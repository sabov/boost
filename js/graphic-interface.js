var GraphicInterface = function(conf) {

    this.conf = conf;
    this.oldTime = 0;
    this.runAnimation = true;
    this.globalTime = 0;
    this.distance = 0;
    this.cameraAngle = 90;
    this.cameraPosition = 0;
    this.cameraTarget = new THREE.Vector3(0,0,-70);
    this.uniformsArr = [];
    this.cubeUniformsArr = [];
    this.onRenderFunctions = [];
    this.flashEffect = false;
    this.shakeAnimation = false;

    var container = document.createElement( 'div' );
    document.body.appendChild( container );

    try {
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        container.appendChild( this.renderer.domElement );
    }
    catch (e) {
        console.log('No WebGL!');
        return;
    }
    SHADER_LOADER.load(function(data) {

        this.fragmentShader = data.commonShader.fragment;
        this.vertexShader = data.commonShader.vertex;

        this.setupStats();
        this.init();
        this.animate();

    }.bind(this));
};

GraphicInterface.prototype = {
    init: function(){
        var conf = this.conf;
        this.scene = new THREE.Scene();
        this.camera = this.createCamera();
        this.scene.add(this.camera);
        this.scene.add(this.createTube());
        this.scene.add(this.createObstacle(1, conf.colors[0], 7, 'pillar'));
        this.scene.add(this.createObstacle(3, conf.colors[1], 8, 'pillar'));
        this.scene.add(this.createObstacle(10, conf.colors[0], 20));
        this.scene.add(this.createObstacle(8, conf.colors[2], 16));
        this.scene.add(this.createObstacle(12, conf.colors[2], 4));
        this.scene.add(this.createObstacle(11, conf.colors[1], 15));
        this.scene.add(this.createArrows(0, 8));
        this.scene.add(this.createObstacle(2, conf.colors[2], 12));
        this.scene.add(this.createObstacle(7, conf.colors[1], 24));

        setTimeout(function() {
            this.shakeCamera();
            this.runFlashEffect();
        }.bind(this), 1000);
        THREEx.WindowResize(this.renderer, this.camera);
    },
    createCamera: function() {
        var cameraTarget = new THREE.Vector3(0,0,-70);
        var camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.lookAt( cameraTarget );
        return camera;
    },
    createTube: function() {
        var length = this.conf.tubeLength * this.conf.textureLength;
        var geometry = new THREE.CylinderGeometry(
            this.conf.radius,
            this.conf.radius,
            length,
            this.conf.numOfSegments,
            this.conf.tubeLength * 10,
            true);
        geometry.applyMatrix( new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-Math.PI/2,0,0)));
        geometry.applyMatrix( new THREE.Matrix4().setPosition( new THREE.Vector3( 0, 0, -length/2 ) ) );

        var map = THREE.ImageUtils.loadTexture( "textures/sq2.jpg" );

        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        var maxAnisotropy = this.renderer.getMaxAnisotropy();
        map.anisotropy = maxAnisotropy;

        var attributes = {};

        var uniforms = {
            color:      { type: "c", value: new THREE.Color( 0xffffff ) },
            texture:    { type: "t", value: map },
            globalTime: { type: "f", value: 0.0 },
            speed:      { type: "f", value: this.conf.speed },
            dynamic:    { type: "f", value: false },
            highlight:  { type: "f", value: 1.0 },
            uvScale:    { type: "v2", value: new THREE.Vector2( this.conf.numOfSegments, this.conf.tubeLength) }
        };
        this.uniformsArr.push(uniforms);

        var material = new THREE.ShaderMaterial( {
            uniforms:       uniforms,
            attributes:     attributes,
            vertexShader:   this.vertexShader,
            fragmentShader: this.fragmentShader,
            side:           THREE.BackSide
        });

        mesh = new THREE.Mesh( geometry, material );
        return mesh;
    },
    createObstacle: function(pos, color, distance, type) {
        type = type || 'cube';
        group = new THREE.Object3D();
        var types = {
            cube: function() {
                group.add(this.createCube(pos, color, distance + this.conf.pathLength));
                group.add(this.createPath(pos, color, distance));
                return group;
            },
            pillar: function() {
                group.add(this.createPillar(pos, color, distance + this.conf.pathLength));
                group.add(this.createPath(pos, color, distance));
                group.add(this.createPath(pos + 6, color, distance));
                return group;
            }
        };
        return types[type].bind(this)();
    },
    createCube: function(pos, color, distance) {
        var width = getSegmentWidth(this.conf.numOfSegments, this.conf.radius);
        var distanceToCenter = getDistanceToSegment(this.conf.numOfSegments, this.conf.radius) - 0.01;

        var geometry = new THREE.CubeGeometry(width, width, this.conf.textureLength);
        geometry.applyMatrix( new THREE.Matrix4().setPosition( new THREE.Vector3( 0, distanceToCenter - width/2, -this.conf.textureLength*3/2)));//prevent clipping
        geometry.applyMatrix( new THREE.Matrix4().makeRotationZ(-Math.PI/12 - Math.PI/6*pos));
        var map = THREE.ImageUtils.loadTexture( "textures/mask.png" );

        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        var maxAnisotropy = this.renderer.getMaxAnisotropy();
        map.anisotropy = maxAnisotropy;

        var attributes = {};

        var uniforms = {
            color:      { type: "c", value: new THREE.Color(color) },
            texture:    { type: "t", value: map },
            globalTime: { type: "f", value: 0.0 },
            position:   { type: "f", value: pos },
            dynamic:    { type: "f", value: true },
            highlight:  { type: "f", value: 1.0 },
            distance:   { type: "f", value: (distance - 1) * this.conf.textureLength},
            speed:      { type: "f", value: this.conf.speed * this.conf.textureLength },
            uvScale:    { type: "v2", value: new THREE.Vector2( 1.0, 1.0) }
        };

        var material = new THREE.ShaderMaterial( {
            uniforms:       uniforms,
            attributes:     attributes,
            vertexShader:   this.vertexShader,
            fragmentShader: this.fragmentShader
        });
        this.uniformsArr.push(uniforms);
        this.cubeUniformsArr.push(uniforms);
        return new THREE.Mesh( geometry, material );
    },
    createPillar: function(pos, color, distance) {
        var width = getSegmentWidth(this.conf.numOfSegments, this.conf.radius);
        var distanceToCenter = getDistanceToSegment(this.conf.numOfSegments, this.conf.radius) - 0.01;
        var height = distanceToCenter * 2;

        var geometry = new THREE.CubeGeometry(width, height, this.conf.textureLength);
        geometry.applyMatrix( new THREE.Matrix4().setPosition( new THREE.Vector3( 0, 0, -this.conf.textureLength*3/2)));//prevent clipping
        geometry.applyMatrix( new THREE.Matrix4().makeRotationZ(-Math.PI/12 - Math.PI/6*pos));
        var map = THREE.ImageUtils.loadTexture( "textures/mask.png" );

        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        var maxAnisotropy = this.renderer.getMaxAnisotropy();
        map.anisotropy = maxAnisotropy;

        var attributes = {};

        var uniforms = {
            color:      { type: "c", value: new THREE.Color(color) },
            texture:    { type: "t", value: map },
            globalTime: { type: "f", value: 0.0 },
            position:   { type: "f", value: pos },
            dynamic:    { type: "f", value: true },
            highlight:  { type: "f", value: 1.0 },
            distance:   { type: "f", value: (distance - 1) * this.conf.textureLength},
            speed:      { type: "f", value: this.conf.speed * this.conf.textureLength },
            uvScale:    { type: "v2", value: new THREE.Vector2( 1.0, 1.0) }
        };

        var material = new THREE.ShaderMaterial( {
            uniforms:       uniforms,
            attributes:     attributes,
            vertexShader:   this.vertexShader,
            fragmentShader: this.fragmentShader
        });
        this.uniformsArr.push(uniforms);
        this.cubeUniformsArr.push(uniforms);
        return new THREE.Mesh( geometry, material );
    },
    createPath: function(pos, color, distance) {

        var length = this.conf.pathLength * this.conf.textureLength;
        var width = getSegmentWidth(this.conf.numOfSegments, this.conf.radius);
        var distanceToCenter = getDistanceToSegment(this.conf.numOfSegments, this.conf.radius) - 0.02;

        var geometry = new THREE.PlaneGeometry(width, length, 1, this.conf.pathLength * 10);
        geometry.applyMatrix( new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.PI/2,0,0)));
        geometry.applyMatrix( new THREE.Matrix4().setPosition( new THREE.Vector3( 0, distanceToCenter, -length/2)));
        geometry.applyMatrix( new THREE.Matrix4().makeRotationZ(-Math.PI/12 - Math.PI/6*pos));
        var map = THREE.ImageUtils.loadTexture( "textures/mask.png" );

        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        var maxAnisotropy = this.renderer.getMaxAnisotropy();
        map.anisotropy = maxAnisotropy;

        var attributes = {};

        var uniforms = {
            color:      { type: "c", value: new THREE.Color(color) },
            texture:    { type: "t", value: map },
            globalTime: { type: "f", value: 0.0 },
            position:   { type: "f", value: pos },
            dynamic:    { type: "f", value: true },
            highlight:  { type: "f", value: 1.0 },
            distance:   { type: "f", value: distance * this.conf.textureLength},
            speed:      { type: "f", value: this.conf.speed * this.conf.textureLength },
            uvScale:    { type: "v2", value: new THREE.Vector2( 1.0, this.conf.pathLength ) }
        };

        var material = new THREE.ShaderMaterial( {
            uniforms:       uniforms,
            attributes:     attributes,
            vertexShader:   this.vertexShader,
            fragmentShader: this.fragmentShader
        });
        this.uniformsArr.push(uniforms);
        return new THREE.Mesh( geometry, material );
    },
    createArrows: function(pos, distance) {

        var length = this.conf.arrowLength * this.conf.textureLength;
        var width = getSegmentWidth(this.conf.numOfSegments, this.conf.radius);
        var distanceToCenter = getDistanceToSegment(this.conf.numOfSegments, this.conf.radius) - 0.01;

        var geometry = new THREE.PlaneGeometry(width, length, 1, this.conf.arrowLength * 10);
        geometry.applyMatrix( new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.PI/2,0,0)));
        geometry.applyMatrix( new THREE.Matrix4().setPosition( new THREE.Vector3( 0, distanceToCenter, -length/2)));
        geometry.applyMatrix( new THREE.Matrix4().makeRotationZ(Math.PI/12 + Math.PI/6*pos));
        var map = THREE.ImageUtils.loadTexture( "textures/arrow.png" );

        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        var maxAnisotropy = this.renderer.getMaxAnisotropy();
        map.anisotropy = maxAnisotropy;

        var attributes = {};

        var uniforms = {
            color:      { type: "c", value: new THREE.Color(0xffffff) },
            texture:    { type: "t", value: map },
            globalTime: { type: "f", value: 0.0 },
            position:   { type: "f", value: pos },
            dynamic:    { type: "f", value: true },
            highlight:  { type: "f", value: 1.0 },
            distance:   { type: "f", value: distance * this.conf.textureLength},
            speed:      { type: "f", value: this.conf.speed * this.conf.textureLength },
            uvScale:    { type: "v2", value: new THREE.Vector2( 1.0, this.conf.arrowLength ) }
        };

        var material = new THREE.ShaderMaterial( {
            uniforms:       uniforms,
            attributes:     attributes,
            transparent:    true,
            vertexShader:   this.vertexShader,
            fragmentShader: this.fragmentShader
        });
        this.uniformsArr.push(uniforms);
        return new THREE.Mesh( geometry, material );
    },
    onCollisions: function(callback) {
        var p = this.camerPosition;
        this.cubeUniformsArr.forEach(function(uniform) {
            if(uniform.position && uniform.position.value == p) {
                if(uniform.distance &&
                   this.distance > uniform.distance.value + 5 &&
                   this.distance < uniform.distance.value + this.conf.textureLength + 5) {
                    if(callback) callback();
                }
            }
        }.bind(this));
    },
    stopAnimation: function() {
        this.runAnimation = false;
    },
    getCameraPosition: function() {
        return this.camerPosition;
    },
    rotateCamera: function(angle) {
        this.cameraAngle += angle;

        var num = this.conf.numOfSegments;
        var position = Math.floor(this.cameraAngle / (360 / num));
        if(position >= num || position < 0) {
            var divisor = Math.floor(position / num);
            position = position - divisor * num;
        }
        this.camerPosition = position;
    },
    runBoostEffect: function() {
    },
    runCrashEffect: function() {
    },
    runFlashEffect: function() {
        this.uniformsArr.forEach(function(uniform) {
            uniform.highlight.value = 5.5;
        });
        this.flashEffect = true;
    },
    shakeCamera: function() {
        this.shakeAnimation = true;
        this.shakeAnimationI = 0;
    },
    computeCameraTargetVector: function() {
        this.shakeAnimationI += 0.1;

        var cameraTarget = this.cameraTarget.clone();
        var radians = angleToRadians(this.cameraAngle);

        cameraTarget.x = Math.sin(radians) * Math.sin(this.shakeAnimationI * 5) * 10 * Math.exp(-this.shakeAnimationI);
        cameraTarget.y = Math.cos(radians) * Math.sin(this.shakeAnimationI * 5) * 10 * Math.exp(-this.shakeAnimationI);

        return cameraTarget;
    },
    highlightLine: function(position) {
        this.uniformsArr.forEach(function(uniform) {
            if(uniform.position && uniform.position.value == position) {
                uniform.highlight.value = 2.0;
            } else {
                uniform.highlight.value = 1.0;
            }
        });
    },
    setupStats: function() {
        this.rendererStats = new THREEx.RendererStats();
        $(this.rendererStats.domElement).css({
            position: 'absolute',
            left: '0px',
            bottom: '0px'
        }).appendTo($('body'));

        this.stats = new Stats();
        this.stats.setMode(0); // 0: fps, 1: ms

        $(this.stats.domElement).css({
            position: 'absolute',
            right: '0px',
            bottom: '0px'
        }).appendTo($('body'));
    },
    onRender: function(func) {
        this.onRenderFunctions.push(func);
    },

    animate: function() {
        if(this.runAnimation) {
            requestAnimationFrame(this.animate.bind(this));
            this.render();
        }
    },
    render: function() {

        this.stats.begin();
        this.rendererStats.update(this.renderer);

        this.onRenderFunctions.forEach(function(func) {
            func(this.renderer);
        }.bind(this));

        var time = new Date().getTime();
        var delta = time - this.oldTime;
        this.oldTime = time;

        if (isNaN(delta) || delta > 1000 || delta === 0 ) {
            delta = 1000/60;
        }

        var radians = angleToRadians(this.cameraAngle);

        this.globalTime += delta * 0.0006;
        this.distance = this.globalTime * this.conf.speed * this.conf.textureLength;

        this.uniformsArr.forEach(function(uniform) {
            uniform.globalTime.value = this.globalTime;
            if(this.flashEffect) {
                if(uniform.highlight.value < 1.2) {
                    uniform.highlight.value = 1;
                    this.flashEffect = false;
                } else {
                    uniform.highlight.value -= 0.2;
                }
            }
        }.bind(this));

        this.camera.position.x = 25 * Math.sin(radians);// - Math.sin(this.globalTime*40)*2;
        this.camera.position.y = 25 * Math.cos(radians);// -  Math.cos(this.globalTime*40)*2;

        if(this.shakeAnimation) {
            var E = 0.01;
            var CT = this.cameraTarget;
            var newCT = this.computeCameraTargetVector();
            if(Math.abs(CT.x - newCT.x) < E && Math.abs(CT.y - newCT.y) < E) {
                this.shakeAnimation = false;
                this.cameraTarget = new THREE.Vector3(0, 0, -70);
            } else {
                this.cameraTarget = newCT;
            }
        }

        this.camera.up.x = -Math.sin(radians);
        this.camera.up.y = -Math.cos(radians);

        this.camera.lookAt(this.cameraTarget);


        this.renderer.render(this.scene, this.camera);

        this.stats.end();
    }
};
