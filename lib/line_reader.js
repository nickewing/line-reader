(function () {
	"use strict";

	var fs = require('fs');

	function LineReader(fd, cb, tSeparator, tEncoding, tBufferSize) {
		var filePosition = 0,
			bufferSize = tBufferSize || 1024,
			buffer = new Buffer(bufferSize),
			bufferStr = '',
			closed = false,
			eof = false,
			separatorIndex = -1,
			separator = tSeparator || '\n',
			encoding = tEncoding || 'utf8';

		function close() {
			if (!closed) {
				fs.close(fd, function (err) {
					if (err) {
						throw err;
					}
				});
				closed = true;
			}
		}

		function readToSeparator(cb) {
			function readChunk() {
				fs.read(fd, buffer, 0, bufferSize, filePosition, function (err, bytesRead) {
					var separatorAtEnd;

					if (err) {
						throw err;
					}

					if (bytesRead < bufferSize) {
						eof = true;
						close();
					}

					filePosition += bytesRead;

					bufferStr += buffer.toString(encoding, 0, bytesRead);

					if (separatorIndex < 0) {
						separatorIndex = bufferStr.indexOf(separator);
					}

					separatorAtEnd = separatorIndex === bufferStr.length - 1;
					if (bytesRead && (separatorIndex === -1 || separatorAtEnd)) {
						readChunk();
					} else {
						cb();
					}
				});
			}

			readChunk();
		}

		function hasNextLine() {
			return separatorIndex !== bufferStr.length - 1 || !eof;
		}

		function nextLine(cb) {
			function getLine() {
				var ret = bufferStr.substring(0, separatorIndex);

				bufferStr = bufferStr.substring(separatorIndex + 1);
				separatorIndex = -1;
				cb(ret);
			}

			if (separatorIndex < 0) {
				separatorIndex = bufferStr.indexOf(separator);
			}

			if (separatorIndex < 0) {
				if (eof) {
					if (hasNextLine()) {
						separatorIndex = bufferStr.length;
						getLine();
					} else {
						throw new Error('No more lines to read.');
					}
				} else {
					readToSeparator(getLine);
				}
			} else {
				getLine();
			}
		}

		this.hasNextLine = hasNextLine;
		this.nextLine = nextLine;
		this.close = close;

		readToSeparator(cb);
	}

	function open(filename, cb, separator, encoding, bufferSize) {
		fs.open(filename, 'r', parseInt('666', 8), function (err, fd) {
			var reader;
			if (err) {
				throw err;
			}

			reader = new LineReader(fd, function () {
				cb(reader);
			}, separator, bufferSize);
		});
	}

	function eachLine(filename, fn, separator, encoding, bufferSize) {
		var finalFn,
			fnReturn = function (tFn) {
				finalFn = tFn;
			};

		open(filename, function (reader) {
			function read() {
				if (reader.hasNextLine()) {
					reader.nextLine(function (line) {
						if (fn(line, !reader.hasNextLine()) !== false) {
							read();
						}
					});
				} else if (finalFn) {
					// let the caller know that we're done
					finalFn();
				}
			}
			read();
		}, separator, encoding, bufferSize);

		return {
			then: fnReturn
		};
	}

	module.exports.open = open;
	module.exports.eachLine = eachLine;
}());
