var $ = require('jquery');

var music = [
  'https://dl.dropboxusercontent.com/u/17064414/champagne.wav',
  'https://dl.dropboxusercontent.com/u/17064414/feelin-u.wav',
  'https://dl.dropboxusercontent.com/u/17064414/funk.wav',
  'https://dl.dropboxusercontent.com/u/17064414/junkyard.wav',
  'https://dl.dropboxusercontent.com/u/17064414/meatspace.wav',
  'https://dl.dropboxusercontent.com/u/17064414/pleasure.wav'
];

var audioTag = null;

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
  vaudioTag.addEventListener('ended', function(){
    audioTag = null;
    toggleMusic();
  });
  return vaudioTag;
};

exports.toggle = toggleMusic;
