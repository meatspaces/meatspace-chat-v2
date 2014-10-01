'use strict';

var fs = require('fs');
var child = require('child_process');

var uuid = require('uuid');
var dataURIBuffer = require('data-uri-to-buffer');
var glob = require('glob');

var TMP_DIR = __dirname + '/../tmp/';
var VIDEO_FORMAT = 'webm';
var IMAGE_FORMAT = 'jpg';

exports.transform = function (mediaArr, next) {
  // write images to tmp files
  var mediaId = uuid.v4();
  var video = new Buffer(0);
  var count = 0;

  var deleteFiles = function () {
    glob(TMP_DIR + mediaId + '*', function(err, files) {
      if (err) {
        console.log('glob error: ', err);
        return;
      }

      files.forEach(function(file) {
        fs.unlink(file, function(err) {
          if (err) {
            console.log('error unlinking ' + file + ':', err);
          }
        });
      });
    });
  };

  var writeWebm = function () {
    child.exec('ffmpeg -i "' + TMP_DIR + mediaId +
      '-%d.' + IMAGE_FORMAT + '" -filter:v "setpts=2.0*PTS" -vcodec libvpx -an "' +
      TMP_DIR + mediaId + '.' + VIDEO_FORMAT + '"', { timeout: 3000 },
      function (err, stdout, stderr) {

      if (err) {
        next(err);
        deleteFiles();
        return;
      }

      var readStream = fs.createReadStream(TMP_DIR + mediaId + '.' + VIDEO_FORMAT);

      readStream.on('data', function (chunk) {
        video = Buffer.concat([video, chunk]);
      });

      readStream.on('error', function (err) {
        next(err);
        deleteFiles();
      });

      readStream.on('end', function () {
        next(null, 'data:video/' + VIDEO_FORMAT + ';base64,' + video.toString('base64'));
        deleteFiles();
      });
    });
  };

  mediaArr.forEach(function (frame, index) {
    var buffer = dataURIBuffer(frame);

    var writeStream = fs.createWriteStream(TMP_DIR + mediaId + '-' + index + '.' + IMAGE_FORMAT);

    writeStream.on('error', function (err) {
      next(err);
      deleteFiles();
      return;
    });

    writeStream.end(buffer, function () {
      count ++;
      if (count === mediaArr.length) {
        writeWebm(next);
      }
    });
  });
};
