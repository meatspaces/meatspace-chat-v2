var $ = require('jquery');
//var musicArr = require('https://dl.dropboxusercontent.com/u/1913694/128382random');

var audioTag = null;
var music = ['https://dl.dropboxusercontent.com/u/1913694/Uia49tkWqAO1.128.mp3'];

var toggleMusic = function () {
  var musicEl = $('#music');

  if (audioTag) {
    musicEl.removeClass('on');
    audioTag.pause();
    audioTag = null;
  } else {
    musicEl.addClass('on');
    audioTag = getSong();
    audioTag.play();
  }
};

var getSong = function () {
  var audio = music[Math.floor(Math.random() * music.length)];
  var vaudioTag = document.createElement('audio');
  vaudioTag.src = audio;

  vaudioTag.addEventListener('ended', function () {
    audioTag = null;
    toggleMusic();
  });

  return vaudioTag;
};

exports.toggle = toggleMusic;
