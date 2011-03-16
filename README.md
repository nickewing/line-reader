Line Reader
===========

Asynchronous line-by-line file reader.

Install
-------
	
		npm install line-reader

Usage
-----

		var lineReader = require('line-reader');

		// read all lines:
		lineReader.eachLine('test.txt', function(line) {
			console.log(line);
		});

		// or read line by line:
		lineReader.open('test.txt', function(reader) {
			if (reader.nextLine()) {
				reader.nextLine(function(line) {
					console.log(line);
				});
			}
		});

Copyright 2011 Nick Ewing.
