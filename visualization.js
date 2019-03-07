//Canvas constants
const BG_COLOR = "#87CEEB";

//Ground constants
const GROUND_HEIGHT = 600;
const GROUND_COLOR = "#9B7653";

//Title constants
const TITLE_FONT_SIZE = 40;
const TITLE_Y = 50;
const TITLE_MSG = "140-mile Smoky Mountain Relay Legs"

//Mountain Color Pallette
const EASIEST_COLOR = "#00B800";
const HARDEST_COLOR = "#FE0000";

//Data vars
let legData;
let mountains;
let maxDifficulty = 0;

//Mountain constants
const WIDTH_MULT = 50;
const HEIGHT_MULT = 0.2;
const SCROLL_SPEED = 10;
const MOUNT_BUFFER = 300;

//Mountain label strings
const LEG_LABEL = "Leg #";
const DIST_LABEL = "Distance: ";
const MI_LABEL = " mi";
const CLIMB_LABEL = "Total Climb: ";
const FT_LABEL = " ft"
const DIFF_LABEL = "Difficulty: "
const CLIMB_THRESH = 450;
const ABOVE_TEXT_BUFF = 5;
const LABEL_FONT_SIZE = 12;

/*
* Run once before site loads
*/
function preload(){
    legData = loadTable("assets/csv/legs.csv", "header");
}

/*
* Run at initial load
*/
function setup(){
    createCanvas(windowWidth, windowHeight);
    initMountains();
}

/*
*   Run every frame
*/
function draw(){
    //Draw Sky
    colorMode(RGB);
    background(BG_COLOR);

    //Draw Title
    fill("black");
    textAlign(CENTER, TOP);
    textSize(TITLE_FONT_SIZE);
    text(TITLE_MSG, windowWidth/2, TITLE_Y);

    //Move Mountains
    if(keyIsDown(LEFT_ARROW) && mountains[0].x < MOUNT_BUFFER){
        for(let i = 0; i < mountains.length; i++){
            mountains[i].move(SCROLL_SPEED);
        }
    }else if(keyIsDown(RIGHT_ARROW) &&
        (mountains[mountains.length - 1].x + mountains[mountains.length - 1].width) > (width - MOUNT_BUFFER)){
        for(let i = 0; i < mountains.length; i++){
            mountains[i].move(-SCROLL_SPEED);
        }
    }

    //Draw Mountains
    colorMode(HSB);
    for(let i = 0; i < mountains.length; i++){
        if(mountains[i].stillDisplaying()){
            mountains[i].display();
        }
    }

    //Draw Ground
    colorMode(RGB);
    fill(GROUND_COLOR);
    noTint();
    rect(0, GROUND_HEIGHT, width, height - GROUND_HEIGHT);
}

/*
* Run when window is resized
*/
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

/*
* Run when mouse is scrolled
*/
function mouseWheel(event){
    //Move Mountains
    if((event.delta < 0 && mountains[0].x < MOUNT_BUFFER) || 
        (event.delta > 0 && (mountains[mountains.length - 1].x + mountains[mountains.length - 1].width) > (width - MOUNT_BUFFER))){
        for(let i = 0; i < mountains.length; i++){
            mountains[i].move(-event.delta);
        }
    }

    //Prevent page scrolling
    return false;
}

/*
* Initializes the array of Mountain object from the SMR legs data
*/
function initMountains(){
    let currX = MOUNT_BUFFER;
    mountains = [];

    for(let i = 0; i < legData.getRowCount(); i++){
        //Get data
        let row = legData.getRow(i);
        let leg = int(row.get("leg_num"));
        let dist = int(row.get("dist"));
        let climb = int(row.get("climb_total"));
        let diff = int(row.get("difficulty"));

        //Calculate height and width
        let height = climb * HEIGHT_MULT;
        let width = dist * WIDTH_MULT;

        //Create Mountain
        mountains.push(new Mountain(leg, currX, height, width, diff));

        //Update vars
        currX += width;
        maxDifficulty = Math.max(maxDifficulty, diff);
    }
}

/*
* Class for Mountain object
*/
class Mountain{
    constructor(legNum, x, height, width, difficulty){
        this.legNum = legNum;
        this.x = x;
        this.height = height;
        this.width = width;
        this.difficulty = difficulty;
    }

    /*
    * Display Mountain
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

        //Calculate coordinates
        let x1 = this.x;
        let y1 = GROUND_HEIGHT;
        let x2 = x1 + this.width/2;
        let y2 = y1 - this.height;
        let x3 = x1 + this.width;
        let y3 = y1;

        //Draw triangle
        triangle(x1, y1, x2, y2, x3, y3);

        //Draw label
        if(this.mouseIsOver()){
            this.drawLabel();
        }
    }

    /*
    * Draws label displaying info about Mountain
    */
    drawLabel(){
        //Get data
        let data = legData.getRow(this.legNum);
        let num = this.legNum + 1;
        let dist = data.get("dist");
        let climb = data.get("climb_total");

        //Create string
        let infoString = LEG_LABEL + str(num) + "\n"
            + DIST_LABEL + str(dist) + MI_LABEL + "\n"
            + CLIMB_LABEL + str(climb) + FT_LABEL + "\n"
            + DIFF_LABEL + str(data.get("difficulty"));

        //Calc position
        let infoX = this.x + (this.width/2);
        let infoY;

        if(climb < CLIMB_THRESH){
            textAlign(CENTER, BOTTOM);
            infoY = GROUND_HEIGHT - this.height - ABOVE_TEXT_BUFF;
        }else{
            textAlign(CENTER, CENTER);
            infoY = GROUND_HEIGHT - (this.height/3);
        }

        //Draw text
        textSize(LABEL_FONT_SIZE);
        fill("black");
        text(infoString, infoX, infoY);
    }

    /*
    * Move the Mountain the given number of pixels
    *
    * Input:
    *   distance - number of pixels to move Mountain
    */
    move(distance){
        this.x += distance;
    }

    /*
    * Determine whether Mountain is still on the screen
    *
    * Output:
    *   true if Mountain is still on screen, false if not
    */
   stillDisplaying(){
        return this.x < width && this.x + this.width > 0;
    }

    /*
    * Return true if mouse is over the Mountain
    */
    mouseIsOver(){
        return (mouseX >= this.x) && (mouseX <= this.x + this.width) && (mouseY <= GROUND_HEIGHT) && (mouseY >= GROUND_HEIGHT - this.height);
    }

}