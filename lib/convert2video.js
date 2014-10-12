'use strict';

var fs = require('fs');
var child = require('child_process');

var uuid = require('uuid');
var dataURIBuffer = require('data-uri-to-buffer');
var glob = require('glob');
var async = require('async');

var TMP_DIR = __dirname + '/../tmp/';
var IMAGE_FORMAT = 'jpg';

exports.transform = function (mediaArr, next) {
  // write images to tmp files
  var mediaId = uuid.v4();
  var count = 0;

  var deleteFiles = function () {
    glob(TMP_DIR + mediaId + '*', function (err, files) {
      if (err) {
        console.log('glob error: ', err);
        return;
      }

      files.forEach(function (file) {
        fs.unlink(file, function (err) {
          if (err) {
            console.log('error unlinking ' + file + ':', err);
          }
        });
      });
    });
  };

  var done = function(err, videos) {
    next(err, videos);
    deleteFiles();
  };

  var writeVideo = function () {
    var types = [{
      format: 'webm',
      ffmpegArgs: '" -filter:v "setpts=2.5*PTS" -vcodec libvpx -an "'
    }, {
      format: 'mp4',
      ffmpegArgs: '" -filter:v "setpts=2.5*PTS" -c:v libx264 -r 30 -an -pix_fmt yuv420p "'
    }];

    async.map(types, function (type, callback) {
      var video = new Buffer(0);
      var command = [
        'ffmpeg -i "',
        TMP_DIR + mediaId + '-%d.' + IMAGE_FORMAT,
        type.ffmpegArgs,
        TMP_DIR + mediaId + '.' + type.format,
        '"'
      ].join('');

      child.exec(command, { timeout: 3000 }, function (err, stdout, stderr) {
        if (err) {
          callback(err);
        }

        var filename = TMP_DIR + mediaId + '.' + type.format;
        var readStream = fs.createReadStream(filename);

        readStream.on('data', function (chunk) {
          video = Buffer.concat([video, chunk]);
        });

        readStream.on('error', function (err) {
          callback(err);
        });

        readStream.on('end', function () {
          var base64 = video.toString('base64');
          callback(null, {
            format: type.format,
            data: 'data:video/' + type.format + ';base64,' + base64
          });
        });
      });
    }, function (err, results) {
      var videos = {};

      if (err) {
        done(err);
      }
      else {
        results.forEach(function (result) {
          videos[result.format] = result.data;
        });
        done(null, videos);
      }
    });
  };

  var fileFinished = function() {
      count++;
      if (count === mediaArr.length) {
        writeVideo();
      }
  };

  for (var i = 0; i < mediaArr.length; i ++) {
    var frame = mediaArr[i];
    if (frame.length > 10000 * 4 / 3) {
      return done(new Error('File too large'));
    }

    var buffer = dataURIBuffer(frame);
    var writeStream = fs.createWriteStream(TMP_DIR + mediaId + '-' + i + '.' + IMAGE_FORMAT);

    writeStream
      .on('error', done)
      .end(buffer, fileFinished);
  }
};
