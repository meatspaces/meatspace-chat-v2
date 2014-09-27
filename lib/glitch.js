'use strict';

var glitcher = require('glitcher');
var readimage = require('readimage');

module.exports = glitch;


var MAX_GLITCHES = 5;

var playlist = {
  'interlace': interlace,
  'interlaced': interlace,
  'solarize': solarize,
  'solarized': solarize,
  'tiedye': tiedye,
  'tie-dye': tiedye,
  'predator': tiedye,
  'grayscale': grayscale,
  'greyscale': grayscale,
  'smear': smear,
  'smeared': smear,
  // TODO add these back in when glitcher gets a perf fix for them
  //'dropper': dropper,
  //'lsd': dropper,
  //'hack': hack,
  'pieces': pieces,
  'shuffle': shuffle,
  'tracer': tracers,
  'tracers': tracers,
  'rainbow': rainbow,
  'mesh': mesh,
};

function glitch(images, message) {
  var s = Date.now();
  var words = message.split(/\s/);
  var glitchCount = 0;
  words.forEach(function (word) {
    if (glitchCount > MAX_GLITCHES) {
      return;
    }
    word = word.toLowerCase();
    if (playlist[word]) {
      glitchCount++;
      playlist[word](images);
    }
  })
  // Always at least do smear
  if (glitchCount === 0) {
    smear(images);
  }
  //console.log("elapsed %s", Date.now() - s);
}

function dropper(images) {
  for (var i = 0; i < images.length; i++) {
    glitcher.glitchClamp(images[i].frames[0].data, 120, 25);
  }
}

function pieces(images) {
  for (var i = 0; i < images.length; i++) {
    var image = images[i];
    var factor = (Math.random() * image.width * image.height * 4) | 0;
    glitcher.rowslice(image.frames[0].data, factor);
  }
}

function hack(images) {
  for (var i = 0; i < images.length; i++) {
    glitcher.superGhost(images[i].frames[0].data, 120, 25);
  }
}

function smear(images) {
  for (var i = 0; i < images.length; i++) {
    glitcher.smearChannel(images[i].frames[0].data, 0, (Math.random() * 10) | 0);
  }
}

function interlace(images) {
  for (var i = 0; i < images.length; i++) {
    glitcher.interleave(images[i].width, images[i].frames[0].data);
  }
}

function solarize(images) {
  for (var i = 0; i < images.length; i++) {
    glitcher.invertRGBA(images[i].frames[0].data);
  }
}

function grayscale(images) {
  for (var i = 0; i < images.length; i++) {
    glitcher.grayscale(images[i].frames[0].data);
  }
}

function tiedye(images) {
  for (var i = 0; i < images.length; i++) {
    glitcher.rainbowClamp(images[i].frames[0].data);
  }
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
}

function rainbow(images) {
  var superImage = new readimage.Image(images[0].height, images[0].width);
  for (var i = 0; i < images.length; i++) {
    superImage.addFrame(images[i].frames[0].data);
  }
  glitcher.rainbow(superImage.frames);
}

function tracers(images) {
  var dupe = null;
  for (var i = images.length - 1; i > 0; i--) {
    dupe = glitcher.copy(images[i - 1].frames[0].data);
    glitcher.cloneChannel(dupe, images[i].frames[0].data, 0);
    if (i - 2 >= 0) {
      dupe = glitcher.copy(images[i - 2].frames[0].data);
      glitcher.cloneChannel(dupe, images[i].frames[0].data, 1);
    }
    if (i - 3 >= 0) {
      dupe = glitcher.copy(images[i - 3].frames[0].data);
      glitcher.cloneChannel(dupe, images[i].frames[0].data, 2);
    }
  }
}

function mesh(images) {
  for (var i = 0; i < images.length; i++) {
    var dupe = glitcher.copy(images[i].frames[0].data);
    glitcher.reverseRGBA(dupe)
    glitcher.interleave(images[i].width, images[i].frames[0].data, dupe);
  }
}
