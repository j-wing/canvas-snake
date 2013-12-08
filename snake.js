/// <reference path="jquery.d.ts"/>
/// <reference path="underscore.d.ts"/>
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

var VERTICALS = [DIRECTIONS.UP, DIRECTIONS.DOWN];
var HORIZONTALS = [DIRECTIONS.LEFT, DIRECTIONS.RIGHT];
var PLAYING_WIDTH = window.innerWidth;
var PLAYING_HEIGHT = window.innerHeight - 50;
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
    function SnakeComponent(snake, pos, x, y, color, direction) {
        this.snake = snake;
        this.pos = pos;
        this.x = x;
        this.y = y;
        this.color = color;
        this.direction = DIRECTIONS.RIGHT;
        this.context = this.snake.context;
        if (direction != null) {
            this.direction = direction;
        }
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
            window.game.log("Snake exceeded playing area");
            return true;
        }
        var comp;

        for (var i = 0; i < this.snake.length; i++) {
            comp = this.snake.components[i];
            if (comp == this)
                continue;
            if (_.isEqual(comp.getNextCoords(), this.getNextCoords())) {
                console.log("Collision between snake components: ", this, comp);
                return true;
            }
        }
        return false;
    };
    SnakeComponent.prototype.willGetFood = function () {
        var f;
        for (var i in window.game.foods) {
            f = window.game.foods[i];
            if (f.x == this.getNextX() && f.y == this.getNextY()) {
                return f;
            }
        }
        return null;
    };
    SnakeComponent.prototype.move = function () {
        var nextX, nextY;
        nextX = this.getNextX();
        nextY = this.getNextY();

        if (this.willCollide()) {
            return false;
        }
        var f = this.willGetFood();
        if (f) {
            this.snake.eatFood(f);
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
    SnakeComponent.prototype.getNextCoords = function () {
        var nextX, nextY;
        nextX = this.getNextX();
        nextY = this.getNextY();

        // 	var d = this.snake.turns.turnForCoord(nextX, nextY);
        // 	if (d) {
        // 		console.log("there's a d", d)
        // 		var old = this.direction;
        // 		this.direction = d;
        // 		nextX = this.getNextX();
        // 		nextY = this.getNextY();
        // 		this.direction = old;
        // 	}
        return [nextX, nextY];
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
            this.createComponent(i);
        }
        this.leadComponent = this.components[0];
    }
    Snake.prototype.createComponent = function (pos) {
        this.addComponent(new SnakeComponent(this, pos, (this.length * SNAKE_BLOCK_SIDE) - pos * SNAKE_BLOCK_SIDE, 0));
    };
    Snake.prototype.addComponent = function (component) {
        this.components.push(component);
    };
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
    Snake.prototype.move = function (coords) {
        var direction;
        var component;
        var coords = [];
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
    };
    Snake.prototype.eatFood = function (food) {
        window.game.foods.splice(window.game.foods.indexOf(food), 1);
        var last = this.components[this.length - 1];
        var x, y;

        switch (last.direction) {
            case DIRECTIONS.UP:
                x = last.x;
                y = last.y + SNAKE_BLOCK_SIDE;
                break;
            case DIRECTIONS.DOWN:
                x = last.x;
                y = last.y - SNAKE_BLOCK_SIDE;
                break;
            case DIRECTIONS.LEFT:
                x = last.x + SNAKE_BLOCK_SIDE;
                y = last.y;
                break;
            case DIRECTIONS.RIGHT:
                x = last.x - SNAKE_BLOCK_SIDE;
                y = last.y;
                break;
        }

        this.addComponent(new SnakeComponent(this, this.length, x, y, "white", last.direction));
        this.length += 1;
        window.game.incrementScore();
    };
    return Snake;
})();

var Food = (function () {
    function Food(context) {
        this.context = context;
        this.x = SNAKE_BLOCK_SIDE * _.random((PLAYING_WIDTH - SNAKE_BLOCK_SIDE) / SNAKE_BLOCK_SIDE);
        this.y = SNAKE_BLOCK_SIDE * _.random((PLAYING_HEIGHT - SNAKE_BLOCK_SIDE * 2) / SNAKE_BLOCK_SIDE);
    }
    Food.prototype.render = function () {
        this.context.fillStyle = "#FFFFFF";
        this.context.beginPath();
        this.context.moveTo(this.x, this.y);
        this.context.lineTo(this.x + MOVE_UNIT, this.y);
        this.context.lineTo(this.x + (MOVE_UNIT / 2), this.y + MOVE_UNIT);
        this.context.fill();
    };
    return Food;
})();

var SnakeGame = (function () {
    function SnakeGame() {
        this.score = 0;
        this.canvas = $("canvas")[0];
        this.context = this.canvas.getContext("2d");
        this.human = new Snake(this.context, false);
        this.players = [this.human];
        $(document.body).keydown(this.handleKeydown.bind(this));

        this.foods = [];
        this.setFoodInterval();
        this.loadDifficulty();
        $("#difficulty").click(this.handleDifficultyClick.bind(this));

        window.setTimeout(this.render.bind(this), 1);
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
    SnakeGame.prototype.handleDifficultyClick = function (e) {
        if (this.difficulty >= 10) {
            this.difficulty = 1;
        } else {
            this.difficulty += 1;
        }
        window.localStorage['difficulty'] = this.difficulty;
        this._updateDifficultyText();
    };
    SnakeGame.prototype._updateDifficultyText = function () {
        $("#difficulty-value").text(this.difficulty);
    };
    SnakeGame.prototype.loadDifficulty = function () {
        if (window.localStorage['difficulty']) {
            this.difficulty = window.parseInt(window.localStorage['difficulty']);
        } else {
            this.difficulty = 1;
        }
        this._updateDifficultyText();
    };
    SnakeGame.prototype.incrementScore = function (amount, multiplyByDifficulty) {
        if (typeof multiplyByDifficulty === "undefined") { multiplyByDifficulty = true; }
        if (amount == null) {
            amount = 1;
        }
        if (multiplyByDifficulty) {
            amount = amount * this.difficulty;
        }
        this.score += amount;
        window.localStorage['lastScore'] = this.score;
        $("#score-value").text(this.score);
    };
    SnakeGame.prototype.endGame = function (player) {
        DISABLED = true;
        $("#gameEnded-wrapper").show();
    };
    SnakeGame.prototype.setFoodInterval = function () {
        window.setTimeout(this.createFood.bind(this), 500 * _.random(1, 10));
    };
    SnakeGame.prototype.createFood = function () {
        this.foods.push(new Food(this.context));
        this.setFoodInterval();
    };
    SnakeGame.prototype.render = function () {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.context.clearRect(0, 0, window.innerWidth, window.innerHeight);
        this.context.fillStyle = "black";
        this.context.fillRect(0, 0, window.innerWidth, window.innerHeight);
        this.context.strokeStyle = "white";

        // lower boundary
        this.context.beginPath();
        this.context.moveTo(0, PLAYING_HEIGHT);
        this.context.lineTo(PLAYING_WIDTH, PLAYING_HEIGHT);
        this.context.stroke();
        this.context.closePath();

        for (var i in this.players) {
            if (!DISABLED) {
                var moveSuccessful = this.players[i].move();
                if (!moveSuccessful) {
                    this.endGame(this.players[i]);
                }
            }
            this.players[i].render();
        }

        for (var i in this.foods) {
            this.foods[i].render();
        }

        if (!DISABLED) {
            window.setTimeout(function () {
                window.requestAnimationFrame(this.render.bind(this));
            }.bind(this), 1000 / (3 + (this.difficulty * 2)));
        }
    };
    SnakeGame.prototype.log = function (txt) {
        console.log("LOG: ", txt);
    };
    return SnakeGame;
})();

$(document).ready(function () {
    window.game = new SnakeGame();
});
