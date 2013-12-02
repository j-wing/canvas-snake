/// <reference path="jquery.d.ts"/>
var DEFAULT_LENGTH = 5;
var DIRECTIONS = {
    "UP": 38,
    "DOWN": 40,
    "LEFT": 37,
    "RIGHT": 39
};
var OPPOSITES = {};
OPPOSITES[DIRECTIONS.UP] = DIRECTIONS.DOWN;
OPPOSITES[DIRECTIONS.DOWN] = DIRECTIONS.UP;
OPPOSITES[DIRECTIONS.LEFT] = DIRECTIONS.RIGHT;
OPPOSITES[DIRECTIONS.RIGHT] = DIRECTIONS.LEFT;

var PLAYING_WIDTH = window.screen.width;
var PLAYING_HEIGHT = window.screen.height;
var SNAKE_BLOCK_BASE = 10;
var SNAKE_BLOCK_SIDE = 12;
var DISABLED = false;
var MOVE_UNIT = 12;

function makeRange(begin, end) {
    if (end == undefined || end == null) {
        end = begin;
        begin = 0;
    }
    var res = new Array(end - begin);
    for (var i = begin; i < end; i++) {
        res.push(i);
    }
    return res;
}

var TurnList = (function () {
    function TurnList() {
        this.turns = {};
    }
    TurnList.prototype.addTurn = function (x, y, direction) {
        if (!this.turns[x]) {
            this.turns[x] = {};
        }
        console.log("adding turn at ", x, y);
        this.turns[x][y] = direction;
    };
    TurnList.prototype.dropTurn = function (x, y) {
        if (this.turns[x] && this.turns[x][y]) {
            delete this.turns[x][y];
        }
    };
    TurnList.prototype.turnForCoord = function (x, y) {
        if (this.turns[x] && this.turns[x][y]) {
            return this.turns[x][y];
        } else {
            return false;
        }
    };
    return TurnList;
})();

var SnakeComponent = (function () {
    function SnakeComponent(snake, pos, x, y, color) {
        this.snake = snake;
        this.pos = pos;
        this.x = x;
        this.y = y;
        this.color = color;
        this.direction = DIRECTIONS.RIGHT;
        this.context = this.snake.context;
        if (!this.color) {
            this.color = "white";
        }
    }
    SnakeComponent.prototype.setCoords = function (x, y) {
        this.x = x;
        this.y = y;
    };
    SnakeComponent.prototype.getCoords = function () {
        return { x: this.x, y: this.y };
    };
    SnakeComponent.prototype.willCollide = function () {
        var nextX = this.getNextX();
        var nextY = this.getNextY();
        if (nextX < 0 || nextX > PLAYING_WIDTH || nextY < 0 || nextY > PLAYING_HEIGHT) {
            return true;
        }
        var comp;

        for (var i = 0; i < this.snake.length; i++) {
            comp = this.snake.components[i];
            if (comp == this)
                continue;
            if (comp.x == nextX || comp.y == nextY) {
                return true;
            }
        }
        return false;
    };
    SnakeComponent.prototype.move = function () {
        var nextX, nextY;
        nextX = this.getNextX();
        nextY = this.getNextY();

        if (this.willCollide()) {
            return false;
        }
        this.setCoords(nextX, nextY);
        return true;
    };
    SnakeComponent.prototype.getNextX = function () {
        if (this.direction == DIRECTIONS.LEFT) {
            return this.x - MOVE_UNIT;
        } else if (this.direction == DIRECTIONS.RIGHT) {
            return this.x + MOVE_UNIT;
        } else {
            return this.x;
        }
    };
    SnakeComponent.prototype.getNextY = function () {
        if (this.direction == DIRECTIONS.UP) {
            return this.y - MOVE_UNIT;
        } else if (this.direction == DIRECTIONS.DOWN) {
            return this.y + MOVE_UNIT;
        } else {
            return this.y;
        }
    };
    SnakeComponent.prototype.render = function () {
        this.context.fillStyle = this.color;
        this.context.fillRect(this.x, this.y, SNAKE_BLOCK_BASE, SNAKE_BLOCK_BASE);
    };
    return SnakeComponent;
})();

var Snake = (function () {
    function Snake(context, isAI) {
        this.context = context;
        this.isAI = isAI;
        this.length = DEFAULT_LENGTH;
        if (!this.isAI) {
            this.x = 0;
            this.y = 0;
        }
        this.snakeWidth = this.calculateSnakeWidth();
        this.turns = new TurnList();

        this.components = [];
        for (var i = 0; i < this.length; i++) {
            this.components.push(new SnakeComponent(this, i, (this.length * SNAKE_BLOCK_SIDE) - i * SNAKE_BLOCK_SIDE, 0));
        }
        this.leadComponent = this.components[0];
        console.log(this);
    }
    Snake.prototype.calculateSnakeWidth = function () {
        return this.length * (SNAKE_BLOCK_SIDE);
    };
    Snake.prototype.render = function () {
        $.each(this.components, function (i, component) {
            component.render();
        });
    };
    Object.defineProperty(Snake.prototype, "direction", {
        set: function (dir) {
            if (dir == OPPOSITES[this.leadComponent.direction] || dir == this.leadComponent.direction) {
                return;
            }
            this.turns.addTurn(this.leadComponent.x, this.leadComponent.y, dir);
        },
        enumerable: true,
        configurable: true
    });

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
    Snake.prototype.move = function (coords) {
        var direction;
        var component;
        for (var i = 0; i < this.length; i++) {
            component = this.components[i];
            direction = this.turns.turnForCoord(component.x, component.y);
            if (direction) {
                component.direction = direction;
            }
            var moveSuccessful = component.move();
            if (!moveSuccessful) {
                return false;
            }
            if (i == 0) {
                this.turns.dropTurn(component.x, component.y);
            }
        }
        ;
        return true;
        // if (coords) {
        // 	this.x = coords.x;
        // 	this.y = coords.y;
        // }
        // else {
        // }
    };
    return Snake;
})();

var SnakeGame = (function () {
    function SnakeGame() {
        this.canvas = $("canvas")[0];
        this.context = this.canvas.getContext("2d");
        this.human = new Snake(this.context, false);
        this.players = [this.human];
        $(document.body).keydown(this.handleKeydown.bind(this));
        this.render();
    }
    SnakeGame.prototype.handleKeydown = function (e) {
        if (e.keyCode == 13) {
            DISABLED = !DISABLED;
            if (DISABLED == false) {
                window.requestAnimationFrame(this.render.bind(this));
            }
        } else if ([37, 38, 39, 40].indexOf(e.keyCode) != -1) {
            this.human.direction = (e.keyCode);
        }
    };
    SnakeGame.prototype.endGame = function (player) {
        DISABLED = true;
        $("#gameEnded-wrapper").show();
    };
    SnakeGame.prototype.render = function () {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.context.clearRect(0, 0, window.innerWidth, window.innerHeight);
        this.context.fillStyle = "black";
        this.context.fillRect(0, 0, window.innerWidth, window.innerHeight);

        for (var i in this.players) {
            if (!DISABLED) {
                var moveSuccessful = this.players[i].move();
                if (!moveSuccessful) {
                    this.endGame(this.players[i]);
                }
            }
            this.players[i].render();
        }

        if (!DISABLED) {
            window.setTimeout(function () {
                window.requestAnimationFrame(this.render.bind(this));
            }.bind(this), 200);
        }
    };
    return SnakeGame;
})();

$(document).ready(function () {
    window.game = new SnakeGame();
});
