// Dependencies
var fs = require('fs');

// Creating the container
var PSLook={};

// Constants for fields lookup and search
PSLook.PID=0;
PSLook.CWD=1;
PSLook.CMD=2;
PSLook.ENV=4;
PSLook.STAT=8;
PSLook.STATM=16;
PSLook.ALL=PSLook.PID|PSLook.CWD|PSLook.CMD|PSLook.ENV
	|PSLook.STAT|PSLook.STATM;

// Set default options and check options integrity
var checkOptions=function (options, callback) {
	// checking callback
	if('function' !== typeof callback) {
		throw Error('No callback given, or given callback is not a function.');
	}
	// checking options
	if(!options) {
		options={};
	}
	// Testing fields
	if(!options.fields) {
		options.fields = PSLook.PID;
	}
	if(PSLook.ALL!==(options.fields|PSLook.ALL)) {
		callback(Error('Some fields you asked seems to not exist.'))
	}
	// Testing search
	if('undefined' === typeof options.searchFields) {
		options.searchFields = PSLook.CMD;
	}
	if(PSLook.ALL!==(options.searchFields|PSLook.ALL)) {
		callback(Error('Some search fields you asked seems to not exist.'))
	}
	if('string' === typeof options.search) {
		try {
			options.search = new RegExp(options.search.replace('*','.*'),'i');
		} catch (e) {
			throw Error('Given search couldn\'t be converted to a valid RegExp.')
		}
	}
	if(options.search&&!(options.search instanceof RegExp)) {
		throw Error('Search must be a string or a RegExp isntance.');
	}
	if(!options.search) {
		options.search = '';
	}
	return options;
};

// List running processes
PSLook.list = function (callback, options) {
	// Checking args
	options=checkOptions(options, callback);
	// Reading the proc folder
	fs.readdir('/proc', function(err, files) {
	  if(err) {
		  callback(err)
	  } else {
			// cleaning up files
			for(var i=0; i<files.length; i) {
				if(!/^[0-9]+$/.test(files[i])) {
					files.splice(i,1);
				} else {
					i++;
				}
			}
			// if the user just want the pid and do no search or search for PID
			if(options.fields===PSLook.PID
					&&(options.searchFields===PSLook.PID||!options.search)) {
				callback(null,files.map(function(file) {
					return {'pid':parseInt(file,10)};
				}));
			// else we have to read other fields before calling the callback up
			} else {
				// creating the processes read discount function
				var processReaded = function (err,process) {
					if(err) {
						callback(err);
					} else {
						if(process) {
							readedProcesses.push(process);
						}
						if(++searchedProcesses==files.length) {
							callback(null, readedProcesses);
						}
					}
				}, readedProcesses=[], searchedProcesses=0;
				// traversing processes
			  files.forEach(function(file){
					PSLook.read(file,processReaded,options);
				});
			}
		}
	});
};

// Read details on a particular process
// Helpful : http://man7.org/linux/man-pages/man5/proc.5.html
PSLook.read = function (pid, callback, options) {
	// Checking args
	if('undefined'===typeof pid) {
		throw Error('No PID given to the read operation.');
	}
	options=checkOptions(options, callback);
	// creating the process object
	var process={'pid':pid},
	// keeping a trace of asked fields
		askedFields=0;
	// Asking PID has no sense
	if(options.fields===PSLook.PID&&options.searchFields===PSLook.PID) {
		throw Error('Please give at least a field or a search field to check.');
	}
	// Discount retrieved fields
	function dataFound() {
		if(--askedFields===0)
			callback(null,process);
	}
	// Reading the command line
	if(options.fields&PSLook.CMD||(options.search&&(options.searchFields&PSLook.CMD))) {
		askedFields++;
		fs.readFile('/proc/'+pid+'/cmdline', 'utf8', function (err, data) {
			if(err) {
				console.log(err);
			 err&&callback(err);
			} else {
				if(options.search&&(options.searchFields&PSLook.CMD)) {
					if(options.search.test(data)) {
						dataFound();
					} else {
						callback(null,null);
					}
				}
				if(options.fields&PSLook.CMD) {
					process.cmdline=data.split('\u0000');
					if(''===process.cmdline[process.cmdline.length-1]) {
						process.cmdline.pop();
					}
				dataFound();
				}
			}
		});
	}
	// Reading the env vars
	if(options.fields&PSLook.ENV) {
		askedFields++;
		fs.readFile('/proc/'+pid+'/environ', 'utf8', function (err, data) {
			if(err) {
				console.log(err);
			 err&&callback(err);
			} else {
				process.env={};
				data.split('\u0000').forEach(function(env){
					var vals;
					if(env) {
						vals=env.split('=');
						process.env[vals[0]]=vals[1];
					}
				});
				dataFound();
			}
		});
	}
	// Reading the process cwd
	if(options.fields&PSLook.CWD) {
		askedFields++;
		fs.readlink('/proc/'+pid+'/cwd', function (err, data) {
			if(err) {
			 err&&callback(err);
			} else {
				process.cwd=data;
				dataFound();
			}
		});
	}
	// Reading the process stat
	if(options.fields&PSLook.STAT) {
		askedFields++;
		fs.readFile('/proc/'+pid+'/stat', 'utf8', function (err, data) {
			if (err) throw err;
			var fields=data.split(/[\r\n\s]+/);
			process.stat={
				'command':fields[1],
				'state':fields[2],
				'ppid': parseInt(fields[3],10),
				'pgrp': parseInt(fields[4],10),
				'session': parseInt(fields[5],10),
				'tty_nr': parseInt(fields[6],10),
				'tpgid': parseInt(fields[7],10),
				'flags': parseInt(fields[8],10),
				'minflt': parseInt(fields[9],10),
				'cminflt': parseInt(fields[10],10),
				'majflt': parseInt(fields[11],10),
				'cmajflt': parseInt(fields[12],10),
				'utime': parseInt(fields[13],10),
				'stime': parseInt(fields[14],10),
				'cutime': parseInt(fields[15],10),
				'cstime': parseInt(fields[16],10),
				'priority': parseInt(fields[17],10),
				'nice': parseInt(fields[18],10),
				'numThreads': parseInt(fields[19],10),
				'itrealvalue': parseInt(fields[20],10),
				'startTime': parseInt(fields[21],10),
				'vsize': parseInt(fields[22],10),
				'rss': parseInt(fields[23],10),
				'rsslim': parseInt(fields[24],10),
				'startCode': parseInt(fields[25],10),
				'endCode': parseInt(fields[26],10),
				'startStack': parseInt(fields[27],10),
				'kstkesp': parseInt(fields[28],10),
				'kstkeip': parseInt(fields[29],10),
				'signal': parseInt(fields[30],10),
				'blocked': parseInt(fields[31],10),
				'sigignore': parseInt(fields[32],10),
				'sigcatch': parseInt(fields[33],10),
				'wchan': parseInt(fields[34],10),
				'nswap': parseInt(fields[35],10),
				'cnswap': parseInt(fields[36],10),
				'exitSignal': parseInt(fields[37],10),
				'processor': parseInt(fields[38],10),
				'rtPriority': parseInt(fields[39],10),
				'policy': parseInt(fields[40],10),
				'delaycctBlkioTicks': parseInt(fields[41],10),
				'guestTime': parseInt(fields[42],10),
				'cguestTime': parseInt(fields[43],10),
			}
			dataFound();
		});
	}
	// Reading the process statm
	if(options.fields&PSLook.STATM) {
		askedFields++;
		fs.readFile('/proc/'+pid+'/statm', 'utf8', function (err, data) {
			if (err) throw err;
			var fields=data.split(/[\r\n\s]+/);
			process.statm={
				'size': parseInt(fields[1],10),
				'resident': parseInt(fields[2],10),
				'share': parseInt(fields[3],10),
				'text': parseInt(fields[4],10),
				'lib': parseInt(fields[5],10),
				'data': parseInt(fields[5],10),
				'dt': parseInt(fields[5],10)
			}
			dataFound();
		});
	}
};

// Export
module.exports = PSLook;

