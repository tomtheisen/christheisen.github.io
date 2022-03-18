"use strict";

let intervalID = null;
let time = null;
let timeout = null;
let isPlaying = false;
let lastPlayed = null;
let loop = false;
const chkChange = (chk) => { loop = chk.checked; }

const awesome = new Audio('.\\audio\\awesome.mp3');
const playAwesome = (btn) => { 
	awesome.play(); 
	setTimeout(() => {isPlaying = false; play(btn);}, 1500); 
}
const audio = {
	fileNotFound: new Audio('.\\audio\\fileNotFound.mp3')
}

const ended = (btn) => {
	isPlaying = false;
	
	if(btn.id.includes('done')){
		btn.classList.remove('playing');
		btn.classList.add('played');
	}

	
	const delay = document.getElementById('numDelay').value * 1000;
	if(loop){ 
		timeout = setTimeout(() => play(btn), delay); 
	}
}

const stuff = {
	Misc:['awesome'],
	Morning:['wake', 'breakfast', 'milk', 'medicine', 'teeth', 'dress', 'hamper', 'bed', 'potty', 'shoes', 'done'],
	Evening:['undress', 'bathe', 'pjs', 'milk', 'medicine', 'teeth', 'hamper', 'sleep', 'done']
};

const toggleGroup = (input) => {
	const buckets = document.getElementsByClassName('buttonBucket');
	for(let x of buckets){
		x.classList.add('hide');
	}
	input.classList.remove('hide');
}

const makeButton = (root, group, names) => {
	names.forEach(x => {
		const btn = document.createElement('button');
		btn.id=`${group}_${x}`;
		btn.textContent = x;
		btn.addEventListener('click', () => play(btn));
		btn.classList.add('unplayed');
		btn.classList.add('activity');
		root.appendChild(btn);
	
		audio[btn.id] = new Audio(`.\\audio\\${x}.mp3`);
		audio[btn.id].addEventListener('ended', () => ended(btn));
		audio[btn.id].addEventListener('error', () => play('fileNotFound'));
	});
}
const init = () => {
	const root = document.getElementById('stuffHere');
	for(let x in stuff) {
		const div = document.createElement('div');
		const h1 = document.createElement('h1');
		const btns = document.createElement('div');

		div.id = x;
		h1.addEventListener('click', () => toggleGroup(btns));
		h1.textContent = x;
		div.appendChild(h1);
		btns.id = `bucket_${x}`;
		btns.classList.add('hide');
		btns.classList.add('buttonBucket');
		div.appendChild(btns);
		
		makeButton(btns, x, stuff[x]);
		root.appendChild(div);
	}
}

const play = (btn) => { 
	if(isPlaying){return;}
	if([...btn.classList].includes('played')){ return; }
	
	if(timeout){
		clearTimeout(timeout);
	}

	if(!btn || !audio[btn.id]){
		console.log(audio);
		audio.fileNotFound.play();
		return;
	}
	isPlaying = true;
	
	if(lastPlayed && [...btn.classList].includes('unplayed')){ 
		playAwesome(btn);
	}
	else{
		audio[btn.id].play();
	}
	
	
	
	btn.classList.remove('unplayed');
	btn.classList.add('playing');
	
	if(lastPlayed && lastPlayed !== btn
		&& !btn.id.includes('Misc')){
		lastPlayed.classList.remove('playing');
		lastPlayed.classList.add('played');
	}
	if(!btn.id.includes('Misc')){
		lastPlayed = btn;
	}
}

const startTimer = (input) => {
	if(intervalID){
		clearInterval(intervalID);
	};

	time = document.getElementById('numTimer').value * 60;
	const clock = document.getElementById('timer');
	renderTimer(clock);
	
	let magic = setInterval(() => renderTimer(clock), 1000);
	intervalID = magic;// for some reason if I just set intervalID directly it doesn't work.
}
const pauseTimer = () => {
	if(intervalID){
		clearInterval(intervalID);
		intervalID=null;
	}
	else{
		const clock = document.getElementById('timer');
		let magic = setInterval(() => renderTimer(clock), 1000);
		intervalID = magic;// for some reason if I just set intervalID directly it doesn't work.
	}
}

const renderTimer = (clock) => {
	const minutes = parseInt(time / 60, 10).toString().padStart(2, '0');
	const seconds = parseInt(time % 60, 10).toString().padStart(2, '0');

	clock.textContent = `${minutes}:${seconds}`;

	if (--time < 0) {
		clearInterval(intervalID);
	}
}

init();