$('.dropdown-toggle').dropdown()

! function () {

	"use strict";

	// branch constructor

	function Branch (parent, level, hue, x, y) {

		this.parent = parent;
		this.branches = [];
		this.hue = hue;
		this.p0 = parent ? parent.p1 : new Point(x, y, 0);
		this.p1 = new Point(
			x,
			y,
			parent === root ?
				0
				:
				(
					parent ?
						parent.p1.z + (
							level ?
								Math.random() * 10 - 5
								:
								0
						)
						:
						0
				)
		);

		this.level = level;
		this.life  = 0;
		this.angle = 0;
		this.vx    = 0;
		this.vy    = 0;

	}

	// grow branch

	Branch.prototype.grow = function () {

		// z move

		this.p1.z--;

		// 3D projection

		this.p1.project();

		// recursively grow children branches

		for (var i = 0; i < this.branches.length; i++) {

			var b = this.branches[i];
			b.grow();
			b.draw();

		}

		// grow

		if (this.life-- > 1) {

			this.p1.x += this.vx;
			this.p1.y += this.vy;

		}

		// done - push more children branches

		if (this.life === 1 && this.level > 0) {

			this.branches.push(newBranch(this));
			this.branches.push(newBranch(this));

			// maybe another one
			if (Math.random() <= freq) this.branches.push(newBranch(this));

			this.life--;

		}

		// cut the tree

		if (this.p0.z <= -250) {

			this.parent = null;

		}

	}

	// draw the branch

	Branch.prototype.draw = function () {

		var width = this.level === 1 ?
			1
			:
			((this.level + 1) * (this.level + 1)) * 0.5 * this.p1.scale * scale
		;

		var color = 5 + Math.abs(this.p0.z * 0.35);

		ctx.lineWidth = this.level ? width : width * leafSize;

		ctx.strokeStyle = this.level ?
			"hsl(" + (this.hue % 360) + ", 14%,"+ color + "%)" // branch
			:
			"hsl(" + ((this.hue + 180) % 360) + ", 70%, 50%)"; // leaf

		ctx.beginPath();
		ctx.lineCap = "round";

		ctx.moveTo(canvas.centerX + this.p0.xp, canvas.centerY + this.p0.yp);
		ctx.lineTo(canvas.centerX + this.p1.xp, canvas.centerY + this.p1.yp);

		ctx.stroke();

	}

	// 3D point constructor

	function Point (x, y, z) {

		this.x = x;
		this.y = y;
		this.z = z;
		this.scale = 0;
		this.xp = 0;
		this.yp = 0;

	}

	// 3D point projection

	Point.prototype.project = function () {

		this.scale = 265 / (265 + this.z);
		this.xp = (this.x - canvas.width  * 0.5) * this.scale;
		this.yp = (this.y - canvas.height * 0.5) * this.scale;

	}

	// new branch factory

	function newBranch (parent) {

		var branch = new Branch (parent, parent.level - 1, hue, parent.p1.x, parent.p1.y);

		branch.angle = Math.atan2(

			parent.p1.y - parent.p0.y,
			parent.p1.x - parent.p0.x

		) + (branch.level ?

			(Math.random() * maxAngle - (maxAngle * 0.5))
			:
			0

		);

		branch.vx = Math.cos(branch.angle) * growSpeed;
		branch.vy = Math.sin(branch.angle) * growSpeed;

		branch.life = branch.level ?

			Math.round(scale * Math.random() * branch.level * branchLength) + 1
			:
			2

		;

		return branch;

	}

	// animate the tree

	function tree () {

		// clear screen

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// pointer trail

		if (pointer.moveDistance > 20) {

			pointer.moveDistance = 0;

			// main trunk

			var branch = new Branch (

				root,
				root.level,
				hue,
				root.p1.x,
				root.p1.y

			);

			// add another branch

			if (Math.random() <= freq) root.branches.push(

				newBranch(root)

			);

			// new root

			root = branch;
			root.p1.x = pointer.x;
			root.p1.y = pointer.y;

		}

		// increment color

		hue++;

		// traverse the tree

		var trunk = root;

		while (trunk) {

			trunk.grow();
			trunk.draw();
			trunk = trunk.parent;

		}

	}

	// prepare the canvas

	var canvas = {

		elem: document.getElementById('canvas'),

		resize: function () {

			this.width   = this.elem.width  = this.elem.offsetWidth;
			this.height  = this.elem.height = this.elem.offsetHeight;
			this.centerX = this.width  * 0.5;
			this.centerY = this.height * 0.5;
			scale = Math.max(this.width, this.height) / 1440;

		}

	}

	var ctx = canvas.elem.getContext("2d");

	canvas.elem.onselectstart = function() { return false; }
	canvas.elem.ondragstart   = function() { return false; }

	window.addEventListener('resize', canvas.resize.bind(canvas), false);
	canvas.resize();

	// pointer events

	var pointer = {

		x:  0,
		y:  0,
		px: 0,
		py: 0,
		moveDistance: 0,

		move: function (e) {

			e.preventDefault();

			var pointer = e.targetTouches ? e.targetTouches[0] : e;

			// stop automove

			if (automove) {

				automove = false;
				document.getElementById("clic").innerHTML = "";

			}

			this.x = pointer.clientX;
			this.y = pointer.clientY;

			this.distance();

			// render tree

			requestAnimationFrame(tree);

		},

		distance: function () {

			var dx = this.x - this.px;
			var dy = this.y - this.py;

			this.moveDistance += Math.sqrt(dx * dx + dy * dy);


			// speed limit

			if (!automove && this.moveDistance > 40) {

				this.x = this.px + dx * 0.1;
				this.y = this.py + dy * 0.1;

			}

			this.px = this.x;
			this.py = this.y;

		}

	}

	window.addEventListener("mousemove", pointer.move.bind(pointer), false );
	canvas.elem.addEventListener("touchmove", pointer.move.bind(pointer), false );

	// variables
	var root         = null;
	var hue          = 0;
	var automove     = true;
	var angleX       = 0;
	var angleY       = 0;
	/////////////////////////
	var maxLevels    = 6;
	var branchLength = 16;
	var leafSize     = 14;
	var growSpeed    = 2;
	var maxAngle     = 1.2;
	var freq         = 0.3;
	var scale        = 1;
	/////////////////////////

	// auto start

	! function auto () {

		automove && requestAnimationFrame(auto);

		// lissajou

		pointer.x = canvas.centerX + canvas.centerX * Math.cos(angleX += 0.02) * 0.20;
		pointer.y = canvas.centerY + canvas.centerY * Math.sin(angleY += 0.04) * 0.25;

		pointer.distance();

		// create the first branch

		if (!root) {

			root = new Branch (false, maxLevels, hue, pointer.x, pointer.y);
			root.p0 = root.p1;
			root.p0.project();

		}

		// render tree

		tree();

	}();

}();
