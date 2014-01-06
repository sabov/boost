var Boost = function(conf) {
    this.shift = 0;
    this.G = new GraphicInterface(conf);
    this.keyboard = new THREEx.KeyboardState();
    this.bindOrientation();
    this.G.onRender(function(renderer) {
        var p = this.G.getCameraPosition();
        //this.G.highlightLine(p);
        this.setCameraRotation();
        this.G.onCollisions(function(){
            this.G.stopAnimation();
            jQuery('.popup').show();
        }.bind(this));
    }.bind(this));
};

Boost.prototype = {
    setSpeed: function() {
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
