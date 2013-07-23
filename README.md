PSLook
============
Pslook is a NodeJS module retrieving processes informations on GNULinux
 systems without spawning a new process and in a full non-blocking way
 using the fs module and the proc filesystem only.

Usage
-------------
```js
// List all processes
var ps=require('pslook');
ps.list(function(err, processes) {
	if(err) throw err;
	console.log(processes.length, processes[0].pid);
});

// List all node processes
var ps=require('pslook');
ps.list(function(err, process) {
	if(err) throw err;
	console.log(processes.length);
},{'search':/^node .*$/});

// List all processes and get their working dir + memory usage
var ps=require('pslook');
ps.list(function(err, process) {
	if(err) throw err;
	console.log(process.cwd);
	console.log(process.statm.size);
},{fields:PSLook.CWD|PSLook.STATM});

// Read every available informations for a process by its PID
var ps=require('pslook');
ps.read(aValidPID, function(err, process) {
	if(err) throw err;
	console.log(process.cwd);
	console.log(process.statm.size);
},{fields:ps.ALL});
```

Contributing
-------------
Feel free to pull your code if this codebase license is ok for you.

More OS Support
-------------
This library is only intended to run with Unix (particularly Linux) systems. If
 you wish to have MacOS/Windows support, write your own and mimic the API. I'll
 be glad to claim its existence there.
