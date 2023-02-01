'use strict';

//group math facts?
	//2+3=5 >next equation> 5-3=2
	//Doesn't work within a level because each level has different ranges

//math levels based on: https://mathfactsmatter.com/the-7-levels-of-math-fact-fluency/#
//A min/max is the sum
//sum = rand min-max
//addend = 0-sum
//calculate other addend
//S min/max is the minuend
//minuend = rand min-max
//subtrahend = rand 0-minuend
//calculate difference
//M min/max is the max of the two multiplicands; other multiplicand is 0-10
//temp = rand min-max
//rand 0/1 for a or b
//other multiplicand = rand 0-10
//calculate product
//D min/max is the max of the divisor and quotient
//temp = rand min-max
//rand 0/1 for divisor or quotient
//other (divisor or quotient) = rand 0-10
//calculate dividend

let difficulty = 0;
let score = 0;
let current = null;
let lvlDone = 0;

const eqs = [];
const missed = [];
const eq = document.getElementById('equation');
const ans = document.getElementById('answer');
const lvl = document.getElementById('difficulty');
const prog = document.getElementById('progress');
const rem = document.getElementById('remaining');
const mis = document.getElementById('missed');
const content = document.getElementById('content');

const levels = [
	{//0: purple
		A:{min:0, max:5}
	},
	{//1: red
		A:{min:6, max:10},
		S:{min:0, max:5}
	},
	{//2: orange
		A:{min:11, max:15},
		S:{min:6, max:10}
	},
	{//3: yellow
		A:{min:16, max:20},
		S:{min:11, max:15},
		M:{min:0, max:2}
	},
	{//4: green
		A:{min:21, max:25},
		S:{min:16, max:20},
		M:{min:3, max:5},
		D:{min:0, max:2}
	},
	{//5: light blue
		A:{min:26, max:30},
		S:{min:21, max:25},
		M:{min:6, max:9},
		D:{min:3, max:5}
	},
	{//6: dark blue
		A:{min:31, max:35},
		S:{min:26, max:30},
		M:{min:10, max:12},
		D:{min:6, max:9}
	},
	{//7: purple
		A:{min:36, max:40},
		S:{min:31, max:35},
		M:{min:13, max:15},
		D:{min:10, max:12}
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
function checkAnswer(){
	const x = Number(ans.value);
	if(x===current.c){
		eq.classList.remove('wrong');
		launchFirework(4);
		updateEquation();
		score += lvlDone*.5;
		score = Math.min(score, 6);
	}
	else{
		score -= lvlDone;
		eq.classList.add('wrong');
		score = Math.max(score, -6);
		if(!lvlDone){
			missed.push({s:current.s, a:current.a, b:current.b, c:current.c});
			mis.textContent = missed.length;

			if(missed.length>5){
				missed.length = 0;
				difficulty--;
				difficulty = Math.max(0,difficulty);
				score = 0;
				lvl.value=difficulty+'';
				generateLevelEquations();				
			}
		}
	}
	
	while(score > 5 && difficulty < 8){
		score-=7;
		difficulty++;
		difficulty = Math.min(7,difficulty);
		lvl.value=difficulty+'';
		generateLevelEquations();

		content.classList.add('hide');
		showEncourage(300);
		
		for(let i=0;i<10;i++){
			setTimeout(()=> {launchFirework(2);}, 500*i);
		}
	}
	while(score < -5 && difficulty > 0){
		score+=5;
		difficulty--;
		difficulty = Math.max(0,difficulty);
		lvl.value=difficulty+'';
		generateLevelEquations();
	}
	prog.value = score+5;
	ans.value = '';
	ans.focus();
}

ans.addEventListener('keydown', (e) => {
	const keys = ['ArrowLeft','ArrowRight','Backspace','Delete'];
	if(e.key.toLowerCase() === 'enter'){
		checkAnswer();
		return;
	}
	if(!'0123456789'.includes(e.key) && !keys.includes(e.key)){
		e.preventDefault();
		return;
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
	const temp = randomInt(min, max);
	const aorb = randomInt(0,1);
	const multiplicandA = aorb === 0 ? temp : randomInt(0,10);
	const multiplicandB = aorb === 0 ? randomInt(0,10) : temp;
	const product = multiplicandA * multiplicandB;
	return {s:'x', a:multiplicandA, b:multiplicandB, c:product};
}
function buildD(min, max){
	const temp = randomInt(min, max);
	const aorb = randomInt(0,1);
	const quotient = aorb === 0 ? temp : randomInt(0,10);
	const divisor = aorb === 0 ? randomInt(0,10) : temp;
	const dividend = multiplicandA * multiplicandB;
	return {s:'÷', a:dividend, b:divisor, c:quotient};
}

function updateEquation(){
	eq.classList.remove('wrong');

	if(!eqs.length){
		if(missed.length){
			while(missed.length){eqs.push(missed.pop());}
		}
		else{
			lvlDone=1;
			generateRandomEquation();
		}
	}
	current = eqs.pop();
	equation.textContent = `${current.a}${current.s}${current.b}`;
	
	if(lvlDone){
		rem.parentNode.classList.add('hide');
		prog.classList.remove('hide');
	}
	else{
		mis.textContent = missed.length;
		rem.textContent = eqs.length + missed.length + 1;
		rem.parentNode.classList.remove('hide');
		prog.classList.add('hide');
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
	difficulty = Number(lvl.value);
	const keys = Object.keys(levels[difficulty]);
	eqs.length = 0;
	lvlDone = 0;
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
					for(let temp=min;temp<=max;temp++){
						for(let multiplicand=0;multiplicand<=10;multiplicand++){
							eqs.push({s:'x', a:temp, b:multiplicand, c:temp*multiplicand});
							eqs.push({s:'x', a:multiplicand, b:temp, c:temp*multiplicand});
						}
					}
					break;
				}
				case 'D':{
					for(let i=min;i<=max;i++){
						for(let j=0;j<=10;j++){
							eqs.push({s:'÷', a:i*j, b:i, c:j});
							eqs.push({s:'÷', a:i*j, b:j, c:i});
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
}

generateLevelEquations();
ans.focus();
