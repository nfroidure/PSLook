var ps=require(__dirname+'/../pslook'),
	exec = require('child_process').exec,
	assert=require('assert');

// Tests
describe('Listing system processes', function() {

	it("should return the same pids than the ps command", function(done) {
		var child = exec('ps hexao pid', function (err, stdout, stderr) {
			if(err) throw err;
			var psCommandPIDs=stdout.trim().split(/[\s\t]*[\r\n]+[\s\t]*/);
			// Listing processes
			ps.list(function(err, processes) {
				if(err) throw err;
				// remove 2 processes for the ps process and the shel process
				assert.equal(processes.length,psCommandPIDs.length-2);
				// check if shared processes are corresponding to the pslook result
				var sharedPIDs=0;
				for(var i=processes.length-1; i>=0; i--) {
					if(-1!==psCommandPIDs.indexOf(processes[i].pid.toString(10)))
						sharedPIDs++;
				}
				assert.equal(sharedPIDs,processes.length);
				child.kill();
				done();
			});
		});
	});

	it("should return the pids of the process corresponding to the search", function(done) {
		
		var child = exec('read lukeimyourfather', function (err, stdout, stderr) {
			if(!err) {
				 throw Error('Execution should return an error');
			}
		});
		// Listing processes
		ps.list(function(err, processes) {
			if(err) throw err;
			assert.equal(processes.length,1);
			child.kill();
			done();
		},{search:'lukeimyourfather'});
	});

	it("should fail with bad fields flags", function(done) {
		try {
			// Listing processes
			ps.list(function(err, processes) {
				if(err) throw err;
			},{'fields':1664});
		} catch(e) {
			done();
		}
	});

	it("should fail with bad searchFields flags", function(done) {
		try {
			// Listing processes
			ps.list(function(err, processes) {
				if(err) throw err;
			},{'searchFields':1664,'search':'node'});
		} catch(e) {
			done();
		}
	});

	it("should fail with bad search", function(done) {
		try {
			// Listing processes
			ps.list(function(err, processes) {
				if(err) throw err;
			},{'search':'node('});
		} catch(e) {
			done();
		}
	});

});

describe('Reading a process', function() {

	it("should return the same infos than those given to the exec method", function(done) {
		var execPID;
		var execOptions={
			cwd: '/tmp',
			env: {'TEST_ENV':'LO'}
		};
		var child = exec('/bin/cat', execOptions, function (err, stdout, stderr) {
			if(!err) {
				 throw Error('Execution should return an error');
			}
		});
		execPID=child.pid;
		// Reading the spawned process
		ps.read(execPID,function(err, process) {
			if(err) throw err;
			assert.equal(process.cwd,execOptions.cwd);
			assert.equal(process.env.TEST_ENV,execOptions.env.TEST_ENV);
			child.kill();
			done();
		},{fields:ps.ENV|ps.CWD});
	});
	
});
