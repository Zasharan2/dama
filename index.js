var c = document.getElementById("gameCanvas");
var ctx = c.getContext("2d");

var keys = [];

document.addEventListener("keydown", function (event) {
    keys[event.key] = true;
    if (["ArrowUp", "ArrowDown", "ArrowRight", "ArrowLeft", " ", "Tab"].indexOf(event.key) > -1) {
        event.preventDefault();
    }
});

document.addEventListener("keyup", function (event) {
    keys[event.key] = false;
});

var mouseX = 0;
var mouseY = 0;
var prevMouseX = 0;
var prevMouseY = 0;

c.addEventListener('contextmenu', function(event) {
    event.preventDefault();
});

window.addEventListener("mousemove", function(event) {
    mouseX = event.clientX - c.getBoundingClientRect().left;
    mouseY = event.clientY - c.getBoundingClientRect().top;
    if (!(mouseX > 0 && mouseY > 0 && mouseX < 512 && mouseY < 512)) {
        mouseDown = false;
        // mouseX = NaN;
        // mouseY = NaN;
    }
});

var mouseDown, mouseButton;

window.addEventListener("mousedown", function(event) {
    if (mouseX > 0 && mouseY > 0 && mouseX < 512 && mouseY < 512) {
        mouseDown = true;
        mouseButton = event.buttons;
    } else {
        mouseDown = false;
    }
});

window.addEventListener("mouseup", function(event) {
    mouseDown = false;
});

ctx.imageSmoothingEnabled = false;

const displayWidth = 512;
const displayHeight = 512;
const scale = 3;
c.style.width = displayWidth + 'px';
c.style.height = displayHeight + 'px';
c.width = displayWidth * scale;
c.height = displayHeight * scale;

function toggleTurnSwitch() {
    if (!firstTurnMove) {
        turn += 1;
        turn %= 2;
        if (turn == PIECECOLOR.RED) {
            c.style.borderColor = "#ff0000ff";
        } else if (turn == PIECECOLOR.BLUE) {
            c.style.borderColor = "#0000ffff";
        }
        firstMovedPiece = null;
        firstTurnMove = true;
        simpleMoveMade = false;
        startedJumping = false;
        movePath = [];
        renderFull();
    }
}

const PIECECOLOR = {
    RED: 0,
    BLUE: 1
};

const PIECETYPE = {
    PAWN: 0,
    KING: 1
};

var selectedPiece;

class Piece {
    constructor(x, y, col, type) {
        this.x = x;
        this.y = y;
        this.col = col;
        this.type = type;
        this.hovering = false;
        this.selected = false;
    }

    update() {
        if (turn != this.col) {
            this.hovering = false;
            this.selected = false;
        } else {
            if (!this.hovering && Math.sqrt(Math.pow(mouseX - ((this.x * 64) + 32), 2) + Math.pow(mouseY - ((this.y * 64) + 32), 2)) < 32) {
                this.hovering = true;
                renderFull();
            }
            if (!this.selected && mouseDown && Math.sqrt(Math.pow(mouseX - ((this.x * 64) + 32), 2) + Math.pow(mouseY - ((this.y * 64) + 32), 2)) < 32) {
                this.selected = true;
                highestEatenIndexList = findMostEaten();
                if (highestEatenIndexList.length == 0) {
                    if (!startedJumping) {
                        movePath = this.simpleMoves([]);
                    } else {
                        movePath = [];
                    }
                } else {
                    movePath = [];
                    for (var i = 0; i < highestEatenIndexList.length; i++) {
                        if (pieceList[highestEatenIndexList[i]] == this) {
                            movePath.push(highestEatenPathList[i]);
                        }
                    }
                }
                renderFull();
            }
            if (this.hovering && Math.sqrt(Math.pow(mouseX - ((this.x * 64) + 32), 2) + Math.pow(mouseY - ((this.y * 64) + 32), 2)) > 32) {
                this.hovering = false;
                renderFull();
            }
            if (this.selected && mouseDown && Math.sqrt(Math.pow(mouseX - ((this.x * 64) + 32), 2) + Math.pow(mouseY - ((this.y * 64) + 32), 2)) > 32) {
                this.selected = false;
                renderFull();
            }
        }
    }

    place() {
        positionArray[this.y][this.x] = this.col;
    }

    simpleMoves(pathList) {
        if (this.type == PIECETYPE.PAWN) {
            switch(this.col) {
                case PIECECOLOR.RED: {
                    // x+
                    if (positionArray[this.y][this.x + 1] == -1) {
                        pathList.push([this.x + 1, this.y, []]);
                    }
                    // x-
                    if (positionArray[this.y][this.x - 1] == -1) {
                        pathList.push([this.x - 1, this.y, []]);
                    }
                    // y-
                    if (positionArray[this.y - 1][this.x] == -1) {
                        pathList.push([this.x, this.y - 1, []]);
                    }
                    break;
                }
                case PIECECOLOR.BLUE: {
                    // x+
                    if (positionArray[this.y][this.x + 1] == -1) {
                        pathList.push([this.x + 1, this.y, []]);
                    }
                    // x-
                    if (positionArray[this.y][this.x - 1] == -1) {
                        pathList.push([this.x - 1, this.y, []]);
                    }
                    // y+
                    if (positionArray[this.y + 1][this.x] == -1) {
                        pathList.push([this.x, this.y + 1, []]);
                    }
                    break;
                }
            }
        } else if (this.type == PIECETYPE.KING) {
            // x+
            for (var i = 1; i < 8; i++) {
                if (this.x + i < 8 && positionArray[this.y][this.x + i] == -1) {
                    pathList.push([this.x + i, this.y, []]);
                } else {
                    break;
                }
            }
            // x-
            for (var i = 1; i < 8; i++) {
                if (this.x - i >= 0 && positionArray[this.y][this.x - i] == -1) {
                    pathList.push([this.x - i, this.y, []]);
                } else {
                    break;
                }
            }
            // y+
            for (var i = 1; i < 8; i++) {
                if (this.y + i < 8 && positionArray[this.y + i][this.x] == -1) {
                    pathList.push([this.x, this.y + i, []]);
                } else {
                    break;
                }
            }
            // y-
            for (var i = 1; i < 8; i++) {
                if (this.y - i >= 0 && positionArray[this.y - i][this.x] == -1) {
                    pathList.push([this.x, this.y - i, []]);
                } else {
                    break;
                }
            }
        }
        return pathList;
    }

    calculatePath() {
        var pathList = [];
        if (!startedJumping) {
            pathList = this.simpleMoves(pathList);
        }
        pathList = this.recurseJump(this.x, this.y, this.type, pathList, [0, 0], []);
        return pathList;
    }

    recurseJump(x, y, type, pathList, prevMove, eatList) {
        var typeSave = structuredClone(type);
        if ((this.col == PIECECOLOR.RED && y == 0) || (this.col == PIECECOLOR.BLUE && y == 7)) {
            type = PIECETYPE.KING;
        }
        if (type == PIECETYPE.PAWN) {
            switch (this.col) {
                case PIECECOLOR.RED: {
                    // x+
                    if (x < 6 && positionArray[y][x + 1] == PIECECOLOR.BLUE && positionArray[y][x + 2] == -1) {
                        if (!(prevMove[0] == -1 && prevMove[1] == 0)) {
                            // save
                            var positionArraySave = structuredClone(positionArray);
                            typeSave = structuredClone(type);

                            positionArray[y][x] = -1;
                            positionArray[y][x + 1] = -1;

                            eatList.push([x + 1, y]);
                            pathList.push([x + 2, y, structuredClone(eatList)]);
                            this.recurseJump(x + 2, y, type, pathList, [1, 0], structuredClone(eatList));
                            eatList.pop();

                            // load
                            positionArray = structuredClone(positionArraySave);
                            type = structuredClone(typeSave);
                        }
                    }
                    // x-
                    if (x > 1 && positionArray[y][x - 1] == PIECECOLOR.BLUE && positionArray[y][x - 2] == -1) {
                        if (!(prevMove[0] == 1 && prevMove[1] == 0)) {
                            // save
                            var positionArraySave = structuredClone(positionArray);
                            typeSave = structuredClone(type);

                            positionArray[y][x] = -1;
                            positionArray[y][x - 1] = -1;

                            eatList.push([x - 1, y]);
                            pathList.push([x - 2, y, structuredClone(eatList)]);
                            this.recurseJump(x - 2, y, type, pathList, [-1, 0], structuredClone(eatList));
                            eatList.pop();

                            // load
                            positionArray = structuredClone(positionArraySave);
                            type = structuredClone(typeSave);
                        }
                    }
                    // y-
                    if (y > 1 && positionArray[y - 1][x] == PIECECOLOR.BLUE && positionArray[y - 2][x] == -1) {
                        if (!(prevMove[0] == 0 && prevMove[1] == 1)) {
                            // save
                            var positionArraySave = structuredClone(positionArray);
                            typeSave = structuredClone(type);

                            positionArray[y][x] = -1;
                            positionArray[y - 1][x] = -1;

                            eatList.push([x, y - 1]);
                            pathList.push([x, y - 2, structuredClone(eatList)]);
                            this.recurseJump(x, y - 2, type, pathList, [0, -1], structuredClone(eatList));
                            eatList.pop();

                            // load
                            positionArray = structuredClone(positionArraySave);
                            type = structuredClone(typeSave);
                        }
                    }
                    break;
                }
                case PIECECOLOR.BLUE: {
                    // x+
                    if (x < 6 && positionArray[y][x + 1] == PIECECOLOR.RED && positionArray[y][x + 2] == -1) {
                        if (!(prevMove[0] == -1 && prevMove[1] == 0)) {
                            // save
                            var positionArraySave = structuredClone(positionArray);
                            typeSave = structuredClone(type);

                            positionArray[y][x] = -1;
                            positionArray[y][x + 1] = -1;

                            eatList.push([x + 1, y]);
                            pathList.push([x + 2, y, structuredClone(eatList)]);
                            this.recurseJump(x + 2, y, type, pathList, [1, 0], structuredClone(eatList));
                            eatList.pop();

                            // load
                            positionArray = structuredClone(positionArraySave);
                            type = structuredClone(typeSave);
                        }
                    }
                    // x-
                    if (x > 1 && positionArray[y][x - 1] == PIECECOLOR.RED && positionArray[y][x - 2] == -1) {
                        if (!(prevMove[0] == 1 && prevMove[1] == 0)) {
                            // save
                            var positionArraySave = structuredClone(positionArray);
                            typeSave = structuredClone(type);

                            positionArray[y][x] = -1;
                            positionArray[y][x - 1] = -1;

                            eatList.push([x - 1, y]);
                            pathList.push([x - 2, y, structuredClone(eatList)]);
                            this.recurseJump(x - 2, y, type, pathList, [-1, 0], structuredClone(eatList));
                            eatList.pop();

                            // load
                            positionArray = structuredClone(positionArraySave);
                            type = structuredClone(typeSave);
                        }
                    }
                    // y+
                    if (y < 6 && positionArray[y + 1][x] == PIECECOLOR.RED && positionArray[y + 2][x] == -1) {
                        if (!(prevMove[0] == 0 && prevMove[1] == -1)) {
                            // save
                            var positionArraySave = structuredClone(positionArray);
                            typeSave = structuredClone(type);

                            positionArray[y][x] = -1;
                            positionArray[y + 1][x] = -1;

                            eatList.push([x, y + 1])
                            pathList.push([x, y + 2, structuredClone(eatList)]);
                            this.recurseJump(x, y + 2, type, pathList, [0, 1], structuredClone(eatList));
                            eatList.pop();

                            // load
                            positionArray = structuredClone(positionArraySave);
                            type = structuredClone(typeSave);
                        }
                    }
                    break;
                }
            }
        } else if (type == PIECETYPE.KING) {
            // x+
            for (var i = 1; i < 8; i++) {
                if (x + i < 8 && positionArray[y][x + i] == ((this.col + 1) % 2)) {
                    for (var j = i + 1; j < 8; j++) {
                        if (x + j < 8 && positionArray[y][x + j] == -1) {
                            if (!(prevMove[0] == -1 && prevMove[1] == 0)) {
                                // save
                                var positionArraySave = structuredClone(positionArray);
                                typeSave = structuredClone(type);

                                positionArray[y][x] = -1;
                                positionArray[y][x + i] = -1;

                                eatList.push([x + i, y]);
                                pathList.push([x + j, y, structuredClone(eatList)]);
                                this.recurseJump(x + j, y, type, pathList, [1, 0], structuredClone(eatList));
                                eatList.pop();

                                // load
                                positionArray = structuredClone(positionArraySave);
                                type = structuredClone(typeSave);
                            }
                        } else if (x + j < 8 && positionArray[y][x + j] != -1) {
                            break;
                        }
                    }
                    break;
                } else if (x + i < 8 && positionArray[y][x + i] == this.col) {
                    break;
                }
            }
            // x-
            for (var i = 1; i < 8; i++) {
                if (x - i >= 0 && positionArray[y][x - i] == ((this.col + 1) % 2)) {
                    for (var j = i + 1; j < 8; j++) {
                        if (x - j >= 0 && positionArray[y][x - j] == -1) {
                            if (!(prevMove[0] == 1 && prevMove[1] == 0)) {
                                // save
                                var positionArraySave = structuredClone(positionArray);
                                typeSave = structuredClone(type);

                                positionArray[y][x] = -1;
                                positionArray[y][x - i] = -1;

                                eatList.push([x - i, y]);
                                pathList.push([x - j, y, structuredClone(eatList)]);
                                this.recurseJump(x - j, y, type, pathList, [-1, 0], structuredClone(eatList));
                                eatList.pop();

                                // load
                                positionArray = structuredClone(positionArraySave);
                                type = structuredClone(typeSave);
                            }
                        } else if (x - j >= 0 && positionArray[y][x - j] != -1) {
                            break;
                        }
                    }
                    break;
                } else if (x - i >= 0 && positionArray[y][x - i] == this.col) {
                    break;
                }
            }
            // y+
            for (var i = 1; i < 8; i++) {
                if (y + i < 8 && positionArray[y + i][x] == ((this.col + 1) % 2)) {
                    for (var j = i + 1; j < 8; j++) {
                        if (y + j < 8 && positionArray[y + j][x] == -1) {
                            if (!(prevMove[0] == 0 && prevMove[1] == -1)) {
                                // save
                                var positionArraySave = structuredClone(positionArray);
                                typeSave = structuredClone(type);

                                positionArray[y][x] = -1;
                                positionArray[y + i][x] = -1;

                                eatList.push([x, y + i]);
                                pathList.push([x, y + j, structuredClone(eatList)]);
                                this.recurseJump(x, y + j, type, pathList, [0, 1], structuredClone(eatList));
                                eatList.pop();

                                // load
                                positionArray = structuredClone(positionArraySave);
                                type = structuredClone(typeSave);
                            }
                        } else if (y + j < 8 && positionArray[y + j][x] != -1) {
                            break;
                        }
                    }
                    break;
                } else if (y + i < 8 && positionArray[y + i][x] == this.col) {
                    break;
                }
            }
            // y-
            for (var i = 1; i < 8; i++) {
                if (y - i >= 0 && positionArray[y - i][x] == ((this.col + 1) % 2)) {
                    for (var j = i + 1; j < 8; j++) {
                        if (y - j >= 0 && positionArray[y - j][x] == -1) {
                            if (!(prevMove[0] == 0 && prevMove[1] == 1)) {
                                // save
                                var positionArraySave = structuredClone(positionArray);
                                typeSave = structuredClone(type);

                                positionArray[y][x] = -1;
                                positionArray[y - i][x] = -1;

                                eatList.push([x, y - i]);
                                pathList.push([x, y - j, structuredClone(eatList)]);
                                this.recurseJump(x, y - j, type, pathList, [0, -1], structuredClone(eatList));
                                eatList.pop();

                                // load
                                positionArray = structuredClone(positionArraySave);
                                type = structuredClone(typeSave);
                            }
                        } else if (y - j >= 0 && positionArray[y - j][x] != -1) {
                            break;
                        }
                    }
                    break;
                } else if (y - i >= 0 && positionArray[y - i][x] == ((this.col + 1) % 2)) {
                    break;
                }
            }
        }
        type = structuredClone(typeSave);
        return pathList;
    }

    promote() {
        this.type = PIECETYPE.KING;
    }

    render() {
        ctx.beginPath();
        if (this.hovering) {
            if (this.col == PIECECOLOR.RED) {
                ctx.fillStyle = "#0000ffff";
            } else {
                ctx.fillStyle = "#ff0000ff";
            }
            ctx.arc(scale * ((this.x * 64) + 32), scale * ((this.y * 64) + 32), scale * 32, 0, 2*Math.PI, false);
            ctx.fill();
        }
        if (this.selected) {
            ctx.fillStyle = "#00ff00ff";
            ctx.arc(scale * ((this.x * 64) + 32), scale * ((this.y * 64) + 32), scale * 32, 0, 2*Math.PI, false);
            ctx.fill();
        }

        ctx.beginPath();
        switch(this.col) {
            case PIECECOLOR.RED: {
                ctx.fillStyle = "#ff0000ff";
                break;
            }
            case PIECECOLOR.BLUE: {
                ctx.fillStyle = "#0000ffff";
                break;
            }
            default: {
                break;
            }
        }
        ctx.arc(scale * ((this.x * 64) + 32), scale * ((this.y * 64) + 32), scale * 28, 0, 2*Math.PI, false);
        ctx.fill();

        if (this.type == PIECETYPE.KING) {
            ctx.beginPath();
            ctx.fillStyle = "#ffff00ff";
            ctx.arc(scale * ((this.x * 64) + 32), scale * ((this.y * 64) + 32), scale * 8, 0, 2*Math.PI, false);
            ctx.fill();
        }
    }
}

function checkForcedJump() {
    for (var i = 0; i < pieceList.length; i++) {
        if (pieceList[i].col == turn) {

        }
    }
}

var highestEaten;
var highestEatenIndexList;
var highestEatenPathList;
function findMostEaten() {
    highestEaten = 0;
    highestEatenIndexList = [];
    highestEatenPathList = [];
    for (var i = 0; i < pieceList.length; i++) {
        if (pieceList[i].col == turn && (firstMovedPiece == null || firstMovedPiece == pieceList[i])) {
            var paths = pieceList[i].calculatePath();
            for (var j = 0; j < paths.length; j++) {
                if (paths[j][2].length > highestEaten) {
                    highestEaten = paths[j][2].length;
                    highestEatenIndexList = [];
                    highestEatenIndexList.push(i);
                    highestEatenPathList = [];
                    highestEatenPathList.push(paths[j]);
                } else if (paths[j][2].length == highestEaten && highestEaten != 0) {
                    highestEatenIndexList.push(i);
                    highestEatenPathList.push(paths[j]);
                }
            }
        }
    }
    return highestEatenIndexList;
}

var pieceList = [];
var positionArray = [[-1, -1, -1, -1, -1, -1, -1, -1], [-1, -1, -1, -1, -1, -1, -1, -1], [-1, -1, -1, -1, -1, -1, -1, -1], [-1, -1, -1, -1, -1, -1, -1, -1], [-1, -1, -1, -1, -1, -1, -1, -1], [-1, -1, -1, -1, -1, -1, -1, -1], [-1, -1, -1, -1, -1, -1, -1, -1], [-1, -1, -1, -1, -1, -1, -1, -1]];

var movePath = [];

function addPiece(x, y, col, type) {
    var p = new Piece(x, y, col, type);
    pieceList.push(p);
    p.place();
}

function initBoard() {
    for (var i = 0; i < 8; i++) {
        for (var j = 1; j < 3; j++) {
            addPiece(i, j, PIECECOLOR.BLUE, PIECETYPE.PAWN);
            addPiece(i, 7 - j, PIECECOLOR.RED, PIECETYPE.PAWN);
        }
    }
}

var turn = PIECECOLOR.RED;
var firstTurnMove = true;
var simpleMoveMade = false;
var firstMovedPiece;
var startedJumping = false;

function main() {
    updateFull();
}

function updateFull() {
    if (Math.floor(prevMouseX / 64) != Math.floor(mouseX / 64) || Math.floor(prevMouseY / 64) != Math.floor(mouseY / 64)) {
        prevMouseX = mouseX;
        prevMouseY = mouseY;
        renderFull();
    }

    if (findMostEaten().length == 0 && startedJumping) {
        toggleTurnSwitch();
    }

    // capturing
    var endTurn = false;
    for (var i = 0; i < movePath.length; i++) {
        if (Math.floor(mouseX / 64) == movePath[i][0] && Math.floor(mouseY / 64) == movePath[i][1]) {
            if (mouseDown) {
                firstTurnMove = false;
                for (var j = 0; j < pieceList.length; j++) {
                    if (pieceList[j].selected && (firstMovedPiece == null || firstMovedPiece == pieceList[j])) {
                        if (movePath[i][2].length > 0) {
                            startedJumping = true;
                        }
                        
                        firstMovedPiece = pieceList[j];

                        positionArray[pieceList[j].y][pieceList[j].x] = -1;

                        pieceList[j].x = movePath[i][0];
                        pieceList[j].y = movePath[i][1];

                        pieceList[j].place();

                        pieceList[j].selected = false;
                        mouseDown = false;

                        if ((pieceList[j].y == 0 && pieceList[j].col == PIECECOLOR.RED) || (pieceList[j].y == 7 && pieceList[j].col == PIECECOLOR.BLUE)) {
                            pieceList[j].promote();
                        }

                        if (movePath[i][2].length == 0) {
                            endTurn = true;
                        }
                    }
                    for (var k = 0; k < movePath[i][2].length; k++) {
                        if (movePath[i][2][k].length > 0) {
                            if (pieceList[j].x == movePath[i][2][k][0] && pieceList[j].y == movePath[i][2][k][1]) {
                                positionArray[pieceList[j].y][pieceList[j].x] = -1;
                                pieceList.splice(j, 1);
                                j--;
                                break;
                            }
                        }
                    }
                }
                renderFull();
                movePath = [];
                break;
            }
        }
    }
    if (endTurn) {
        toggleTurnSwitch();
    }

    for (var i = 0; i < pieceList.length; i++) {
        pieceList[i].update();
    }
    var checkSelect = false;
    for (var i = 0; i < pieceList.length; i++) {
        if (pieceList[i].selected) {
            checkSelect = true;
            selectedPiece = pieceList[i];
        }
    }
    if (!checkSelect) {
        selectedPiece = null;
        movePath = [];
        renderFull();
    }
}

function renderFull() {
    renderBackground();

    renderHover();

    for (var i = 0; i < pieceList.length; i++) {
        pieceList[i].render(false);
    }

    renderPath();
}

function renderHover() {
    ctx.beginPath();
    ctx.fillStyle = "#00ff0040";
    ctx.fillRect(scale * Math.floor(mouseX / 64) * 64, scale * Math.floor(mouseY / 64) * 64, scale * 64, scale * 64);
}

function renderPath() {
    for (var i = 0; i < movePath.length; i++) {
        ctx.beginPath();
        ctx.fillStyle = "#00ff0080";
        ctx.fillRect(scale * movePath[i][0] * 64, scale * movePath[i][1] * 64, scale * 64, scale * 64);
    }
}

function renderBackground() {
    // background
    ctx.fillStyle = "#ffffffff";
    ctx.fillRect(0, 0, scale * 512, scale * 512);
    // tiles
    ctx.fillStyle = "#000000ff";
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            if ((i + j) % 2 == 0) {
                ctx.fillRect(scale * 64*i, scale * 64*j, scale * 64, scale * 64);
            }
        }
    }
}

var deltaTime = 0;
var deltaCorrect = (1 / 8);
var prevTime = Date.now();
function loop() {
    deltaTime = (Date.now() - prevTime) * deltaCorrect;
    prevTime = Date.now();

    main();
    window.requestAnimationFrame(loop);
}

function init() {
    initBoard();
    renderFull();
    window.requestAnimationFrame(loop)
}
window.requestAnimationFrame(init);