        var pageW = 900;
        var pageH = 400;
        var hex = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
        var C = 0;
        var b0 = "#000";
        var b1 = "#222";
        var b2 = "#444";
        var f0 = "#FFF";
        var f1 = "#CFF";
        var f2 = "#FFC";

        var drawArea = document.getElementById('canvasArea');
        drawArea.width = pageW;
        drawArea.height = pageH;
        var ctx = drawArea.getContext('2d');
        var Root;
        var Top;
        var Back = "#FFFFFF";
        var Interval = null;

        function ParseJSONTree() {
			
            var JSONTree = document.getElementById("txt").value;
			try{
				var tree = JSON.parse(JSONTree);
				Root = new Node(tree.name, tree.desc, 0, null, null);
				BuildJSONTree(Root, tree);

				clear();
				Root.draw(0);
				Top = Root;
			}
			catch(x){
				alert("Error parsing JSON:"+x);
				console.error(x);
			}
        }

        function BuildJSONTree(parent, tree) {
            for (var i = 0; i < tree["child"]?.length; i++) {
                var temp = new Node(tree["child"][i].name, tree["child"][i].desc, i, null, parent);
                parent.child[parent.child.length] = temp
                BuildJSONTree(temp, tree["child"][i]);
            }
        }

        function Node(name, desc, index, child, parent) {
            this.name = name || "";
            this.desc = desc || "";
            this.index = index || 0;
            this.child = child || [];
            this.parent = parent;
            this.x = -1;
            this.y = -1;
            this.w = -1;
            this.h = -1;
        }
        Node.prototype.draw = function (lvl) {
            if (!this.parent && lvl > 0) { lvl = 0; }
            if (lvl == 0 && this.parent) {
                this.parent.draw(-1);
            }

            var w = 300;
            var h = 50;
            var x = (pageW - w) / 2;
            var y = 10;
            var back = "#fff";
            var fore = "#000";

            if (lvl < 0) {
                //controls the fading.
                var depth = NodeDepth(Top, 0);
                var scale = -.4;
                scale = Math.max(-1/(depth + 1), Math.min(0, scale));
                var base = 150;
                var fade = (lvl * scale);
                var padding = -20 * scale;
                var offset = ((-lvl * -lvl) * (75 * scale)) + (-lvl * (75 * scale + base + padding));

                x = (pageW - 300) / 2 - offset;
                w = base * (1-fade);
                h = 30;
                y = 15;
                ctx.font = "14px Arial";
                back = b0;
                fore = f0;

                if (this.parent) {
                    this.parent.draw(lvl - 1);
                }

                //draw line
                ctx.strokeStyle = "#000";
                ctx.beginPath();
                ctx.moveTo(x + w, y + (h / 2));
                ctx.lineTo(x + w + padding, y + (h / 2));
                ctx.stroke();

            }
            else if (lvl == 0) {
                ctx.font = "18px Arial";
                back = b0;
                fore = f0;

                if (this.child.length > 0) {
                    //draw lines
                    ctx.strokeStyle = "#000";
                    ctx.beginPath();
                    ctx.moveTo(x + (w / 2), y + h);
                    ctx.lineTo(x + (w / 2), y + h + 10);
                    ctx.stroke();

                    var childw = Math.min(200, (pageW - (10 * this.child.length)) / this.child.length);
                    var start = ((pageW - (this.child.length * (childw + 10)) + childw) / 2) + 5;
                    var end = start + (childw + 10) * (this.child.length - 1);

                    ctx.moveTo(start, y + h + 10);
                    ctx.lineTo(end, y + h + 10);
                    ctx.stroke();
                }
            }
            else if (lvl == 1) {
                ctx.font = "14px Arial";
                back = b1;
                fore = f1;

                h = 30;
                w = Math.min(200, (pageW - (10 * this.parent.child.length)) / this.parent.child.length);
                var offset = (pageW - (this.parent.child.length * (w + 10))) / 2;
                x = this.index * (w + 10) + 5 + offset;
                y = 80;

                //draw line
                ctx.strokeStyle = "#000";
                ctx.beginPath();
                ctx.moveTo(x + (w / 2), y);
                ctx.lineTo(x + (w / 2), y - 10);
                ctx.stroke();
                if (this.child.length > 0) {
                    ctx.beginPath();
                    ctx.moveTo(x + (w / 2), y + h);
                    ctx.lineTo(x + (w / 2), y + h + 10);
                    ctx.stroke();
                }
            }
            else if (lvl == 2) {
                ctx.font = "10px Arial";
                back = b2;
                fore = f2;

                h = Math.min(20, (pageH - 120 - (5 * this.parent.child.length)) / this.parent.child.length);
                w = Math.min(200, ((pageW - (10 * this.parent.parent.child.length)) / this.parent.parent.child.length)) - 10;

                var offset = ((pageW - (this.parent.parent.child.length * (w + 20))) / 2) + 15;
                x = this.parent.index * (w + 20) + offset;

                y = this.index * (h) + 120;
            }

            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;

            ctx.strokeStyle = fore;
            ctx.fillStyle = back;

            ctx.fillRect(x, y, w, h);

            ctx.fillStyle = fore;
            var padding = Math.max(0,(w - ctx.measureText(this.name).width)) / 2;
            if (lvl == 0) {
                ctx.fillText(this.name, x + padding, y + (h / 3) + (h / 12), w);
                padding = Math.max(0, (w - ctx.measureText(this.desc).width)) / 2;
                ctx.fillText(this.desc, x + padding, y + (h * 2 / 3) + (h / 12), w);
            }
            else {
                ctx.fillText(this.name, x + padding, y + (h / 2) + (8 / 2), w );
            }

            if (lvl >= 0 && lvl < 2) {
                for (var i = 0; i < this.child.length; i++) {
                    this.child[i].draw(lvl + 1);
                }
            }
        }

        function NodeDepth(Input, d) {
            if (Input.parent) {
                return NodeDepth(Input.parent, d+1);
            }
            return d;
        }

        drawArea.onclick = function (e) {
            var rect = drawArea.getBoundingClientRect();
            var x = e.x ? e.x : e.clientX;
            var y = e.y ? e.y : e.clientY;
            x -= rect.left;
            y -= rect.top;

            if (x > Root.x && x < Root.x + Root.w
                    && y > Root.y && y < Root.y + Root.h) {
                clear();
                Root.draw(0);
                Top = Root;
            }
            else {
                var Clicked = getClicked(Root, x, y);
                if (Clicked) {
                    clear();
                    Top = Clicked;

                    if (e.ctrlKey) {
						alert("You ctrl+Clicked on " + Top.name)
                    }
					Top.draw(0);
                }
                if (e.altKey && e.shiftKey && Top.name == "Cuttlefish") {
                    Interval = setInterval(fun, 1000 / 30);
                }
            }
        }
        drawArea.onmousemove = function (e) {
            var rect = drawArea.getBoundingClientRect();
            var x = e.x ? e.x : e.clientX;
            var y = e.y ? e.y : e.clientY;

            x -= rect.left;
            y -= rect.top;

            if (x > Root.x && x < Root.x + Root.w
                    && y > Root.y && y < Root.y + Root.h) {
                document.body.style.cursor = "pointer"
            }
            else {
                var Clicked = getClicked(Root, x, y);
                if (Clicked) {
                    document.body.style.cursor = "pointer"
                }
                else {
                    document.body.style.cursor = "default"
                }
            }
        }

        function getClicked(Input, x, y) {
            for (var i = 0; i < Input.child.length; i++) {
                if (x > Input.child[i].x && x < Input.child[i].x + Input.child[i].w
                        && y > Input.child[i].y && y < Input.child[i].y + Input.child[i].h) {
                    return Input.child[i];
                }
                else {
                    var temp = getClicked(Input.child[i], x, y);
                    if (temp) {
                        return temp;
                    }
                }
            }
        }

        function fun() {
            Back = genColor(C, 1);
            clear();
            Top.draw(0);
            if (C % 256 < 10) {
                b0 = genColor(Math.random() * 1536, 1);
                b1 = genColor(Math.random() * 1536, 1);
                b2 = genColor(Math.random() * 1536, 1);
                f0 = genColor(Math.random() * 1536, 1);
                f1 = genColor(Math.random() * 1536, 1);
                f2 = genColor(Math.random() * 1536, 1);
            }

            C += 10;
            while (C > 1536) {
                C -= 1536;
            }
        }

        function clear() {
            Reset(Root);
            ctx.fillStyle = Back;
            ctx.fillRect(0, 0, pageW, pageH);
        }
        function Reset(Input) {
            Input.x = -1;
            Input.y = -1;
            Input.w = -1;
            Input.h = -1;

            for (var i = 0; i < Input.child.length; i++) {
                Reset(Input.child[i]);
            }
        }

        function genColor(input, fade) {
            if (input < 0) { input *= -1; }
            var R;
            var G;
            var B;
            var P = 256;
            var temp = input % (P * 6);

            if (temp < P * 1) {//red
                R = P - 1;
                G = (temp % P);
                B = 0;
            }
            else if (temp < P * 2) {//orange
                R = P - 1 - (temp % P);
                G = P - 1;
                B = 0;
            }
            else if (temp < P * 3) {//yellow
                R = 0;
                G = P - 1;
                B = (temp % P);
            }
            else if (temp < P * 4) {//green
                R = 0;
                G = P - 1 - (temp % P);
                B = P - 1;
            }
            else if (temp < P * 5) {//blue
                R = (temp % P);
                G = 0;
                B = P - 1;
            }
            else if (temp < P * 6) {//violet
                R = P - 1;
                G = 0;
                B = P - 1 - (temp % P);
            }

            R *= fade;
            G *= fade;
            B *= fade;

            R = Math.floor(Math.max(Math.min(255, R), 0));
            G = Math.floor(Math.max(Math.min(255, G), 0));
            B = Math.floor(Math.max(Math.min(255, B), 0));

            var C = '#' + hex[parseInt(R / 16)] + hex[R % 16] + hex[parseInt(G / 16)] + hex[G % 16] + hex[parseInt(B / 16)] + hex[B % 16];
            return C;
        }
        function findIndex(Array, Element) {
            for (var i = 0; i < Array.length; i++) {
                if (Array[i] === Element) { return i; }
            }
            return -1;
        }

        ParseJSONTree();