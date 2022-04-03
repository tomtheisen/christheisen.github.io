//TODO: zoom
//TODO: drag draw area
//TODO: paginate or scroll shape instance buttons
//TODO: select/move/manipulate multpile shapes
//TODO: import image object??
//TODO: greyscale image:
//function hexToRgb(hex) {
// 
//  if(hex.length != 7 && hex.length != 4){
//    console.log(hex, "invalid hex length");
//    return {r:-1, g:-1, b:-1};
//  }
// 
//  const pattern = hex.length == 7 ?/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i:/^#?([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i;
//  const result = pattern.exec(hex);
// 
//  return result ? {
//    r: parseInt(result[1], 16),
//    g: parseInt(result[2], 16),
//    b: parseInt(result[3], 16)
//  } : null;
//}
//function rgbToHex(r, g, b) {
//  const rh = r.toString(16).padStart(2,'0');
//  const gh = g.toString(16).padStart(2,'0');
//  const bh = b.toString(16).padStart(2,'0');
// 
//  return "#" + rh + gh + bh;
//}
//function convertToGrey(colorHex)
//{
//  const rgb = hexToRgb(colorHex);
//  const grey = Math.floor(rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) % 100;
//
//  const outHex = rgbToHex(grey, grey, grey);
//  return outHex;
//}


var pageW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - 30;
var pageH = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 30;
var bottomH = 200;
var rightW = 200;
var shapeButtonMin = 250;
var drawW = pageW - rightW;
var drawH = pageH - bottomH;
var cursorShift = 9;
var zoomMultiplier = 1;
var DragOffset = new point(0,0);

var drawArea = document.getElementById('canvasArea');
drawArea.width = pageW;
drawArea.height = pageH;
var ctx = drawArea.getContext('2d');


//0: pencil; 1:line; 2:circle; 3:ellipse; 4:rectangle; 5:diamond; 6:text; 7:bezier;
var type=0;
var shapes=[];
var tempShape = null;
var typeButtons=[];
var miscButtons=[];
var colorButtons=[];
var shapeButtons=[];
var selectColorButton=new button("", 0, drawH, bottomH, 100, "#000");

var bezierClick=0;
var isColorsDrawn=false;
var isMouseDown=false;
var isFill=true;
var isResizing=false;
var isMoving=false;
var selectedShapeIndex=-1;
var selectedShape=tempShape;
var reSizers=[];
var selectedResizerIndex=-1;

var interval;
var moveU=false;
var moveD=false;
var moveL=false;
var moveR=false;


function init(){
	buildButtons();
	drawCanvas();
}

//0: pencil; 1:line; 2:circle; 3:ellipse; 4:rectangle; 5:diamond; 6:text; 7:bezier;
function shape(type, x1, y1, x2, y2, color, fill, other){
	this.type = type||0;
    this.x1 = x1||0;
    this.y1 = y1||0;
    this.x2 = x2||0;
    this.y2 = y2||0;
	this.color = color||"#000";
	this.fill = fill||0;
	if(type==0){
		this.other=[];
1	}
	else{this.other = other||0;}
}
shape.prototype.toString = function(){
	return "("+this.x1+","+this.y1+")["+this.color+"]";
}
shape.prototype.draw = function(){
	ctx.beginPath();

	ctx.fillStyle=this.color;
	ctx.strokeStyle=this.color;

	if(this.type==0){//pencil
		var scaleX = 1;
		var scaleY = 1;
		
		if(this.other.length > 1){
			var w1 = this.x1 - this.x2;
			var h1 = this.y1 - this.y2;
			
		
			var w2 = this.other[this.other.length - 1].x * -1;
			var h2 = this.other[this.other.length - 1].y * -1;
			
			scaleX = w1 == 0 ? 0 : w1/w2;
			scaleY = h1 == 0 ? 0 : h1/h2;
		}
		
		for(var i=0; i<this.other.length-1;i++){
			var x1 = this.x1 + (this.other[i].x * scaleX);
			var x2 = this.x1 + (this.other[i+1].x * scaleX);
			var y1 = this.y1 + (this.other[i].y * scaleY);
			var y2 = this.y1 + (this.other[i+1].y * scaleY);

			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
		}
	}
	else if(this.type == 1){//Line
		ctx.moveTo(this.x1, this.y1);
		ctx.lineTo(this.x2, this.y2);
		ctx.stroke();
	}
	else if(this.type == 2){//Circle
		var r = distance(this.x1, this.y1, this.x2, this.y2);// Math.sqrt(r);
		ctx.arc(this.x1, this.y1, r, 0, 2*Math.PI);
	}
	else if(this.type == 3){//Ellipse
		drawEllipse(this.x1,this.y1,this.x2-this.x1,this.y2-this.y1,this.other);
	}
	else if(this.type == 4){//Rectangle
		ctx.rect(this.x1,this.y1,this.x2-this.x1,this.y2-this.y1);
	}
	else if(this.type == 5){//Diamond
		drawEllipse(this.x1,this.y1,this.x2-this.x1,this.y2-this.y1,this.other);
	}
	else if(this.type == 6){//Text
		ctx.font=this.y2 * 1.5 + "px Ariel";
		ctx.fillText(this.other, this.x1, this.y1, this.x2);
	}
	else if(this.type == 7){//Bezier
		ctx.moveTo(this.x1, this.y1);
		
		var midx1 = this.other.length > 0 ? this.other[0].x : this.x2;
		var midy1 = this.other.length > 0 ? this.other[0].y : this.y2;
		var midx2 = this.other.length > 1 ? this.other[1].x : this.x2;
		var midy2 = this.other.length > 1 ? this.other[1].y : this.y2;
		
		ctx.bezierCurveTo(midx1, midy1, midx2, midy2, this.x2, this.y2);
	}
	if(this.fill){
		ctx.fill();
	}
	else{
		ctx.stroke();
	}	
}

function point(x, y){
	this.x = x||0;
	this.y = y||0;
}

function button(text, x, y, w, h, val){
	this.text = text;
    this.x = x||0;
    this.y = y||0;
    this.w = h||0;
    this.h = w||0;
	this.val = val||0;
}
button.prototype.draw = function(fill){
	ctx.beginPath();
	ctx.rect(this.x,this.y,this.w,this.h);
	ctx.stroke();
	ctx.fillStyle = fill;
	ctx.fillRect(this.x,this.y,this.w,this.h);
	ctx.fillStyle = "#000";
	ctx.fillText(this.text,parseInt(this.x)+10, parseInt(this.y)+30);		
};

function scrollbar(x, y, w, h, scrollDir, scrollSizePct, scrollPosPct){
    this.x = x||0;
    this.y = y||0;
    this.w = h||0;
    this.h = w||0;

    this.scrollDir = scrollDir||0;
    this.scrollSizePct = scrollSizePct||0;
    this.scrollPosPct = scrollPosPct||0;
}
scrollbar.prototype.draw = function(){
	ctx.beginPath();
	ctx.fillStyle="#333";
	ctx.rect(this.x,this.y,this.w,this.h);
	ctx.fill();
	
	ctx.beginPath();
	ctx.strokeStyle="#000";
	ctx.rect(this.x,this.y,this.w,this.h);
	ctx.stroke();
	
	var scrollSize = 0;
	var scrollX = this.x;
	var scrollY = this.y;
	var scrollW = this.w;
	var scrollH = this.h;
	if(this.scrollDir == "horizontal"){
		scrollSize = this.w * scrollSizePct;
		scrollY += (this.w-scrollSize) * scrollPosPct;
	}
	else if(this.scrollDir == "vertical"){
		scrollSize = this.h * scrollSizePct;
		scrollX += (this.h-scrollSize) * scrollPosPct;
	}
	ctx.fillStyle="#FFF";
	ctx.rect(scrollX, scrollY, scrollW, scrollH);
	ctx.fill();
}

function saveImage(){
	drawArea.width = drawW;
	drawArea.height = drawH;
	drawShapes();

	window.location = drawArea.toDataURL();

	var img = drawArea.toDataURL("image/png");
	
	var a = $("<a>").attr("href", img).attr("download", "img.png").appendTo("body");
	a[0].click();
	a.remove();
	
	drawArea.width = pageW;
	drawArea.height = drawH;
	drawCanvas();
}

function drawCanvas(){
	ctx.fillStyle="#000";
	ctx.strokeStyle="#000";
	clearCanvas();
	drawShapes();
	ctx.rect(0,0,drawW,drawH);
	ctx.stroke();
	clearExtra();
	drawButtons();
	drawResizers();
}

function drawShapes(){
	for(var i=0; i<shapes.length; i++){
		shapes[i].draw();
	}
	ctx.beginPath();
	drawTempShape();
	
	//for some reason if I don't have this here it draws the last stroke the wrong color.
	ctx.fillStyle="#000";
	ctx.strokeStyle="#000";
}

function drawTempShape(){
	if(tempShape==null){return;}
	tempShape.draw();
	
	if(tempShape.type == 6){return;}//text;
	
	ctx.fillStyle="#FFF";
	ctx.fillRect(tempShape.x1-2,tempShape.y1, 100, -20);
	ctx.fillRect(tempShape.x2-2,tempShape.y2, 100, -20);

	ctx.fillStyle="#000";
	ctx.font="20px Ariel";
	ctx.fillText("("+tempShape.x1+","+tempShape.y1+")", tempShape.x1, tempShape.y1-5);
	ctx.fillText("("+(tempShape.x2-tempShape.x1)+","+(tempShape.y2-tempShape.y1)+")", tempShape.x2, tempShape.y2-5);
}

function drawEllipse(x, y, w, h, kappa) {
  var ox = (w / 2) * kappa, // control point offset horizontal
      oy = (h / 2) * kappa, // control point offset vertical
      xe = x + w,           // x-end
      ye = y + h,           // y-end
      xm = x + w / 2,       // x-middle
      ym = y + h / 2;       // y-middle

  ctx.beginPath();
  ctx.moveTo(x, ym);
  ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
  ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
  ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
  ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
}

function drawResizers(){
	if(selectedShapeIndex < 0){ return; }
	buildResizers();

	for(var i=0;i<reSizers.length;i++)
	{
		if(i==0){
			ctx.beginPath();
			ctx.fillStyle="#FFF";
			var w = 10;
			drawEllipse(reSizers[i].x-w,reSizers[i].y-w,w*2,w*2,0);
			ctx.fill();

			ctx.beginPath();
			ctx.fillStyle="#F00";
			w = 7;
			drawEllipse(reSizers[i].x-w,reSizers[i].y-w,w*2,w*2,0);
			ctx.fill();

			ctx.beginPath();
			ctx.fillStyle="#FFF";
			w = 2;
			drawEllipse(reSizers[i].x-w,reSizers[i].y-w,w*2,w*2,0);
			ctx.fill();
		}
		else{
			ctx.beginPath();
			ctx.fillStyle="#FFF";
			ctx.arc(reSizers[i].x, reSizers[i].y, 6, 0, 2*Math.PI);
			ctx.fill();

			ctx.beginPath();
			ctx.fillStyle="#000";
			ctx.arc(reSizers[i].x, reSizers[i].y, 5, 0, 2*Math.PI);
			ctx.fill();

			ctx.beginPath();
			ctx.fillStyle="#FFF";
			ctx.arc(reSizers[i].x, reSizers[i].y, 1, 0, 2*Math.PI);
			ctx.fill();
		}
	}
	ctx.beginPath();
}

function drawButtons(){
	clearExtra();
	ctx.font="20px Ariel";

	for(var i=0; i<typeButtons.length; i++){
		var fill = "#FFF";
		if(typeButtons[i].val == type){fill="#CCC";}
		else{fill="#FFF";}
		typeButtons[i].draw(fill);
	}
	if(!isColorsDrawn){
		for(var i=0; i<miscButtons.length; i++){
			miscButtons[i].draw("#FFF");
		}
	}
	
	ctx.fillStyle=selectColorButton.val;
	ctx.fillRect(selectColorButton.x,selectColorButton.y,selectColorButton.w,selectColorButton.h);
	ctx.fillStyle="#FFF";
	ctx.fillRect(selectColorButton.x + 10,selectColorButton.y + 5,selectColorButton.w - 20, 20);
	ctx.fillStyle="#000";
	ctx.fillText(selectColorButton.val, selectColorButton.x+30, selectColorButton.y + 20);
	
	if(isColorsDrawn){
		drawColorButtons();
	}
	drawShapeButtons();
}

function drawShapeButtons(){
	shapeButtons=[];
	for(var i = 0; i < shapes.length; i++){
	
		if(shapes[i].type == type){
			var n = shapeButtons.length;
		
			var x = drawW;
			var y = shapeButtonMin + (n*25);
			shapeButtons[n]=new button(shapes[i].toString(), x, y, 25, rightW-15, i);
			
			ctx.beginPath();
			ctx.strokeStyle="#000";
			ctx.rect(shapeButtons[n].x,shapeButtons[n].y,shapeButtons[n].w,shapeButtons[n].h);
			ctx.stroke();
			
			ctx.beginPath();
			ctx.fillStyle=shapes[i].color;
			ctx.rect(pageW-25,y+1,10,23);
			ctx.fill();
			
			ctx.font="14px Ariel";
			if(i==selectedShapeIndex){	ctx.font="20px Ariel";}
			ctx.fillStyle="#000";
			ctx.fillText(shapeButtons[n].text,parseInt(shapeButtons[n].x)+3, parseInt(shapeButtons[n].y)+18);		
		}
	}
}

function drawColorButtons(){
	ctx.fillStyle="#000";
	ctx.fillRect(0,drawH,drawW,bottomH);
	
	for(var i=0; i<colorButtons.length; i++){
		ctx.fillStyle = colorButtons[i].val;
		ctx.fillRect(colorButtons[i].x,colorButtons[i].y,colorButtons[i].w,colorButtons[i].h);
		ctx.fillStyle = "#000";
	}
}

function clearCanvas() {ctx.clearRect(0, 0, drawArea.width, drawArea.height);}
function clearExtra() {	ctx.clearRect(drawW, 0, rightW, drawArea.height); ctx.clearRect(0,drawH,drawArea.width,bottomH); }

function distance(ax, ay, bx, by){
	return Math.sqrt(((ax - bx)*(ax - bx)) + ((ay-by)*(ay-by)));
}

function buildButtons(){
	typeButtons[typeButtons.length]=new button("Pencil", drawW, 0, 50, 100, 0);
	typeButtons[typeButtons.length]=new button("Text", drawW + 100, 0, 50, 100, 6);

	typeButtons[typeButtons.length]=new button("Line", drawW, 50, 50, 100, 1);
	typeButtons[typeButtons.length]=new button("Curve", drawW + 100, 50, 50, 100, 7);

	typeButtons[typeButtons.length]=new button("Circle", drawW, 100, 50, 100, 2);
	typeButtons[typeButtons.length]=new button("Ellipse", drawW + 100, 100, 50, 100, 3);

	typeButtons[typeButtons.length]=new button("Rectangle", drawW, 150, 50, 100, 4);
	typeButtons[typeButtons.length]=new button("Diamond", drawW + 100, 150, 50, 100, 5, 0);
	
	miscButtons[miscButtons.length]=new button("Save", drawW-202, drawH, 50, 100, 0);
	miscButtons[miscButtons.length]=new button("Fill", drawW-101, drawH, 50, 100, 1);

	miscButtons[miscButtons.length]=new button("Delete", drawW-202, drawH + 51, 50, 100, 2);
	miscButtons[miscButtons.length]=new button("Clone", drawW-101, drawH + 51, 50, 100, 3);

	miscButtons[miscButtons.length]=new button("To Front", drawW-202, drawH + 102, 50, 100, 4);
	miscButtons[miscButtons.length]=new button("To Back", drawW-101, drawH + 102, 50, 100, 5);

	miscButtons[miscButtons.length]=new button("Export", drawW-202, drawH + 153, 50, 100, 6);
	miscButtons[miscButtons.length]=new button("Import", drawW-101, drawH + 153, 50, 100, 7);
	
	miscButtons[miscButtons.length]=new button("Zoom In", drawW-303, drawH, 50, 100, 8);
	miscButtons[miscButtons.length]=new button("100%", drawW-303, drawH + 51, 50, 100, 9);
	miscButtons[miscButtons.length]=new button("Zoom Out", drawW-303, drawH + 102, 50, 100, 10);
	
	
	buildColorButtons();
}

function buildColorButtons(){
	var hex = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'];
	var P = 64;
	var RC = P*6;
	var S = parseInt(drawW/RC);
	var Pad = 140;//drawW-(RC*S);
	selectColorButton.w=Pad;
	for(var i=0; i<RC*P;i++){

		var R;
		var G;
		var B;
		
		var temp = i%RC;
		if(temp<P*1){//red
			R=P-1;
			G=(temp%P);
			B=0;
		}
		else if(temp<P*2){//orange
			R=P-1-(temp%P);
			G=P-1;
			B=0;
		}
		else if(temp<P*3){//yellow
			R=0;
			G=P-1;
			B=(temp%P);
		}
		else if(temp<P*4){//green
			R=0;
			G=P-1-(temp%P);
			B=P-1;
		}
		else if(temp<P*5){//blue
			R=(temp%P);
			G=0;
			B=P-1;
		}
		else if(temp<P*6){//violet
			R=P-1;
			G=0;
			B=P-1-(temp%P);
		}
		
		R *= 256/P;
		G *= 256/P;
		B *= 256/P;
		
		var fade = ((parseInt(i/RC)*512)/P)-256;
		
		R=Math.max(Math.min(255,R+fade), 0);
		G=Math.max(Math.min(255,G+fade), 0);
		B=Math.max(Math.min(255,B+fade), 0);

		var C = '#' + hex[parseInt(R/16)] + hex[R%16] + hex[parseInt(G/16)] + hex[G%16] + hex[parseInt(B/16)] + hex[B%16];
		
		colorButtons[colorButtons.length] = new button(C, ((i%RC)*S), drawH+5+(parseInt(i/RC)*S), S, S, C);
	}
}

function buildResizers(){
	if(selectedShapeIndex < 0){ return; }
	
	selectedShape = shapes[selectedShapeIndex];
	reSizers=[];
	if(selectedShape.type==0){//pencil
		reSizers[reSizers.length]=new point(selectedShape.x1, selectedShape.y1);
		reSizers[reSizers.length]=new point(selectedShape.x2, selectedShape.y2);
	}
	else if(selectedShape.type == 1){//Line
		reSizers[reSizers.length]=new point((selectedShape.x1 + selectedShape.x2)/2, (selectedShape.y1 + selectedShape.y2)/2);
		reSizers[reSizers.length]=new point(selectedShape.x1, selectedShape.y1);
		reSizers[reSizers.length]=new point(selectedShape.x2, selectedShape.y2);
	}
	else if(selectedShape.type == 2){//Circle
		reSizers[reSizers.length]=new point(selectedShape.x1, selectedShape.y1);

		var a = selectedShape.x2 - selectedShape.x1;
		var b = selectedShape.y2 - selectedShape.y1;
		var r = (a*a) + (b*b);
		r = Math.sqrt(r);
		reSizers[reSizers.length]=new point(selectedShape.x1-r, selectedShape.y1);
		reSizers[reSizers.length]=new point(selectedShape.x1, selectedShape.y1-r);
		reSizers[reSizers.length]=new point(selectedShape.x1+r, selectedShape.y1);
		reSizers[reSizers.length]=new point(selectedShape.x1, selectedShape.y1+r);
	}
	else if(selectedShape.type == 3){//Ellipse
		var midX = (selectedShape.x1 + selectedShape.x2)/2;
		var midY = (selectedShape.y1 + selectedShape.y2)/2;
		reSizers[reSizers.length]=new point(midX, midY);
		reSizers[reSizers.length]=new point(midX, selectedShape.y1);
		reSizers[reSizers.length]=new point(selectedShape.x2, midY);
		reSizers[reSizers.length]=new point(midX, selectedShape.y2);
		reSizers[reSizers.length]=new point(selectedShape.x1, midY);
	}
	else if(selectedShape.type == 4){//Rectangle
		reSizers[reSizers.length]=new point((selectedShape.x1 + selectedShape.x2)/2, (selectedShape.y1 + selectedShape.y2)/2);

		reSizers[reSizers.length]=new point(selectedShape.x1, selectedShape.y1);
		reSizers[reSizers.length]=new point(selectedShape.x2, selectedShape.y1);
		reSizers[reSizers.length]=new point(selectedShape.x2, selectedShape.y2);
		reSizers[reSizers.length]=new point(selectedShape.x1, selectedShape.y2);
	}
	else if(selectedShape.type == 5){//Diamond
		var midX = (selectedShape.x1 + selectedShape.x2)/2;
		var midY = (selectedShape.y1 + selectedShape.y2)/2;
		reSizers[reSizers.length]=new point(midX, midY);
		reSizers[reSizers.length]=new point(midX, selectedShape.y1);
		reSizers[reSizers.length]=new point(selectedShape.x2, midY);
		reSizers[reSizers.length]=new point(midX, selectedShape.y2);
		reSizers[reSizers.length]=new point(selectedShape.x1, midY);
	}
	else if(selectedShape.type == 6){//Text
		reSizers[reSizers.length]=new point(selectedShape.x1, selectedShape.y1);
		reSizers[reSizers.length]=new point(selectedShape.x1 + selectedShape.x2, selectedShape.y1 - selectedShape.y2);
	}
	else if(selectedShape.type == 7){//Bezier
		reSizers[reSizers.length]=new point(selectedShape.x1, selectedShape.y1);
		reSizers[reSizers.length]=new point(selectedShape.x2, selectedShape.y2);
		
		if(selectedShape.other.length > 0){
			reSizers[reSizers.length]=new point(selectedShape.other[0].x,selectedShape.other[0].y);
		}
		if(selectedShape.other.length > 1){
			reSizers[reSizers.length]=new point(selectedShape.other[1].x,selectedShape.other[1].y);
		}
	}
}

function MoveShape(){
	if(moveU){
		selectedShape.y1 -= 1;
		selectedShape.y2 -= 1;
		
		if(selectedShape.type==6){
			selectedShape.y2 += 1
		}
	}
	if(moveD){
		selectedShape.y1 += 1;
		selectedShape.y2 += 1;

		if(selectedShape.type==6){
			selectedShape.y2 -= 1
		}
	}
	if(moveL){
		selectedShape.x1 -= 1;
		selectedShape.x2 -= 1;

		if(selectedShape.type==6){
			selectedShape.x2 += 1
		}
	}
	if(moveR){
		selectedShape.x1 += 1;
		selectedShape.x2 += 1;
		
		if(selectedShape.type==6){
			selectedShape.x2 -= 1
		}

	}
	drawCanvas();
}

function GetColorIndex(x, y){
	if(isColorsDrawn){
		for(var i=0;i<colorButtons.length;i++){
			if(x >= colorButtons[i].x	 && x <= colorButtons[i].x + colorButtons[i].w
				&& y >= colorButtons[i].y && y <= colorButtons[i].y + colorButtons[i].h){
				
				return i;
			}
		}
	}
	return -1;
}

function toggleDiv(Div, isShown){
	var div = document.getElementById(Div);
	if(div == null){return;}
	
	isShown = isShown || div.style.display == "none";
	div.style.display = isShown ? "block" : "none";
}

function Export(){
	return "{\"shapes\":" + JSON.stringify(shapes) +"}";
}

function Import(){
	var text = document.getElementById("txt").value;
	toggleDiv("div");
	toggleDiv("div2", 0);

	shapes = [];

	var temp = JSON.parse(text).shapes;
	for(var i=0;i<temp.length;i++){
		shapes[i] = new shape(temp[i].type, temp[i].x1, temp[i].y1, temp[i].x2, temp[i].y2, temp[i].color, temp[i].fill, temp[i].other);
		if(temp[i].type == 0){//pencil
			shapes[i].other = []
			for(var j=0;j<temp[i].other.length;j++){
				shapes[i].other[j] = new point(temp[i].other[j].x, temp[i].other[j].y);
			}
		}
		if(temp[i].type == 7){//bezier
			shapes[i].other = []
			for(var j=0;j<temp[i].other.length;j++){
				shapes[i].other[j] = new point(temp[i].other[j].x, temp[i].other[j].y);
			}
			
		}

	}

	drawCanvas();
}

drawArea.onmousedown=function(e){

	var x = e.clientX-cursorShift;
	var y = e.clientY-cursorShift;

	if(x > drawW){//Right area
		if(y<shapeButtonMin){
			for(var i=0;i<typeButtons.length;i++){
				if(x > typeButtons[i].x	 && x < typeButtons[i].x + typeButtons[i].w
					&& y > typeButtons[i].y && y < typeButtons[i].y + typeButtons[i].h){
					type = typeButtons[i].val;
					drawButtons();
					return;
				}
			}
		}
		else{
			for(var i=0;i<shapeButtons.length;i++){
				if(x > shapeButtons[i].x	 && x < shapeButtons[i].x + shapeButtons[i].w
					&& y > shapeButtons[i].y && y < shapeButtons[i].y + shapeButtons[i].h){
					
					if(shapeButtons[i].val == selectedShapeIndex) {
						selectedShapeIndex = -1;
						drawCanvas();
					}
					else{
						selectedShapeIndex = shapeButtons[i].val;
						
						ctx.fillStyle="#000";
						ctx.fillText(shapeButtons[i].text, 50, 50);
						
						isColorsDrawn=false;
						selectColorButton.val=shapeButtons[i].text.split("[")[1];
						selectColorButton.val=selectColorButton.val.substring(0, selectColorButton.val.length-1);

						drawCanvas();
					}
					return;
				}
			}
		}
	}
	else if(x < drawW && y > drawH){//Bottom area
		if(isColorsDrawn){
			var i = GetColorIndex(x, y);

			if(i >= 0){
				ctx.fillStyle="#000";
				ctx.fillText(colorButtons[i].text, 50, 50);
				
				isColorsDrawn=false;
				selectColorButton.val=colorButtons[i].val;
				
				if(selectedShapeIndex >= 0){
					shapes[selectedShapeIndex].color=colorButtons[i].val;
				}

				drawCanvas();
				return;
			}
		}
		else{
			for(var i=0;i<miscButtons.length;i++){
				if(x > miscButtons[i].x	 && x < miscButtons[i].x + miscButtons[i].w
					&& y > miscButtons[i].y && y < miscButtons[i].y + miscButtons[i].h){
					
					if(miscButtons[i].val==0){//Save
						saveImage();
						return;
					}
					else if(miscButtons[i].val==1){//Toggle fill/line
						isFill=!isFill;
						miscButtons[i].text=isFill?"Fill":"Line";
						
						if(selectedShapeIndex >= 0){
							shapes[selectedShapeIndex].fill = isFill;
							drawCanvas();
						}
						
						drawButtons();
						return;
					}
					else if(miscButtons[i].val==2){//Delete
						if(selectedShapeIndex>=0){
							for(var i=0;i<shapeButtons.length;i++){
								if(shapeButtons[i].val==selectedShapeIndex){
									shapeButtons.splice(i,1);
									break;
								}
							}
							shapes.splice(selectedShapeIndex, 1);
							selectedShapeIndex = -1;
							drawCanvas();
							return;
						}
						else{
							shapes.splice(shapes.length-1,1);
							shapeButtons.splice(shapeButtons.length-1,1);
							drawCanvas();
							return;
						}
					}
					else if(miscButtons[i].val==3){//Clone
						if(selectedShapeIndex >= 0){
							shapes[shapes.length] = new shape(shapes[selectedShapeIndex].type, shapes[selectedShapeIndex].x1, shapes[selectedShapeIndex].y1, shapes[selectedShapeIndex].x2, shapes[selectedShapeIndex].y2, shapes[selectedShapeIndex].color, shapes[selectedShapeIndex].fill, shapes[selectedShapeIndex].other);
							if(shapes[selectedShapeIndex].type==0){//pencil
								for(var j=0;j<shapes[selectedShapeIndex].other.length;j++){
									shapes[shapes.length-1].other[j] = shapes[selectedShapeIndex].other[j];
								}
							}
							else if(shapes[selectedShapeIndex].type==7){//bezier
								shapes[shapes.length-1].other = [];//for some reason this one breaks without this line.
								shapes[shapes.length-1].other[0] = new point(shapes[selectedShapeIndex].other[0].x, shapes[selectedShapeIndex].other[0].y);
								shapes[shapes.length-1].other[1] = new point(shapes[selectedShapeIndex].other[1].x, shapes[selectedShapeIndex].other[1].y);
							}
							
							selectedShapeIndex = shapes.length -1;
							tempShape=null;
							drawCanvas();
						}
						return;
					}
					else if(miscButtons[i].val==4){//To Front
						if(selectedShapeIndex >= 0){
							shapes.splice(shapes.length, 0, shapes.splice(selectedShapeIndex, 1)[0]);
							selectedShapeIndex = shapes.length-1;
							drawCanvas();
						}
						return;
					}
					else if(miscButtons[i].val==5){//To Back
						if(selectedShapeIndex >= 0){
							shapes.splice(0, 0, shapes.splice(selectedShapeIndex, 1)[0]);
							selectedShapeIndex = 0;
							drawCanvas();
						}
						return;
					}
					else if(miscButtons[i].val==6){//Export
						toggleDiv("export", 1);
						document.getElementById("txt").value = Export();
					}
					else if(miscButtons[i].val==7){//Import
						toggleDiv("import", 1);
						document.getElementById("txt").value = "";
					}
				}
			}	
		}
		
		if(x > selectColorButton.x && x < selectColorButton.x + selectColorButton.w
			&& y > selectColorButton.y && y < selectColorButton.y + selectColorButton.h){
			isColorsDrawn=true;
			drawColorButtons();
		}

	}
	else {//DrawArea
		isColorsDrawn=false;
		isMouseDown=true;
		if(bezierClick==0){
			var isResizing = 0;
			for(var i=0; i < reSizers.length; i++){
				if(distance(x,y,reSizers[i].x,reSizers[i].y)<6){
					isResizing=1;
					selectedResizerIndex=i;
				}
			}
			if(!isResizing){
				var other = 1;
				if(type==0){
					other=[];
					tempShape=new shape(type, x, y, -1, -1, selectColorButton.val, isFill, other);
				}
				else if(type==3){
					other = .5522848;
					tempShape=new shape(type, x, y, -1, -1, selectColorButton.val, isFill, other);
				}
				else if(type==5){
					other = 0;
					tempShape=new shape(type, x, y, -1, -1, selectColorButton.val, isFill, other);
				}
				else if(type==6){
					other = "TEXT";
					tempShape=new shape(type, x, y, ctx.measureText(other)+5, 20, selectColorButton.val, isFill, other);
				}
				else if(type==7){
					other=[];
					tempShape=new shape(type, x, y, -1, -1, selectColorButton.val, isFill, other);
				}
				else{
					tempShape=new shape(type, x, y, -1, -1, selectColorButton.val, isFill, null);
				}
			}
		}
		else{
			if(tempShape.type==7){
				tempShape.other[tempShape.other.length] = new point(x,y);
			}
		}
	}
}

drawArea.onmouseup=function(e){
	isMouseDown=false;
	selectedResizerIndex=-1;

	if(tempShape != null){
		if(bezierClick==0){
			shapes[shapes.length] = new shape(tempShape.type, tempShape.x1, tempShape.y1, tempShape.x2, tempShape.y2, tempShape.color, tempShape.fill, tempShape.other);
			if(tempShape.type==0){//pencil
				for(var i=0;i<tempShape.other.length;i++){
					shapes[shapes.length-1].other[i] = tempShape.other[i];
				}
				selectedShapeIndex = shapes.length -1;
				tempShape=null;
			}
			else if(tempShape.type==7) { 
				bezierClick = 2; 
			}
			else{
				selectedShapeIndex = shapes.length -1;
				tempShape=null;
			}
		}
		else{
			bezierClick--;
			if(bezierClick == 0){ 
				tempShape = null; 
				selectedShapeIndex = shapes.length -1;
			}
		}
		
		drawCanvas();
	}
}

drawArea.onmousemove=function(e){
	var x = e.clientX-cursorShift;
	var y = e.clientY-cursorShift;
		
	if(x < drawW && y < drawH){
		if(type==6){//text
			document.body.style.cursor = "text";	
		}
		else{
			document.body.style.cursor = "crosshair";
		}

		if(reSizers.length > 0 && distance(x,y,reSizers[0].x, reSizers[0].y) < 6){
			document.body.style.cursor="move";
		}
		else{
			for(var i=1; i<reSizers.length;i++){
				if(distance(x,y,reSizers[i].x, reSizers[i].y)<6){
					document.body.style.cursor = "pointer";
				}
			}
		}
	}
	else{
		if(isColorsDrawn && y > drawH){
			drawCanvas();
			var i = GetColorIndex(x, y);
			if(i >= 0){ 
				ctx.fillStyle="#FFF";
				ctx.fillRect(x+15, y, 80, 20);
				ctx.fillStyle="#000";
				ctx.fillText(colorButtons[i].val, x+15,y+17); 
			}
		}
		document.body.style.cursor = "default";		
	}

	if(selectedResizerIndex >= 0){
		drawCanvas();
		ctx.fillStyle="#000";
		ctx.beginPath();

		selectedShape = shapes[selectedShapeIndex];
		var deltaX = x - reSizers[selectedResizerIndex].x;
		var deltaY = y - reSizers[selectedResizerIndex].y;
	
		if(selectedResizerIndex==0){
			if(selectedShape.type==0){//pencil
				selectedShape.x1 = x;
				selectedShape.y1 = y;
				
				selectedShape.x2 += deltaX;
				selectedShape.y2 += deltaY;
			}
			else if(selectedShape.type==1){//line
				selectedShape.x1 += deltaX;
				selectedShape.x2 += deltaX;
				selectedShape.y1 += deltaY;
				selectedShape.y2 += deltaY;
			}
			else if(selectedShape.type==2){//circle
				selectedShape.x2 -= selectedShape.x1-x;
				selectedShape.y2 -= selectedShape.y1-y;
				selectedShape.x1 = x;
				selectedShape.y1 = y;
			}
			else if(selectedShape.type==3){//ellipse
				selectedShape.x1 += deltaX;
				selectedShape.x2 += deltaX;
				selectedShape.y1 += deltaY;
				selectedShape.y2 += deltaY;
			}
			else if(selectedShape.type==4){//rectangle
				selectedShape.x1 += deltaX;
				selectedShape.x2 += deltaX;
				selectedShape.y1 += deltaY;
				selectedShape.y2 += deltaY;
			}
			else if(selectedShape.type==5){//diamond
				selectedShape.x1 += deltaX;
				selectedShape.x2 += deltaX;
				selectedShape.y1 += deltaY;
				selectedShape.y2 += deltaY;
			}
			else if(selectedShape.type==6){//text
				selectedShape.x1 = x;
				selectedShape.y1 = y;
			}
			else if(selectedShape.type==7){//bezier
				selectedShape.x1 = x;
				selectedShape.y1 = y;

				selectedShape.x2 += deltaX;
				selectedShape.y2 += deltaY;

				selectedShape.other[0].x += deltaX;
				selectedShape.other[0].y += deltaY;

				selectedShape.other[1].x += deltaX;
				selectedShape.other[1].y += deltaY;

			}
		}
		else{
			if(selectedShape.type==0){//pencil
				if(selectedResizerIndex==1){
					selectedShape.x2 = x;
					selectedShape.y2 = y;
				}
			}
			else if(selectedShape.type==1){//line
				if(selectedResizerIndex==1){
					selectedShape.x1 = x;
					selectedShape.y1 = y;
				}
				else if(selectedResizerIndex==2){
					selectedShape.x2 = x;
					selectedShape.y2 = y;
				}
			}
			else if(selectedShape.type==2){//circle
				selectedShape.x2 = x;
				selectedShape.y2 = y;
			}
			else if(selectedShape.type==3){//ellipse
				if(selectedResizerIndex==1){
					selectedShape.y1 = y;
				}
				else if(selectedResizerIndex==2){
					selectedShape.x2 = x;
				}
				else if(selectedResizerIndex==3){
					selectedShape.y2 = y;
				}
				else if(selectedResizerIndex==4){
					selectedShape.x1 = x;
				}
			}
			else if(selectedShape.type==4){//rectangle
				if(selectedResizerIndex==1){
					selectedShape.x1 = x;
					selectedShape.y1 = y;
				}
				else if(selectedResizerIndex==2){
					selectedShape.x2 = x;
					selectedShape.y1 = y;
				}
				else if(selectedResizerIndex==3){
					selectedShape.x2 = x;
					selectedShape.y2 = y;
				}
				else if(selectedResizerIndex==4){
					selectedShape.x1 = x;
					selectedShape.y2 = y;
				}
			}
			else if(selectedShape.type==5){//diamond
				if(selectedResizerIndex==1){
					selectedShape.y1 = y;
				}
				else if(selectedResizerIndex==2){
					selectedShape.x2 = x;
				}
				else if(selectedResizerIndex==3){
					selectedShape.y2 = y;
				}
				else if(selectedResizerIndex==4){
					selectedShape.x1 = x;
				}
			}
			else if(selectedShape.type==6){//text
				selectedShape.x2 = Math.max(x - selectedShape.x1,selectedShape.other.length);
				selectedShape.y2 = Math.max(selectedShape.y1 - y,5);
			}
			else if(selectedShape.type==7){//bezier
				if(selectedResizerIndex==1){
					selectedShape.x2 = x;
					selectedShape.y2 = y;
				}
				if(selectedResizerIndex==2){
					selectedShape.other[0].x = x;
					selectedShape.other[0].y = y;
				}
				if(selectedResizerIndex==3){
					selectedShape.other[1].x = x;
					selectedShape.other[1].y = y;
				}
			}
		}
	}
	else if(isMouseDown){
		if(bezierClick==0){
			tempShape.x2=x;
			tempShape.y2=y;
			if(tempShape.type==0){//Pencil
				tempShape.other[tempShape.other.length] = new point(x - tempShape.x1, y - tempShape.y1);
			}
			if(tempShape.type==6){//Text
				tempShape.x1 = x;
				tempShape.y1 = y;
				tempShape.x2 = ctx.measureText(tempShape.other).width+5;
				tempShape.y2 = 20;
			}
		}
		else{
			if(tempShape.type==7){
				tempShape.other[bezierClick==2?0:1] = new point(x,y);
			}
		}
		drawCanvas();
	}
}

document.onkeydown=function(e){
	//13 = enter
	if(e.keyCode==72){
		toggleDiv('help');
	}
	
	if(selectedShapeIndex < 0){return;}
	if(shapes[selectedShapeIndex].type==6 && e.keyCode==8){//Backspace
		shapes[selectedShapeIndex].other = shapes[selectedShapeIndex].other.slice(0,-1);
		drawCanvas();
		e.preventDefault();
	}
	else if(e.keyCode==46){//Delete
		for(var i=0;i<shapeButtons.length;i++){
			if(shapeButtons[i].val==selectedShapeIndex){
				shapeButtons.splice(i,1);
				break;
			}
		}
		shapes.splice(selectedShapeIndex, 1);
		selectedShapeIndex = -1;
		drawCanvas();
	}
	else if(e.keyCode==37){//left
		moveL = true;
	}
	else if(e.keyCode==39){//right
		moveR = true;
	}	
	else if(e.keyCode==38){//up
		moveU = true;
	}
	else if(e.keyCode==40){//down
		moveD = true;
	}
	else if(e.keyCode==27){//escape
		selectedShapeIndex=-1;
		drawCanvas();
	}
	
	if((moveL || moveR || moveU || moveD) && interval == null){
		interval = setInterval(MoveShape, 10);
	}
}

document.onkeyup=function(e){
	if(e.keyCode==37){//left
		moveL = false;
	}
	else if(e.keyCode==39){//right
		moveR = false;
	}	
	else if(e.keyCode==38){//up
		moveU = false;
	}
	else if(e.keyCode==40){//down
		moveD = false;
	}
	
	if(!moveL && !moveR && !moveU && !moveD){
		clearInterval(interval);
		interval = null;
	}
}

document.onkeypress=function(e){
	if(selectedShapeIndex < 0){return;}
	if(shapes[selectedShapeIndex].type==6){
		var c = String.fromCharCode(e.which);

		shapes[selectedShapeIndex].other += c;
		drawCanvas();
	}
}

init();
toggleDiv('help',1);