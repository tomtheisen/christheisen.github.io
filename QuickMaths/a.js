'use strict';


//practice
	//do all equations from level
	//don't show wrong/misses

//quiz
	//3 hearts
	//lose a heart when you get one wrong
	//fill progress bar
	//get 10 right to pass

//math levels mostly based on: https://mathfactsmatter.com/the-7-levels-of-math-fact-fluency/#

let difficulty = 0;
let score = 0;
let current = null;
let practiceDone = 0;
let hearts = 3;

const eqs = [];
const missed = [];

const wrapper = document.getElementById('wrapper');
const eq = document.getElementById('equation');
const ans = document.getElementById('answer');
const lvl = document.getElementById('difficulty');
const prog = document.getElementById('progress');
const rem = document.getElementById('remaining');
const quiz = document.getElementById('quiz');
const heart = document.getElementById('hearts');
const practice = document.getElementById('practice');
const header = document.getElementById('header');

const levels = [
	{//0: purple
		A:{min:0, max:5}
	},
	{//1: red
		A:{min:6, max:10},
		S:{min:0, max:5}
	},
	{//2: orange
		A:{min:10, max:16},
		S:{min:4, max:11}
	},
	{//3: yellow
		A:{min:16, max:20},
		S:{min:11, max:15},
		M:{min:0, max:2}
	},
	{//4: green
		S:{min:16, max:20},
		M:{min:3, max:5},
		D:{min:0, max:2}
	},
	{//5: light blue
		M:{min:6, max:8},
		D:{min:3, max:5}
	},
	{//6: dark blue
		M:{min:9, max:12},
		D:{min:6, max:8}
	},
	{//7: purple
		D:{min:9, max:12}
	}
];

function pickAKey(input){
	const keys = Object.keys(input);
	const index = randomInt(0, keys.length-1);
	return keys[index];
}
function pickOne(array){
	const index = randomInt(0, array.length)
	const option = array[index];
	return option;
}

function levelUp(){
	difficulty = Math.min(7,difficulty+1);
	lvl.value=difficulty+'';
	generateLevelEquations();

	wrapper.classList.add('hide');
	showEncourage(300);
	for(let i=0;i<10;i++){
		setTimeout(()=> {launchFirework(2);}, 500*i);
	}
}
function levelDown(){
	difficulty = Math.max(0,difficulty-1);
	lvl.value=difficulty+'';
	generateLevelEquations();
}
function correct(){
	launchFirework(4);
	updateEquation();
	score+=practiceDone;
	prog.value = score-1;
	if(practiceDone && score > 10){
		levelUp();
	}
}
function incorrect(){
	eq.classList.add('wrong');
	if(practiceDone){
		hearts--;
		heart.textContent = '♥'.repeat(hearts);
		if(!hearts){
			levelDown();
		}
	}
	else{
		missed.push({s:current.s, a:current.a, b:current.b, c:current.c});
		rem.textContent = eqs.length + missed.length + 1;
	}	
}

function checkAnswer(){
	const x = Number(ans.value);
	eq.classList.remove('wrong');

	if(x===current.c){
		correct();
	}
	else{
		incorrect();
	}
	
	while(false){
		levelUp();
	}
	while(false){
		levelDown();
	}
	ans.value = '';
	ans.focus();
}

ans.addEventListener('keydown', (e) => {
	const keys = ['ArrowLeft','ArrowRight','Backspace','Delete'];
	if(e.key.toLowerCase() === 'enter'){
		checkAnswer();
		return;
	}
	
	if(!keys.includes(e.key)){
		if(!'0123456789'.includes(e.key) || ans.value.length > 3){
			e.preventDefault();
			return;
		}
	}
});

function randomInt(min, max){
	min = Math.ceil(min);
	max = Math.floor(max)+1;//makes the max inclusive
	return Math.floor(Math.random() * (max - min)) + min;
}

function buildA(min, max){
	const sum = randomInt(min, max);
	const addA = randomInt(min, sum);
	const addB = sum-addA;
	return {s:'+', a:addA, b:addB, c:sum};
}
function buildS(min, max){
	const minuend = randomInt(min, max);
	const subtrahend = randomInt(min, minuend);
	const difference = minuend-subtrahend;
	return {s:'-', a:minuend, b:subtrahend, c:difference};
}
function buildM(min, max){
	const m2 = Math.max(10, max);
	const temp = randomInt(min, max);
	const aorb = randomInt(0,1);
	const multiplicandA = aorb === 0 ? temp : randomInt(0,m2);
	const multiplicandB = aorb === 0 ? randomInt(0,m2) : temp;
	const product = multiplicandA * multiplicandB;
	return {s:'x', a:multiplicandA, b:multiplicandB, c:product};
}
function buildD(min, max){
	const m2 = Math.max(10, max);
	const temp = randomInt(min, max);
	const aorb = randomInt(0,1);
	if(aorb){temp = Math.max(temp, 1);}//no 0 divisor
	
	const quotient = aorb === 0 ? temp : randomInt(0,m2);
	const divisor = aorb === 0 ? randomInt(1,m2) : temp;
	const dividend = divisor * quotient;
	return {s:'÷', a:dividend, b:divisor, c:quotient};
}

function updateEquation(){
	eq.classList.remove('wrong');

	if(!eqs.length){
		if(missed.length){
			while(missed.length){eqs.push(missed.pop());}
		}
		else{
			practiceDone=1;
			generateRandomEquation();
		}
	}
	current = eqs.pop();
	equation.textContent = `${current.a}${current.s}${current.b}`;
	
	if(practiceDone){
		rem.parentNode.classList.add('hide');
		quiz.classList.remove('hide');
		header.textContent = 'Quiz Time';
		bgColor.classList.add('grass');
		bgColor.classList.remove('robin');
		heart.textContent = '♥'.repeat(hearts);
	}
	else{
		rem.textContent = eqs.length + missed.length + 1;
		rem.parentNode.classList.remove('hide');
		quiz.classList.add('hide');
		header.textContent = "Let's Practice";
		bgColor.classList.remove('grass');
		bgColor.classList.add('robin');
	}

}
function generateRandomEquation(){
	const key = pickAKey(levels[difficulty]);
	const min = levels[difficulty][key].min;
	const max = levels[difficulty][key].max;
	
	switch(key){
		case 'A':{
			eqs.push(buildA(min, max));
			break;
		}
		case 'S':{
			eqs.push(buildS(min, max));
			break;
		}
		case 'M':{
			eqs.push(buildM(min, max));
			break;
		}
		case 'D':{
			eqs.push(buildD(min, max));
			break;
		}
		default:{
			eqs.push({s:'+', a:1, b:1, c:2});
			break;
		}
	}
}

function generateLevelEquations(){
	hearts=3;
	score=0;
	difficulty = Number(lvl.value);
	const keys = Object.keys(levels[difficulty]);
	eqs.length = 0;
	practiceDone = 0;
	keys.forEach(
		key => {
			const min = levels[difficulty][key].min;
			const max = levels[difficulty][key].max;
			
			switch(key){
				case 'A':{
					for(let sum=min;sum<=max;sum++){
						for(let addend=min;addend<=sum;addend++){
							eqs.push({s:'+', a:addend, b:sum-addend, c:sum});
						}
					}
					break;
				}
				case 'S':{
					for(let minuend=min;minuend<=max;minuend++){
						for(let subtrahend=min;subtrahend<=minuend;subtrahend++){
							eqs.push({s:'-', a:minuend, b:subtrahend, c:minuend-subtrahend});
						}
					}
					break;
				}
				case 'M':{
					const m2 = Math.max(10, max);
					for(let temp=min;temp<=max;temp++){
						for(let multiplicand=0;multiplicand<=m2;multiplicand++){
							eqs.push({s:'x', a:temp, b:multiplicand, c:temp*multiplicand});
							eqs.push({s:'x', a:multiplicand, b:temp, c:temp*multiplicand});
						}
					}
					break;
				}
				case 'D':{
					const m2 = Math.max(10, max);
					for(let i=min;i<=max;i++){
						for(let j=0;j<=m2;j++){
							if(i){//no 0 divisor
								eqs.push({s:'÷', a:i*j, b:i, c:j});
							}
							if(j){//no 0 divisor
								eqs.push({s:'÷', a:i*j, b:j, c:i});
							}
						}
					}
					break;
				}
				default:{
					eqs.push({s:'+', a:1, b:1, c:2});
					break;
				}
			}
		}
	);
	
	for(let i=eqs.length;i;){
		const r = Math.floor(Math.random() * i--);
		const temp = eqs[i];
		eqs[i] = eqs[r];
		eqs[r] = temp;
	}

	updateEquation();
	ans.focus();
}

generateLevelEquations();
ans.focus();
