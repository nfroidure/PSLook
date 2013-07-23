var ps=require(__dirname+'/../pslook'),
	exec = require('child_process').exec,
	assert=require('assert');

// Tests
describe('Listing system processes', function(){

	it("should return the same pids than the ps command", function(done) {
		var psCommandPID;
		var child = exec('ps hexao pid', function (err, stdout, stderr) {
			if(err) throw err;
			var psCommandPIDs=stdout.trim().split(/[\r\n\s\t]+/);
			// Removing ps process pid
			var index=psCommandPIDs.indexOf(psCommandPID.toString(10));
			assert.equal(-1!==index,true);
			psCommandPIDs.splice(index,1);
			// Listing processes
			ps.list(function(err, processes) {
				if(err) throw err;
				console.log(processes.length,psCommandPIDs.length);
				assert.equal(Math.abs(processes.length-psCommandPIDs.length)<2,true);
				var sharedPIDs=0;
				for(var i=processes.length-1; i>=0; i--) {
					if(-1!==psCommandPIDs.indexOf(processes[i].pid.toString(10)))
						sharedPIDs++;
				}
				assert.equal(sharedPIDs,processes.length);
				done();
			});
		});
		psCommandPID=child.pid;
	});

	it("should return the same pids than the ps command (search)", function(done) {
		var psCommandPID;
		var child = exec('ps hexao pid,command | grep node', function (err, stdout, stderr) {
			if(err) throw err;
			var psCommandPIDs=stdout.trim().split(/[\r\n]+/);
			psCommandPIDs=psCommandPIDs.map(function(line) {
				if(line) {
					return line.trim().split(/[\s\t]+/)[0];
				}
				return line;
			});
			// Removing ps process pid
			var index=psCommandPIDs.indexOf(psCommandPID.toString(10));
			assert.equal(-1!==index,true);
			psCommandPIDs.splice(index,1);
			// Removing empty indexes
			do {
				index=psCommandPIDs.indexOf('');
				if(-1!==index) {
					psCommandPIDs.splice(index,1);
				}
			} while(-1!==index);
			// Listing processes
			ps.list(function(err, processes) {
				console.log(processes.length,psCommandPIDs.length);
				if(err) throw err;
				assert.equal(Math.abs(processes.length-psCommandPIDs.length)<2,true);
				var sharedPIDs=0;
				for(var i=processes.length-1; i>=0; i--) {
					if(-1!==psCommandPIDs.indexOf(processes[i].pid.toString(10)))
						sharedPIDs++;
				}
				assert.equal(sharedPIDs,processes.length);
				done();
			},{search:'node'});
		});
		psCommandPID=child.pid;
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
