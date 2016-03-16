(function() {
  "use strict";

  var fs = require('fs'),
      StringDecoder = require('string_decoder').StringDecoder;

  function createLineReader(fd, options, cb) {
    if (options instanceof Function) {
      cb = options;
      options = undefined;
    }
    if (!options) options = {};

    var filePosition   = 0,
        encoding       = options.encoding || 'utf8',
        separator      = options.separator || /\r\n?|\n/,
        bufferSize     = options.bufferSize || 1024,
        buffer         = new Buffer(bufferSize),
        bufferStr      = '',
        decoder        = new StringDecoder(encoding),
        closed         = false,
        eof            = false,
        separatorIndex = -1,
        separatorLen;

    var findSeparator;

    if (separator instanceof RegExp) {
      findSeparator = function() {
        var result = separator.exec(bufferStr);
        if (result && (result.index + result[0].length < bufferStr.length || eof)) {
          separatorIndex = result.index;
          separatorLen = result[0].length;
        } else {
          separatorIndex = -1;
          separatorLen = 0;
        }
      };
    } else {
      separatorLen = separator.length;
      findSeparator = function() {
        separatorIndex = bufferStr.indexOf(separator);
      };
    }

    function _fd() {
      return fd;
    }

    function close(cb) {
      if (!closed) {
        fs.close(fd, cb);
        closed = true;
      }
    }

    function isOpen() {
      return !closed;
    }

    function isClosed() {
      return closed;
    }

    function readToSeparator(cb) {
      function readChunk() {
        fs.read(fd, buffer, 0, bufferSize, filePosition, function(err, bytesRead) {
          if (err) {
            return cb(err);
          }

          if (bytesRead < bufferSize) {
            eof = true;
          }

          filePosition += bytesRead;

          bufferStr += decoder.write(buffer.slice(0, bytesRead));

          findSeparator();

          if (bytesRead && separatorIndex < 0 && !eof) {
            readChunk();
          } else {
            cb();
          }
        });
      }

      readChunk();
    }

    function hasNextLine() {
      return bufferStr.length > 0 || !eof;
    }

    function nextLine(cb) {
      if (closed) {
        return cb(new Error('LineReader has been closed'));
      }

      function getLine(err) {
        if (err) {
          return cb(err);
        }

        if (separatorIndex < 0 && eof) {
          separatorIndex = bufferStr.length;
        }
        var ret = bufferStr.substring(0, separatorIndex);

        bufferStr = bufferStr.substring(separatorIndex + separatorLen);
        separatorIndex = -1;
        cb(undefined, ret);
      }

      findSeparator();

      if (separatorIndex < 0) {
        if (eof) {
          if (hasNextLine()) {
            separatorIndex = bufferStr.length;
            getLine();
          } else {
            return cb(new Error('No more lines to read.'));
          }
        } else {
          readToSeparator(getLine);
        }
      } else {
        getLine();
      }
    }

    readToSeparator(function(err) {
      if (err) {
        return close(function(err2) {
          return cb(err || err2);
        });
      }
      return cb(undefined, {
        hasNextLine:  hasNextLine,
        nextLine:     nextLine,
        close:        close,
        isOpen:       isOpen,
        isClosed:     isClosed,
        fd:           _fd,
      });
    });
  }

  function open(filename, options, cb) {
    if (options instanceof Function) {
      cb = options;
      options = undefined;
    }

    fs.open(filename, 'r', parseInt('666', 8), function(err, fd) {
      if (err) {
        return cb(err);
      }

      createLineReader(fd, options, cb);
    });
  }

  function eachLine(filename, options, iteratee, cb) {
    if (options instanceof Function) {
      cb = iteratee;
      iteratee = options;
      options = undefined;
    }
    var finalFn,
        asyncIteratee = iteratee.length == 3;

    var theReader;
    var getReaderCb;

    open(filename, options, function(err, reader) {
      theReader = reader;
      if (getReaderCb) {
        getReaderCb(reader);
      }

      if (err) {
        if (cb) cb(err);
        return;
      }

      function finish(err) {
        reader.close(function(err2) {
          if (cb) cb(err || err2); 
        });
      }

      function newRead() {
        if (reader.hasNextLine()) {
          setImmediate(readNext);
        } else {
          finish();
        }
      }

      function continueCb(continueReading) {
        if (continueReading !== false) {
          newRead();
        } else {
          finish();
        }
      }

      function readNext() {
        reader.nextLine(function(err, line) {
          if (err) {
            finish(err);
          }

          var last = !reader.hasNextLine();

          if (asyncIteratee) {
            iteratee(line, last, continueCb);
          } else {
            if (iteratee(line, last) !== false) {
              newRead();
            } else {
              finish();
            }
          }
        });
      }

      newRead();
    });

    // this hook is only for the sake of testing; if you choose to use it,
    // please don't file any issues (unless you can also reproduce them without 
    // using this).
    return {
      getReader: function(cb) {
        if (theReader) {
          cb(theReader);
        } else {
          getReaderCb = cb;
        }
      }
    };
  }

  module.exports.open = open;
  module.exports.eachLine = eachLine;
}());
