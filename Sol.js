//TODO: get equations for more accurate orbits.
	//also adjust speeds based on orbital position

var solInterval;

var pageW = 1200;
var pageH = 800;

var isDrawSun=false;
var isDrag = false;
var turn = 0;
var orbitScale = 5;
var sizeScale = 1;
var speed = .01;
var cc = [];
var sun = new Planet(pageW/2, pageH/2, 0, 0, 287, "#FF0");
var twoPi = Math.PI*2;

var x = sun.x;
var y = sun.y;

cc[0] = new Planet(x, y, 1.00, 8.71, 1.00, "#855");
cc[1] = new Planet(x, y, 1.87, 6.44, 2.48, "#AA6");
cc[2] = new Planet(x, y, 2.58, 5.48, 2.61, "#33D");
cc[3] = new Planet(x, y, 3.94, 4.43, 1.39, "#B31");
cc[4] = new Planet(x, y,13.44, 2.40,28.66, "#B82");
cc[5] = new Planet(x, y,24.64, 1.77,23.87, "#AA2");
cc[6] = new Planet(x, y,49.57, 1.25,10.40, "#5BB");
cc[7] = new Planet(x, y,77.68, 1.00,10.09, "#26B");

var go = true;
var lastLoc = [];
var shift = [0,0];

var SolSimArea = document.getElementById('SolSimArea');
var SolSimRect = SolSimArea.getBoundingClientRect();
var SolSimCtx = SolSimArea.getContext('2d');

SolSimArea.width = pageW;
SolSimArea.height = pageH;

var cursorShift = [SolSimRect.left, SolSimRect.top];

var MapArea = document.getElementById('MapArea');
var MapRect = MapArea.getBoundingClientRect();
var MapCtx = MapArea.getContext('2d');

MapArea.width = 200;
MapArea.height = 200;

function Point(x, y){this.x=x;this.y=y;}

function Planet (x, y, r, v, s, f){
	this.x = x;
	this.y = y;
	this.r = r;
	this.v = r==0?0:v / r;
	this.s = s;
	this.f = f;
}
Planet.prototype.draw = function(){
	var pr = this.s * sizeScale;
	var r = this.r * orbitScale;
	var px = (Math.cos(this.v * turn) * r) + this.x + shift[0];
	var py = (Math.sin(this.v * turn) * r) + this.y + shift[1];
	
	SolSimCtx.strokeStyle="#333";
	SolSimCtx.lineWidth=1;
	SolSimCtx.beginPath();
	SolSimCtx.arc(this.x + shift[0],this.y + shift[1],r,0,twoPi);
	SolSimCtx.stroke();
	SolSimCtx.closePath();
	
	SolSimCtx.fillStyle=this.f;
	SolSimCtx.strokeStyle=this.f;
	SolSimCtx.beginPath();
	SolSimCtx.arc(px,py,pr,0,twoPi);
	SolSimCtx.closePath();
	SolSimCtx.fill();
	SolSimCtx.stroke();
}
Planet.prototype.drawMap = function(){
	var s = 2;//this.s;
	var r = this.r;
	var px = (Math.cos(this.v * turn) * r) + 100;
	var py = (Math.sin(this.v * turn) * r) + 100;
	
	MapCtx.strokeStyle="#333";
	MapCtx.lineWidth=1;
	MapCtx.beginPath();
	MapCtx.arc(100,100,r,0,twoPi);
	MapCtx.stroke();
	MapCtx.closePath();

	MapCtx.fillStyle=this.f;
	MapCtx.strokeStyle=this.f;
	MapCtx.beginPath();
	MapCtx.arc(px,py,s,0,twoPi);
	MapCtx.closePath();
	MapCtx.fill();
	MapCtx.stroke();
}

function DrawSolSim(){
	if(isDrawSun){
		sun.draw();
	}
	for(var i=0; i < cc.length; i++){
		cc[i].draw();
	}
}

function DrawMap(){
	for(var i=0;i<cc.length;i++){
			cc[i].drawMap();
	}
	
	
	var x = 100-(shift[0]/orbitScale);
	var y = 100-(shift[1]/orbitScale);
	//TODO: scale shift based on OrbitScale

	MapCtx.strokeStyle="#F00";
	MapCtx.lineWidth=1;
	MapCtx.beginPath();
	MapCtx.moveTo(x-5,y);
	MapCtx.lineTo(x+5,y);
	MapCtx.moveTo(x,y-5);
	MapCtx.lineTo(x,y+5);
	MapCtx.stroke();
	MapCtx.closePath();


}

function UpdateSolSim(){
	SolSimCtx.fillStyle = "#000";
	SolSimCtx.fillRect(0,0,pageW,pageH);
	DrawSolSim();
	
	MapCtx.fillStyle = "#000";
	MapCtx.fillRect(0,0,200,200);
	DrawMap();

	if(go){    
		turn+=speed; 
	}
}

function Reset(){
	isDrawSun=false;
	
	sun.x = pageW/2;
	sun.y = pageH/2;
	x = sun.x;
	y = sun.y;

	orbitScale = 5;
	sizeScale = 1;
	speed = .01;
	
	shift[0] = 0;
	shift[1] = 0;
}

function toggleDiv(Div, isShown){
	var div = document.getElementById(Div);
	if(div == null){return;}
	
	isShown = isShown || div.style.display == "none";
	div.style.display = isShown ? "block" : "none";
}

document.onkeypress = function (event) {
	if(event.which==104){
		toggleDiv('help');
	}

	if(event.which == 32){
		go = !go;
	}
	else if(event.which == 96){
		shift[0] = sun.x;
		shift[1] = sun.y;
	}
	else if(event.which >= 49 && event.which <= 56){
		var index = event.which - 49;
		var r = (cc[index].r * orbitScale);
		var px = (Math.cos(cc[index].v * turn) * r) + cc[index].x - (pageW/2);
		var py = (Math.sin(cc[index].v * turn) * r) + cc[index].y - (pageH/2);
		shift[0] = -1 * px;
		shift[1] = -1 * py;
	}
	else if(event.which == 33){
		shift[0]=0;
		shift[1]=0;
		document.getElementById("zoomOrbit").value = 350/cc[0].r;
		setZoomOrbit();
		sizeScale=50;
	}
	else if(event.which == 64){
		shift[0]=0;
		shift[1]=0;
		document.getElementById("zoomOrbit").value = 350/cc[1].r;
		setZoomOrbit();
		sizeScale=40;
	}
	else if(event.which == 35){
		shift[0]=0;
		shift[1]=0;
		document.getElementById("zoomOrbit").value = 350/cc[2].r;
		setZoomOrbit();
		sizeScale=15;
	}
	else if(event.which == 36){
		shift[0]=0;
		shift[1]=0;
		document.getElementById("zoomOrbit").value = 350/cc[3].r;
		setZoomOrbit();
		sizeScale=10;
	}
	else if(event.which == 37){
		shift[0]=0;
		shift[1]=0;
		document.getElementById("zoomOrbit").value = 350/cc[4].r;
		setZoomOrbit();
		sizeScale=5;
	}
	else if(event.which == 94){
		shift[0]=0;
		shift[1]=0;
		document.getElementById("zoomOrbit").value = 350/cc[5].r;
		setZoomOrbit();
		sizeScale=2;
	}
	else if(event.which == 38){
		shift[0]=0;
		shift[1]=0;
		document.getElementById("zoomOrbit").value = 350/cc[6].r;
		setZoomOrbit();
		sizeScale=1;
	}
	else if(event.which == 42){
		shift[0]=0;
		shift[1]=0;
		document.getElementById("zoomOrbit").value = 350/cc[7].r;
		setZoomOrbit();
		sizeScale=1;
	}
	else if(event.which == 61){
		//actual size go!
		isDrawSun=true;
		document.getElementById("zoomOrbit").value = 38199;
		document.getElementById("zoomSize").value = 1;
		shift = [0,0];
	}
	else if(event.which == 115){
		shift[1] -= orbitScale;
	}
	else if(event.which == 97){
		shift[0] += orbitScale;
	}
	else if(event.which == 119){
		shift[1] += orbitScale;
	}
	else if(event.which == 100){
		shift[0] -= orbitScale;
	}
	else if(event.which == 114){
		Reset();
	}
	else if(event.which == 101){
		isDrawSun = !isDrawSun;
	}
	else{
		console.log(event, event.which);
	}
}

SolSimArea.onmousedown = function (event) {
	isDrag = true;
}
SolSimArea.onmouseup = function (event) {
	isDrag = false;
}
SolSimArea.onmousemove = function (event) {
	var x = event.x ? event.x : event.clientX;
	var y = event.y ? event.y : event.clientY;
	
	x -= cursorShift[0];
	y -= cursorShift[1];
	
	if(isDrag){
		shift[0] += x - lastLoc[0];
		shift[1] += y - lastLoc[1];
	}
	lastLoc = [x,y];
}

function setZoomOrbit(){
	const newScale = +document.getElementById("zoomOrbit").value;
	shift[0]*=newScale;
	shift[1]*=newScale;
	
	shift[0]/=orbitScale;
	shift[1]/=orbitScale;

	orbitScale=newScale;
}
function setZoomSize(){
	sizeScale=+document.getElementById("zoomSize").value;
}
function setSpeed(){
	speed=+document.getElementById("speed").value;
}

function startSol(){
	solInterval = setInterval(UpdateSolSim, 1000/20);
	
	SolSimRect = SolSimArea.getBoundingClientRect();
	cursorShift = [SolSimRect.left, SolSimRect.top];
}

function stopSol(){
	clearInterval(solInterval);
}

toggleDiv('help', 1);
startSol();