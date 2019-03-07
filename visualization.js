//Canvas constants
const BG_COLOR = "#87CEEB";

//Ground constants
const GROUND_HEIGHT = 600;
const GROUND_COLOR = "#9B7653";

//Title constants
const TITLE_FONT_SIZE = 40;
const TITLE_Y = 50;
const TITLE_MSG = "140-mile Smoky Leg Relay Legs"

//Leg Color Pallette
const EASIEST_COLOR = "#00B800";
const HARDEST_COLOR = "#FE0000";

//Data vars
let legData;
let legs;
let maxDifficulty = 0;

//Leg constants
const WIDTH_MULT = 100;
const HEIGHT_MULT = 0.1;
const SCROLL_SPEED = 10;
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

/*
* Run once before site loads
*/
function preload(){
    legData = loadJSON("assets/json/legs.json");
}

/*
* Run at initial load
*/
function setup(){
    createCanvas(windowWidth, windowHeight);
    initLegs();
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

    //Move Legs
    if(keyIsDown(LEFT_ARROW) && legs[0].x < MOUNT_BUFFER){
        for(let i = 0; i < legs.length; i++){
            legs[i].move(SCROLL_SPEED);
        }
    }else if(keyIsDown(RIGHT_ARROW) &&
        (legs[legs.length - 1].x + legs[legs.length - 1].legWidth) > (width - MOUNT_BUFFER)){
        for(let i = 0; i < legs.length; i++){
            legs[i].move(-SCROLL_SPEED);
        }
    }

    //Draw Legs
    colorMode(HSB);
    for(let i = 0; i < legs.length; i++){
        if(legs[i].stillDisplaying()){
            legs[i].display();
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
    //Move Legs
    if((event.delta < 0 && legs[0].x < MOUNT_BUFFER) || 
        (event.delta > 0 && (legs[legs.length - 1].x + legs[legs.length - 1].legWidth) > (width - MOUNT_BUFFER))){
        for(let i = 0; i < legs.length; i++){
            legs[i].move(-event.delta);
        }
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
        vertex(this.x, GROUND_HEIGHT);  //bottom left
        vertex(this.x, GROUND_HEIGHT - (this.portions[0].start_elev * HEIGHT_MULT));    //top left
        for(let i = 0; i < this.portions.length; i++){
            vertex(this.x + this.portions[i].end_dist * WIDTH_MULT, GROUND_HEIGHT - (this.portions[i].end_elev * HEIGHT_MULT))   //top
        }
        vertex(this.x + this.legWidth, GROUND_HEIGHT); //bottom right
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
        return (mouseX >= this.x) && (mouseX <= this.x + this.legWidth) && (mouseY <= GROUND_HEIGHT) && (mouseY >= GROUND_HEIGHT - this.height);
    }

}