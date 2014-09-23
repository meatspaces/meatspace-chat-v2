'use strict';

var fs = require('fs');
var child = require('child_process');

var uuid = require('uuid');
var dataURIBuffer = require('data-uri-to-buffer');
var ffmpeg = require('fluent-ffmpeg');

var TMP_DIR = __dirname + '/../tmp/';

exports.transform = function (mediaArr, next) {
  // write images to tmp files
  var mediaId = uuid.v4();
  var ended = false;
  var video = new Buffer(0);
  var count = 0;

  var deleteFiles = function () {
    child.exec('rm ' + TMP_DIR + mediaId + '*.jpg');
  };

  var writeWebm = function () {
    child.exec('ffmpeg -pattern_type glob -i "' + TMP_DIR + mediaId +
      '-*.jpg" -filter:v "setpts=2.0*PTS" -vcodec libvpx -acodec libvorbis "' +
      TMP_DIR + mediaId + '.webm"', function (err, stdout, stderr) {

      if (err) {
        next(err);
        deleteFiles();
        return;
      }

      var readStream = fs.createReadStream(TMP_DIR + mediaId + '.webm');

      readStream.on('data', function (chunk) {
        video = Buffer.concat([video, chunk]);
      });

      readStream.on('error', function (err) {
        next(err);
        deleteFiles();
      });

      readStream.on('end', function () {
        next(null, 'data:video/webm;base64,' + video.toString('base64'));
        deleteFiles();
      });
    });
  };

  mediaArr.forEach(function (frame) {
    setImmediate(function () {
      var buffer = dataURIBuffer(frame);
      count ++;
      var writeStream = fs.createWriteStream(TMP_DIR + mediaId + '-' + count + '.jpg');

      writeStream.write(buffer);
      writeStream.on('error', function (err) {
        next(err);
        deleteFiles();
        return;
      });

      writeStream.end(function () {
        if (count === mediaArr.length) {
          writeWebm(next);
        }
      });
    });
  });
};
