var Game;

(function (Game) {
  var realWidth;
  var realHeight;
  var absorb = 0.1;
  var RESTI = 0.4;
  var TWOPI = Math.PI * 2;
  var useBlobColors = false;
  var absorbMode = false;
  var members = [];
  var canvas = document.getElementById("canvas");

  class Vector {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }

    subtract(vector) {
      return new Vector(this.x - vector.x, this.y - vector.y);
    }

    add(vector) {
      return new Vector(this.x + vector.x, this.y + vector.y);
    }

    multiply(val) {
      return new Vector(this.x * val, this.y * val);
    }

    dot(v) {
      return this.x * v.x + this.y * v.y;
    }

    vectorMultiply(v) {
      return new Vector(this.x * v.x, this.y * v.y);
    }

    normalize() {
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
    }

    reverseX() {
      this.x *= -1;
    }

    reverseY() {
      this.y *= -1;
    }

    reverse() {
      this.reverseX();
      this.reverseY();
    }

    length() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    distance(v) {
      return Math.sqrt((v.x - this.x) * (v.x - this.x) + (v.y - this.y) * (v.y - this.y));
    }

    direction() {
      var x = this.x / Math.abs(this.x);
      var y = this.y / Math.abs(this.y);
      return new Vector(x, y);
    }

  }

  class Blob {
    constructor(x, y, id, canvas) {
      this.id = id;
      this.radius = Math.floor(Math.random() * 10) + 1;
      this.color = "#" + Math.floor(Math.random() * 16777215).toString(16);
      this.pos = new Vector(x, y);
      this.v = new Vector(0, 0);
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", {
        alpha: false
      });
    }

    bump(n) {
      this.v.y += Math.random() >= 0.5 ? 1 : -1 * n;
      this.v.x += Math.random() >= 0.5 ? 1 : -1 * n;
    }

    move() {
      this.pos.x += this.v.x;
      this.pos.y += this.v.y;

      if (this.pos.x - this.radius < 0) {
        this.pos.x = this.radius;
        this.v.x = -(this.v.x * RESTI);
      } else if (this.pos.x + this.radius > realWidth) {
        this.pos.x = realWidth - this.radius;
        this.v.x = -(this.v.x * RESTI);
      }

      if (this.pos.y - this.radius < 0) {
        this.pos.y = this.radius;
        this.v.y = -(this.v.y * RESTI);
      } else if (this.pos.y + this.radius > realHeight) {
        this.pos.y = realHeight - this.radius;
        this.v.y = -(this.v.y * RESTI);
      }
    }

    collisionCheck() {
      for (var i = 0; i < members.length; i++) {
        if (members[i].id !== this.id) {
          if (roughCollisionCheck(this, members[i])) {
            if (collide(this, members[i])) {
              resolveCollision(this, members[i]);
            }
          }
        }
      }
    }

    getColor() {
      let color = this.color;

      if (!useBlobColors) {
        var MAX = 3;
        var red = Math.floor(255 * Math.abs(this.v.y) / MAX);
        var green = 255 - red;
        color = `rgb(${red}, ${green},0)`;
      }

      return color;
    }

  }

  function resolveCollision(b1, b2) {
    var delta = b1.pos.subtract(b2.pos);
    var r = b1.radius + b2.radius;
    var dist2 = delta.dot(delta);
    var mtd;

    if (dist2 > r * r) {
      return;
    }

    if (absorbMode && b1.radius > b2.radius && 2 * (b1.radius + absorb) < realHeight && 2 * (b1.radius + absorb) < realWidth) {
      b1.radius += absorb / 3;
      b2.radius = Math.max(0, b2.radius - absorb);

      if (b2.radius === 0) {
        members.splice(members.indexOf(b2), 1);
      }
    }

    var d = delta.length();

    if (d !== 0.0) {
      mtd = delta.multiply((b1.radius + b2.radius - d) / d);
    } else {
      d = b1.radius + b2.radius - 1.0;
      delta = new Vector(b1.radius + b2.radius, 0.0);
      mtd = delta.multiply((b1.radius + b2.radius - d) / d);
    }

    var im1 = 1 / b1.radius;
    var im2 = 1 / b2.radius;
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
    return b1.pos.x + b1.radius + b2.radius > b2.pos.x && b1.pos.x < b2.pos.x + b1.radius + b2.radius && b1.pos.y + b1.radius + b2.radius > b2.pos.y && b1.pos.y < b2.pos.y + b1.radius + b2.radius;
  }

  function collide(b1, b2) {
    let distance = Math.sqrt(Math.pow(b2.pos.x - b1.pos.x, 2) + Math.pow(b2.pos.y - b1.pos.y, 2));
    return distance < b1.radius + b2.radius;
  }

  function drawStuff(ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const member of members) {
      member.move();
      member.collisionCheck();
    }

    for (const member of members) {
      ctx.beginPath();
      ctx.fillStyle = member.getColor();
      ctx.moveTo(member.pos.x, member.pos.y);
      ctx.arc(member.pos.x, member.pos.y, member.radius, 0, TWOPI);
      ctx.fill();
    }

    window.requestAnimationFrame(drawStuff.bind(null, ctx));
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.8;
    scaleCanvas();
    var ctx = canvas.getContext("2d", {
      alpha: false
    });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStuff(ctx);
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
      var ctx = canvas.getContext("2d", {
        alpha: false
      });
      ctx.scale(scaleFactor, scaleFactor);
      canvas.style.width = realWidth + "px";
      canvas.style.height = realHeight + "px";
    }
  };

  function generateId() {
    return "" + Math.floor(Math.random() * 1000000000);
  }

  function addRandomBlob(bump = true) {
    let blob = new Blob(Math.random() * realWidth, Math.random() * realHeight, generateId(), canvas);

    if (bump) {
      blob.bump(Math.round(Math.random() * 3));
    }

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
    addRandomBlob(false);
    resizeCanvas();
    registerEventListeners();
  }

  Game.init = init;

  function registerEventListeners() {
    const canvas = document.getElementById("canvas");
    canvas.addEventListener("mouseup", event => {
      let blob = new Blob(event.offsetX, event.offsetY, generateId(), canvas);
      insertBlob(blob);
    });
    const woah = document.querySelector(".title .whoa");
    woah.addEventListener("mouseup", function () {
      console.log("toggle blob colors");
      useBlobColors = !useBlobColors;
    });
    const genTen = document.getElementById("gen10");
    genTen.addEventListener("click", function () {
      for (let i = 0; i < 10; i++) {
        addRandomBlob();
      }
    });
    const genOneHundred = document.getElementById("gen100");
    genOneHundred.addEventListener("click", function () {
      for (let i = 0; i < 100; i++) {
        addRandomBlob();
      }
    });
    const boldTitle = document.getElementById("bigpartytitle");
    boldTitle.addEventListener("click", function () {
      members.forEach(member => member.bump(Math.round(Math.random() * 3)));
    });
  }
})(Game || (Game = {}));
//# sourceMappingURL=blob.js.map
