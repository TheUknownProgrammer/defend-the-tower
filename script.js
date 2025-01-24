
/** @type {HTMLCanvasElement} */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const gameWidth = 500;
const gameHeight = 500;

canvas.width = gameWidth;
canvas.height = gameHeight;

var frame = 0;
var castelHealth = 5;
var gameOver = false;
var score = 0;
var bestScore = 0;
var mouseY = undefined;
var lastTime = 0;
var enemyInterval = 2500;
var timeToNextEnemy = 0;
var canvasRect = canvas.getBoundingClientRect();

const initEnemyInterval = enemyInterval;
const minEnemyInterval = 1200;

var cannon_cooldown = 800;

const sprites = {
    enemies: {
    "samurai": {frameWidth: 36, frameHeight: 36, img: "resources/images/enemy_spritesheet-removebg.png"},
    "blue_samurai": {frameWidth: 36, frameHeight: 36, img: "resources/images/enemy_spritesheet-2.png"}
    }
};
sprites.cannon = new Image();
sprites.cannon.src = "resources/images/cannon spritesheet.png";

const images = {
    castle: "resources/images/vertical castle.jpg",
    scoreBackground: "resources/images/score background.png",
    brickTexture: "resources/images/brick texture.png"
};

const castle = {width: 80, height: canvas.height,x: 0, y: 0};

const gameMusic = new Audio("resources/audios/musics/glorious-morning-extended.mp3");
gameMusic.loop = true;

var projectiles = [];
var enemies = [];
var messages = [];

const rndColor = () => `rgb(${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)})`;
const collisionDetection = (rect1,rect2) => rect1.x + rect1.width > rect2.x && rect1.x < rect2.width + rect2.x && rect1.y + rect1.height > rect2.y && rect1.y < rect2.height + rect2.y;

function capitalizeText(txt) {
    var txtArray = txt.split(" ");
    for(let i = 0; i < txtArray.length; i++) {
        txtArray[i] = txtArray[i][0].toUpperCase() + txtArray[i].substring(1,txtArray[i].length);
    }
    return txtArray.join(" ");
}

var dialogIndex = -1;
const dialogBox = ["in a parallel universe, the mongols invaded china in 1421.","you should defend the tower and defeat the invaders!"];

window.addEventListener("load", function() {
    canvas.title = "click for the next dialog";
    canvas.addEventListener("click",nextDialog);

    window.addEventListener("resize", function() {
        canvasRect = canvas.getBoundingClientRect();
    });

    for(let enemy in sprites.enemies) {
        var img = new Image();
        img.src = sprites.enemies[enemy].img;
        sprites.enemies[enemy].img = img
    }

    for(let imgUrl in images) {
        let img = new Image();
        img.src = images[imgUrl];
        images[imgUrl] = img;
    }
    
    nextDialog();
});

function nextDialog() {
    dialogIndex++;
    if(dialogIndex >= dialogBox.length) {
        canvas.removeEventListener("click", nextDialog);
        startNewGame();
    } else {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();

    var fontSize = 17

    ctx.fillStyle = "green";
    ctx.fillRect(0,0,canvas.width,fontSize);

    ctx.font = `${fontSize}px sans-serif`;
    ctx.textBaseline = "top";
    ctx.lineWidth = 0.2;
    ctx.strokeStyle = "gray";
    ctx.fillStyle = "white";
    ctx.fillText(capitalizeText(dialogBox[dialogIndex]),0,0);
    ctx.strokeText(capitalizeText(dialogBox[dialogIndex]),0,0);

    fontSize = 12

    ctx.textAlign = "right";
    ctx.font = `${fontSize}px sans-serif`;

    if(dialogIndex < dialogBox.length-1) {
        ctx.fillText("> click to next dialog. <", canvas.width,canvas.height-fontSize);
    } else {
        ctx.fillText("> click to start the game. <", canvas.width,canvas.height-fontSize);
        canvas.title = "click for start the game";

        var displayedEnemies = rndInt(5,10);

        for(let i = 0; i < displayedEnemies; i++) {
        var yFrame = rndInt(7,9);
        var xFrame;

        var frameWidth = 36;
        var frameHeight = 36;
        var size = 50;

        if(yFrame > 7) {
            xFrame = rndInt(0,9); 
        } else {
            xFrame = rndInt(0,7); 
        }

        console.log(xFrame);

        var xPos = (Math.random() * (canvas.width - size - castle.x - castle.width)) + castle.x + castle.width;
        var yPos = Math.random() * (canvas.height-size-fontSize) + fontSize;

        ctx.beginPath();
        ctx.drawImage(sprites.enemies.samurai.img, xFrame * frameWidth, yFrame * frameHeight, frameWidth, frameHeight, xPos,yPos,size,size);
        }
    }

    fontSize = 17;

    ctx.drawImage(images.castle,castle.x,fontSize,castle.width,castle.height);

    ctx.restore();
    }
}

function shootBullet(e) {
    projectiles.push(new Projectile());
    canvas.removeEventListener("click",shootBullet);
    canvas.style.cursor = "progress";
    canvas.title = "reload the cannon..."
    cannon.shoot = true;
    setTimeout(() => {
        if(!gameOver) {
        cannon.shoot = false;
        //cannon.frameX = 0;
        canvas.title = "click to shoot.";
        canvas.style.cursor = "crosshair";
        canvas.addEventListener("click",shootBullet);
        }
    }, cannon_cooldown);
}

const getYMouse = e => mouseY = e.y - canvasRect.top; 

class floatingMessages {
    constructor(text,x,y,size,color) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.opacity = 1;
        this.faded = true;
    }
    update() {
        if(this.opacity <= 0) {
        this.faded = true;
        } else {
        this.opacity -= 0.01;
        }
    }
    draw() {
        ctx.save();
        ctx.textBaseline = "top";
        ctx.font = `${this.size}px arial`;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fillText(this.text,this.x,this.y);
        ctx.restore();
    }
}

const cannon = {
    x: 20,
    y: 0,
    width: 60,
    height: 50,
    frameWidth: 88.714,
    frameHeight: 50,
    frameX: 0,
    maxFrame: 6,
    shoot: false,
    draw() {
        ctx.save();
        ctx.beginPath();
        ctx.drawImage(sprites.cannon,this.frameX * this.frameWidth,0,this.frameWidth,this.frameHeight,this.x,this.y,this.width,this.height);
        ctx.restore();
    },
    update() {
        if(mouseY != undefined) {
            if(mouseY != this.y - this.height/2) {
            var dy = (mouseY - this.y - this.height/2) / 10;
            this.y += dy;
            }
        }

        if(this.y + this.height > canvas.height) {
            this.y = canvas.height-this.height;
        } else if(this.y < 0) {
            this.y = 0;
        }

        if(this.shoot && frame % 3 == 0) {
            if(this.frameX < this.maxFrame) {
                this.frameX++;
            } else {
                this.frameX = 0;
                this.shoot = false;
            }
        }
    }
}

const gradient = ctx.createLinearGradient(cannon.x,0,canvas.width,0);
gradient.addColorStop(0,"black");
gradient.addColorStop(0.5,"dimgray");
gradient.addColorStop(1,"gray");

const cannonShootSfx = new Audio("resources/audios/sfxs/cannon fire.mp3");

class Rgba {
    constructor(red,green,blue,opacity) {
        this.opacity = opacity;
        this.red = red;
        this.green = green;
        this.blue = blue;
    }
    set setOpacity(newOpacity) {
        this.opacity = newOpacity;
    }
    set setRed(newRed) {
        this.red = newRed;
    }
    set setGreen(newGreen) {
        this.green = newGreen;
    }
    set setBlue(newBlue) {
        this.blue = newBlue;
    }
    get getFullRgba() {
        return `rgba(${this.red},${this.green},${this.blue},${this.opacity})`;
    }
}

class Projectile {
    constructor() {
        this.radius = 5
        this.width = this.radius;
        this.height = this.radius;
        this.x = cannon.x+cannon.width-26;
        this.y = cannon.y + (cannon.height/2-this.height/2)+6.5;
        this.startX = this.x;
        this.startY = this.y;
        this.markedForDeletion = false;
        this.speedX = 3;
        this.damage = 1;
        this.trailColor = new Rgba(Math.floor(Math.random() * 256),Math.floor(Math.random() * 256),Math.floor(Math.random() * 256),1); // rndColor()

        if(!cannonShootSfx.paused) {
            cannonShootSfx.currentTime = 0;
        }
        cannonShootSfx.play();
    }
    draw(ctx) {
        ctx.save();
        
        ctx.beginPath();
        ctx.strokeStyle = this.trailColor.getFullRgba;
        ctx.lineCap = "round";
        ctx.moveTo(this.startX,this.startY);
        ctx.lineTo(this.x,this.y);
        ctx.stroke();


        ctx.beginPath();
        ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);

        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = "gray";
        ctx.stroke();

        ctx.restore();
    }
    update() {
        this.x += this.speedX;
        this.speedX += 0.1;
        this.trailColor.opacity -= 0.01;

        if(this.x >= canvas.width) {
            this.markedForDeletion = true;
        }
    }
}

class Enemy {
    constructor() {
    var enemyName = "";

    this.hp; 
    this.dx; 
    this.reward;
    this.frameX;
    this.frameY;
    this.maxFrame;
    this.deadAnimation;

    if(Math.random() > 0.1) {
    enemyName = "samurai";
    this.hp = Math.floor(Math.random() * 3) + 1;
    this.dx = Math.random() + 0.5;
        switch(this.hp) {
            case 1: this.reward = 25; break; 
            case 2: this.reward = 50; break;
            case 3: this.reward = 100; break;
        }
        if(this.dx <= 0.95) {
        this.frameY = 7; 
        this.maxFrame = 7;
        } else {
        this.frameY = 9; 
        this.maxFrame = 9;
        }
        this.deadAnimation = {frameX: 0, frameY: 3, maxFrame: 5};
    } else {
    enemyName = "blue_samurai";
    this.hp = Math.floor(Math.random() * 2) + 4;
    this.dx = Math.random() + 0.8;
    this.reward = Math.floor(Math.random() * 101) + 100;
        if(this.dx <= 1) {
        this.frameY = 7; 
        this.maxFrame = 7;
        } else {
        this.frameY = 9; 
        this.maxFrame = 9;
        }
        this.deadAnimation = {frameX: 0, frameY: 3, maxFrame: 5};
    }

    var enemy = sprites.enemies[enemyName];

    this.sprite = enemy.img;
    this.size = 50; 
    this.width = this.size;
    this.height = this.size;
    this.x = canvas.width;
    this.y = Math.random() * (canvas.height-this.height);
    this.markedForDeletion = false;
    this.FrameWidth = enemy.frameWidth;
    this.FrameHeight = enemy.frameHeight;
    this.deadSound = new Audio("resources/audios/sfxs/enemy_death.mp3");
    this.dead = false;
    this.hurtSound = new Audio("resources/audios/sfxs/got hit.mp3"); 
    this.initHp = this.hp;
    this.attackSound = new Audio("resources/audios/sfxs/attack.mp3");
    this.healthBarWidth = this.width;
    this.initBarWidth = this.healthBarWidth;
    this.healthBarHeight = 15;
    this.healthBarTexture = new Image();
    this.healthBarTexture.src = "resources/images/health_bar_texture.png";
    this.relativeDecline = this.healthBarWidth / this.initHp;
    this.bonus = 20;
    this.bonusObtained = false;

    this.draw = function(ctx) {
        ctx.beginPath();
        ctx.drawImage(this.sprite,this.frameX * this.FrameWidth,this.frameY * this.FrameHeight,this.FrameWidth,this.FrameHeight,this.x,this.y,this.width,this.height);

        if(!this.dead) {
            this.displayHealth();
        } else {
            this.displayReward();
        }
    }

    this.update = function() {
        if(!this.dead) {
            if(!collisionDetection(castle,this)) {
                this.x -= this.dx;
                for(let i = 0; i < projectiles.length; i++) {
                    if(collisionDetection(projectiles[i],this)) {
                        this.hp -= projectiles[i].damage;
                        if(this.hp <= 0) {
                            if(this.x - (castle.x + castle.width) <= this.size * 2) {
                                if(Math.random() >= 0.55) {
                                score += this.bonus;
                                this.bonusObtained = true;
                                }
                            }

                            score += this.reward;
                            this.deathState();
                        } else {
                            if(!this.hurtSound.paused) {
                                this.hurtSound.currentTime = 0;
                            }
                            this.hurtSound.play();
                        }
                        this.healthBarWidth -= this.relativeDecline * projectiles[i].damage;
                        projectiles[i].markedForDeletion = true;
                        break;
                    }
                }
            } else {
                this.markedForDeletion = true;
                castelHealth--;
                this.attackSound.play();
            }
        }

        if(frame % 5 == 0) {
            if(this.frameX < this.maxFrame) {
                this.frameX++;
            } else {
                if(!this.dead) {
                this.frameX = 0;
                } else {
                this.markedForDeletion = true;
                }
            }
        }
    }

    this.deathState = function() {
        this.dead = true;
        this.frameX = this.deadAnimation.frameX;
        this.frameY = this.deadAnimation.frameY;
        this.maxFrame = this.deadAnimation.maxFrame;
        this.deadSound.play();
    }

    this.displayHealth = function() {
        ctx.save();

        ctx.beginPath();
        ctx.fillStyle = "green";
        ctx.drawImage(this.healthBarTexture,this.x,this.y+this.height,this.healthBarWidth,this.healthBarHeight);

        ctx.beginPath();
        ctx.fillStyle = "red";
        var width = this.initBarWidth - this.healthBarWidth;
        ctx.fillRect(this.x+this.healthBarWidth,this.y+this.height,width,this.healthBarHeight);

        ctx.beginPath();
        ctx.rect(this.x,this.y+this.height,this.initBarWidth,this.healthBarHeight)
        ctx.strokeStyle = "white";
        ctx.lineWidth = 0.75;
        ctx.stroke();

        ctx.beginPath();
        var fontSize = this.healthBarHeight;
        ctx.font = `${fontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "black";
        ctx.fillText(this.hp,this.x+this.width/2,this.y+this.height+(fontSize/2));
        ctx.restore();
    }

    this.displayReward = function() {
        ctx.save();
        var fontSize = 10;
        ctx.font = `${fontSize}px arial`;
        ctx.textAlign = "center";
        ctx.fillStyle = "black";
        ctx.textBaseline = "middle";
        ctx.fillText("+" + this.reward,this.x+this.width/2,this.y+this.height/2);

        if(this.bonusObtained) {
            ctx.fillStyle = "gold";
            ctx.textBaseline = "top";
            ctx.font = `bold ${fontSize}px arial`;
            ctx.fillText("Bonus: " + "+" + this.bonus,this.x+this.width/2+fontSize,this.y+this.height/2+fontSize);
        }

        ctx.restore();
    }

    }
}

function drawCastel() {
    ctx.save();

    ctx.beginPath();
    ctx.drawImage(images.castle,castle.x,castle.y,castle.width,castle.height);

    var fontSize = 20;
    ctx.font = `${fontSize}px Arial`;
    if(castelHealth > 1) {
    ctx.fillStyle = "white";
    } else {
    ctx.fillStyle = "red";
    }
    ctx.textBaseline = "middle"; 
    ctx.textAlign = "center"

    ctx.fillText(castelHealth,(castle.width)/2,castle.height/2);
    ctx.lineWidth = 0.25;
    ctx.strokeText(castelHealth,(castle.width)/2,castle.height/2);

    var brickSize = 10;
    for(let y = 0; y < canvas.height; y += brickSize) {
        ctx.drawImage(images.brickTexture,castle.x+castle.width-brickSize,y,brickSize,brickSize);
    }

    ctx.restore();
}

function gameOverState() {
    gameMusic.pause();
    canvas.removeEventListener("click",shootBullet);
    canvas.removeEventListener("mousemove", getYMouse);
    canvas.addEventListener("click", startNewGame);
    canvas.title = "click to start a new game";

    if(canvas.style.cursor != "pointer") canvas.style.cursor = "pointer";

    if(score > bestScore) bestScore = score;

    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();

    ctx.beginPath();
    ctx.fillStyle = "green";
    ctx.rect(0,canvas.height/2-15,canvas.width,52.5);
    ctx.fill();
    ctx.strokeStyle = "lightgreen";
    ctx.stroke();

    ctx.beginPath();

    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    ctx.fillStyle = "red";
    ctx.font = "30px monospace";
    ctx.fillText("Game Over!",canvas.width/2,canvas.height/2);

    ctx.fillStyle = "black";
    ctx.font = "15px monospace";
    ctx.fillText(`Best Score: ${bestScore}`,canvas.width/2,canvas.height/2+30);
    ctx.restore();
}

function drawScore() {
    ctx.save();

    var txt = "Score: " + score.toString();
    var fontSize = 18
    ctx.fillStyle = "white";
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = "top";

    ctx.beginPath();
    ctx.drawImage(images.scoreBackground,canvas.width-ctx.measureText(txt).width-1,0,ctx.measureText(txt).width,fontSize);

    ctx.beginPath();
    ctx.fillText(txt,canvas.width-ctx.measureText(txt).width,0);

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(canvas.width-ctx.measureText(txt).width-ctx.lineWidth,0);
    ctx.lineTo(canvas.width-ctx.measureText(txt).width-ctx.lineWidth,fontSize);
    ctx.lineTo(canvas.width,fontSize);
    ctx.stroke();

    ctx.restore();
}

function startNewGame() {
    canvas.removeEventListener("click", startNewGame);
    canvas.addEventListener("click",shootBullet);
    canvas.addEventListener("mousemove", getYMouse);
    canvas.removeAttribute("title");
    canvas.style.cursor = "crosshair";
    gameMusic.currentTime = 0;
    gameMusic.play();
    enemies.push(new Enemy());
    reset();
    requestAnimationFrame(Render);
}

function reset() {
    lastTime = 0;
    timeToNextEnemy = 0;
    enemyInterval = initEnemyInterval;
    castelHealth = 5;
    projectiles = [];
    enemies = [];
    gameOver = false;
    score = 0;
    cannon.shoot = false;
    cannon.y = castle.height/2-cannon.height/2;
    cannon.frameX = 0;
    mouseY = undefined;
}

const generateEnemy = () => enemies.push(new Enemy());

function Render(timestamp) {
    var deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    timeToNextEnemy += deltaTime;
    if(timeToNextEnemy >= enemyInterval) {
        generateEnemy();

        timeToNextEnemy = 0;
        enemyInterval = Math.max(minEnemyInterval,enemyInterval-2.5);
    }
    if(castelHealth == 0) {
        gameOver = true;
    }
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawCastel();
    drawScore();
    [...projectiles,...enemies, cannon].forEach((obj) => obj.draw(ctx));
    [...projectiles,...enemies, cannon].forEach((obj) => obj.update());
    projectiles = projectiles.filter((projectile) => !projectile.markedForDeletion);
    enemies = enemies.filter((enemy) => !enemy.markedForDeletion);
    frame++;
    if(!gameOver) requestAnimationFrame(Render);
    else gameOverState();
}

function rndInt(min,max) {
    return Math.floor(Math.random() * (max-min+1)) + min;
}

