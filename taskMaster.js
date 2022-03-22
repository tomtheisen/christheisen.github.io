"use strict";
let paused = false;
let intervalID = null;
let time = null;
let timeout = null;
let isPlaying = false;
let lastPlayed = null;
let loop = true;
let dataLoaded = false;
const chkChange = (chk) => { loop = chk.checked; }

const awesome = new Audio('.\\audio\\awesome.mp3');
const playAwesome = (btn) => { 
	awesome.play(); 
	setTimeout(() => {isPlaying = false; play(btn);}, 1500); 
}
const timeElapsed = new Audio('.\\audio\\timer.mp3');
const playTimeElapsed = (btn) => { 
	timeElapsed.play(); 
	if(lastPlayed){
		setTimeout(() => {isPlaying = false; play(lastPlayed);}, 3500); 
	}
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

let stuff = {};
const Other = {
		Misc:[
		{
			name:'clean',
			text:'Clean Up!',
			reminders: 0,
			time: 5
		},
		{
			name:'dinner',
			text:'Come to the Table!',
			reminders: 0,
			time: 1
		},
		{
			name:'shoes',
			text:'Shoes On!',
			reminders: 0,
			time: 5
		},
		{
			name:'potty',
			text:'Potty Time!',
			reminders: 0,
			time: 3
		}
	]
}
const Isaiah = {
	Morning:[
		{
			name:'wake',
			text:'Wake Up!',
			reminders: 0,
			time: 2
		}, 
		{
			name:'breakfast',
			text:'Eat Up!',
			reminders: 0,
			time: 15
		},
		{
			name: 'milk',
			text:'Drink Up!',
			reminders: 0,
			time: 7
		}, 
		{
			name:'medicine',
			text:'Medicine Time!',
			reminders: 0,
			time: .5
		}, 
		{
			name:'teeth',
			text:'Brush Your Teeth!',
			reminders: 0,
			time: 3
		}, 
		{
			name:'unpajamas',
			text:'Pajamas Off!',
			reminders: 0,
			time: 2
		},
		{
			name:'dress',
			text:'Clothes On!',
			reminders: 0,
			time: 5
		}, 
		{
			name:'hamper',
			text:'Clothes in Hamper!',
			reminders: 0,
			time: 1
		}, 
		{
			name:'bed',
			text:'Make Your Bed!',
			reminders: 0,
			time: 2
		},
		{
			name:'potty',
			text:'Potty Time!',
			reminders: 0,
			time: 5
		}, 
		{
			name:'shoes',
			text:'Shoes On!',
			reminders: 0,
			time: 3
		}, 
		{
			name:'done',
			text:'Good Work!',
			reminders: 0,
			time: 0
		}
	],
	Evening:[
		{
			name:'undress',
			text:'Clothes Off!',
			reminders: 0,
			time: 2
		}, 
		{
			name:'bathe',
			text:'Bath Time!',
			reminders: 0,
			time: 8
		}, 
		{
			name:'dry',
			text:'Dry Yourself!',
			reminders: 0,
			time: 3
		}, 
		{
			name:'pjs',
			text:'Pajamas On!',
			reminders: 0,
			time: 3
		}, 
		{
			name:'milk',
			text:'Drink Up!',
			reminders: 0,
			time: 5
		}, 
		{
			name:'medicine',
			text:'Medicine Time!',
			reminders: 0,
			time: .5
		}, 
		{
			name:'teeth',
			text:'Brush Your Teeth!',
			reminders: 0,
			time: 3
		}, 
		{
			name:'hamper',
			text:'Clothes in Hamper!',
			reminders: 0,
			time: 1
		}, 
		{
			name:'pick',
			text:'Pick Clothes!',
			reminders: 0,
			time: 3
		}, 
		{
			name:'sleep',
			text:'Bed Time!',
			reminders: 0,
			time: 1
		}, 
		{
			name:'done',
			text:'Good Work!',
			reminders: 0,
			time: 0
		}]
};
const Caleb = {
	Morning:[
		{
			name:'wake',
			text:'Wake Up!',
			reminders: 0,
			time: 5
		},
		{
			name:'breakfast',
			text:'Eat Up!',
			reminders: 0,
			time: 15
		},
		{
			name:'unpajamas',
			text:'Pajamas Off!',
			reminders: 0,
			time: 3
		},
		{
			name:'underwear',
			text:'Underwear On!',
			reminders: 0,
			time: 2
		},
		{
			name:'shirt',
			text:'Shirt On!',
			reminders: 0,
			time: 2
		},
		{
			name:'long',
			text:'Long Sleeves On!',
			reminders: 0,
			time: 3
		},
		{
			name:'pants',
			text:'Pants On!',
			reminders: 0,
			time: 2
		},
		{
			name:'socks',
			text:'Socks On!',
			reminders: 0,
			time: 2
		},
		{
			name:'done',
			text:'Good Work!',
			reminders: 0,
			time: 5
		}
	],
	Evening:[
		{
			name:'undress',
			text:'Clothes Off!',
			reminders: 0,
			time: 3
		}, 
		{
			name:'bathe',
			text:'Bath Time!',
			reminders: 0,
			time: 8
		}, 
		{
			name:'dry',
			text:'Dry Yourself!',
			reminders: 0,
			time: 3
		}, 
		{
			name:'pjs',
			text:'Pajamas On!',
			reminders: 0,
			time: 4
		}, 
		{
			name:'milk',
			text:'Drink Up!',
			reminders: 0,
			time: 5
		}, 
		{
			name:'teeth',
			text:'Brush Your Teeth!',
			reminders: 0,
			time: 3
		}, 
		{
			name:'hamper',
			text:'Clothes in Hamper!',
			reminders: 0,
			time: 1
		}, 
		{
			name:'sleep',
			text:'Bed Time!',
			reminders: 0,
			time: 1
		}, 
		{
			name:'done',
			text:'Good Work!',
			reminders: 0,
			time: 0
		}]

}

const loadData = (input) => {
	const root = document.getElementById('stuffHere');
	stuff = input;
	for(let x in stuff) {
		const div = document.createElement('div');
		const h1 = document.createElement('h1');
		const btns = document.createElement('div');
		
		div.id = x;
		h1.addEventListener('click', () => toggleGroup(btns));
		h1.textContent = x;
		h1.classList.add('groupTitle');
		div.appendChild(h1);
		btns.id = `bucket_${x}`;
		btns.classList.add('hide');
		btns.classList.add('buttonBucket');
		div.appendChild(btns);
		
		makeButton(btns, x, stuff[x]);
		root.appendChild(div);
	}
	
	document.getElementById('selector').classList.add('hide');
	dataLoaded = true;
}

const selectKid = (btn) => {
	switch(btn.id){
		case 'Isaiah':
			loadData(Isaiah);
			break;
		case 'Caleb':
			loadData(Caleb);
			break;
		default:
			loadData(Other);
			break;
	}
}

const getActivity = (id) => {
	const group = id.split('_')[0];
	const name = id.split('_')[1];
	return stuff[group].filter(x => x.name === name)[0];//todo: robustify this.
}

const remind = () => {
	if(!lastPlayed?.id?.includes('_')){return;}
	
	getActivity(lastPlayed.id).reminders++;
	
	updateReminderDisplay();
}
const updateReminderDisplay = () => {
	const id = `${lastPlayed.id}_reminders`;
	const reminders = document.getElementById(id);
	const activity = getActivity(lastPlayed.id);
	
	if(reminders){
		reminders.textContent = activity.reminders;
	}
	else{
		const table = document.getElementById('remindersTable');
		const row = document.createElement('div');
		const label = document.createElement('div');
		const datum = document.createElement('div');
		
		row.id = `${lastPlayed.id}_row`;
		label.id = `${lastPlayed.id}_name`;
		datum.id = id;
		
		row.classList.add('reminderRow');
		label.classList.add('reminderLabel');
		
		label.textContent = `${activity.text}`;
		datum.textContent = activity.reminders;
		
		row.appendChild(label);
		row.appendChild(datum);
		
		table.appendChild(row);
	}
}
	
const defaultTime = (id) => {
	document.getElementById('numTimer').value = getActivity(id).time;
	startTimer();
}

const toggleGroup = (input) => {
	const buckets = document.getElementsByClassName('buttonBucket');
	for(let x of buckets){
		x.classList.add('hide');
	}
	input.classList.remove('hide');
	
	const groups = document.getElementsByClassName('groupTitle');
	for(let x of groups){
		x.classList.add('hide');
	}
	document.getElementById('bottomPart').classList.remove('hide');
	document.getElementById('reference').classList.add('hide');
}

const makeButton = (root, group, names) => {
	names.forEach(x => {
		const btn = document.createElement('button');
		btn.id=`${group}_${x.name}`;
		btn.textContent = x.text;
		btn.addEventListener('click', () => play(btn));
		btn.classList.add('unplayed');
		btn.classList.add('activity');
		root.appendChild(btn);
		
		audio[btn.id] = new Audio(`.\\audio\\${x.name}.mp3`);
		audio[btn.id].addEventListener('ended', () => ended(btn));
		audio[btn.id].addEventListener('error', () => play('fileNotFound'));
	});
}


const play = (btn) => { 
	if(isPlaying){return;}
	if([...btn.classList].includes('played')){ return; }
	
	if(timeout){
		clearTimeout(timeout);
	}
	
	if(!btn || !audio[btn.id]){
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
	
	if(!intervalID && !paused){//no timer going, go a timer.
		defaultTime(btn.id);
	}
	
	if(lastPlayed && lastPlayed !== btn){
		//new activity, go a timer.
		defaultTime(btn.id);
	
		if(!btn.id.includes('Misc')){
			lastPlayed.classList.remove('playing');
			lastPlayed.classList.add('played');
		}
	}
	if(!btn.id.includes('Misc')){
		btn.classList.remove('unplayed');
		btn.classList.add('playing');
		lastPlayed = btn;
	}
}

const startTimer = () => {
	if(intervalID){
		clearInterval(intervalID);
	};
	
	time = document.getElementById('numTimer').value * 60;
	const clock = document.getElementById('timer');
	if(time <= 0){ 
		clock.textContent = '00:00';
		return; 
	}
	
	renderTimer(clock);
	let magic = setInterval(() => renderTimer(clock), 1000);
	intervalID = magic;// for some reason if I just set intervalID directly it doesn't work.
}
const pauseTimer = () => {
	if(intervalID){
		clearInterval(intervalID);
		intervalID=null;
		paused = true;
	}
	else{
		const clock = document.getElementById('timer');
		let magic = setInterval(() => renderTimer(clock), 1000);
		intervalID = magic;// for some reason if I just set intervalID directly it doesn't work.
		paused = false;
	}
}

const renderTimer = (clock) => {
	const minutes = parseInt(time / 60, 10).toString().padStart(2, '0');
	const seconds = parseInt(time % 60, 10).toString().padStart(2, '0');
	
	clock.textContent = `${minutes}:${seconds}`;
	
	if (--time < 0) {
		clearInterval(intervalID);
		playTimeElapsed();
	}
}
