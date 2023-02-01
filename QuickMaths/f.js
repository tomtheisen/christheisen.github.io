"use strict";

const F = document.getElementById('fireworks');
const A = document.getElementById('answer');
const ctx = F.getContext("2d", {alpha: true});
F.addEventListener('click', (e) => {A.focus();});

//TODO: adjust these
const speed = 10;
const G = -.05;
const twoPI = Math.PI*2;
const fw = [];
let W = 10;
let H = 10;
let AF = 0;
let encourageTimer = 0;
let encouragementHue = 0;

function point(x, y){ this.x = x||0; this.y = y||0; }
point.prototype.plus = function(addend){
	const x = addend?.x || 0;
	const y = addend?.y || 0;
	
	return new point(this.x+x,this.y+y);
}
point.prototype.equals = function(rhs){
	const x = rhs?.x || 0;
	const y = rhs?.y || 0;
	
	return this.x===x && this.y===y;
}
point.prototype.scale = function(mult){
	return new point(this.x*mult, this.y*mult);
}

function manageFireworks(){
	ctx.clearRect(0,0,W,H);
	if(!fw.length){
		AF=0;
		document.getElementById('content').classList.remove('hide');
		return;
	}
	AF = requestAnimationFrame(manageFireworks);
	
	if(encourageTimer>0){
		encourage();
	}

for(let i=0;i<fw.length;i++){
		fw[i].Move();
		fw[i].Draw();
		if(fw[i].Done()){
			fw.splice(i,1);
			i--;
		}
	}
}

function showEncourage(duration){
	encouragementHue = Math.floor(Math.random() * 360);
	encourageTimer = duration;
}

function encourage(){
	encourageTimer--;
	if(encourageTimer < 3){
		document.getElementById('content').classList.remove('hide');
	}
	
	const text = "Next Level!";
	let px = Math.floor(W/6);
	let width = 0;
	
	if(encourageTimer % 25 === 0){
		encouragementHue = Math.floor(Math.random() * 360);
	}
	ctx.beginPath();
	ctx.fillStyle = `hsl(${encouragementHue},50%,50%,100%)`;
	
	do{
		ctx.font = `${px}px sans-serif`;
		px-=5;
		width = ctx.measureText(text).width;
	}
	while(width > W)
		
	ctx.fillText(text, (W-width)/2, H/2);
	ctx.closePath();
	
}
function launchFirework(count=1){
	for(let i=0;i<count;i++){
		fw.push(new firework());
	}
	if(!AF){
		requestAnimationFrame(manageFireworks);
	}
}

function firework(){
	this.exploded = 0;
	this.location = new point(W/2, H);
	const x = Math.random()*W;
	const y = (Math.random()*H/2);
	this.target = new point(x,y);
	
	const tempx = (W/2)-x;
	const tempy = H-y;
	const hyp = ((tempx**2)+(tempy**2))**.5;
	
	const dx = speed*tempx/hyp;
	const dy = speed*tempy/hyp;
	this.delta = new point(-dx,-dy);
	
	this.hue = Math.floor(Math.random()*360);
	this.sat = 100;
	this.alpha = 70;
	this.fragments = [];
}

firework.prototype.Done = function(){
	return this.exploded && this.fragments.length == 0;
}
firework.prototype.Draw = function(){
	
	if(this.exploded){
		for(let i=0;i<this.fragments.length;i++){
			this.fragments[i].Draw();
		}
		return;
	}
	
	ctx.beginPath();
	ctx.strokeStyle = `hsl(${this.hue},${this.sat}%,${this.alpha}%)`;
	ctx.lineWidth = 2;
	ctx.moveTo(this.location.x, this.location.y);
	ctx.lineTo(
		this.location.x+this.delta.x*2, 
		this.location.y+this.delta.y*2
		);
	ctx.stroke();
	ctx.closePath();
}
firework.prototype.Move = function(){
	if(this.exploded){
		for(let i=0;i<this.fragments.length;i++){
			this.fragments[i].Move();
			if(this.fragments[i].age < 0){
				this.fragments.splice(i,1);
				i--;
			}
		}
		return;
	}
	this.location = this.location.plus(this.delta);
	
	if(this.location.y < this.target.y){
		this.Explode();
	}
}
firework.prototype.Explode = function(){
	//make the particles.
	this.exploded = 1;
	const particles = Math.random()*12+12;
	for(let i=0;i<particles;i++){
		this.fragments.push(new fragment(this.location.x, this.location.y, this.hue));
	}
}

function fragment(x,y,hue){
	this.location = new point(x,y);
	const v = Math.random() * twoPI;
	const px = Math.random() * 5;
	const py = Math.random() * 5;
	const vx = Math.cos(v) * px * 2;
	const vy = Math.sin(v) * py * 2;
	this.velocity = new point(vx, vy);
	this.hue = hue+(Math.floor(Math.random()*100)-50);
	this.sat = 50;
	this.trail = [];
	this.age = 75 + Math.random()*50;
}

fragment.prototype.Draw = function(){
	const r = 2;
	for(let i=0;i<this.trail.length;i++){
		const alpha = 70-(i*5);
		ctx.beginPath();
		ctx.fillStyle = `hsl(${this.hue},50%,50%,${alpha}%)`;
		ctx.arc(this.trail[i].x, this.trail[i].y, r, 0, twoPI);
		ctx.fill();
		ctx.closePath();
	}
}
fragment.prototype.Move = function(){
	this.location = this.location.plus(this.velocity);
	this.velocity = this.velocity.scale(.95);
	this.velocity.y -= G;
	this.trail.unshift(this.location);
	this.age--;
	while(this.trail.length > 10){
		this.trail.pop();
	}
}

function initFireworks(){
	const w = Math.max(document.documentElement.clientWidth) - 10;
	const h = Math.max(document.documentElement.clientHeight) - 10;
	
	F.style.width = w;
	F.style.height = h;
	F.width = w;
	F.height = h;
	
	H = h;
	W = w;
}
initFireworks();