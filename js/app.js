var Boost = function(conf, pathConf) {
    var dropSpeed = false;
    this.shift = 0;
    this.G = new GraphicInterface(conf, pathConf, function() {
        //on error
        jQuery('.start-page').hide();
        jQuery('.browser-page').css('display', 'block');
    });
    this.keyboard = new THREEx.KeyboardState();
    this.bindOrientation();

    this.G.onRender(function(renderer) {
        var p = this.G.getCameraPosition();
        this.G.highlightLine(p);
        this.setCameraRotation();
    }.bind(this));

    this.G.onArrowCollisions(function() {
        this.G.setSpeed(this.G.getSpeed() + 3);
        this.flashEffect();
        this.G.shakeCamera();
    }.bind(this));

    this.G.onCollisions(function(){
        this.flashEffect();
        jQuery('.game-over-page').show().animate({'opacity':  '1'}, 1000);
        this.G.shakeCamera(function() {
            this.G.stopAnimation();
        }.bind(this));
        this.G.slowDownTo(0, -0.05);
    }.bind(this));
    this.initEvents();

};

Boost.prototype = {
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
    flashEffect: function() {
        jQuery('.flash').show().animate({'opacity':  '0.8'}, 50).animate({'opacity':  '0'}, 500, function() {
            jQuery('.flash').hide();
        });
    },
    bindOrientation: function() {
        window.addEventListener("deviceorientation", function(e) {
            this.shift = e.beta;
        }.bind(this), true);
    },
    initEvents: function() {
        jQuery('.start-button').click(function(){
            jQuery('.start-page').hide();
            this.G.init();
            this.G.animate();
        }.bind(this));
        jQuery(window).on('keypress', function() {
            if(this.keyboard.pressed('escape')) {
                jQuery('.pause-page').toggle();
                this.G.toggleAnimation();
            }
        }.bind(this));
    },
    generateObstacles: function() {
    }
};

jQuery(function(){
    new Boost(config, pathConfig);
});
