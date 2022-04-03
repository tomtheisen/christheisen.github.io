var pageS = 300;
var pageHalf = pageS/2;
var R = pageHalf - 20;
var root2 = Math.sqrt(2)/2;
var RR = R*root2;
var MaxVal = 10;

var drawArea = document.getElementById('canvasArea');
var rect = drawArea.getBoundingClientRect();
var cursorShift = [rect.left, rect.top];

drawArea.width = pageS * 2;
drawArea.height = pageS;
var ctx = drawArea.getContext('2d');
ctx.font = "12pt Calibri";

function ParseJSON() {
	
	var input = document.getElementById("txt").value;
	try{
		var parsed = JSON.parse(input);
		console.log(parsed);
		people=[];
		for(var i=0;i<parsed.people.length;i++){
			var p = parsed.people[i];
			people.push(new person(p.name, p.scores));
		}
		
		texts = document.getElementById("categories").value.split(",");
		Draw();
	}
	catch(x){
		alert("Error parsing JSON:"+x);
		console.error(x);
	}
}

function DrawBase(){
    ctx.fillStyle = "#FFF";
    ctx.fillRect(0,0, pageS*2, pageS);

    /*draw circle and lines */
    ctx.strokeStyle="#000";
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.arc(pageHalf,pageHalf,R,0,2*Math.PI);
    ctx.stroke();

    ctx.strokeStyle="#000";
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(pageHalf, pageHalf + R);
    ctx.lineTo(pageHalf, pageHalf - R);
    ctx.moveTo(pageHalf + R, pageHalf);
    ctx.lineTo(pageHalf - R, pageHalf);

    ctx.moveTo(pageHalf - RR, pageHalf + RR);
    ctx.lineTo(pageHalf + RR, pageHalf - RR);
    ctx.moveTo(pageHalf + RR, pageHalf + RR);
    ctx.lineTo(pageHalf - RR, pageHalf - RR);
    ctx.stroke();

    ctx.font = "12pt Calibri";
    ctx.fillStyle="#000";

    var inc = R/MaxVal;
    for(var i=0;i<texts.length;i++){
        ctx.fillText(texts[i], pageHalf-(ctx.measureText(texts[i]).width/2), pageHalf-R-3);
       
        for(var j=0;j<R;j+=inc){
            ctx.beginPath();
            ctx.moveTo(pageHalf-(R/50), pageHalf-j);
            ctx.lineTo(pageHalf+(R/50), pageHalf-j);
            ctx.stroke();
        }
        Rotate();
    }
}
function person(name, scores){
    this.name = name;
    this.scores = scores;
    this.isSelected = 1;
   
    this.x = 0;
    this.y = 0;
    this.w = 100;
    this.h = 20;
}
person.prototype.draw = function(){
    var Dist = [];
    for(var j = 0; j < this.scores.length;j++){
        var temp = this.scores[j] * R / MaxVal;
        Dist[j] = temp;
    }

    ctx.fillStyle= 'rgba(190,190,250,.5)';
    ctx.beginPath();
    ctx.moveTo(pageHalf, pageHalf - Dist[0]);
    ctx.lineTo(pageHalf + (Dist[1]*root2), pageHalf - (Dist[1]*root2));
    ctx.lineTo(pageHalf + Dist[2], pageHalf);
    ctx.lineTo(pageHalf + (Dist[3]*root2), pageHalf + (Dist[3]*root2));
    ctx.lineTo(pageHalf, pageHalf + Dist[4]);
    ctx.lineTo(pageHalf - (Dist[5]*root2), pageHalf + (Dist[5]*root2));
    ctx.lineTo(pageHalf - Dist[6], pageHalf);
    ctx.lineTo(pageHalf - (Dist[7]*root2), pageHalf - (Dist[7]*root2));
    ctx.closePath();
    ctx.fill();
}
function Draw(){
    DrawBase();
   
    var x = pageS;
    var y = 15;
    for(var i=0;i<people.length;i++){
        if(people[i].isSelected){
            people[i].draw();
        }
        ctx.fillStyle="#000";
        ctx.font = people[i].isSelected?"bold 12pt Calibri" : "12pt Calibri";
       
        ctx.fillText(people[i].name, x, y);
        people[i].x = x;
        people[i].y = y;
        y += 20;
       
        if(y > pageS){
            y = 15;
            x += 100;
        }
    }
}

drawArea.onmousedown = function (event) {
    var x = event.x ? event.x : event.clientX;
    var y = event.y ? event.y : event.clientY;

    x -= cursorShift[0];
    y -= cursorShift[1];
   //TODO: figure out a better way to determine i;
    if(x > pageS){
        var row = Math.floor(y / 20);
        var col = Math.floor((x-pageS)/100);
        var i = row+ (col*(pageS/20));
        people[i].isSelected = !people[i].isSelected;
        Draw();
    }
}

var people = [];
var texts=[];

ParseJSON();
Draw();

function Rotate(){
    ctx.translate(pageHalf, pageHalf);
    ctx.rotate(Math.PI/4);
    ctx.translate(-pageHalf, -pageHalf);
}