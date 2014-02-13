var Boost = function(conf, pathConf) {
    this.conf = conf;
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
        var dist = Math.round(this.G.distance/10)
        $(".counter").html(dist);
    }.bind(this));


    this.G.onArrowCollisions(function() {
        this.arrowCollisionHandler();
    }.bind(this));



    this.G.onCollisions(function(){
        this.onCollisionsHandler();
    }.bind(this));
    this.initEvents();
};

Boost.prototype = {

    arrowCollisionHandler: function(){        
        this.flashEffect();
        this.G.shakeCamera();
        var arrNum = ((this.G.getSpeed() - this.conf.speed)/this.conf.acceleration);
        if (arrNum <= 2){ 
        this.G.setSpeed(this.G.getSpeed() + this.conf.acceleration);
        arrNum = ((this.G.getSpeed() - this.conf.speed)/this.conf.acceleration);           
            $(".acceleration-3x").show();
            $(".acceleration-trapez").show();
            $(".acceleration-holder").show();
            if(arrNum == 1){                
                $(".first-accelerator").show();
            } else if (arrNum == 2){            
                $(".second-accelerator").show();
            } else $(".third-accelerator").show();
        }        
        setTimeout(function(){
            this.G.onArrowCollisions(this.arrowCollisionHandler.bind(this));
        }.bind(this), 1000);
    },
    onCollisionsHandler: function()
    {
        this.flashEffect();
        if (this.G.getSpeed() > this.conf.speed)
        {
            $(".acceleration-3x").hide();
            $(".second-accelerator").hide();
            $(".first-accelerator").hide();
            $(".third-accelerator").hide();
            this.G.shakeCamera();
            this.G.setSpeed(this.conf.speed);
        }else {
        jQuery('.game-over-page').show().animate({'opacity':  '1'}, 1000);
        this.G.shakeCamera(function() {
            this.G.stopAnimation();
        }.bind(this));
        this.G.slowDownTo(0, -0.05);
        }    
        setTimeout(function(){
            this.G.onCollisions(this.onCollisionsHandler.bind(this));
        }.bind(this), 1000);
    },
    setCameraRotation: function() {
        if(this.keyboard.pressed("left")) {
            this.G.rotateCamera(-2);
        } else if(this.keyboard.pressed("right")) {
            this.G.rotateCamera(2);
        }
        if(this.shift !== 0) {
            this.G.rotateCamera(0.15 * this.shift);
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
            $(".counter").show();
        }.bind(this));
        jQuery('.restart-button, .quit-button').click(function(){
            location.reload();
        }.bind(this));
        jQuery(window).on('keydown', function(e) {
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
