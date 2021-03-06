module Game {
  var realWidth: number;
  var realHeight: number;

  var absorb: number = 0.1;
  var RESTI: number = 0.4;
  var TWOPI: number = Math.PI * 2;

  var useBlobColors: boolean = false;
  var absorbMode: boolean = false;

  var members: Blob[] = [];
  var canvas = <HTMLCanvasElement>document.getElementById("canvas");

  class Vector {
    x: number;
    y: number;

    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
    }

    subtract(vector: Vector) {
      return new Vector(this.x - vector.x, this.y - vector.y);
    }
    add(vector: Vector) {
      return new Vector(this.x + vector.x, this.y + vector.y);
    }
    multiply(val: number) {
      return new Vector(this.x * val, this.y * val);
    }
    dot(v: Vector) {
      return this.x * v.x + this.y * v.y;
    }
    vectorMultiply(v: Vector) {
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
    distance(v: Vector) {
      return Math.sqrt(
        (v.x - this.x) * (v.x - this.x) + (v.y - this.y) * (v.y - this.y)
      );
    }
    direction() {
      var x = this.x / Math.abs(this.x);
      var y = this.y / Math.abs(this.y);
      return new Vector(x, y);
    }
  }

  class Blob {
    id: string;
    radius: number;
    color: string;
    pos: Vector;
    v: Vector;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    constructor(x: number, y: number, id: string, canvas: HTMLCanvasElement) {
      this.id = id;
      this.radius = Math.floor(Math.random() * 10) + 1;
      this.color = "#" + Math.floor(Math.random() * 16777215).toString(16);
      this.pos = new Vector(x, y);
      this.v = new Vector(0, 0);
      this.canvas = canvas;
      this.ctx = <CanvasRenderingContext2D>(
        canvas.getContext("2d", { alpha: false })
      );
    }

    bump(n: number) {
      this.v.y += Math.random() >= 0.5 ? 1 : -1 * n;
      this.v.x += Math.random() >= 0.5 ? 1 : -1 * n;
    }
    move() {
      this.pos.x += this.v.x;
      this.pos.y += this.v.y;

      // Check for collision with walls
      if (this.pos.x - this.radius < 0) {
        this.pos.x = this.radius; // Place ball against edge
        this.v.x = -(this.v.x * RESTI); // Reverse direction and account for friction
      } else if (this.pos.x + this.radius > realWidth) {
        // Right Wall
        this.pos.x = realWidth - this.radius; // Place ball against edge
        this.v.x = -(this.v.x * RESTI); // Reverse direction and account for friction
      }

      if (this.pos.y - this.radius < 0) {
        // Top Wall
        this.pos.y = this.radius; // Place ball against edge
        this.v.y = -(this.v.y * RESTI); // Reverse direction and account for friction
      } else if (this.pos.y + this.radius > realHeight) {
        // Bottom Wall
        this.pos.y = realHeight - this.radius; // Place ball against edge
        this.v.y = -(this.v.y * RESTI); // Reverse direction and account for friction
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

    getColor(): string {
      let color = this.color;
      if (!useBlobColors) {
        var MAX = 3;
        var red = Math.floor((255 * Math.abs(this.v.y)) / MAX);
        //console.log(red);
        var green = 255 - red;
        color = `rgb(${red}, ${green},0)`;
      }
      return color;
    }
  }

  function resolveCollision(b1: Blob, b2: Blob) {
    // get the mtd
    var delta = b1.pos.subtract(b2.pos);
    var r = b1.radius + b2.radius;
    var dist2 = delta.dot(delta);
    var mtd;

    if (dist2 > r * r) {
      return; // they aren't colliding
    }

    if (
      absorbMode &&
      b1.radius > b2.radius &&
      2 * (b1.radius + absorb) < realHeight &&
      2 * (b1.radius + absorb) < realWidth
    ) {
      b1.radius += absorb / 3;
      b2.radius = Math.max(0, b2.radius - absorb);
      //console.log(b1.size + ':' + b2.size);
      if (b2.radius === 0) {
        members.splice(members.indexOf(b2), 1);
      }
    }

    var d = delta.length();
    //console.log(d);
    if (d !== 0.0) {
      // minimum translation distance to push balls apart after intersecting
      mtd = delta.multiply((b1.radius + b2.radius - d) / d);
    } else {
      // Special case. Balls are exactly on top of eachother.
      // Don't want to divide by zero.
      d = b1.radius + b2.radius - 1.0;
      delta = new Vector(b1.radius + b2.radius, 0.0);
      mtd = delta.multiply((b1.radius + b2.radius - d) / d);
    }
    // resolve intersection
    var im1 = 1 / b1.radius; // inverse mass quantities
    var im2 = 1 / b2.radius;
    //console.log(mtd.length());
    // push-pull them apart

    b1.pos = b1.pos.add(mtd.multiply(im1 / (im1 + im2)));
    b2.pos = b2.pos.subtract(mtd.multiply(im2 / (im1 + im2)));

    // impact speed
    var v = b1.v.subtract(b2.v);
    mtd = mtd.normalize();
    var vn = v.dot(mtd);
    // sphere intersecting but moving away from each other already
    if (vn > 0) {
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

  function roughCollisionCheck(b1: Blob, b2: Blob) {
    return (
      b1.pos.x + b1.radius + b2.radius > b2.pos.x &&
      b1.pos.x < b2.pos.x + b1.radius + b2.radius &&
      b1.pos.y + b1.radius + b2.radius > b2.pos.y &&
      b1.pos.y < b2.pos.y + b1.radius + b2.radius
    );
  }

  function collide(b1: Blob, b2: Blob) {
    let distance = Math.sqrt(
      Math.pow(b2.pos.x - b1.pos.x, 2) + Math.pow(b2.pos.y - b1.pos.y, 2)
    );
    return distance < b1.radius + b2.radius;
  }

  function drawStuff(ctx: CanvasRenderingContext2D) {
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
    var ctx: CanvasRenderingContext2D = <CanvasRenderingContext2D>(
      canvas.getContext("2d", { alpha: false })
    );
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStuff(ctx);
  }

  var backingScale = function() {
    if ("devicePixelRatio" in window) {
      if (window.devicePixelRatio > 1) {
        return window.devicePixelRatio;
      }
    }
    return 1;
  };

  var scaleCanvas = function() {
    var scaleFactor = backingScale();
    realWidth = canvas.width;
    realHeight = canvas.height;
    if (scaleFactor > 1) {
      var oldWidth: number = canvas.width;
      var oldHeight: number = canvas.height;
      canvas.width = canvas.width * scaleFactor;
      canvas.height = canvas.height * scaleFactor;
      // update the context for the new canvas scale
      var ctx: CanvasRenderingContext2D = <CanvasRenderingContext2D>(
        canvas.getContext("2d", { alpha: false })
      );
      ctx.scale(scaleFactor, scaleFactor);
      canvas.style.width = realWidth + "px";
      canvas.style.height = realHeight + "px";
    }
  };

  function generateId(): string {
    return "" + Math.floor(Math.random() * 1000000000);
  }

  function addRandomBlob(bump = true) {
    let blob: Blob = new Blob(
      Math.random() * realWidth,
      Math.random() * realHeight,
      generateId(),
      canvas
    );
    if (bump) {
      blob.bump(Math.round(Math.random() * 3));
    }
    insertBlob(blob);
  }

  function insertBlob(blob: Blob) {
    members.push(blob);
  }

  function removeBlob(blob: Blob) {
    members.splice(members.indexOf(blob), 1);
  }

  export function init() {
    realWidth = canvas.width;
    realHeight = canvas.height;

    window.addEventListener("resize", resizeCanvas, false);
    addRandomBlob(false);
    resizeCanvas();
    registerEventListeners();
  }

  function registerEventListeners() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    canvas.addEventListener("mouseup", event => {
      let blob: Blob = new Blob(
        event.offsetX,
        event.offsetY,
        generateId(),
        canvas
      );
      insertBlob(blob);
    });

    const woah = document.querySelector(".title .whoa") as HTMLSpanElement;
    woah.addEventListener("mouseup", function() {
      console.log("toggle blob colors");
      useBlobColors = !useBlobColors;
    });

    const genTen = document.getElementById("gen10") as HTMLSpanElement;
    genTen.addEventListener("click", function() {
      for (let i = 0; i < 10; i++) {
        addRandomBlob();
      }
    });

    const genOneHundred = document.getElementById("gen100") as HTMLSpanElement;
    genOneHundred.addEventListener("click", function() {
      for (let i = 0; i < 100; i++) {
        addRandomBlob();
      }
    });

    const boldTitle = document.getElementById(
      "bigpartytitle"
    ) as HTMLSpanElement;
    boldTitle.addEventListener("click", function() {
      members.forEach(member => member.bump(Math.round(Math.random() * 3)));
    });
  }
}
