var GraphicInterface = function(conf) {

    this.conf = conf;
    this.oldTime = 0;
    this.runAnimation = true;
    this.globalTime = 0;
    this.distance = 0;
    this.cameraAngle = 0;
    this.cameraPosition = 0;
    this.cameraTarget = new THREE.Vector3(0,0,-1000);
    this.uniformsArr = [];
    this.cubeUniformsArr = [];
    this.arrowUniformsArr = [];
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

        var spline1 = new THREE.SplineCurve3([
           new THREE.Vector3(0, 0, 0),
           new THREE.Vector3(0, 200, 0),
           new THREE.Vector3(10, 400, 0)
        ]);
        var spline2 = new THREE.SplineCurve3([
           new THREE.Vector3(10, 100, 0),
           new THREE.Vector3(40, 200, 0)
        ]);
        for(var i = 1; i < 60; i++) {
            this.scene.add(this.createTubeSegment(spline1, i));
        }
        //this.scene.add(this.createTube(spline2));

        THREEx.WindowResize(this.renderer, this.camera);
    },
    createCamera: function() {
        var camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 1, 10000 );
        return camera;
    },
    createTube: function(spline) {
        var length = this.conf.tubeLength * this.conf.textureLength;
        var path = new THREE.Curves.Custom();
        //var geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
        var geometry = new THREE.TubeTileGeometry(spline, 20, 30, 12, 0, 0, false);
        //var geometry = new THREE.CylinderGeometry(
            //this.conf.radius,
            //this.conf.radius,
            //length,
            //this.conf.numOfSegments,
            //this.conf.tubeLength * 10,
            //true);
        geometry.applyMatrix( new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-Math.PI/2,0,0)));
        geometry.applyMatrix( new THREE.Matrix4().setPosition( new THREE.Vector3( 0, 0, -50) ) );

        var map = THREE.ImageUtils.loadTexture( "textures/sq.jpg" );

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
            //uvScale:    { type: "v2", value: new THREE.Vector2( this.conf.numOfSegments, this.conf.tubeLength) }
            uvScale:    { type: "v2", value: new THREE.Vector2(1, 1) }
        };
        this.tubeUniform = uniforms;
        this.uniformsArr.push(uniforms);

        //var material = new THREE.ShaderMaterial( {
            //uniforms:       uniforms,
            //attributes:     attributes,
            //vertexShader:   this.vertexShader,
            //fragmentShader: this.fragmentShader,
            //side:           THREE.BackSide
        /*});*/
        var material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            side: THREE.BackSide
        });

        mesh = new THREE.Mesh( geometry, material );
        return mesh;
    },
    createTubeSegment: function(path, segmentNum) {
        var group = new THREE.Object3D();
        for(var i = 0; i < 12; i++) {
            var geometry = new THREE.TubeTileGeometry(path, 60, 20, 12, segmentNum, i, false);
            geometry.applyMatrix( new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-Math.PI/2,0,0)));
            geometry.applyMatrix( new THREE.Matrix4().setPosition( new THREE.Vector3( 0, 0, -20) ) );

            var map = THREE.ImageUtils.loadTexture( "textures/sq2.jpg" );

            var material = new THREE.MeshBasicMaterial({
                map: map,
                side: THREE.BackSide
            });

            var mesh = new THREE.Mesh( geometry, material );
            group.add(mesh);
        }
        return group;
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
        geometry.applyMatrix( new THREE.Matrix4().makeRotationZ(-Math.PI/12 - Math.PI/6*pos));
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
        this.arrowUniformsArr.push(uniforms);

        return new THREE.Mesh( geometry, material );
    },
    removeObstacle: function(obstacle) {
    },
    getSpeed: function() {
        return this.tubeUniform.speed.value;
    },
    setSpeed: function(speed) {
        this.globalTime = this.globalTime * this.tubeUniform.speed.value/speed;
        this.uniformsArr.forEach(function(uniform) {
            uniform.speed.value = speed * this.conf.textureLength;
        }.bind(this));
        this.tubeUniform.speed.value = speed;
    },
    onCollisions: function(callback) {
        var p = this.camerPosition;
        this.cubeUniformsArr.forEach(function(uniform, i) {
            if(uniform.position && uniform.position.value == p) {
                if(uniform.distance &&
                    this.distance - this.conf.textureLength > uniform.distance.value &&
                    this.distance - 2 * this.conf.textureLength < uniform.distance.value ) {
                    if(callback) callback();
                }
            }
        }.bind(this));
    },
    onArrowCollisions: function(callback) {
        var index = -1;
        var p = this.camerPosition;
        this.arrowUniformsArr.forEach(function(uniform, i) {
            if(uniform.position && uniform.position.value == p) {
                if(uniform.distance &&
                    this.distance - this.conf.textureLength > uniform.distance.value &&
                    this.distance - 10 * this.conf.textureLength < uniform.distance.value ) {
                    index = i;
                    if(callback) callback();
                }
            }
        }.bind(this));
        if(index !== -1) {
            this.arrowUniformsArr.splice(index, 1);
        }
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
            uniform.highlight.value = 12.5;
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

        cameraTarget.x = Math.sin(radians) * Math.sin(this.shakeAnimationI * 7) * 15 * Math.exp(-this.shakeAnimationI * 0.7);
        cameraTarget.y = Math.cos(radians) * Math.sin(this.shakeAnimationI * 7) * 15 * Math.exp(-this.shakeAnimationI * 0.7);

        return cameraTarget;
    },
    highlightLine: function(position) {
        if(!this.flashEffect) {
            this.uniformsArr.forEach(function(uniform) {
                if(uniform.position && uniform.position.value == position) {
                    uniform.highlight.value = 2.0;
                } else {
                    uniform.highlight.value = 1.0;
                }
            });
        }
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
                    uniform.highlight.value -= 0.5;
                }
            }
        }.bind(this));

        //this.camera.position.x = 25 * Math.sin(radians);
        //this.camera.position.y = 25 * Math.cos(radians);

        this.camera.position.z -= 5;
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

        //this.camera.up.x = -Math.sin(radians);
        //this.camera.up.y = -Math.cos(radians);

        this.camera.lookAt(this.cameraTarget);

        this.renderer.render(this.scene, this.camera);

        this.stats.end();
    }
};

THREE.Curves = {};
THREE.Curves.GrannyKnot = THREE.Curve.create(function(){},
     function(t) {
         var cos = Math.cos;
         var sin = Math.sin;
        t = 2 * Math.PI * t;

        var x = -0.22 * cos(t) - 1.28 * sin(t) - 0.44 * cos(3 * t) - 0.78 * sin(3 * t);
        var y = -0.1 * cos(2 * t) - 0.27 * sin(2 * t) + 0.38 * cos(4 * t) + 0.46 * sin(4 * t);
        var z = 0.7 * cos(3 * t) - 0.4 * sin(3 * t);
        return new THREE.Vector3(x, y, z).multiplyScalar(20);
    }
);
THREE.Curves.HeartCurve = THREE.Curve.create(

function(s) {

    this.scale = (s === undefined) ? 5 : s;

},

function(t) {

    t *= 2 * Math.PI;

    var tx = 16 * Math.pow(Math.sin(t), 3);
    ty = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t), tz = 0;

    return new THREE.Vector3(tx, ty, tz).multiplyScalar(this.scale);

}

);

THREE.Curves.Custom = THREE.Curve.create(

function() {},

function(t) {

    t *= 2 * Math.PI;

    var tx = t,
    ty = t, 
    tz = 0;

    return new THREE.Vector3(tx, ty, tz).multiplyScalar(this.scale);

}

);
