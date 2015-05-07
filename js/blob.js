var everything = (function() {
  "use strict";
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var absorb = .1;
  var RESTI = .1;
  var TWOPI = Math.PI * 2;
  var realWidth = canvas.width;
  var realHeight = canvas.height;

  var members = [];
  function Vector(x, y) {
    this.x = x;
    this.y = y;
    this.subtract = function(vector) {
      return new Vector(this.x - vector.x, this.y - vector.y);
    };
    this.add = function(vector) {
      return new Vector(this.x + vector.x, this.y + vector.y);
    };
    this.multiply = function(val) {
      return new Vector(this.x * val, this.y * val);
    };
    this.dot = function(v) {
      return (this.x * v.x) + (this.y * v.y);
    };
    this.vectorMultiply = function(v) {
      return new Vector(this.x * v.x, this.y * v.y);
    };
    this.normalize = function() {
      var l = this.length();
      var nX, nY;
      if (l !== 0) {
        nX = this.x / l;
        nY = this.y / l;
      } else {
        nX = 0;
        nY = 0;
      }

      return new Vector(nX, nY);
    };
    this.reverseX = function() {
      this.x *= -1;
    };
    this.reverseY = function() {
      this.y *= -1;
    };
    this.reverse = function() {
      this.reverseX();
      this.reverseY();
    };
    this.length = function() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    this.distance = function(v) {
      return Math.sqrt((v.x - this.x) * (v.x - this.x) + (v.y - this.y) * (v.y - this.y));
    };
    this.direction = function() {
      x = this.x / Math.abs(x);
      y = this.y / Math.abs(y);
      return new Vector(x, y);
    };
  }

  function resolveCollision(b1, b2) {

    // get the mtd
    var delta = (b1.pos.subtract(b2.pos));
    var r = b1.size + b2.size;
    var dist2 = delta.dot(delta);
    var mtd;

    if (dist2 > r * r){
      return; // they aren't colliding
    }

    if (b1.size > b2.size && (2 * (b1.size + absorb) < realHeight) && (2 * (b1.size + absorb) < realWidth) ){
      b1.size += absorb / 3;
      b2.size = Math.max(0, b2.size - absorb);
      //console.log(b1.size + ':' + b2.size);
      if (b2.size === 0) {
        members.splice(members.indexOf(b2), 1);
      }
    }

    var d = delta.length();
    //console.log(d);
    if (d !== 0.0) {
      // minimum translation distance to push balls apart after intersecting
      mtd = delta.multiply(((b1.size + b2.size) - d) / d);
    } else {
      // Special case. Balls are exactly on top of eachother.
      // Don't want to divide by zero.
      d = b1.size + b2.size - 1.0;
      delta = new Vector(b1.size + b2.size, 0.0);
      mtd = delta.multiply(((b1.size + b2.size) - d) / d);
    }
    // resolve intersection
    var im1 = 1 / (b1.size); // inverse mass quantities
    var im2 = 1 / (b2.size);
    //console.log(mtd.length());
    // push-pull them apart


    b1.pos = b1.pos.add(mtd.multiply(im1 / (im1 + im2)));
    b2.pos = b2.pos.subtract(mtd.multiply(im2 / (im1 + im2)));

    // impact speed
    var v = (b1.v.subtract(b2.v));
    mtd = mtd.normalize();
    var vn = v.dot(mtd);
    // sphere intersecting but moving away from each other already
    if (vn > 0){
      return;
    }

    // collision impulse
    var i = -((1.0 + RESTI) * vn) / (im1 + im2);
    var impulse = mtd.multiply(i);
    // change in momentum
    //console.log(impulse.length());
    b1.v = b1.v.add(impulse.multiply(im1));
    b2.v = b2.v.subtract(impulse.multiply(im2));

  }

  function Blob(x, y, id){
    this.id = id;
    this.size = Math.floor(Math.random() * 10) + 6;
    this.color = '#' + Math.floor(Math.random() * 16777215).toString(16);
    this.pos = new Vector(x, y);
    this.v = new Vector(0, 0);
    this.move = function(){
      for(var i = 0; i < members.length; i++){
        if (members[i].id !== this.id){
          if (collide(this, members[i])) {
            this.v.reverse();
            this.pos.add(this.v);
            members[i].v.reverse();
            members[i].pos.add(members[i].v);
            resolveCollision(this, members[i]);
          }
        }
      }

      // TODO
      this.v.y += 0;
      this.v.x += 0;

      this.pos.x += this.v.x;
      this.pos.y += this.v.y;

      // Check for collision with walls
      if (this.pos.x - this.size < 0)
      {
        this.pos.x = this.size;   // Place ball against edge
        this.v.x = -(this.v.x * RESTI);// Reverse direction and account for friction
      }
      else if (this.pos.x + this.size > realWidth) // Right Wall
      {
        this.pos.x = realWidth - this.size;    // Place ball against edge
        this.v.x = -(this.v.x * RESTI);// Reverse direction and account for friction
      }

      if (this.pos.y - this.size < 0)       // Top Wall
      {
        this.pos.y = this.size;   // Place ball against edge
        this.v.y = -(this.v.y * RESTI);// Reverse direction and account for friction∂∂∂
      }
      else if (this.pos.y + this.size > realHeight) // Bottom Wall
      {
        this.pos.y = realHeight - this.size;   // Place ball against edge
        this.v.y = -(this.v.y * RESTI);// Reverse direction and account for friction
      }
    };
    this.draw = function(){
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.size, 0, TWOPI, true);
      //ctx.fillStyle = this.color;
      var MAX = 10;
      var red = Math.floor(255 * Math.abs(this.v.y) / MAX);
      //console.log(red);
      var green = 255 - red;
      ctx.fillStyle = 'rgb(' + red + "," + green + ',0)';
      ctx.closePath();
      ctx.fill();
    };
  }

  function collide(b1, b2){
    var distance = Math.sqrt(Math.pow(b2.pos.x - b1.pos.x, 2) + Math.pow(b2.pos.y - b1.pos.y, 2));
    return distance < b1.size + b2.size;
  }


  function drawStuff() {
    ctx.clearRect(0, 0, realWidth, realHeight);
    for (var i = 0; i < members.length; i++){
      members[i].draw();
      members[i].move();
    }
    window.requestAnimationFrame(drawStuff);
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.80;

    scaleCanvas();
    drawStuff();
  }

  var backingScale = function() {
    if ('devicePixelRatio' in window) {
      if (window.devicePixelRatio > 1) {
        return window.devicePixelRatio;
      }
    }
    return 1;
  };

  var scaleCanvas = function(){
    var scaleFactor = backingScale();
    if (scaleFactor > 1) {
      var oldWidth = canvas.width;
      var oldHeight = canvas.height;
      canvas.width = canvas.width * scaleFactor;
      canvas.height = canvas.height * scaleFactor;
      // update the context for the new canvas scale
      canvas.getContext("2d").scale(scaleFactor, scaleFactor);
      canvas.style.width = oldWidth + "px";
      canvas.style.height = oldHeight + "px";
      realHeight = oldHeight;
      realWidth = oldWidth;
    }
  };

  function init(){
    console.log("helllllo");
    // resize the canvas to fill browser window dynamically

    window.addEventListener('resize', resizeCanvas, false);
    members.push(new Blob(Math.random() * realWidth, Math.random() * realHeight));
    resizeCanvas();
    registerEventListeners();
  }

  function registerEventListeners(){
    $('#canvas').on('mouseup', function(event){
      console.log(event);
      var blob = new Blob(event.offsetX, event.offsetY);
      members.push(blob);
    });
  }


  init();
});
