var Game;

(function (Game) {
  var realWidth;
  var realHeight;
  let fps;
  var absorb = 0.1;
  var RESTI = 0.4;
  var TWOPI = Math.PI * 2;
  var useBlobColors = false;
  var absorbMode = false;
  var members = [];
  var canvas = document.getElementById("canvas");

  class Vector {
    constructor(x, y) {
      this.subtract = function (vector) {
        return new Vector(this.x - vector.x, this.y - vector.y);
      };

      this.add = function (vector) {
        return new Vector(this.x + vector.x, this.y + vector.y);
      };

      this.multiply = function (val) {
        return new Vector(this.x * val, this.y * val);
      };

      this.dot = function (v) {
        return this.x * v.x + this.y * v.y;
      };

      this.vectorMultiply = function (v) {
        return new Vector(this.x * v.x, this.y * v.y);
      };

      this.normalize = function () {
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

      this.reverseX = function () {
        this.x *= -1;
      };

      this.reverseY = function () {
        this.y *= -1;
      };

      this.reverse = function () {
        this.reverseX();
        this.reverseY();
      };

      this.length = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
      };

      this.distance = function (v) {
        return Math.sqrt((v.x - this.x) * (v.x - this.x) + (v.y - this.y) * (v.y - this.y));
      };

      this.direction = function () {
        var x = this.x / Math.abs(x);
        var y = this.y / Math.abs(y);
        return new Vector(x, y);
      };

      this.x = x;
      this.y = y;
    }

  }

  class Blob {
    constructor(x, y, id, canvas) {
      this.bump = function (n) {
        this.v.y += Math.random() >= 0.5 ? 1 : -1 * n;
        this.v.x += Math.random() >= 0.5 ? 1 : -1 * n;
      };

      this.move = function () {
        this.pos.x += this.v.x;
        this.pos.y += this.v.y;

        if (this.pos.x - this.size < 0) {
          this.pos.x = this.size;
          this.v.x = -(this.v.x * RESTI);
        } else if (this.pos.x + this.size > realWidth) {
          this.pos.x = realWidth - this.size;
          this.v.x = -(this.v.x * RESTI);
        }

        if (this.pos.y - this.size < 0) {
          this.pos.y = this.size;
          this.v.y = -(this.v.y * RESTI);
        } else if (this.pos.y + this.size > realHeight) {
          this.pos.y = realHeight - this.size;
          this.v.y = -(this.v.y * RESTI);
        }
      };

      this.collisionCheck = function () {
        for (var i = 0; i < members.length; i++) {
          if (members[i].id !== this.id) {
            if (roughCollisionCheck(this, members[i])) {
              if (collide(this, members[i])) {
                resolveCollision(this, members[i]);
              }
            }
          }
        }
      };

      this.draw = function (ctx) {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.size, 0, TWOPI, true);
        var color = this.color;

        if (!useBlobColors) {
          var MAX = 3;
          var red = Math.floor(255 * Math.abs(this.v.y) / MAX);
          var green = 255 - red;
          color = "rgb(" + red + "," + green + ",0)";
        }

        ctx.fillStyle = color;
        ctx.closePath();
        ctx.fill();
      };

      this.id = id;
      this.size = Math.floor(Math.random() * 10) + 6;
      this.color = "#" + Math.floor(Math.random() * 16777215).toString(16);
      this.pos = new Vector(x, y);
      this.v = new Vector(0, 0);
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
    }

  }

  function resolveCollision(b1, b2) {
    var delta = b1.pos.subtract(b2.pos);
    var r = b1.size + b2.size;
    var dist2 = delta.dot(delta);
    var mtd;

    if (dist2 > r * r) {
      return;
    }

    if (absorbMode && b1.size > b2.size && 2 * (b1.size + absorb) < realHeight && 2 * (b1.size + absorb) < realWidth) {
      b1.size += absorb / 3;
      b2.size = Math.max(0, b2.size - absorb);

      if (b2.size === 0) {
        members.splice(members.indexOf(b2), 1);
      }
    }

    var d = delta.length();

    if (d !== 0.0) {
      mtd = delta.multiply((b1.size + b2.size - d) / d);
    } else {
      d = b1.size + b2.size - 1.0;
      delta = new Vector(b1.size + b2.size, 0.0);
      mtd = delta.multiply((b1.size + b2.size - d) / d);
    }

    var im1 = 1 / b1.size;
    var im2 = 1 / b2.size;
    b1.pos = b1.pos.add(mtd.multiply(im1 / (im1 + im2)));
    b2.pos = b2.pos.subtract(mtd.multiply(im2 / (im1 + im2)));
    var v = b1.v.subtract(b2.v);
    mtd = mtd.normalize();
    var vn = v.dot(mtd);

    if (vn > 0) {
      return;
    }

    var i = -((1.0 + RESTI) * vn) / (im1 + im2);
    var impulse = mtd.multiply(i);
    b1.v = b1.v.add(impulse.multiply(im1));
    b2.v = b2.v.subtract(impulse.multiply(im2));
  }

  function roughCollisionCheck(b1, b2) {
    return b1.pos.x + b1.size + b2.size > b2.pos.x && b1.pos.x < b2.pos.x + b1.size + b2.size && b1.pos.y + b1.size + b2.size > b2.pos.y && b1.pos.y < b2.pos.y + b1.size + b2.size;
  }

  function collide(b1, b2) {
    let distance = Math.sqrt(Math.pow(b2.pos.x - b1.pos.x, 2) + Math.pow(b2.pos.y - b1.pos.y, 2));
    return distance < b1.size + b2.size;
  }

  function drawStuff() {
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < members.length; i++) {
      members[i].move(ctx);
    }

    for (var i = 0; i < members.length; i++) {
      members[i].collisionCheck(ctx);
      members[i].draw(ctx);
    }

    window.requestAnimationFrame(drawStuff);
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.8;
    scaleCanvas();
    drawStuff();
  }

  var backingScale = function () {
    if ("devicePixelRatio" in window) {
      if (window.devicePixelRatio > 1) {
        return window.devicePixelRatio;
      }
    }

    return 1;
  };

  var scaleCanvas = function () {
    var scaleFactor = backingScale();
    realWidth = canvas.width;
    realHeight = canvas.height;

    if (scaleFactor > 1) {
      var oldWidth = canvas.width;
      var oldHeight = canvas.height;
      canvas.width = canvas.width * scaleFactor;
      canvas.height = canvas.height * scaleFactor;
      var ctx = canvas.getContext("2d");
      ctx.scale(scaleFactor, scaleFactor);
      canvas.style.width = realWidth + "px";
      canvas.style.height = realHeight + "px";
    }
  };

  function generateId() {
    return "" + Math.floor(Math.random() * 1000000000);
  }

  function addRandomBlob() {
    let blob = new Blob(Math.random() * realWidth, Math.random() * realHeight, generateId(), canvas);
    blob.bump(Math.round(Math.random() * 3));
    insertBlob(blob);
  }

  function insertBlob(blob) {
    members.push(blob);
  }

  function removeBlob(blob) {
    members.splice(members.indexOf(blob), 1);
  }

  function init() {
    realWidth = canvas.width;
    realHeight = canvas.height;
    window.addEventListener("resize", resizeCanvas, false);
    addRandomBlob();
    resizeCanvas();
    registerEventListeners();
  }

  Game.init = init;

  function registerEventListeners() {
    $("#canvas").on("mouseup", function (event) {
      let blob = new Blob(event.offsetX, event.offsetY, generateId(), canvas);
      insertBlob(blob);
    });
    $(".title .whoa").on("mouseup", function () {
      console.log("toggle blob colors");
      useBlobColors = !useBlobColors;
    });
    $("#gen10").on("click", function () {
      for (let i = 0; i < 10; i++) {
        addRandomBlob();
      }
    });
    $("#gen100").on("click", function () {
      for (let i = 0; i < 100; i++) {
        addRandomBlob();
      }
    });
    $(".title .bold").on("mouseup", function () {
      members.forEach(member => member.bump(Math.round(Math.random() * 3)));
    });
  }
})(Game || (Game = {}));
//# sourceMappingURL=blob.js.map
