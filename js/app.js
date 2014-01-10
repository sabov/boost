var Boost = function(conf) {
    var dropSpeed = false;
    this.shift = 0;
    this.G = new GraphicInterface(conf);
    this.keyboard = new THREEx.KeyboardState();
    this.bindOrientation();
    this.G.onRender(function(renderer) {
        var p = this.G.getCameraPosition();
        this.G.highlightLine(p);
        this.setCameraRotation();
        this.G.onArrowCollisions(function() {
            this.G.setSpeed(30);
            this.G.runFlashEffect();
            this.G.shakeCamera();
        }.bind(this));
        this.G.onCollisions(function(){
            this.G.setSpeed(2);
            this.G.runFlashEffect();
            this.G.shakeCamera();
            dropSpeed = true;
            jQuery('.popup').delay(500).animate({'opacity':  '1'}, 1000);
        }.bind(this));
        if(dropSpeed) {
            this.dropSpeed();
        }
    }.bind(this));
};

Boost.prototype = {
    dropSpeed: function(callback) {
        var currSpeed = this.G.getSpeed();
        if(currSpeed > 0) {
            this.G.setSpeed(currSpeed - 0.01);
        } else {
            if(callback) callback();
        }
    },
    setCameraRotation: function() {
        if(this.keyboard.pressed("left")) {
            this.G.rotateCamera(2);
        } else if(this.keyboard.pressed("right")) {
            this.G.rotateCamera(-2);
        }
        if(this.shift !== 0) {
            this.G.rotateCamera(-0.15 * this.shift);
        }
    },
    bindOrientation: function() {
        window.addEventListener("deviceorientation", function(e) {
            this.shift = e.beta;
        }.bind(this), true);
    },
    generateObstacles: function() {
    }
};

jQuery(function(){
    new Boost(config);
});
