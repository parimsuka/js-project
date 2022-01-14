//State space
const bend = 'data/images/bend.jpg'
const straight = 'data/images/straight.jpg'
const t_shape = 'data/images/t_shape.jpg'

const ROOM_SIZE = 50

let pre_board = [] 
pre_board.push (...[...Array(13).keys()].map (elem => ({img : straight, rotation : 0})))
pre_board.push (...[...Array(15).keys()].map (elem => ({img : bend, rotation : 0})))
pre_board.push (...[...Array(6).keys()].map (elem => ({img : t_shape, rotation : 0})))
shuffle(pre_board)
shuffleRotations (pre_board)

let board = [
    [{img : bend, rotation : 0}, pre_board.pop(), {img : t_shape, rotation : 0}, pre_board.pop(), {img : t_shape, rotation : 0}, pre_board.pop(), {img : bend, rotation : 90}],
    
    [pre_board.pop(), pre_board.pop(), pre_board.pop(), pre_board.pop(), pre_board.pop(), pre_board.pop(), pre_board.pop()],
    
    [{img : t_shape, rotation : 270}, pre_board.pop(), {img : t_shape, rotation : 270}, pre_board.pop(), {img : t_shape, rotation : 0}, pre_board.pop(), {img : t_shape, rotation : 90}],
    
    [pre_board.pop(), pre_board.pop(), pre_board.pop(), pre_board.pop(), pre_board.pop(), pre_board.pop(), pre_board.pop()],
    
    [{img : t_shape, rotation : 270}, pre_board.pop(), {img : t_shape, rotation : 180}, pre_board.pop(), {img : t_shape, rotation : 90}, pre_board.pop(), {img : t_shape, rotation : 90}],
    
    [pre_board.pop(), pre_board.pop(), pre_board.pop(), pre_board.pop(), pre_board.pop(), pre_board.pop(), pre_board.pop()],
    
    [{img : bend, rotation : 270}, pre_board.pop(), {img : t_shape, rotation : 180}, pre_board.pop(), {img : t_shape, rotation : 180}, pre_board.pop(), {img : bend, rotation : 180}]
]

let extraRoom = [pre_board.pop (), {x : 100, y : 300}]

const arrows = []
let redArrow = {x : 50, y : 50*6, rotation : 0}
fillArrows ()

console.log (board)

let players = []

let currentPlayerTurn = 0
let playerHasToMoveExtraRoom = true

let possiblePaths = []


//Element selectors
const startScreen = document.querySelector('#start-screen');
const numberOfPlayers = document.querySelector('#nr-players');
const numberOfCards = document.querySelector('#nr-cards');
const startButton = document.querySelector('#start');
const instructionsButton = document.querySelector('#instructions');
const resetButton = document.querySelector('#reset-button');
const instructionsScreen = document.querySelector('#instructions-screen');
const saveButton = document.querySelector('#save-button');
const loadButton = document.querySelector('#load-button');

const boardScreen = document.querySelector('#board-screen');
const canvas = document.querySelector('#canvas-board')
const canvasBoard = canvas.getContext('2d');

const playerInformation = document.querySelector('#player-information');

//On Start
changeNrCards()


//Event listeners
window.onload = function() {
    if (localStorage.getObj('board') != null) {
        loadButton.style.display = "inline"
    } else {
        loadButton.style.display = "none"
    }
};

numberOfPlayers.addEventListener ('input', changeNrCards)
function changeNrCards (e) {
    const nrPlayers = numberOfPlayers.value

    const inHTML = [...Array(24/nrPlayers).keys()].map(nr => `<option value="${nr+1}">${nr+1}</option>`)
    numberOfCards.innerHTML = inHTML.join('')
}

startButton.addEventListener ('click', startClick)
function startClick (e) {
    const nrTreasures = numberOfCards.value
    const nrPlayers = numberOfPlayers.value
    startScreen.style.display = "none"
    boardScreen.style.display = "block"
    resetButton.style.display = "inline"
    saveButton.style.display = "inline"
    
    fillTreasures (nrPlayers, nrTreasures)
    refresh ()
    
}

instructionsButton.addEventListener ('click', instructionsClick)
function instructionsClick (e) {
    if (instructionsScreen.style.display === "none") {
        instructionsScreen.style.display = "block";
    } else {
        instructionsScreen.style.display = "none";
    }
}

document.addEventListener ('keydown', onKeyPress)
function onKeyPress (e) {
    const name = e.key;
    e.preventDefault ()

    switch (name) {
        case 'ArrowUp':
            moveExtraRoom (0, -50)
        break;
        case 'ArrowRight':
            moveExtraRoom (50, 0)
        break;
        case 'ArrowDown':
            moveExtraRoom (0, 50)
        break;
        case 'ArrowLeft':
            moveExtraRoom (-50, 0)
        break;
    }
}

document.addEventListener ('mousemove', onArrowHover)
function onArrowHover (e) {
    const x = e.offsetX
    const y = e.offsetY

    if (playerHasToMoveExtraRoom) {
        if (x >= redArrow.x && y >= redArrow.y && x <= redArrow.x + 50 && y <= redArrow.y + 50) {
            document.body.style.cursor = 'pointer'
        } else {
            document.body.style.cursor = 'initial'
        }
    } else {
        if (x >= 150 && y >= 150 && x <= 500 && y <= 500) {
            if (checkInsidePossiblePaths ({x : x, y : y})) {
                document.body.style.cursor = 'pointer'
            } else {
                document.body.style.cursor = 'initial'
            }
        }
        else {
            document.body.style.cursor = 'initial'
        }
    }
}

document.addEventListener ('click', documentclick)
function documentclick (e) {
    const x = e.offsetX
    const y = e.offsetY

    if (playerHasToMoveExtraRoom) {
        if (x >= extraRoom[1].x && y >= extraRoom[1].y && x <= extraRoom[1].x+50 && y <= extraRoom[1].y+50) {
            extraRoom[0].rotation = (extraRoom[0].rotation + 90) % 360
            drawExtraRoom()
        }
        else if (x >= redArrow.x && y >= redArrow.y && x <= redArrow.x + 50 && y <= redArrow.y + 50) {
            playerHasToMoveExtraRoom = false
            addExtraRoom ()
            refresh ()
            delay(100).then(() => highlightAllPaths ());
        }
    } else {
        if (document.body.style.cursor == 'pointer') {
            let x1 = Math.floor (x / 50) - 3
            let y1 = Math.floor (y / 50) - 3
            players[currentPlayerTurn].location = {x : y1, y : x1}
            if (playerFoundTreasure ({x : x1, y : y1})) {
                if (players[currentPlayerTurn].treasures.length > 1) {
                    players[currentPlayerTurn].treasures.pop ()
                } else {
                    //Player Won
                    alert(`Player number ${currentPlayerTurn+1} won the game`);
                    location.reload ()
                }
            } 

            currentPlayerTurn = (currentPlayerTurn + 1) % players.length
            playerHasToMoveExtraRoom = true
            
            refresh ()
        }
    }
}

resetButton.addEventListener ('click', resetGame)
function resetGame (e) {
    location.reload ()
}

saveButton.addEventListener ('click', saveGame)
function saveGame (e) {
    //board, extraRoom, redArrow, players, currentPlayerTurn, playerHasToMoveExtraRoom
    localStorage.setObj('board', board)
    localStorage.setObj('extraRoom', extraRoom)
    localStorage.setObj('redArrow', redArrow)
    localStorage.setObj('players', players)
    localStorage.setObj('currentPlayerTurn', currentPlayerTurn)
    localStorage.setObj('playerHasToMoveExtraRoom', playerHasToMoveExtraRoom)
}

loadButton.addEventListener ('click', loadGame)
function loadGame (e) {
    board = localStorage.getObj('board')
    extraRoom = localStorage.getObj('extraRoom')
    redArrow = localStorage.getObj('redArrow')
    players = localStorage.getObj('players')
    currentPlayerTurn = localStorage.getObj('currentPlayerTurn')
    playerHasToMoveExtraRoom = localStorage.getObj('playerHasToMoveExtraRoom')

    startScreen.style.display = "none"
    boardScreen.style.display = "block"
    resetButton.style.display = "inline"
    saveButton.style.display = "inline"

    refresh ()
}


//Functions
Storage.prototype.setObj = function(key, obj) {
    return this.setItem(key, JSON.stringify(obj))
}

Storage.prototype.getObj = function(key) {
    return JSON.parse(this.getItem(key))
}

function shuffle (array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function shuffleRotations (array) {
    array.map (elem =>
            {
                const rot = Math.floor(Math.random () * 4)
                elem.rotation = 90 * rot
            }
        )
}

function refresh () {
        drawImages ()
        drawArrows ()
        changeArrowColor ()      
        delay(100).then(() => drawTreasures ());
        delay(100).then(() => drawPlayers ());
        showPlayerInfo ()
}

function drawImages () {
    //Creating canvas board
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            const elem = board [i][j]
            const img = new Image();
            let x = (j+4)*50-50
            let y = (i+3)*50
            
            img.onload = function() {
                rotateAndDrawImage (img, x, y, ROOM_SIZE, elem.rotation)
            };
            img.src = elem.img
        }
    }

    canvasBoard.lineWidth = 50
    //Moving extra box rectangle
    canvasBoard.strokeStyle = "#99ccff";
    canvasBoard.strokeRect(125, 125, 400, 400);

    //Arrows rectangle
    canvasBoard.strokeStyle = "#3A089E";
    canvasBoard.strokeRect(75, 75, 500, 500);

    drawExtraRoom()
}

function rotateAndDrawImage (img, x, y, size, degree) {
    canvasBoard.translate (x + size / 2, y + size / 2)
    canvasBoard.rotate (Math.PI * degree / 180)
    canvasBoard.drawImage(img, - size / 2, - size / 2, size, size)
    canvasBoard.rotate (-Math.PI * degree / 180)
    canvasBoard.translate (-(x+ size / 2), -(y+ size / 2)) 
}

function drawExtraRoom () {
    const img = new Image();  
    img.onload = function() {
        rotateAndDrawImage (img, extraRoom[1].x, extraRoom[1].y, ROOM_SIZE, extraRoom[0].rotation)
    };
    img.src = extraRoom[0].img
}

function moveExtraRoom (x, y) {
    const newPos = {x : extraRoom[1].x+x, y : extraRoom[1].y+y}
    if (checkBorder (newPos)) {
        canvasBoard.lineWidth = 50
        canvasBoard.strokeStyle = "#99ccff";
        canvasBoard.strokeRect(125, 125, 400, 400);

        extraRoom[1] = newPos
        
        drawExtraRoom()
        changeArrowColor ()
    }
}

function checkBorder (loc) {
    return loc.x >= 100 && loc.x <= 500 && loc.y >= 100 && loc.y <= 500 &&
            !(loc.x >= 150 && loc.x <= 450 && loc.y >= 150 && loc.y <= 450)
}

function fillArrows () {
    let x = 50*4
    let y = 50

    //Up and down
    for (let i = 0; i < 3; i++) {
        arrows.push ({x : x, y : y, rotation : 90})
        arrows.push ({x : x, y : y*11, rotation : 270})
        x += 100
    }
    
    x = 50
    y = 50 * 4
    //Left and right
    for (let i = 0; i < 3; i++) {
        arrows.push ({x : x, y : y, rotation : 0})
        arrows.push ({x : x*11, y : y, rotation : 180})
        y += 100
    }
}

function drawArrows () {
    const src = 'data/images/arrowBlack.png'
    arrows.forEach (
        arrow => {
           drawArrow (arrow, src) 
        }
    )
    drawArrow (redArrow, 'data/images/arrowRed.png')
}

function changeArrowColor () {
    for (const elem of arrows) {
        let loc = [{x : extraRoom[1].x, y : extraRoom[1].y - 50},
                    {x : extraRoom[1].x + 50, y : extraRoom[1].y},
                    {x : extraRoom[1].x, y : extraRoom[1].y + 50},
                    {x : extraRoom[1].x - 50, y : extraRoom[1].y}]


        for (const arrowLocation of loc) {
            if (isNearby (arrowLocation, elem)) {
                redArrow.x = arrowLocation.x   
                redArrow.y = arrowLocation.y
                redArrow.rotation = elem.rotation
                drawArrow (redArrow, 'data/images/arrowRed.png')
                return
            }
        }
    }
    
    drawArrow (redArrow, 'data/images/arrowBlack.png')
}

function drawArrow (arrow, src) {
    canvasBoard.fillStyle = "#3A089E";
    canvasBoard.fillRect(arrow.x, arrow.y, 50, 50);

    const img = new Image ()
    img.onload = function () {
        rotateAndDrawImage (img, arrow.x+12, arrow.y+12, 25, arrow.rotation)
    };
    img.src = src
}

function isNearby (loc, arrow) {
    return arrow.x == loc.x && arrow.y == loc.y
}

function fillTreasures (nrPlayers, nrTreasures) {
    let boardIndexes = []
    let treasures = []

    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
            boardIndexes.push ({x:i, y:j})
        }
    }

    //Removing corner indexes
    boardIndexes = boardIndexes.filter (elem => !((elem.x == 0 & elem.y == 0) || (elem.x == 0 & elem.y == 6) ||
                                        (elem.x == 6 & elem.y == 0) || (elem.x == 6 & elem.y == 6)))
    
    shuffle (boardIndexes)
    boardIndexes = boardIndexes.slice (0, nrTreasures*nrPlayers)

    const len = boardIndexes.length / nrPlayers
    for (let i = 0; i < nrPlayers; i++) {
        const tempIndexes = []
        for (let j = 0; j < len ; j++) {
            tempIndexes.push (boardIndexes.pop ())
        }
        treasures.push (tempIndexes)
    }
    initializePlayers (nrPlayers, treasures)
}

function drawTreasures () {
    players.forEach (player => {
        const img = new Image();
        img.onload = function() {
            const index = player.treasures[player.treasures.length - 1]
            rotateAndDrawImage (img, index.x*50 + 150 + 12, index.y*50 + 150 + 12, 25, 0)
            //player.treasures.forEach (treasure => rotateAndDrawImage (img, treasure.x*50 + 150 + 12, treasure.y*50 + 150 + 12, 25, 0))
        };
        img.src = player.treasureSrc
    })
}

function drawPlayers () {
    players.forEach (player => {
        const img = new Image();
        img.onload = function() {
            const index = player.location
            rotateAndDrawImage (img, index.y*50 + 150 + 12, index.x*50 + 150 + 12, 25, 0)
        };
        img.src = player.playerSrc
    })
}

function initializePlayers (nrPlayers, allTreasures) {
    const locations = [{x : 6, y : 0}, {x : 0, y : 6}, {x : 6, y : 6}, {x : 0, y : 0}]
    for (let i = 0; i < nrPlayers; i++) {
        players.push ({
            number : i+1,
            treasures : allTreasures.pop (),
            foundAllTreasures : false,
            location : locations.pop (),
            treasureSrc : `data/images/${i+1}.png`,
            playerSrc : `data/images/player${i+1}.png`,

        })
    }
}

function addExtraRoom () {
    const row = extraRoom[1].y /50 - 3
    const col = extraRoom[1].x /50 - 3
    //Push from left to right
    if (extraRoom[1].x == 100) {
        moveRooms (row, 6)
    } else
    //Push from right to left
    if (extraRoom[1].x == 500) {
        moveRooms (row, 0)
    } else
    //Push from top to bottom
    if (extraRoom[1].y == 100) {
        moveRooms (6, col)
    } else
    //Push from bottom to top
    if (extraRoom[1].y == 500) {
        moveRooms (0, col)
    }

    
    
}

function moveRooms (row, col) {
    const temp = board[row][col]

    let lastTreasure1
    let lastTreasure2
    let player1
    let player2
    if (row == 6 || col == 6) {
        lastTreasure1 = getTreasureIndex ({x : row, y: 6})
        lastTreasure2 = getTreasureIndex ({x : 6, y: col})
        player1 = getPlayer ({x : row, y: 6})
        player2 = getPlayer ({x : 6, y: col})
        for (let i = 6; i >= 1; i--) {
            if (col == 6) {
                board[row][i] = board [row][i-1]
                moveTreasure ({x : row, y: i-1}, {x : row, y : i})
                movePlayer ({x : row, y: i-1}, {x : row, y : i})
            }
            
            if (row == 6) {
                board[i][col] = board [i-1][col]
                moveTreasure ({x : i-1, y: col}, {x : i, y : col})
                movePlayer ({x : i-1, y: col}, {x : i, y : col})
            }
        }

        if (col == 6) {
            board[row][0] = extraRoom[0]
            extraRoom = [temp, {x : extraRoom[1].x + 400, y : extraRoom[1].y}]
            if (lastTreasure1[0] != -1) {
                players[lastTreasure1[0]].treasures[lastTreasure1[1]] = {x : 0, y : row}
            }
            if (player1 != -1) {
                players[player1].location = {x : row, y : 0}
            }
        }
        if (row == 6) {
            board[0][col] = extraRoom[0]
            extraRoom = [temp, {x : extraRoom[1].x, y : extraRoom[1].y + 400}]
            if (lastTreasure2[0] != -1) {
                players[lastTreasure2[0]].treasures[lastTreasure2[1]] = {x : col, y : 0}
            }
            if (player2 != -1) {
                players[player2].location = {x : 0, y : col}
            }
        }
    }

    if (row == 0 || col == 0) {
        lastTreasure1 = getTreasureIndex ({x : row, y: 0})
        lastTreasure2 = getTreasureIndex ({x : 0, y: col})
        player1 = getPlayer ({x : row, y: 0})
        player2 = getPlayer ({x : 0, y: col})
        for (let i = 0; i < 6; i++) {
            if (col == 0) {
                board[row][i] = board [row][i+1]
                moveTreasure ({x : row, y: i+1}, {x : row, y : i})
                movePlayer ({x : row, y: i+1}, {x : row, y : i})
            }
            if (row == 0) {
                board[i][col] = board [i+1][col]
                moveTreasure ({x : i+1, y: col}, {x : i, y : col})
                movePlayer ({x : i+1, y: col}, {x : i, y : col})
            }
        }
        if (col == 0) {
            board[row][6] = extraRoom[0]
            extraRoom = [temp, {x : extraRoom[1].x - 400, y : extraRoom[1].y}]
            if (lastTreasure1[0] != -1) {
                players[lastTreasure1[0]].treasures[lastTreasure1[1]] = {x : 6, y : row}
            }
            if (player1 != -1) {
                players[player1].location = {x : row, y : 6}
            }
        }
        if (row == 0) {
            board[6][col] = extraRoom[0]
            extraRoom = [temp, {x : extraRoom[1].x, y : extraRoom[1].y - 400}]
            if (lastTreasure2[0] != -1) {
                players[lastTreasure2[0]].treasures[lastTreasure2[1]] = {x : col, y : 6}
            }
            if (player2 != -1) {
                players[player2].location = {x : 6, y : col}
            }
        } 
    }
}

function moveTreasure (from, to) {
    players.forEach (player => {
        const indexOfTreasure = player.treasures.findIndex (loc => from.x == loc.y && from.y == loc.x)
        if (indexOfTreasure != -1) {
            player.treasures[indexOfTreasure] = {x : to.y, y : to.x}
        }
    })
}

function getTreasureIndex (loc) {
    let treasureIndex
    let playerIndex = players.findIndex (player => {
        treasureIndex = player.treasures.findIndex (treasure => treasure.x == loc.y && treasure.y == loc.x)
        return treasureIndex != -1
    });

    return [playerIndex, treasureIndex]
}

function playerFoundTreasure (loc) {
    const lastTreasureLoc = players[currentPlayerTurn].treasures[players[currentPlayerTurn].treasures.length -1]
    return lastTreasureLoc.x == loc.x && lastTreasureLoc.y == loc.y
}

function getPlayer (loc) {
    return players.findIndex (player => player.location.x == loc.x &&player.location.y == loc.y)
}

function movePlayer (from, to) {
    let loc = getPlayer(from)
    if (loc != -1) {
        players [loc].location = to
    }
}

function showPlayerInfo () {
    playerInformation.innerHTML = `<p>${playerHasToMoveExtraRoom ? "Please move the extra room in the board" : "Select the next move of your piece"}<p/>
                                    <p>Current turn: PLAYER NUMBER ${players[currentPlayerTurn].number} <img src="${players[currentPlayerTurn].playerSrc}" width="45" height="45" alt=""></p>                            
                                    <p>Find next treasure: <img src="${players[currentPlayerTurn].treasureSrc}" width="45" height="45" alt=""></p>
                                    <p>Treasures left: ${players[currentPlayerTurn].treasures.length}</p>
                                    `
}

function showPlayerPossiblePaths () {
    let graph = []

    for (let i = 0; i < 7; i++) {
        let startingGraph = []
        for (let j = 0; j < 7; j++) {
            startingGraph.push (roomToPath (board[i][j]))
        }
        
        let list = []
        for (let k = 0; k < 3; k++) {
            let row = []
            for (let j = 0; j < 7; j++) {
                row.push (startingGraph[j][k])
            }
            list.push (row.flat ())
        }
        graph.push (list[0])
        graph.push (list[1])
        graph.push (list[2])
    }

    return graph
}

function roomToPath (room) {
    switch (room.img) {
        case bend:
            return bendToPath (room)
        case straight:
            return straightToPath (room)
        case t_shape:
            return t_shapeToPath (room)
    }
}

function bendToPath (room) {
    switch (room.rotation) {
        case 0:
            return [
                [0,0,0],
                [0,1,1],
                [0,1,0]
            ]
        case 90:
            return [
                [0,0,0],
                [1,1,0],
                [0,1,0]
            ]
        case 180:
            return [
                [0,1,0],
                [1,1,0],
                [0,0,0]
            ]
        case 270:
            return [
                [0,1,0],
                [0,1,1],
                [0,0,0]
            ]
    }
}

function straightToPath (room) {
    switch (room.rotation) {
        case 0:
        case 180:
            return [
                [0,0,0],
                [1,1,1],
                [0,0,0]
            ]
        case 90:
        case 270:
            return [
                [0,1,0],
                [0,1,0],
                [0,1,0]
            ]
    }
}

function t_shapeToPath (room) {
    switch (room.rotation) {
        case 0:
            return [
                [0,0,0],
                [1,1,1],
                [0,1,0]
            ]
        case 90:
            return [
                [0,1,0],
                [1,1,0],
                [0,1,0]
            ]
        case 180:
            return [
                [0,1,0],
                [1,1,1],
                [0,0,0]
            ]
        case 270:
            return [
                [0,1,0],
                [0,1,1],
                [0,1,0]
            ]
    }
}

class Node {
    // `(x, y)` represents matrix cell coordinates, and
    // `dist` represents their minimum distance from the source
    constructor(x,  y, dist, parent) {
        this.x = x;
        this.y = y;
        this.dist = dist;
        this.parent = parent;
      }
}

    
    
    
function isValid(mat, visited, row, col, x, y) {   
    return (row >= 0) && (row < 21) && (col >= 0) && (col < 21)
            && mat[row][col] == 1 && !visited[row][col];
}


function useBFS(mat, i, j, x, y) {
    // Below arrays detail all four possible movements from a cell
    const row = [ -1, 0, 0, 1 ]
    const col = [ 0, -1, 1, 0 ]
    
    
    let visited = []

    for (let p = 0; p < 21; p++) {
        let list = []
        for (let k = 0; k < 21; k++) {
            list.push (false)
        }
        visited.push (list)
    }
    let q = []

    visited[i][j] = true;
    q.push(new Node(i, j, 0, null));

    // stores length of the longest path from source to destination
    let min_dist = Infinity;
    let node
    
    while (q.length != 0) {
        
        node = q.shift();

        i = node.x;
        j = node.y;
        let dist = node.dist;

        // if the destination is found, update `min_dist` and stop
        if (i == x && j == y)
        {
            min_dist = dist;
            break;
        }

        // check for all four possible movements from the current cell
        // and enqueue each valid movement
        for (let k = 0; k < 4; k++)
        {
            // check if it is possible to go to position
            // `(i + row[k], `j` + col[k])` from current position
            if (isValid(mat, visited, i + row[k], j + col[k], x, y))
            {
                // mark next cell as visited and enqueue it
                visited[i + row[k]][j + col[k]] = true;
                q.push(new Node(i + row[k], j + col[k], dist + 1, node));
            }
        }
    }

    return min_dist != Infinity
}


function highlightAllPaths () {
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            let x = (j+4)*50-50
            let y = (i+3)*50

            let x2 = Math.floor (x / 50) - 3
            let y2 = Math.floor (y / 50) - 3

            x2 = x2 == 0 ? 1 : x2*3+1
            y2 = y2 == 0 ? 1 : y2*3+1

            let x1 = players[currentPlayerTurn].location.x == 0 ?  1 : players[currentPlayerTurn].location.x*3+1
            let y1 = players[currentPlayerTurn].location.y == 0 ?  1 : players[currentPlayerTurn].location.y*3+1
            
            if (useBFS (showPlayerPossiblePaths(), x1, y1, y2, x2)) {
                canvasBoard.lineWidth = 3
                canvasBoard.strokeStyle = 'black'
                canvasBoard.strokeRect (Math.floor (x/50) * 50 , Math.floor (y/50)*50, 50, 50)
                possiblePaths.push ({x: Math.floor (x/50) * 50, y: Math.floor (y/50)*50})
            }
        }
    }
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function checkInsidePossiblePaths (loc) {
    return possiblePaths.some (elem =>loc.x >= elem.x && loc.y >= elem.y && loc.x <= elem.x + 50 && loc.y <= elem.y +50)
}


