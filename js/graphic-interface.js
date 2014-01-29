var GraphicInterface = function(conf) {

    this.conf = conf;
    this.oldTime = 0;
    this.runAnimation = true;
    this.globalTime = 0;
    this.distance = 0;
    this.cameraAngle = 0;
    this.cameraPosition = 0;
    this.cameraTarget = new THREE.Vector3(0,10000,0);
    this.uniformsArr = [];
    this.cubeUniformsArr = [];
    this.arrowUniformsArr = [];
    this.onRenderFunctions = [];
    this.flashEffect = false;
    this.shakeAnimation = false;
    this.animator = null;
    this.clock = new THREE.Clock();

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


        var path = new THREE.SplineCurve3([
           new THREE.Vector3(0, 0, 0),
           new THREE.Vector3(10, 300, 200),
           new THREE.Vector3(100, 750, 100),
           new THREE.Vector3(201, 1610, 0),
           new THREE.Vector3(300, 2500, -300),
           new THREE.Vector3(0, 3580, -10000)
        ]);

        this.path = new Path(path, 4000);

        this.arrow = this.createArrows(this.path, 0);
        this.scene.add(this.arrow);

        this.tube = this.createTubePiece(this.path, 0);
        this.scene.add(this.tube);
        for(var i = 1; i < 20; i++) {
            this.scene.add(this.createTubePiece(this.path, i));
        }

        this.cube = this.createCube(1, this.conf.colors[0], 10);

        var x = new THREE.Vector3(1, 0, 0);
        var y = new THREE.Vector3(0, 1, 0);
        var z = new THREE.Vector3(0, 0, 1);

        var u = this.conf.textureLength/this.path.getLength() * 2.5;
        var p = this.path.getPointAt(u);

        var t = this.path.getTangentAt(u).normalize();
        var n = this.path.getNormalAt(u).normalize();
        var b = this.path.getBinormalAt(u).normalize();

        //n = n.clone().multiplyScalar(-1);

        n = n.clone();
        var nz = n.clone();
        nz.y = 0;
        nz = nz.normalize();

        var ny = n.clone();
        ny.z = 0;
        ny = ny.normalize();

        var nx = t.clone();

        this.cube.position = p;

        //this.arrow.position = p;

        var angZ = Math.acos(ny.dot(x));
        var angY = Math.acos(nz.dot(x));
        var angX = Math.acos(nx.dot(z));
        //this.a = x;


        this.cube.rotateZ(angZ);
        this.cube.rotateY(angY);
        this.cube.rotateX(-angX);
        this.cube.geometry.verticesNeedUpdate = true;

        //this.arrow.rotateX(angX);
        //this.arrow.rotateY(Math.PI*3/2 + angY);
        //this.arrow.rotateZ(angZ);

        //this.arrow.rotateZ(angZ);
        //this.arrow.rotateY(angY);
        //this.arrow.rotateX(-angX);
        //this.arrow.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0,  -getDistanceToSegment(this.conf.numOfSegments, this.conf.radius) - 0.5));
        //this.arrow.rotateY(Math.PI / 12 * 3);

        //p = this.getCubePositionAt(u);
        this.cube.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(getDistanceToSegment(this.conf.numOfSegments, this.conf.radius) - 8, 0, 0));

        this.cube.rotateZ(Math.PI / 12 * 3);
        //for ( i = 0; i < this.tube.geometry.faces.length / 24 * 20; i ++ ) {
            if(i % 24 === 0 || (i - 1) % 24 === 0) {
                //this.tube.geometry.faces[ i ].color.setHex(this.conf.colors[0]);
            }
        //}
        //var an = Math.acos(n.clone().dot(x));
        //var l = n.clone().cross(x).normalize();

        //var ang = Math.acos(c.dot(e));
        //var d = a.cross(c).normalize();
        //this.a = c.cross(e).normalize();
        //this.a = x;

        //this.cube.rotateOnAxis(l, an);
        

        this.scene.add(this.cube);

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

        distance = distance || 0;
        var uniforms = {
            color:      { type: "c", value: new THREE.Color( 0xffffff ) },
            texture:    { type: "t", value: map },
            globalTime: { type: "f", value: 0.0 },
            speed:      { type: "f", value: this.conf.speed * this.conf.textureLength },
            distance:   { type: "f", value: distance * this.conf.textureLength },
            dynamic:    { type: "f", value: dynamic },
            highlight:  { type: "f", value: 1.0 },
            //uvScale:    { type: "v2", value: new THREE.Vector2( this.conf.numOfSegments, this.conf.tubeLength) }
            uvScale:    { type: "v2", value: new THREE.Vector2(1, 1) }
        };
        this.tubeUniform = uniforms;
        this.uniformsArr.push(uniforms);
        this.tubeUniforms = uniforms;

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
    createTubePiece: function(path, num) {

        var geometry = new THREE.TubePieceGeometry(
            path,
            this.conf.tubePieceLength * num,
            this.conf.tubePieceLength,
            this.conf.tubePieceLength / this.conf.textureLength,
            this.conf.radius,
            this.conf.numOfSegments
        );

        var texturePath = num % 2 === 0? 'textures/mask.png' : 'textures/sq.jpg';

        var map2 = THREE.ImageUtils.loadTexture( "textures/arrow2.png" );
        //this.animator = new this.TextureAnimator( map, 4, 1, 4, 200 );    
        map2.wrapS = map2.wrapT = THREE.RepeatWrapping;

        var map = THREE.ImageUtils.loadTexture(texturePath);
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        var maxAnisotropy = this.renderer.getMaxAnisotropy();
        map.anisotropy = maxAnisotropy;
        //map.repeat.set( this.conf.tubePieceLength / this.conf.textureLength, this.conf.numOfSegments );


        var attributes = {};

        var uniforms = {
            //color:      { type: "c", value: new THREE.Color( 0xffffff ) },
            texture:    { type: "t", value: map },
            texture2:    { type: "t", value: map2 },
            uvScale:    { type: "v2", value: new THREE.Vector2(10, 12) }
        };

        var material = new THREE.ShaderMaterial( {
            uniforms:       uniforms,
            attributes:     attributes,
            vertexShader:   this.vertexShader,
            fragmentShader: this.fragmentShader,
            vertexColors: THREE.FaceColors,
            color: 0xFFFFFF,
            side:           THREE.BackSide
        });

        /*material = new THREE.MeshBasicMaterial({
            map: map,
            color: 0xFFFFFF,
            transparent: true,
            vertexColors: THREE.FaceColors,
            side: THREE.BackSide
            //wireframe: true
        });*/

        var mesh = new THREE.Mesh( geometry, material );
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

        var geometry = new THREE.CubeGeometry(16, width, this.conf.textureLength);
        //geometry.applyMatrix(new THREE.Matrix4().makeTranslation(p.x, p.y, p.z));
        //geometry.applyMatrix(new THREE.Matrix4().makeRotationAxis(n, 0.4));
        //geometry.applyMatrix( new THREE.Matrix4().makeRotationZ(-Math.PI/12 - Math.PI/6*pos));
        var map = THREE.ImageUtils.loadTexture( "textures/sq2.jpg" );

        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        var maxAnisotropy = this.renderer.getMaxAnisotropy();
        map.anisotropy = maxAnisotropy;


        var material = new THREE.MeshBasicMaterial({
            map: map
            //wireframe: true
        });


        /*var attributes = {};

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
        });*/
        //this.uniformsArr.push(uniforms);
        //this.cubeUniformsArr.push(uniforms);
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
    createArrows: function(path, num) {

        var length = this.conf.arrowLength * this.conf.textureLength;
        var width = getSegmentWidth(this.conf.numOfSegments, this.conf.radius);
        var distanceToCenter = getDistanceToSegment(this.conf.numOfSegments, this.conf.radius) - 0.01;

        //var geometry = new THREE.TubePlaneGeometry(width, length, 1, this.conf.arrowLength * 10);
        
        var geometry = new THREE.TubePlaneGeometry(
            path,
            this.conf.tubePieceLength * num + 20,
            this.conf.tubePieceLength - 60,
            //this.conf.tubePieceLength / this.conf.textureLength,
            7,
            this.conf.radius - 0.1,
            this.conf.numOfSegments,
            0
        );

        var map = THREE.ImageUtils.loadTexture( "textures/arrow2.png" );
        this.animator = new this.TextureAnimator( map, 4, 1, 4, 200 );    

        //map.wrapS = map.wrapT = THREE.RepeatWrapping;
        var maxAnisotropy = this.renderer.getMaxAnisotropy();
        //map.anisotropy = maxAnisotropy;
        //map.repeat.set(1, 12);

        var attributes = {};

        var uniforms = {
            //color:      { type: "c", value: new THREE.Color( 0xffffff ) },
            //texture:    { type: "t", value: map },
            //texture2:    { type: "t", value: map2 },
            uvScale:    { type: "v2", value: new THREE.Vector2(10, 12) }
        };


        var material = new THREE.MeshBasicMaterial( {
            map: map,
            //color: 0x000000,
            //wireframe: true
            side:THREE.DoubleSide,
            transparent: true
        } );

        //var material = new THREE.ShaderMaterial( {
            //uniforms:       uniforms,
            //attributes:     attributes,
            //vertexShader:   this.vertexShader,
            //fragmentShader: this.fragmentShader,
            ////vertexColors: THREE.FaceColors,
            //color: 0xFFFFFF,
            //transparent: true,
            //side:           THREE.BackSide
        /*});*/

        //this.uniformsArr.push(uniforms);
        //this.arrowUniformsArr.push(uniforms);

        return new THREE.Mesh( geometry, material );
    },
    createAnimatedRows: function(pos, distance) {
        var length = this.conf.arrowLength;
        var width = getSegmentWidth(this.conf.numOfSegments, this.conf.radius);
        var distanceToCenter = getDistanceToSegment(this.conf.numOfSegments, this.conf.radius) - 0.01;

        var geometry = new THREE.PlaneGeometry(width, this.conf.textureLength, 1, 1);
        //var geometry = new THREE.PlaneGeometry(10, 10, 2, 2);
        //geometry.applyMatrix( new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.PI/2,0,0)));
        //geometry.applyMatrix( new THREE.Matrix4().setPosition( new THREE.Vector3( 0, 10, -50)));
        //geometry.applyMatrix( new THREE.Matrix4().makeRotationZ(-Math.PI/12 - Math.PI/6*pos));

        var map = THREE.ImageUtils.loadTexture( "textures/arrow2.png" );
        //this.animator = new this.TextureAnimator( map, 4, 1, 4, 200 );    

        //map.wrapS = map.wrapT = THREE.RepeatWrapping;
        //var maxAnisotropy = this.renderer.getMaxAnisotropy();
        //map.anisotropy = maxAnisotropy;

        //var attributes = {};

        //var uniforms = {
            //color:      { type: "c", value: new THREE.Color(0xffffff) },
            //texture:    { type: "t", value: map },
            //globalTime: { type: "f", value: 0.0 },
            //position:   { type: "f", value: pos },
            //dynamic:    { type: "f", value: false },
            //highlight:  { type: "f", value: 1.0 },
            //distance:   { type: "f", value: distance * this.conf.textureLength},
            //speed:      { type: "f", value: this.conf.speed * this.conf.textureLength },
            //uvScale:    { type: "v2", value: new THREE.Vector2( 1.0, this.conf.arrowLength ) }
        //};

        /*var material = new THREE.ShaderMaterial( {
            uniforms:       uniforms,
            attributes:     attributes,
            transparent:    true,
            vertexShader:   this.arrowVertexshader,
            fragmentShader: this.fragmentShader
        });*/
        var material = new THREE.MeshBasicMaterial( {
            //map: map, 
            color: 0x000000,
            //wireframe: true
            side:THREE.DoubleSide
            //transparent: true
        } );
        //this.uniformsArr.push(uniforms);
        //this.arrowUniformsArr.push(uniforms);

        return new THREE.Mesh( geometry, material );
    },
    removeObstacle: function(obstacle) {
    },
    getCubePositionAt: function(u) {
        var point = this.path.getPointAt(u);
        var normal = this.path.getNormalAt(u);
        var binormal = this.path.getBinormalAt(u);

        var radius = 14;
        //var radians = Math.Pi/12;
        var radians = 0;
        var cx = -radius * Math.cos(radians);
        var cy = radius * Math.sin(radians);

        point.x += cx * normal.x + cy * binormal.x;
        point.y += cx * normal.y + cy * binormal.y;
        point.z += cx * normal.z + cy * binormal.z;

        return point;
    },
    getCameraPositionAt: function(u) {
        var point = this.path.getPointAt(u);
        var normal = this.path.getNormalAt(u);
        var binormal = this.path.getBinormalAt(u);

        var radius = this.conf.cameraRadius;
        var radians = angleToRadians(this.cameraAngle);
        var cx = -radius * Math.cos(radians);
        var cy = radius * Math.sin(radians);

        point.x += cx * normal.x + cy * binormal.x;
        point.y += cx * normal.y + cy * binormal.y;
        point.z += cx * normal.z + cy * binormal.z;

        return point;
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
    changeTubeTexture: function(texture1, texture2) {
        this.tubeUniforms.dynamic.value = true;
        this.scene.add(this.createTube(10, this.conf.tubeLength, true, 'textures/' + texture2));
        this.scene.add(this.createTube(this.conf.tubeLength, this.conf.tubeLength + 10, true, 'textures/' + texture1));
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

    TextureAnimator: function (texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) {   
        this.tilesHorizontal = tilesHoriz;
        this.tilesVertical = tilesVert;
        this.numberOfTiles = numTiles;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping; 
        texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );

        this.tileDisplayDuration = tileDispDuration;

        this.currentDisplayTime = 0;

        this.currentTile = 0;
            
        this.update = function( milliSec ) {
            this.currentDisplayTime += milliSec;
            while (this.currentDisplayTime > this.tileDisplayDuration)
            {
                this.currentDisplayTime -= this.tileDisplayDuration;
                this.currentTile++;
                if (this.currentTile == this.numberOfTiles)
                    this.currentTile = 0;
                var currentColumn = this.currentTile % this.tilesHorizontal;
                texture.offset.x = currentColumn / this.tilesHorizontal;
                var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
                texture.offset.y = currentRow / this.tilesVertical;                               
            }
        };
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

        var delta = this.clock.getDelta(); 
        this.animator.update(1000 * delta);

        this.onRenderFunctions.forEach(function(func) {
            func(this.renderer);
        }.bind(this));

        var time = new Date().getTime();
        delta = time - this.oldTime;
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

        var u = this.globalTime / 40;
        //u = 0;

        if(this.a) {
            this.arrow.rotateOnAxis(this.a, this.globalTime / 100);
        }


        var point = this.path.getPointAt(u);
        var cameraPosition = this.getCameraPositionAt(u);
        var cameraTarget = this.getCameraPositionAt(u + 0.001);
        var up = new THREE.Vector3();
        up.subVectors(point, cameraPosition);

        this.camera.position = cameraPosition;
        this.camera.up = up;
        this.camera.lookAt(cameraTarget);

        this.renderer.render(this.scene, this.camera);
        this.stats.end();
    }
};

