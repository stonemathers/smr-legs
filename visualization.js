//Canvas constants
const BG_COLOR = "#87CEEB";

//Ground constants
let ground_height;
const GROUND_BUFF = 200;
const MIN_GROUND_HEIGHT = 500;
const GROUND_COLOR = "#9B7653";

//Title constants
const TITLE_FONT_SIZE = 40;
const TITLE_Y = 50;
const TITLE_MSG = "140-mile Smoky Relay Legs"

//Leg Color Pallette
const EASIEST_COLOR = "#00B800";
const HARDEST_COLOR = "#FE0000";

//Data vars
let legData;
let legs;
let maxDifficulty = 0;

//Leg constants
const WIDTH_MULT = 200;
const HEIGHT_MULT = 0.12;
const SCROLL_SPEED = 20;
const MOUNT_BUFFER = 300;

//Leg label strings
const LEG_LABEL = "Leg #";
const DIST_LABEL = "Distance: ";
const MI_LABEL = " mi";
const CLIMB_LABEL = "Total Climb: ";
const FT_LABEL = " ft"
const DIFF_LABEL = "Difficulty: "
const LABEL_HEIGHT_THRESH = 100;
const ABOVE_TEXT_BUFF = 5;
const LABEL_FONT_SIZE = 12;

//Clouds
let medCloudImg;
let clouds = [];
const CLOUD_Y_MAX = 300;
const CLOUD_SPACING_MIN = 100;
const CLOUD_SPACING_MAX = 300;
const CLOUD_SIZE_DIV_FACTOR = 12;

//Positioning
let currentPixelPosition = 0;
let totalPixelWidth;

/*
* Run once before site loads
*/
function preload(){
    legData = loadJSON("assets/json/legs.json");
    medCloudImg = loadImage("assets/images/cloud.png");
}

/*
* Run at initial load
*/
function setup(){
    createCanvas(windowWidth, windowHeight);
    initLegs();
    initClouds();
    ground_height = Math.max(height - GROUND_BUFF, MIN_GROUND_HEIGHT);
}

/*
*   Run every frame
*/
function draw(){
    //Draw Sky
    colorMode(RGB);
    let skyColor;
    if(currentPixelPosition < totalPixelWidth / 3){
        skyColor = lerpColor(color(BG_COLOR), color("#000"), currentPixelPosition/(totalPixelWidth / 3));
    }else if(currentPixelPosition > totalPixelWidth * 2 / 3){
        skyColor = lerpColor(color("#000"), color(BG_COLOR), (currentPixelPosition - totalPixelWidth * 2 / 3)/(totalPixelWidth / 3));
    }else{
        skyColor = color("#000");
    }
    background(skyColor);

    //Draw Title
    fill("black");
    textAlign(CENTER, TOP);
    textSize(TITLE_FONT_SIZE);
    text(TITLE_MSG, windowWidth/2, TITLE_Y);

    //Move Legs and Clouds
    if(keyIsDown(LEFT_ARROW) && legs[0].x < MOUNT_BUFFER){
        for(let i = 0; i < legs.length; i++){
            legs[i].move(SCROLL_SPEED);
        }
        for(let i = 0; i < clouds.length; i++){
            clouds[i].move(SCROLL_SPEED);
        }
        currentPixelPosition -= SCROLL_SPEED;
    }else if(keyIsDown(RIGHT_ARROW) &&
        (legs[legs.length - 1].x + legs[legs.length - 1].legWidth) > (width - MOUNT_BUFFER)){
        for(let i = 0; i < legs.length; i++){
            legs[i].move(-SCROLL_SPEED);
        }
        for(let i = 0; i < clouds.length; i++){
            clouds[i].move(-SCROLL_SPEED);
        }
        currentPixelPosition += SCROLL_SPEED;
    }

    //Draw every other cloud - some end up in front of legs and some behind
    for(let i = 0; i < clouds.length; i+=2){
        clouds[i].display();
    }

    //Draw Legs
    colorMode(HSB);
    for(let i = 0; i < legs.length; i++){
        if(legs[i].stillDisplaying()){
            legs[i].display();
        }
    }

    //Draw rest of clouds
    for(let i = 1; i < clouds.length; i+=2){
        clouds[i].display();
    }

    //Draw Ground
    colorMode(RGB);
    fill(GROUND_COLOR);
    noTint();
    rect(0, ground_height, width, height - ground_height);
}

/*
* Run when window is resized
*/
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    ground_height = Math.max(height - GROUND_BUFF, MIN_GROUND_HEIGHT);
}

/*
* Run when mouse is scrolled
*/
function mouseWheel(event){
    //Move Legs
    if((event.delta < 0 && legs[0].x < MOUNT_BUFFER) || 
        (event.delta > 0 && (legs[legs.length - 1].x + legs[legs.length - 1].legWidth) > (width - MOUNT_BUFFER))){
        for(let i = 0; i < legs.length; i++){
            legs[i].move(-event.delta);
        }
        for(let i = 0; i < clouds.length; i++){
            clouds[i].move(-event.delta);
        }
        currentPixelPosition += event.delta;
    }

    //Prevent page scrolling
    return false;
}

/*
* Initializes the array of Leg objects from the SMR legs data
*/
function initLegs(){
    let currX = MOUNT_BUFFER;
    legs = [];

    for(let i = 0; i < legData.leg_list.length; i++){
        //Get data
        let leg_num = legData.leg_list[i].leg_num;
        let dist = legData.leg_list[i].dist;
        let climb = legData.leg_list[i].climb_total;
        let diff = legData.leg_list[i].difficulty;
        let ports = legData.leg_list[i].portions;

        //Calculate overall width
        let legWidth = dist * WIDTH_MULT;

        //Create Leg
        legs.push(new Leg(leg_num, currX, legWidth, diff, climb, ports));

        //Update vars
        currX += legWidth;
        maxDifficulty = Math.max(maxDifficulty, diff);
    }

    //Set total pixel width of visualization
    totalPixelWidth = currX + MOUNT_BUFFER;
}

function initClouds(){
    //Initialize Clouds
    let currX = 0;
    while(currX < totalPixelWidth){
        currX += random(CLOUD_SPACING_MIN, CLOUD_SPACING_MAX);
        let y = random(0, CLOUD_Y_MAX);
        clouds.push(new Cloud(medCloudImg, currX, y, medCloudImg.width / CLOUD_SIZE_DIV_FACTOR, medCloudImg.height / CLOUD_SIZE_DIV_FACTOR));
    }
}

/*
* Class for Leg object
*/
class Leg{
    constructor(legNum, x, legWidth, difficulty, climb_total, portions){
        this.legNum = legNum;
        this.x = x;
        this.legWidth = legWidth;
        this.difficulty = difficulty;
        this.climb_total = climb_total;
        this.portions = portions;
        
        //Determine highest point
        let maxH = this.portions[0].start_elev * HEIGHT_MULT;
        for(let i = 0; i < this.portions.length; i++){
            maxH = Math.max(maxH, this.portions[i].end_elev * HEIGHT_MULT);
        }
        this.height = maxH;
    }

    /*
    * Display Leg
    */
    display(){
        //Set color
        let fillColor = lerpColor(color(EASIEST_COLOR), color(HARDEST_COLOR), this.difficulty/maxDifficulty);
        
        //Change alpha if hovering
        if(this.mouseIsOver()){
            fill(hue(fillColor), saturation(fillColor), brightness(fillColor), 0.6);
        }else{
            fill(fillColor);
        }

        //Draw shape
        beginShape();
        vertex(this.x, ground_height);  //bottom left
        vertex(this.x, ground_height - (this.portions[0].start_elev * HEIGHT_MULT));    //top left
        for(let i = 0; i < this.portions.length; i++){
            vertex(this.x + this.portions[i].end_dist * WIDTH_MULT, ground_height - (this.portions[i].end_elev * HEIGHT_MULT))   //top
        }
        vertex(this.x + this.legWidth, ground_height); //bottom right
        endShape(CLOSE);

        //Draw label
        if(this.mouseIsOver()){
            this.drawLabel();
        }
    }

    /*
    * Draws label displaying info about Leg
    */
    drawLabel(){
        //Get data
        let currLeg = legData.leg_list[this.legNum];
        let num = this.legNum + 1;
        let dist = currLeg.dist;

        //Create string
        let infoString = LEG_LABEL + str(num) + "\n"
            + DIST_LABEL + str(dist) + MI_LABEL + "\n"
            + CLIMB_LABEL + str(this.climb_total) + FT_LABEL + "\n"
            + DIFF_LABEL + str(this.difficulty);

        //Calc position
        let infoX = this.x + (this.legWidth/2);
        let infoY;

        if(this.height < LABEL_HEIGHT_THRESH){
            textAlign(CENTER, BOTTOM);
            infoY = ground_height - this.height - ABOVE_TEXT_BUFF;
        }else{
            textAlign(CENTER, CENTER);
            infoY = ground_height - (this.height/3);
        }

        //Draw text
        textSize(LABEL_FONT_SIZE);
        fill("black");
        text(infoString, infoX, infoY);
    }

    /*
    * Move the Leg the given number of pixels
    *
    * Input:
    *   distance - number of pixels to move Leg
    */
    move(distance){
        this.x += distance;
    }

    /*
    * Determine whether Leg is still on the screen
    *
    * Output:
    *   true if Leg is still on screen, false if not
    */
   stillDisplaying(){
        return this.x < width && this.x + this.legWidth > 0;
    }

    /*
    * Return true if mouse is over the Leg
    */
    mouseIsOver(){
        return (mouseX >= this.x) && (mouseX <= this.x + this.legWidth) && (mouseY <= ground_height) && (mouseY >= ground_height - this.height);
    }

}

class Cloud{
    constructor(img, x, y, width, height){
        this.img = img;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    display(){
        image(this.img, this.x, this.y, this.width, this.height);
    }

    move(dx){
        this.x += dx;
    }

    stillDisplaying(){
        return this.x > -this.width  && this.x < width;
    }
}