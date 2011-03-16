var lineReader         = require('../index'),
    assert             = require('assert'),
    fs                 = require('fs'),
    testFilePath       = __dirname + '/test_file.txt',
    separatorFilePath  = __dirname + '/test_separator_file.txt',
    emptyFilePath      = __dirname + '/empty_file.txt',
    i                  = 0,
    j                  = 0,
    testSeparatorFile  = ['foo', 'bar\n', 'baz\n'],
    testFile = [
      'Jabberwocky',
      '',
      '’Twas brillig, and the slithy toves',
      'Did gyre and gimble in the wabe;',
      '',
      ''
    ];

lineReader.eachLine(testFilePath, function(line) {
  assert.equal(testFile[i], line, 'Each line should be what we expect');
  i++;
});

lineReader.eachLine(separatorFilePath, function(line) {
  // console.log('"' + line + '"');
  assert.equal(testSeparatorFile[j], line);
  j++;
}, ';');

process.on('exit', function() {
  assert.equal(i, 6, 'Should read 6 lines from test file');
  assert.equal(j, 3, 'Should read 3 lines from separator test file');
});

lineReader.eachLine(emptyFilePath, function(line) {
  assert.ok(false, 'Empty file should not cause any callbacks');
});

lineReader.open(testFilePath, function(reader) {
  assert.ok(reader.hasNextLine());

  assert.ok(reader.hasNextLine(),
            'Calling hasNextLine multiple times should be ok');

  reader.nextLine(function(line) {
    assert.equal('Jabberwocky', line);
    assert.ok(reader.hasNextLine());
    reader.nextLine(function(line) {
      assert.equal('', line);
      assert.ok(reader.hasNextLine());
      reader.nextLine(function(line) {
        assert.equal('’Twas brillig, and the slithy toves', line);
        assert.ok(reader.hasNextLine());
        reader.nextLine(function(line) {
          assert.equal('Did gyre and gimble in the wabe;', line);
          assert.ok(reader.hasNextLine());
          reader.nextLine(function(line) {
            assert.equal('', line);
            assert.ok(reader.hasNextLine());
            reader.nextLine(function(line) {
              assert.equal('', line);
              assert.ok(!reader.hasNextLine());

              assert.throws(function() {
                reader.nextLine(function() {});
              }, Error, "Should be able to read next line at EOF");
            });
          });
        });
      });
    });
  });
});

console.log('OK');
