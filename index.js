var fs = require('fs');

function LineReader(fd, cb, separator, bufferSize) {
	if (!separator) {
		separator = '\n';
	}

	if (!bufferSize) {
		bufferSize = 1024;
	}

  var filePosition   = 0,
      buffer         = new Buffer(bufferSize),
      bufferStr      = '',
      eof            = false,
      separatorIndex = -1;

  function readToSeparator(cb) {
    function readChunk() {
      fs.read(fd, buffer, 0, bufferSize, filePosition, function(err, bytesRead) {
        if (err)
          throw err;

        if (bytesRead < bufferSize) {
          eof = true;
					fs.close(fd, function(err) {
						if (err)
							throw err;
					});
				}

        filePosition += bytesRead;

        bufferStr += buffer.toString('utf8', 0, bytesRead);

        if (separatorIndex < 0) {
          separatorIndex = bufferStr.indexOf(separator);
        }

        var separatorAtEnd = separatorIndex == bufferStr.length - 1;
        if (bytesRead && (separatorIndex == -1 || separatorAtEnd)) {
          readChunk();
        } else {
          cb();
        }
      });
    }

    readChunk();
  }

  function hasNextLine() {
    return separatorIndex != bufferStr.length - 1 || !eof;
  }
	this.hasNextLine = hasNextLine;

  this.nextLine = function(cb) {
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

  readToSeparator(cb);
}

exports.open = function(filename, cb, separator, bufferSize) {
  fs.open(filename, 'r', 0666, function(err, fd) {
    if (err)
      throw err;

    var reader = new LineReader(fd, function() {
      cb(reader);
    }, separator, bufferSize);
  });
};

exports.eachLine = function(filename, fn, separator, bufferSize) {
  exports.open(filename, function(reader) {
    function read() {
      if (reader.hasNextLine()) {
        reader.nextLine(function(line) {
          fn(line);
          read();
        });
      }
    }
    read();
  }, separator, bufferSize);
}
