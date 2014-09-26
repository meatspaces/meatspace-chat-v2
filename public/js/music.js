var $ = require('jquery');
//var musicArr = require('https://dl.dropboxusercontent.com/u/1913694/128382random');

var audioTag = null;
var music = null;

function getMusic(){
  if(music) return $.when(music);
  else return $.get('https://dl.dropboxusercontent.com/u/1913694/128382random.json').then(function(data){
    music = data;
  });
}

var toggleMusic = function () {
  getMusic().then(function(music){
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
  });
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
