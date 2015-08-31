Line Reader
===========

Asynchronous line-by-line file reader.

Install
-------

`npm install line-reader`

Usage
-----

The `eachLine` function reads each line of the given file.  Upon each new line,
the given callback function is called with two parameters: the line read and a
boolean value specifying whether the line read was the last line of the file.
If the callback returns `false`, reading will stop and the file will be closed.

    var lineReader = require('line-reader');

    lineReader.eachLine('file.txt', function(line, last) {
      console.log(line);

      if (/* done */) {
        return false; // stop reading
      }
    });

`eachLine` can also be used in an asynchronous manner by providing a third
callback parameter like so:

    var lineReader = require('line-reader');

    lineReader.eachLine('file.txt', function(line, last, cb) {
      console.log(line);

      if (/* done */) {
        cb(false); // stop reading
      } else {
        cb();
      }
    });

You can provide an optional second node-style callback that will be called with
`(err)` on failure or `()` when finished (even if you manually terminate iteration
by returning `false` from the iteratee):

    var lineReader = require('line-reader');

    // read all lines:
    lineReader.eachLine('file.txt', function(line) {
      console.log(line);
    }).then(function (err) {
      if (err) throw err;
      console.log("I'm done!!");
    });


For more granular control, `open`, `hasNextLine`, and `nextLine` maybe be used
to iterate a file:

    // or read line by line:
    lineReader.open('file.txt', function(err, reader) {
      if (err) throw err;
      if (reader.hasNextLine()) {
        reader.nextLine(function(err, line) {
          if (err) throw err;
          console.log(line);
        });
      }
    });

You may provide additional options before the callbacks:
* separator   - a string or RegExp separator (defaults to `/\r\n?|\n/`)
* encoding    - file encoding (defaults to `'utf8'`)
* bufferSize  - amount of bytes to buffer (defaults to 1024)

Contributors
------------

* Nick Ewing
* Jameson Little (beatgammit)

Paul Em has also written a reverse-version of this gem to read files from bottom to top: [reverse-line-reader](https://github.com/paul-em/reverse-line-reader).

Copyright 2011 Nick Ewing.
