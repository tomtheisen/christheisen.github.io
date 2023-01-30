'use strict';

//group math facts
	//2+3=5 >next equation> 5-3=2

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
let a=0,b=0,c=0,s='+';
const eq = document.getElementById('equation');
const ans = document.getElementById('answer');
const lvl = document.getElementById('difficulty');
const prog = document.getElementById('progress');
	
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
	if(x===c){
		score++;
		launchFirework(2);
	}
	else{
		score--;
	}
	while(score > 5 && difficulty < 8){
		score-=5;
		difficulty++;
		launchFirework(6);
	}
	while(score < -5 && difficulty > 0){
		score+=5;
		difficulty--;
	}
	prog.value = score+5;
	lvl.textContent=difficulty;
	generateEquation();
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

function generateEquation(){
	const key = pickAKey(levels[difficulty]);
	const min = levels[difficulty][key].min;
	const max = levels[difficulty][key].max;
	
	switch(key){
		case 'A':{
			s = '+';
			c = randomInt(min, max);
			a = randomInt(min, c);
			b = c-a;
			break;
		}
		case 'S':{
			s = '-';
			a = randomInt(min, max);
			b = randomInt(min, a);
			c = a-b;
			break;
		}
		case 'M':{
			s='x';
			const temp = randomInt(min, max);
			const aorb = randomInt(0,1);
			if(aorb === 0){
				a = temp;
				b = randomInt(0,10);
			}
			else{
				a = randomInt(0,10);
				b = temp;
			}
			c = a*b;
			break;
		}
		case 'D':{
			s='÷';
			const temp = randomInt(min, max);
			const aorb = randomInt(0,1);
			if(aorb === 0){
				b = Math.max(temp, 1);
				c = randomInt(0,10);
			}
			else{
				b = randomInt(1,10);
				c = temp;
			}
			a = b*c;
			break;
		}
		default:{
			//shouldn't happen.
			break;
		}
	}
	
	equation.textContent = `${a}${s}${b}`;
}

generateEquation();
ans.focus();
