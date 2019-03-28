//Canvas constants
const BG_COLOR = "#87CEEB";
const TEXT_COLOR = "#152614";
const KEY_SCROLL_SPEED = 15;
const MAX_WHEEL_SCROLL_SPEED = 80;
const SHAPE_STROKE_WEIGHT = 2;
const SKY_BRIGHTNESS_THRESH = 25;
let skyColor;

//Fonts
let bannerFont;

//Ground constants
let ground_height;
const GROUND_BUFF = 250;
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
let maxLegHeight = 0;
let maxDifficulty = 0;

//Legs
const WIDTH_MULT = 200;
const HEIGHT_MULT = 0.12;
let MOUNT_BUFFER;

//Flag
const FLAG_POLE_HEIGHT = 100;
const FLAG_POLE_WIDTH = 4;
const FLAG_WIDTH = 70;
const FLAG_HEIGHT = 50;
const FLAG_FONT_SIZE = 30;

//Leg Label
const LEG_LABEL = "Leg #";
const DIST_LABEL = "Distance: ";
const MI_LABEL = " mi";
const CLIMB_LABEL = "Total Climb: ";
const FT_LABEL = " ft";
const LABEL_FONT_SIZE = 24;
const TEXT_STROKE_WEIGHT = 0;

//Clouds
let cloudImg;
let clouds = [];
const CLOUD_Y_MAX = 300;
const CLOUD_SPACING_MIN = 100;
const CLOUD_SPACING_MAX = 400;
const CLOUD_SIZE_DIV_FACTOR = 12;

//Positioning
let currentPixelPosition = 0;
let totalPixelWidth;

//Difficuly Gauge
const GAUGE_X = 50;
const GAUGE_Y_BUFF = 115;
const GAUGE_WIDTH = 300;
const GAUGE_HEIGHT = 40;
const GAUGE_TOP_FONT_SIZE = 24;
const GAUGE_BOTTOM_FONT_SIZE = 20;
const GAUGE_TOP_LABEL_BUFF = 4;
const GAUGE_BOTTOM_LABEL_BUFF = 8;
const DIFFICULTY_LABEL = "Difficulty";
const EASY_LABEL = "Easy";
const HARD_LABEL = "Hard";
const OMG_LABEL = "OMG";

//Scroll Tracker
const TRACKER_BUFF = GAUGE_Y_BUFF;
const TRACKER_HEIGHT = GAUGE_HEIGHT;

//Altitude Bar
const ALT_BAR_X = 8;
const ALT_BAR_ALPHA = 0.4;
const BAR_STROKE_WEIGHT = 5;
const ALT_BAR_TICK_WIDTH = 40;

//Distance Bar
const DIST_BAR_HEIGHT = 5;
const DIST_BAR_TICK_HEIGHT = 40;
const DIST_BAR_TICK_WIDTH = 5;
let distBar;

//Banners
const BANNER_WIDTH = 600;
const BANNER_HEIGHT = 100;
const BANNER_POLE_HEIGHT = 150;
const BANNER_POLE_WIDTH = 4;
const START_TEXT = "SMOKY MOUNTAIN RELAY 2019";
const FINISH_TEXT = "FINISH";
const BANNER_FONT_SIZE = 36;
let startBannerX;
let finishBannerX;

/*
* Run once before site loads
*/
function preload(){
    legData = loadJSON("assets/json/legs.json");
    cloudImg = loadImage("assets/images/cloud.png");
    bannerFont = loadFont("assets/fonts/Permanent_Marker/PermanentMarker-Regular.ttf");
}

/*
* Run at initial load
*/
function setup(){
    createCanvas(windowWidth, windowHeight);

    MOUNT_BUFFER = width / 2;
    ground_height = Math.max(height - GROUND_BUFF, MIN_GROUND_HEIGHT);
    textFont(bannerFont);

    initLegs();
    initClouds();
    initDistanceBar();
    initBanners();
}

/*
*   Run every frame
*/
function draw(){
    //Draw Sky
    colorMode(RGB);
    if(currentPixelPosition < totalPixelWidth / 6){
        skyColor = BG_COLOR;
    }else if(currentPixelPosition < totalPixelWidth * 1 / 3){
        skyColor = lerpColor(color(BG_COLOR), color("#000"), (currentPixelPosition - (totalPixelWidth / 6))/(totalPixelWidth / 6));
    }else if(currentPixelPosition > totalPixelWidth * 2 / 3){
        skyColor = lerpColor(color("#000"), color(BG_COLOR), (currentPixelPosition - totalPixelWidth * 2 / 3)/(totalPixelWidth / 3));
    }else{
        skyColor = "#000";
    }
    background(skyColor);

    //Move Legs, Clouds, Distance Bar, and Banners
    if(keyIsDown(LEFT_ARROW) && legs[0].x < MOUNT_BUFFER){
        for(let i = 0; i < legs.length; i++){
            legs[i].move(KEY_SCROLL_SPEED);
        }
        for(let i = 0; i < clouds.length; i++){
            clouds[i].move(KEY_SCROLL_SPEED);
        }
        distBar.move(KEY_SCROLL_SPEED);
        startBannerX += KEY_SCROLL_SPEED;
        finishBannerX += KEY_SCROLL_SPEED;
        currentPixelPosition -= KEY_SCROLL_SPEED;
    }else if(keyIsDown(RIGHT_ARROW) &&
        (legs[legs.length - 1].x + legs[legs.length - 1].legWidth) > (width - MOUNT_BUFFER)){
        for(let i = 0; i < legs.length; i++){
            legs[i].move(-KEY_SCROLL_SPEED);
        }
        for(let i = 0; i < clouds.length; i++){
            clouds[i].move(-KEY_SCROLL_SPEED);
        }
        distBar.move(-KEY_SCROLL_SPEED);
        startBannerX -= KEY_SCROLL_SPEED;
        finishBannerX -= KEY_SCROLL_SPEED;
        currentPixelPosition += KEY_SCROLL_SPEED;
    }

    //Draw every other cloud - some end up in front of legs and some behind
    for(let i = 0; i < clouds.length; i+=2){
        if(clouds[i].isOnScreen()){
            clouds[i].display();
        }
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
        if(clouds[i].isOnScreen()){
            clouds[i].display();
        }
    }

    //Draw Ground
    fill(GROUND_COLOR);
    noTint();
    rect(0, ground_height, width, height - ground_height);

    //Draw Difficulty Gauge
    drawDifficultyGauge();

    //Draw Scroll Tracker
    drawScrollTracker();

    //Draw altitude bar
    drawAltitudeBar();

    //Draw distance bar
    distBar.display();

    //Draw start/finish banners
    drawBanners();
}

/*
* Run when window is resized
*/
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    MOUNT_BUFFER = width / 2;
    ground_height = Math.max(height - GROUND_BUFF, MIN_GROUND_HEIGHT);
    distBar = new DistanceBar(distBar.x, ground_height, distBar.distance);
}

/*
* Run when mouse is scrolled
*/
function mouseWheel(event){
    //Move Legs
    if((event.delta < 0 && legs[0].x < MOUNT_BUFFER) || 
        (event.delta > 0 && (legs[legs.length - 1].x + legs[legs.length - 1].legWidth) > (width - MOUNT_BUFFER))){
        //Prevent scroll from going too far or too fast
        let moveDist;
        if(event.delta > 0){
            moveDist = Math.min(MAX_WHEEL_SCROLL_SPEED, event.delta, totalPixelWidth - width - currentPixelPosition);
        }else{
            moveDist = -Math.min(MAX_WHEEL_SCROLL_SPEED, -event.delta, currentPixelPosition);
        }

        for(let i = 0; i < legs.length; i++){
            legs[i].move(-moveDist);
        }
        for(let i = 0; i < clouds.length; i++){
            clouds[i].move(-moveDist);
        }
        distBar.move(-moveDist);
        startBannerX -= moveDist;
        finishBannerX -= moveDist;
        currentPixelPosition += moveDist;
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
        for(let i = 0; i < ports.length; i++){
            maxLegHeight = Math.max(ports[i].start_elev, ports[i].end_elev, maxLegHeight);
        }
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
        clouds.push(new Cloud(currX, y, cloudImg.width / CLOUD_SIZE_DIV_FACTOR, cloudImg.height / CLOUD_SIZE_DIV_FACTOR));
    }
}

function initDistanceBar(){
    let totalDist = 0;

    for(let i = 0; i < legData.leg_list.length; i++){
        totalDist += float(legData.leg_list[i].dist);
    }

    distBar = new DistanceBar(MOUNT_BUFFER, ground_height, totalDist);
}

function initBanners(){
    startBannerX = (MOUNT_BUFFER - BANNER_WIDTH) / 2;
    finishBannerX = totalPixelWidth - MOUNT_BUFFER + startBannerX;
}

function drawDifficultyGauge(){
    let currX = GAUGE_X;
    let barWidth = GAUGE_WIDTH / (maxDifficulty + 1);
    let barY = ground_height + GAUGE_Y_BUFF;

    //Set stroke props
    stroke(0, 0, 0);
    strokeWeight(SHAPE_STROKE_WEIGHT);

    for(let i = 0; i <= maxDifficulty; i++){
        //Set color
        let fillColor = lerpColor(color(EASIEST_COLOR), color(HARDEST_COLOR), i/maxDifficulty);
        fill(fillColor);
        //Draw bar
        rect(currX, barY, barWidth, GAUGE_HEIGHT);
        //Update x
        currX += barWidth;
    }

    //Draw labels
    strokeWeight(TEXT_STROKE_WEIGHT);
    //fill(TEXT_COLOR);
    fill("black");
    textSize(GAUGE_TOP_FONT_SIZE);
    textAlign(CENTER, BOTTOM);
    text(DIFFICULTY_LABEL, GAUGE_X + (GAUGE_WIDTH / 2), barY - GAUGE_TOP_LABEL_BUFF);
    textSize(GAUGE_BOTTOM_FONT_SIZE);
    textAlign(LEFT, TOP);
    text(EASY_LABEL, GAUGE_X, barY + GAUGE_HEIGHT + GAUGE_BOTTOM_LABEL_BUFF);
    textAlign(CENTER, TOP);
    text(HARD_LABEL, GAUGE_X + (GAUGE_WIDTH / 2), barY + GAUGE_HEIGHT + GAUGE_BOTTOM_LABEL_BUFF);
    textAlign(RIGHT, TOP);
    text(OMG_LABEL, GAUGE_X + GAUGE_WIDTH, barY + GAUGE_HEIGHT + GAUGE_BOTTOM_LABEL_BUFF);
}

function drawScrollTracker(){
    let trackerX = GAUGE_X + GAUGE_WIDTH + TRACKER_BUFF;
    let trackerY = ground_height + TRACKER_BUFF;
    let trackerWidth = width - trackerX - TRACKER_BUFF;
    let prcntScrolled = currentPixelPosition / (totalPixelWidth - MOUNT_BUFFER - MOUNT_BUFFER);
    let scrolledWidth = trackerWidth * prcntScrolled;

    //Set stroke props
    stroke(0, 0, 0);
    strokeWeight(SHAPE_STROKE_WEIGHT);

    //Draw tracker base
    fill("white");
    rect(trackerX, trackerY, trackerWidth, TRACKER_HEIGHT);

    //Draw scrolled portion
    fill("black");
    rect(trackerX, trackerY, scrolledWidth, TRACKER_HEIGHT);

    //Draw divider
    
}

function drawAltitudeBar(){
    //Set stroke and fill props
    if(currentPixelPosition < MOUNT_BUFFER){
        if(brightness(skyColor) < SKY_BRIGHTNESS_THRESH){
            stroke(0, 0, 100, 1 - ((currentPixelPosition / MOUNT_BUFFER) * (1 - ALT_BAR_ALPHA)));
            fill(0, 0, 100, 1 - ((currentPixelPosition / MOUNT_BUFFER) * (1 - ALT_BAR_ALPHA)));
        }else{
            stroke(0, 0, 0, 1 - ((currentPixelPosition / MOUNT_BUFFER) * (1 - ALT_BAR_ALPHA)));
            fill(0, 0, 0, 1 - ((currentPixelPosition / MOUNT_BUFFER) * (1 - ALT_BAR_ALPHA)));
        }
    }else{
        if(brightness(skyColor) < SKY_BRIGHTNESS_THRESH){
            stroke(0, 0, 100, ALT_BAR_ALPHA);
            fill(0, 0, 100, ALT_BAR_ALPHA);
        }else{
            stroke(0, 0, 0, ALT_BAR_ALPHA);
            fill(0, 0, 0, ALT_BAR_ALPHA);
        }
    }
    strokeWeight(BAR_STROKE_WEIGHT);

    //Calc max height and display height
    let maxDisplayHeight = (int(maxLegHeight / 1000) + 1) * 1000;
    let baseHeight = maxDisplayHeight * HEIGHT_MULT;

    //Draw lines
    rect(ALT_BAR_X, ground_height, 0, -baseHeight);

    strokeWeight(BAR_STROKE_WEIGHT / 2);
    for(let i = 1000; i <= maxDisplayHeight; i += 1000){
        rect(ALT_BAR_X + 3, ground_height - (i * HEIGHT_MULT) + 2, ALT_BAR_TICK_WIDTH, 0);
        rect(ALT_BAR_X + 3, ground_height - ((i - 250) * HEIGHT_MULT) + 2, ALT_BAR_TICK_WIDTH / 2, 0);
        rect(ALT_BAR_X + 3, ground_height - ((i - 500) * HEIGHT_MULT) + 2, ALT_BAR_TICK_WIDTH / 2, 0);
        rect(ALT_BAR_X + 3, ground_height - ((i - 750) * HEIGHT_MULT) + 2, ALT_BAR_TICK_WIDTH / 2, 0);
    }

    //Set text stroke props
    strokeWeight(TEXT_STROKE_WEIGHT);

    //Draw text
    textAlign(LEFT, BOTTOM);
    text(str(maxDisplayHeight), ALT_BAR_X, ground_height - baseHeight);

}

function drawBanners(){
    //Start Banner
    stroke(0, 0, 0);
    strokeWeight(2);
    fill(0, 0, 0);
    rect(startBannerX, ground_height, BANNER_POLE_WIDTH, -BANNER_POLE_HEIGHT);
    rect(startBannerX + BANNER_WIDTH - BANNER_POLE_WIDTH, ground_height, BANNER_POLE_WIDTH, -BANNER_POLE_HEIGHT);
    fill(0, 0, 100);
    rect(startBannerX, ground_height - BANNER_POLE_HEIGHT, BANNER_WIDTH, -BANNER_HEIGHT);
    fill(0, 0, 0);
    strokeWeight(0);
    textAlign(CENTER, CENTER);
    textSize(BANNER_FONT_SIZE);
    text(START_TEXT, startBannerX + (BANNER_WIDTH / 2), ground_height - BANNER_POLE_HEIGHT - (BANNER_HEIGHT / 2) - 5);

    //Finish Banner
    strokeWeight(2);
    fill(0, 0, 0);
    rect(finishBannerX, ground_height, BANNER_POLE_WIDTH, -BANNER_POLE_HEIGHT);
    rect(finishBannerX + BANNER_WIDTH - BANNER_POLE_WIDTH, ground_height, BANNER_POLE_WIDTH, -BANNER_POLE_HEIGHT);
    fill(0, 0, 100);
    rect(finishBannerX, ground_height - BANNER_POLE_HEIGHT, BANNER_WIDTH, -BANNER_HEIGHT);
    fill(0, 0, 0);
    strokeWeight(0);
    text(FINISH_TEXT, finishBannerX + (BANNER_WIDTH / 2), ground_height - BANNER_POLE_HEIGHT - (BANNER_HEIGHT / 2) - 5);
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

        //Set label display state
        this.labelDisplayed = false;
    }

    /*
    * Display Leg
    */
    display(){
        //Draw flag
        //Set stroke props
        if(brightness(skyColor) < SKY_BRIGHTNESS_THRESH){
            stroke(0, 0, 100);
        }else{
            stroke(0, 0, 0);
        }
        strokeWeight(1);
        //Draw flag
        let bottomY = ground_height - (this.portions[0].start_elev * HEIGHT_MULT);
        fill(0, 0, 100);
        rect(this.x, bottomY - FLAG_POLE_HEIGHT, FLAG_WIDTH, FLAG_HEIGHT);
        //Draw pole
        fill(0, 0, 0);
        rect(this.x, bottomY, FLAG_POLE_WIDTH, -FLAG_POLE_HEIGHT);
        //Draw text
        textAlign(CENTER, CENTER);
        textSize(FLAG_FONT_SIZE);
        text(str(this.legNum + 1), this.x + (FLAG_WIDTH / 2), bottomY - FLAG_POLE_HEIGHT + (FLAG_HEIGHT / 2) - 5);

        //Set color and stroke
        let fillColor = lerpColor(color(EASIEST_COLOR), color(HARDEST_COLOR), this.difficulty/maxDifficulty);
        stroke(0, 0, 0);
        strokeWeight(SHAPE_STROKE_WEIGHT);
        
        //Change alpha if hovering
        /*
        if(this.mouseIsOver()){
            fill(hue(fillColor), saturation(fillColor) * 0.8, brightness(fillColor) * 0.8);
        }else{
            */
            fill(fillColor);
        //}

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
        /*
        if(this.mouseIsOver()){
            this.drawLabel();
        }
        */
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
            + CLIMB_LABEL + str(this.climb_total) + FT_LABEL;

        //Calc position
        let infoX = this.x + (this.legWidth/2);
        let infoY = ground_height - (this.height/3);

        //Draw text
        stroke(0, 0, 0);
        strokeWeight(TEXT_STROKE_WEIGHT);
        textAlign(CENTER, CENTER);
        textSize(LABEL_FONT_SIZE);
        fill(TEXT_COLOR);
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
    constructor(x, y, width, height){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    display(){
        image(cloudImg, this.x, this.y, this.width, this.height);
    }

    move(dx){
        this.x += dx;
    }

    isOnScreen(){
        return this.x > -this.width  && this.x < width;
    }
}

class DistanceBar{
    /*
    * distance - distance the bar is representing in miles
    */
    constructor(x, y, distance){
        this.x = x;
        this.y = y;
        this.distance = distance;
    }

    display(){
        //Base
        fill(0, 0, 0);
        rect(this.x, this.y, this.distance * WIDTH_MULT, DIST_BAR_HEIGHT);

        //First tick
        rect(this.x, this.y, DIST_BAR_TICK_WIDTH, -DIST_BAR_TICK_HEIGHT);

        //Middle ticks
        for(let i = 1; i < this.distance; i++){
            let mainX = this.x + (i * WIDTH_MULT);
            rect(mainX, this.y, DIST_BAR_TICK_WIDTH, -DIST_BAR_TICK_HEIGHT);
            rect(mainX - (WIDTH_MULT * 0.25), this.y, DIST_BAR_TICK_WIDTH / 2, -(DIST_BAR_TICK_HEIGHT / 2));
            rect(mainX - (WIDTH_MULT * 0.5), this.y, DIST_BAR_TICK_WIDTH / 2, -(DIST_BAR_TICK_HEIGHT / 2));
            rect(mainX - (WIDTH_MULT * 0.75), this.y, DIST_BAR_TICK_WIDTH / 2, -(DIST_BAR_TICK_HEIGHT / 2));
        }

        //Last ticks
        let currDist = Math.floor(this.distance) + 0.25;
        while(currDist < this.distance){
            rect(this.x + (currDist * WIDTH_MULT), this.y, DIST_BAR_TICK_WIDTH / 2, -(DIST_BAR_TICK_HEIGHT / 2));
            currDist += 0.25;
        }
        rect(this.x + this.distance * WIDTH_MULT, this.y, -DIST_BAR_TICK_WIDTH, -DIST_BAR_TICK_HEIGHT);

        //Text
        textAlign(CENTER, TOP);
        for(let i = 0; i < this.distance; i += 5){
            text(str(i) + " mi", this.x + (i * WIDTH_MULT), this.y + 10);
        }
        text(str(this.distance) + " mi", this.x + (this.distance * WIDTH_MULT), this.y + 10);

    }

    move(dx){
        this.x += dx;
    }
}