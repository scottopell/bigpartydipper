/// <reference path="jquery.d.ts" />
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Game;
(function (Game) {
    var realWidth;
    var realHeight;
    var absorb = .1;
    var RESTI = .4;
    var TWOPI = Math.PI * 2;
    var useBlobColors = false;
    var absorbMode = false;
    var members = [];
    var canvas = document.getElementById('canvas');

    var Vector = function Vector(x, y) {
        _classCallCheck(this, Vector);

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
    };

    var Blob = function Blob(x, y, id, canvas) {
        _classCallCheck(this, Blob);

        this.bump = function (n) {
            this.v.y += Math.random() > 0.5 ? 1 : -1 * n;
            this.v.x += Math.random() > 0.5 ? 1 : -1 * n;
        };
        this.move = function () {
            for (var i = 0; i < members.length; i++) {
                if (members[i].id !== this.id) {
                    if (collide(this, members[i])) {
                        this.v.reverse();
                        this.pos.add(this.v);
                        members[i].v.reverse();
                        members[i].pos.add(members[i].v);
                        resolveCollision(this, members[i]);
                    }
                }
            }
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
        this.draw = function (ctx) {
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.size, 0, TWOPI, true);
            var color = this.color;
            if (!useBlobColors) {
                var MAX = 3;
                var red = Math.floor(255 * Math.abs(this.v.y) / MAX);
                var green = 255 - red;
                color = 'rgb(' + red + "," + green + ',0)';
            }
            ctx.fillStyle = color;
            ctx.closePath();
            ctx.fill();
        };
        this.id = id;
        this.size = Math.floor(Math.random() * 10) + 6;
        this.color = '#' + Math.floor(Math.random() * 16777215).toString(16);
        this.pos = new Vector(x, y);
        this.v = new Vector(0, 0);
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    };

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
    function collide(b1, b2) {
        var distance = Math.sqrt(Math.pow(b2.pos.x - b1.pos.x, 2) + Math.pow(b2.pos.y - b1.pos.y, 2));
        return distance < b1.size + b2.size;
    }
    function drawStuff() {
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < members.length; i++) {
            members[i].draw(ctx);
            members[i].move(ctx);
        }
        window.requestAnimationFrame(drawStuff);
    }
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight * 0.80;
        scaleCanvas();
        drawStuff();
    }
    var backingScale = function backingScale() {
        if ('devicePixelRatio' in window) {
            if (window.devicePixelRatio > 1) {
                return window.devicePixelRatio;
            }
        }
        return 1;
    };
    var scaleCanvas = function scaleCanvas() {
        var scaleFactor = backingScale();
        if (scaleFactor > 1) {
            var oldWidth = canvas.width;
            var oldHeight = canvas.height;
            canvas.width = canvas.width * scaleFactor;
            canvas.height = canvas.height * scaleFactor;
            var ctx = canvas.getContext('2d');
            ctx.scale(scaleFactor, scaleFactor);
            canvas.style.width = oldWidth + "px";
            canvas.style.height = oldHeight + "px";
            realHeight = oldHeight;
            realWidth = oldWidth;
        }
    };
    function generateId() {
        return "" + Math.floor(Math.random() * 1000000000);
    }
    function init() {
        realWidth = canvas.width;
        realHeight = canvas.height;
        window.addEventListener('resize', resizeCanvas, false);
        var blob = new Blob(Math.random() * realWidth, Math.random() * realHeight, generateId(), canvas);
        blob.bump(Math.round(Math.random() * 3));
        members.push(blob);
        resizeCanvas();
        registerEventListeners();
    }
    Game.init = init;
    function registerEventListeners() {
        $('#canvas').on('mouseup', function (event) {
            console.log('click / new blob created');
            var blob = new Blob(event.offsetX, event.offsetY, generateId(), canvas);
            members.push(blob);
        });
        $('.title .whoa').on('mouseup', function () {
            console.log('toggle blob colors');
            useBlobColors = !useBlobColors;
        });
        $('.title .bold').on('mouseup', function () {
            console.log('bump');
            members.forEach(function (member) {
                console.log(member);
                member.bump(Math.round(Math.random() * 3));
            });
        });
    }
})(Game || (Game = {}));
//# sourceMappingURL=blob.js.map