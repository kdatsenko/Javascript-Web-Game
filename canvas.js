var foods;
var bugs;
var num_food = 5;
//var num_bugs = 5;

var padding = 40;
var mouseX;
var mouseY;

var timeUntilBugEnters;

//CAN GET THESE THROUGH THE DOM!
var canvas_width; 
var canvas_height;
var food_width = 30;
var food_height = 30;
var food_radius = 20;

var bug_R = 20;
var bug_width = 2 * bug_R;
var bug_height = (2 * bug_R) + bug_R/2.5;
var bug_radius = bug_R + bug_R/2.5;

var frame_interval = 10;

var level = 0; //current level

var gamePaused;
var killScore = 0; //var to save game score

/* For overlap cases */
var mouse_radius = 30; //px
var animationID;

var timerCountDown;
var GAME_TIME = 60;


/*Start page variables*/
var start_page;
var start; //Start button element
var levels; //Radio buttons group  
var high_score; //High score span
var High_Score = 0; //var to save high score

/*Game variables*/
var game_page; 
var time; //time span
var pause; //pause button 
var this_score; //score span
var bye_page;	 

window.onload = init_start_page;

function init_start_page(){
	/*Get start page elements*/
	start_page = document.getElementById("start_page");
	levels = document.getElementsByName("level");
	high_score = document.getElementById("high_score");
	start = document.getElementById("start_game_btn");

	if(typeof(Storage) !== "undefined" && localStorage.getItem("highscore") != null ){
		High_Score=localStorage.getItem("highscore");
	}
	else{
		High_Score=0;
	}
	high_score.innerHTML=  High_Score;
	
	//Start page event handlers
	start.onclick = init;
		
	/*Get game page elements*/
	game_page = document.getElementById("game_page");
	//Initialize info bar
	time = document.getElementById("time");
	pause = document.getElementById("pause_btn");
	this_score = document.getElementById("this_score");
	canvas_width = document.getElementById("game").width;
	canvas_height = document.getElementById("game").height;

	//Game page event handlers
	pause.onclick = pauseGame; 
		
	/*Get end game page elements*/
	end_game_page = document.getElementById("end_game_page");
	game_score = document.getElementById("game_score");
	restart = document.getElementById("restart_btn");
	exit = document.getElementById("exit_btn");
	restart.onclick = restartGame;
	exit.onclick = byeBye;
	bye_page = document.getElementById("bye_page");
}


function init(){
	foods = [];
	bugs = [];
	mouseX = 2 * canvas_height;
	mouseY = 2 * canvas_height;
	//Load game page
	if (level == 0){
		level = getPlayerLevel(); //Determine player's level
		hidePage(start_page);
		showPage(game_page);
	}	

	initializeFood(); //make all food
	enterNewBug(); //start new bug entry process (not independant - with main loop)
	gamePaused = false;
	timerCountDown = GAME_TIME;
  	//draw bugs!
  	document.addEventListener("mousedown", doMouseDown, true);
  	animationID = setInterval(main, frame_interval); //1000/FPS*/
  }

function main (){
  	if (gamePaused == false){
  		var canvas = document.getElementById("game");
  		ctx = canvas.getContext("2d");
  		ctx.clearRect(0, 0, canvas_width, canvas_height);

  		time.innerHTML =  Math.ceil(timerCountDown);
  		this_score.innerHTML = killScore;

  		ctx.font = "20px Comic Sans MS";
  		ctx.fillStyle = "red";
  		ctx.textAlign = "center";
  		ctx.fillText("Level: "+level, canvas.width/2, 20); 

		for (var i = 0; i < foods.length; i++){ //ALWAYS DRAW BUGS ON TOP OF FOOD, NO MATTER WHAT
			foods[i].draw(ctx);
		}

		var killed_bugs = [];
		for (var i = 0; i < bugs.length; i++){
			var dis = Math.sqrt(Math.pow(bugs[i].x - mouseX, 2) + Math.pow(bugs[i].y - mouseY, 2));
		
			//Check if mouseclick kills this bug!
			if (dis < (bug_radius + mouse_radius)){
				bugs[i].isKilled = true;
				killScore += bugs[i].score;
			}

			if (bugs[i].updateBug()){
				bugs[i].draw(ctx);	
			} else {
				gameOver();
				return;
			}
		
			if (bugs[i].alpha <= 0){ //finally, we can get rid of it from memory
				killed_bugs.push(i);
			}
		}

		clearMouse();

		for (var k = killed_bugs.length - 1; k >= 0; k--){
			bugs.splice(killed_bugs[k], 1);
		}	

		timeUntilBugEnters -= frame_interval;
		if (timeUntilBugEnters <= 0){
			enterNewBug();
		}

		timerCountDown -= (frame_interval/1000);

		if (timerCountDown < 0){
			timerCountDown = 0;
			gameOver();
		} 

	}

}

function restartGame() {
	//Load start page again
	hidePage(end_game_page);
	level = 0;
	killScore = 0;
	//Update high_score
	high_score.innerHTML = localStorage.getItem("highscore");
	showPage(start_page);
}

function byeBye() {
	hidePage(end_game_page);
	showPage(bye_page);
}


function pauseGame(){
	if (gamePaused == false){
		clearTimeout(animationID);
		gamePaused = true;
		pause.innerHTML = "PLAY";
	} else {
		gamePaused = false;
		pause.innerHTML = "PAUSE";
		animationID = setInterval(main, frame_interval); //1000/FPS*/
	}
}

function gameOver(){
	clearTimeout(animationID);
	var canvas = document.getElementById("game");
	ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas_width, canvas_height);
	if (level == 1){
		level = 2;
		init();
	} else {
  		//Save killscore somewhere in local storage as highest score
  		hidePage(game_page);

  		if (High_Score < killScore) {
  			High_Score = killScore;
  		}

		//Update highscore
		if (typeof(Storage) !== "undefined") {
			localStorage.setItem("highscore",High_Score); 
		}

		showPage(end_game_page);
		game_score.innerHTML = killScore;
	}
}

function hidePage(page) {
	page.classList.add("hide");
}

function showPage(page) {
	page.classList.remove("hide");
}

function getPlayerLevel() {
	for (var i = 0, l = levels.length; i < l; i++) {
		if (levels[i].checked) {
			return parseInt(levels[i].value);
		}
	}
}

/*
* Bug object constructor
*/
function Bug(x, y, id, target, color, speed1, speed2, score) {
	this.x = x;
	this.y = y;
	this.id = id;
	this.target = target; //food index/ID
	this.color = color;
	this.speed1 = speed1;
	this.speed2 = speed2;
	this.score = score;
	this.alpha = 1;
	this.isKilled = false;
	this.angle;

	this.draw = draw;
	this.updateBug = updateBug;
	this.old_angle;
	this.needs_turning=false;
	this.currentTargetId;
	this.oldTargetId = -1;

	function draw(ctx){
		//draw bug
		ctx.save();
		//ctx.translate(this.x, this.y)
		ctx.translate(this.x, this.y);
		//ctx.rotate(angle + (Math.PI /2));
		if (this.needs_turning){
			var angle_diff = this.angle - this.old_angle;
			if (Math.abs(angle_diff) < ((Math.PI/180) * 2)){ //nearly there, doesn't need turning
				this.needs_turning = false;
		} else {
				if (angle_diff < 0){ //turns towards correct angle
					this.angle = this.old_angle - ((Math.PI/180) * 2);
				} else {
					this.angle = this.old_angle + ((Math.PI/180) * 2);
				}
				this.old_angle = this.angle;
				//Problem HERE
			}
			
		}

		ctx.rotate(this.angle - 0.5*Math.PI);

		ctx.strokeStyle = "black";
		ctx.scale(0.6, 1.2);
		bugArt(ctx, -1 * bug_R, -1 * bug_R, bug_R, this.color, this.alpha); //CORRECT

		ctx.restore();

	}

	function updateBug(ctx){
		//should update position + alpha (if bug is Killed!)
		// bug fade out is 2 secs!
		if (this.isKilled){
			/*
			b. IF bug is killed
			- fade out alpha in 2 sec
			*/
			var alpha_decrement = 1 * (frame_interval / 2000);
			this.alpha -= alpha_decrement;

		} else {
			if (foods.length == 0){
				return false;
			} else { //0. Check if there is still food
				//1. get closest food
				
				/*
				PLAN OF ACTION:
						a. IF bug is not killed
				0. check if there is still food 
				1. get closest food, call the function()~inefficient for now
				2. check if food is not eaten
					IF YES then find a new food!
				3. check if bug is currently eating the food, 
					IF YES then update isFoodEaten for food
					IF NO ....
				4. Check for overlap Immediately, give the right of way, else do #5
				5. get the angle, using x,y position and speed, get update position
				*/

				this.target = findClosestFood(this.x, this.y);
				this.currentTargetId = foods[this.target].id;
				//3. check if bug is currently eating the food, 
				//IF YES then update foods array
				var dis_to_food = Math.sqrt(Math.pow(this.x - foods[this.target].x, 2) +  Math.pow(this.y - foods[this.target].y, 2));
				if (dis_to_food <= (bug_radius + food_radius)){
					foods.splice(this.target, 1); //get rid of eaten food!
					if (foods.length == 0){
						return false;
					} else {
						this.target = findClosestFood(this.x, this.y);
						this.currentTargetId = foods[this.target].id; 


					}
				}

				//4. Check for overlap Immediately, give the right of way, else do #5
				for (var i = 0; i < bugs.length; i++){
					if (i != this.id & bugs[i].isKilled == false){
						var dis = Math.sqrt(Math.pow(this.x - bugs[i].x, 2) +  Math.pow(this.y - bugs[i].y, 2));
						if (dis < (2 * bug_radius)){
							if (this.speed1 < bugs[i].speed1){
								return true;
							} else if (this.speed1 == bugs[i].speed1 & this.x < bugs[i].x){
								return true;
							}
						}
					}
				}

				//For smooth rotation
				if (this.needs_turning == false){
					if (this.oldTargetId != -1 & this.oldTargetId != this.currentTargetId){
						this.old_angle = this.angle;
						this.needs_turning = true;
					}
				}


				//5. get the angle, using x,y position and speed, get update position
				var current_speed;
				if (level == 1){
					current_speed = this.speed1;
				} else {
					current_speed = this.speed2;
				}
				var distance = frame_interval * (current_speed / 1000); //speed is given as pixels per second

				this.angle = Math.atan2(this.y - foods[this.target].y, foods[this.target].x - this.x);
				var degrees = this.angle*(180/Math.PI);
				//The number returned represents the counterclockwise angle in radians 
				//(not degrees) between the positive X axis and the point (x, y).
				var move_x = Math.cos(this.angle) * distance;
				var move_y = -1 * (Math.sin(this.angle) * distance);

				if (!this.needs_turning){
					this.x += move_x;
					this.y += move_y;
				}
				//Recalculate in case of killedd bug fade out, since food could be eaten
				this.angle = Math.atan2(foods[this.target].y - this.y, foods[this.target].x - this.x); //For case of fade out
				//update central x, y position!
				//ON DRAW, we pyh=sically rotate the bug image
				this.oldTargetId = this.currentTargetId;
				
			}


		}

		return true;
	}
}


//Determines the X,Y coordinates of the mouse on the game canvas.
function doMouseDown(event){
	mouseX = event.pageX - document.getElementById("game").offsetLeft;
	mouseY = event.pageY - document.getElementById("game").offsetTop;
}

function clearMouse(){
	mouseX = canvas_height * 2;
	mouseY = canvas_height * 2;
}

/*
* Bug sub-objects constructors
*/
function blackBug(x, y, target, id){
  		color = "black"; //Alpha
  		speed1 = 150;
  		speed2 = 200;
  		score = 5;
  		Bug.call(this, x, y, id, target, color, speed1, speed2, score);
  	};

function redBug(x, y, target, id){
	color = "red";
	speed1 = 75;
	speed2 = 100;
	score = 3;
	Bug.call(this, x, y, id, target, color, speed1, speed2, score);
};

function orangeBug(x, y, target, id){
	color = "orange";
	speed1 = 60;
	speed2 = 80;
	score = 1;
	Bug.call(this, x, y, id, target, color, speed1, speed2, score);
};

function enterNewBug(){
 	timeUntilBugEnters = Math.random() * (2000) + 1000; //1000-3000 ms

 	var bug;
 	var bug_type = Math.random();
 	var x = padding + (Math.random() * (canvas_width - (2*padding))) + padding;
 	var y = padding;
 	if (bug_type < 0.3){
 		bug = new blackBug(x, y, -1, bugs.length);
 	} else if (bug_type < 0.6){
 		bug = new redBug(x, y, -1, bugs.length);
 	} else {
 		bug = new orangeBug(x, y, -1, bugs.length);
 	}

 	bugs.push(bug);
}

/*Gets index of closest food*/
function findClosestFood(x, y){
	var min_distance = Number.POSITIVE_INFINITY;
	var index;
	//find the closest food 
	for (var i = 0; i < foods.length; i++){
		var current = Math.pow(foods[i].x - x, 2) + Math.pow(foods[i].y - y, 2);
		if (current < min_distance){
			min_distance = current;
			index = i;
		}
	}
	return index;
}

/*
* Food constructor
*/
function food(x, y, id){
	this.x = x;
	this.y = y;
	this.id = id;
	this.draw = draw;
	
	function draw(ctx){
     	drawFood(ctx, x, y, food_radius);
	}
}

function initializeFood() {
	//initialize food positipn
	for (var i = 0; i < num_food; i++) {
		
		var y;
		var x; 
		
		//Makes sure food doesn't overlap!
		var food_overlap = true;	
		while(food_overlap == true){
			food_overlap = false;
			//Makes sure food isn't drawn beyond the canvas size, and plus between some padding	
			x = (Math.random() * (canvas_width - 2*padding - food_width)) + (padding) + food_width/2;
			y = (Math.random() * (canvas_height - (canvas_height*0.2) - (2 * padding) - food_height)) + (canvas_height*0.2) + padding + food_height/2;
			for (var j = 0; j < foods.length; j++){ //Check for all food!
				var dis_btw = Math.sqrt(Math.pow(foods[j].x - x, 2) + Math.pow(foods[j].y - y, 2));
				if (dis_btw < (3*food_radius)){
					food_overlap = true;
				}
			}
		}

		foods.push(new food(x, y, i));
	}
}



function bugArt(ctx, x, y, R, bugtype, transparency){

	var red = "rgba(255, 0, 0, " + transparency + ")";
	var orange = "rgba(255, 165, 0, " + transparency + ")";
	var black = "rgba(0, 0, 0, " + transparency + ")";
	var color;
	if (bugtype == "black"){
		color = black;
	} else if (bugtype == "red"){
		color = red;
	} else {
		color = orange;
	}

	ctx.beginPath();
	ctx.fillStyle=color;
	ctx.arc(x+R, y+R, R, 0, 2 * Math.PI);
	ctx.fill();
	ctx.beginPath();
	if (bugtype=="black"){
		ctx.fillStyle= red;
	}
	else {
		ctx.fillStyle=black; 
	}
	ctx.strokeStyle = black;

	ctx.moveTo(x+R/8*5, y+R/8*4);
	ctx.arc(x+R/8*5, y+R/8*4,R/8  , 0, 2 * Math.PI);

	ctx.moveTo(x+R/8*3, y+R );
	ctx.arc(x+R/8*3, y+R ,R/6  , 0, 2 * Math.PI);

	ctx.moveTo(x+R/8*6, y+R/8*6 +R/8 *6);
	ctx.arc(x+R/8*6, y+R/8*6 +R/8 *6 ,R/8  , 0, 2 * Math.PI);

	ctx.moveTo(x+R, y );
	ctx.lineTo(x+R, R + R/3);
	ctx.lineWidth = 2; 
	ctx.stroke(); 

	ctx.moveTo(x+R*2-R/8*5, y+R/8*4);
	ctx.arc(x+R*2-R/8*5, y+R/8*4,R/8  , 0, 2 * Math.PI);

	ctx.moveTo(x+R*2-R/8*3, y+R);
	ctx.arc(x+R*2-R/8*3, y+R ,R/6  , 0, 2 * Math.PI);

	ctx.moveTo(x+R*2-R/8*6, y+R/8*6 +R/8 *6);
	ctx.arc(x+R*2-R/8*6, y+R/8*6 +R/8 *6 ,R/8  , 0, 2 * Math.PI);
	ctx.fill();

	ctx.moveTo(x+R, y+R*1.9);
	ctx.arc(x+R, y+R*1.9, R/2.5, 0, Math.PI, false);

	ctx.fill();

	ctx.moveTo(x+R, y+R*1.9 + R/2 );
	ctx.arc(x+ R, y+R*1.9 + R/2 , R/2.5, 1 * Math.PI, 2 * Math.PI, false);

	ctx.lineWidth = 2;
	ctx.stroke();
}

function drawFood( ctx,c_x,c_y, R){  
	var x = c_x - R;
	var y = c_y - R;
	ctx.beginPath();
	ctx.arc(x +R +1 , y+2, R+2, .4, Math.PI , false);
	ctx.lineWidth = 3;
	ctx.strokeStyle = 'green';
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(x+R+3, y, R, .4, Math.PI , false);

	ctx.lineWidth = 5;
	ctx.fillStyle = 'red';
	ctx.fill();
	ctx.beginPath();
	ctx.arc(x+R+3, y, R, .4, Math.PI , false);
	ctx.fillStyle = 'red';
	ctx.fill();

	ctx.strokeStyle = 'pink';
	ctx.stroke(); 
}