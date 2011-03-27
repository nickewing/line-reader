Line Reader
===========

Asynchronous line-by-line file reader.

Install
-------

`npm install line-reader`

Usage
-----

The eachLine function returns an object with one property, then.  If a callback is passed in, then it will be called once all lines have been read.

For example, if you need to parse a file and return a JSON array, the `then` function can be used to append a `]` at the end.

	var lineReader = require('line-reader');

	// read all lines:
	lineReader.eachLine('test.txt', function(line) {
		console.log(line);
	}).then(function () {
		console.log("I'm done!!");
	});

Another way to interface with it is by manually looping through each line.  The parameters are the same, but you get to control when each line is read.

	// or read line by line:
	lineReader.open('test.txt', function(reader) {
		if (reader.nextLine()) {
			reader.nextLine(function(line) {
				console.log(line);
			});
		}
	});

Copyright 2011 Nick Ewing.
