/// <reference path="jquery.d.ts"/>

var DEFAULT_LENGTH:number = 5;
var DIRECTIONS:any = {
	"UP":38,
	"DOWN":40,
	"LEFT":37,
	"RIGHT":39
}
var OPPOSITES:any = {};
OPPOSITES[DIRECTIONS.UP] = DIRECTIONS.DOWN;
OPPOSITES[DIRECTIONS.DOWN] = DIRECTIONS.UP;
OPPOSITES[DIRECTIONS.LEFT] = DIRECTIONS.RIGHT;
OPPOSITES[DIRECTIONS.RIGHT] = DIRECTIONS.LEFT;

var PLAYING_WIDTH:number = window.screen.width;
var PLAYING_HEIGHT:number = window.screen.height;
var SNAKE_BLOCK_BASE:number = 10;
var SNAKE_BLOCK_SIDE:number = 12;
var DISABLED = false;
var MOVE_UNIT:number = 12;

interface Drawable {
	context:any;
	render:() => void;
}

interface CoordinatePair {
	x:number;
	y:number;
}

function makeRange(begin:number, end?:number) {
	if (end == undefined || end == null){
		end = begin;
		begin = 0;
	}
	var res = new Array(end-begin);
	for (var i=begin;i<end;i++) {
		res.push(i);
	}
	return res;
}


class TurnList {
	turns:any={};
	addTurn(x, y, direction) {
		if (!this.turns[x]) {
			this.turns[x] = {};
		}
		console.log("adding turn at ", x, y);
		this.turns[x][y] = direction;
	}
	dropTurn(x:number, y:number) {
		if (this.turns[x] && this.turns[x][y]) {
			delete this.turns[x][y];
		}
	}
	turnForCoord(x:number, y:number) {
		if (this.turns[x] && this.turns[x][y]) {
			return this.turns[x][y];
		}
		else {
			return false;
		}
	}

}

class SnakeComponent implements Drawable {
	direction:number=DIRECTIONS.RIGHT;
	context:any;
	constructor(public snake:Snake, public pos:number, public x:number, public y:number, public color?:string) {
		this.context = this.snake.context;
		if (!this.color) {
			this.color = "white";
		}
	}
	setCoords(x:number, y:number) {
		this.x = x;
		this.y = y;
	}
	getCoords() {
		return {x:this.x, y:this.y};
	}
	willCollide() {
		var nextX = this.getNextX();
		var nextY = this.getNextY();
		if (nextX < 0 || nextX > PLAYING_WIDTH || nextY < 0 || nextY > PLAYING_HEIGHT) {
			return true
		}
		var comp:SnakeComponent;

		for (var i=0;i<this.snake.length;i++) {
			comp = this.snake.components[i];
			if (comp == this) continue;
			if (comp.x == nextX || comp.y == nextY) {
				return true;
			}
		}
		return false;
	}
	move() {
		var nextX:number, nextY:number;
		nextX = this.getNextX();
		nextY = this.getNextY();
		
		if (this.willCollide()) {
			return false;
		}
		this.setCoords(nextX, nextY);
		return true;
	}
	getNextX() {
		if (this.direction == DIRECTIONS.LEFT) {
			return this.x - MOVE_UNIT;
		}
		else if (this.direction == DIRECTIONS.RIGHT) {
			return this.x + MOVE_UNIT;
		}
		else {
			return this.x;
		}
	}
	getNextY() {
		if (this.direction == DIRECTIONS.UP) {
			return this.y - MOVE_UNIT;
		}
		else if (this.direction == DIRECTIONS.DOWN) {
			return this.y + MOVE_UNIT;
		}
		else {
			return this.y;
		}

	}
	render() {
		this.context.fillStyle = this.color;
		this.context.fillRect(this.x, this.y, SNAKE_BLOCK_BASE, SNAKE_BLOCK_BASE);
	}
}

class Snake implements Drawable {
	length:number=DEFAULT_LENGTH;
	x:number;
	y:number;
	snakeWidth:number;
	components:Array<SnakeComponent>;
	turns:TurnList;
	leadComponent:SnakeComponent;
	constructor(public context:any, public isAI:boolean){
		if (!this.isAI) {
			this.x = 0;
			this.y = 0;
		}
		this.snakeWidth = this.calculateSnakeWidth();
		this.turns = new TurnList();
		
		this.components = [];
		for (var i=0;i<this.length;i++) {
			this.components.push(new SnakeComponent(this, i, (this.length*SNAKE_BLOCK_SIDE)-i*SNAKE_BLOCK_SIDE, 0));
		}
		this.leadComponent = this.components[0];
		console.log(this)
	}
	calculateSnakeWidth() {
		return this.length * (SNAKE_BLOCK_SIDE);
	}
	render() {
		$.each(this.components, function(i:number, component:SnakeComponent) {
			component.render();
		});
	}
	set direction(dir:number) {
		if (dir == OPPOSITES[this.leadComponent.direction] || dir == this.leadComponent.direction){
			return;
		}
		this.turns.addTurn(this.leadComponent.x, this.leadComponent.y, dir);
	}
	// willPassWall() {
	// 	if (this.direction == DIRECTIONS.UP && this.y+this.totalLength+SNAKE_BLOCK_SIDE < 0) {
	// 		return true;
	// 	}
	// 	else if (this.direction == DIRECTIONS.DOWN && this.y+this.totalLength+SNAKE_BLOCK_SIDE > window.innerHeight) {
	// 		return true;
	// 	}
	// 	else if (this.direction == DIRECTIONS.LEFT && this.x-SNAKE_BLOCK_SIDE < 0) {
	// 		return true;
	// 	}
	// 	else if (this.direction == DIRECTIONS.RIGHT && this.x+this.totalLength+SNAKE_BLOCK_SIDE > window.innerWidth) {
	// 		return true;
	// 	}
	// 	else {
	// 		return false;
	// 	}
	// }
	move(coords?:CoordinatePair) {
		var direction:number;
		var component:SnakeComponent;
		for (var i=0;i<this.length;i++) {
			component = this.components[i];
			direction = this.turns.turnForCoord(component.x, component.y);
			if (direction) {
				component.direction = direction;
			}
			var moveSuccessful:boolean = component.move();
			if (!moveSuccessful) {
				return false;
			}
			if (i == 0) {
				this.turns.dropTurn(component.x, component.y);
			}
		};
		return true;
		// if (coords) {
		// 	this.x = coords.x;
		// 	this.y = coords.y;
		// }
		// else {
		// }
	}
}

class SnakeGame {
	canvas:HTMLElement;
	context:any;
	human:Snake;
	players:Array<Snake>;
	constructor() {
		this.canvas = $("canvas")[0];
		this.context = this.canvas.getContext("2d");
		this.human = new Snake(this.context, false);
		this.players = [this.human];
		$(document.body).keydown(this.handleKeydown.bind(this));
		this.render();
	}
	handleKeydown(e:JQueryKeyEventObject) {
		if (e.keyCode == 13) {
			DISABLED = !DISABLED;
			if (DISABLED == false) {
				window.requestAnimationFrame(this.render.bind(this))
			}
		}
		else if ([37, 38, 39, 40].indexOf(e.keyCode) != -1){
			this.human.direction = (e.keyCode);
		}
	}
	endGame(player:Snake) {
		DISABLED = true;
		$("#gameEnded-wrapper").show();
	}
	render() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		this.context.clearRect(0, 0, window.innerWidth, window.innerHeight);
		this.context.fillStyle = "black";
		this.context.fillRect(0, 0, window.innerWidth, window.innerHeight);

		for (var i in this.players) {
			if (!DISABLED) {
				var moveSuccessful:boolean = this.players[i].move();
				if (!moveSuccessful) {
					this.endGame(this.players[i]);
				}
			}
			this.players[i].render();
		}

		if (!DISABLED) {
			window.setTimeout(function() {
				window.requestAnimationFrame(this.render.bind(this))
			}.bind(this), 200);
		}
	}
}

$(document).ready(function() {
	window.game = new SnakeGame();
})