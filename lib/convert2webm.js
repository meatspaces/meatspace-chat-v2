'use strict';

var fs = require('fs');
var child = require('child_process');

var uuid = require('uuid');
var dataURIBuffer = require('data-uri-to-buffer');
var glob = require('glob');

var TMP_DIR = __dirname + '/../tmp/';
var IMAGE_FORMAT = 'jpg';

exports.transform = function (videoType, mediaArr, next) {
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

  var writeVideo = function (videoType) {
    var videoFormat = 'webm';
    var ffmpegArgs = '" -filter:v "setpts=2.5*PTS" -vcodec libvpx -an "';

    if (videoType && videoType === 'h264') {
      videoFormat = 'mp4';
      ffmpegArgs = '" -filter:v "setpts=2.0*PTS" -c:v libx264 -r 30 -pix_fmt yuv420p "';
    }

    child.exec('ffmpeg -i "' + TMP_DIR + mediaId +
      '-%d.' + IMAGE_FORMAT + ffmpegArgs +
      TMP_DIR + mediaId + '.' + videoFormat + '"', { timeout: 3000 },
      function (err, stdout, stderr) {

      if (err) {
        next(err);
        deleteFiles();
        return;
      }

      var readStream = fs.createReadStream(TMP_DIR + mediaId + '.' + videoFormat);

      readStream.on('data', function (chunk) {
        video = Buffer.concat([video, chunk]);
      });

      readStream.on('error', function (err) {
        next(err);
        deleteFiles();
      });

      readStream.on('end', function () {
        next(null, 'data:video/' + videoFormat + ';base64,' + video.toString('base64'));
        deleteFiles();
      });
    });
  };

  for (var i = 0; i < mediaArr.length; i ++) {
    var frame = mediaArr[i];
    var buffer = dataURIBuffer(frame);

    if (buffer.length > 10000) {
      next(new Error('File size too large'));
      deleteFiles();
      return;
    }

    var writeStream = fs.createWriteStream(TMP_DIR + mediaId + '-' + i + '.' + IMAGE_FORMAT);

    writeStream.on('error', function (err) {
      next(err);
      deleteFiles();
      return;
    });

    writeStream.end(buffer, function () {
      count ++;
      if (count === mediaArr.length) {
        writeVideo(videoType, next);
      }
    });
  }
};
