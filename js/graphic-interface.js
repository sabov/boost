var GraphicInterface = function(conf, pathConf) {

    this.conf = conf;
    this.pathConf = pathConf;
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
        this.initTextures();
        this.initPath();
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

        this.createTube();

        this.scene.add(this.createArrows(5, 1, this.textures.arrowColorSprite));

        var cube = this.createCube(this.conf.colors[0], this.textures.simple);
        this.setCubePosiotion(cube, 6, 0);
        this.scene.add(cube);

        //for ( i = 0; i < this.tube.geometry.faces.length / 24 * 20; i ++ ) {
            //if(i % 24 === 0 || (i - 1) % 24 === 0) {
                //this.tube.geometry.faces[ i ].color.setHex(this.conf.colors[0]);
            //}
        //}

        THREEx.WindowResize(this.renderer, this.camera);
    },

    initTextures: function() {
        this.textures = [];
        this.conf.textures.forEach(function(t) {
            var path = this.conf.textureFolder + '/' + t.file;
            var map  = THREE.ImageUtils.loadTexture(path);
            if(t.repeat) {
                map.wrapS = map.wrapT = THREE.RepeatWrapping;
            }
            this.textures[t.name] = map;
        }.bind(this));
    },
    initPath: function() {
        var threePoints = this.pathConf.pathPoints.map(function(p) {
           return new THREE.Vector3(p[0], p[1], p[2]);
        });
        var curve = new THREE.SplineCurve3(threePoints);
        this.path = new Path(curve, this.pathConf.fragmentation);
    },
    createCamera: function() {
        var camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 1, 10000 );
        return camera;
    },
    createTube: function(spline) {
        for(var i = 0; i < 20; i++) {
            var m = i % 2 === 0?  this.textures.simple : this.textures.corner;
            this.scene.add(this.createTubePiece(i, m));
        }
    },
    createTubePiece: function(num, map) {

        var segments = this.conf.tubePieceLength / this.conf.textureLength;

        var geometry = new THREE.TubePieceGeometry(
            this.path,
            this.conf.tubePieceLength * num,
            this.conf.tubePieceLength,
            segments,
            this.conf.radius,
            this.conf.numOfSegments
        );

        var attributes = {};

        var uniforms = {
            texture: { type: "t", value: map },
            uvScale: { type: "v2", value: new THREE.Vector2(segments, this.conf.numOfSegments) }
        };

        var material = new THREE.ShaderMaterial( {
            uniforms:       uniforms,
            attributes:     attributes,
            vertexShader:   this.vertexShader,
            fragmentShader: this.fragmentShader,
            vertexColors:   THREE.FaceColors,
            side:           THREE.BackSide
        });

        return new THREE.Mesh( geometry, material );
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
    createCube: function(color, map) {

        var width = getSegmentWidth(this.conf.numOfSegments, this.conf.radius);

        var geometry = new THREE.CubeGeometry(this.conf.cubeHeight, width, this.conf.textureLength);

        geometry.faces.forEach(function(face) {
            face.color.setHex(color);
        });

        var attributes = {};

        var uniforms = {
            texture:    { type: "t", value: map },
            uvScale:    { type: "v2", value: new THREE.Vector2( 1.0, 1.0) }
        };

        var material = new THREE.ShaderMaterial( {
            uniforms:       uniforms,
            attributes:     attributes,
            vertexShader:   this.vertexShader,
            fragmentShader: this.fragmentShader,
            vertexColors:   THREE.FaceColors
        });

        return new THREE.Mesh( geometry, material );
    },
    setCubePosiotion: function(cube, pos, radialPos) {

        var x = new THREE.Vector3(1, 0, 0);
        var y = new THREE.Vector3(0, 1, 0);
        var z = new THREE.Vector3(0, 0, 1);

        var u = this.conf.textureLength/this.path.getLength() * (pos + 0.5);
        var p = this.path.getPointAt(u);

        var t = this.path.getTangentAt(u).normalize();
        var n = this.path.getNormalAt(u).normalize();
        var b = this.path.getBinormalAt(u).normalize();

        var nz = n.clone();
        nz.y = 0;
        nz = nz.normalize();

        var ny = n.clone();
        ny.z = 0;
        ny = ny.normalize();

        var nx = t.clone();

        var angZ = Math.acos(ny.dot(x));
        var angY = Math.acos(nz.dot(x));
        var angX = Math.acos(nx.dot(z));

        cube.position = p;

        cube.rotateZ(angZ);
        cube.rotateY(angY);
        cube.rotateX(-angX);
        cube.geometry.verticesNeedUpdate = true;

        var distToCenter = getDistanceToSegment(this.conf.numOfSegments, this.conf.radius);
        var shift = distToCenter - this.conf.cubeHeight / 2;
        cube.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(shift, 0, 0));

        cube.rotateZ(Math.PI / 12 + Math.PI / 6 * radialPos);
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
    createArrows: function(pos, radialPos, map) {

        var length = this.conf.arrowLength * this.conf.textureLength;

        var geometry = new THREE.TubePlaneGeometry(
            this.path,
            this.conf.textureLength * pos,
            length,
            this.conf.arrowLength,
            this.conf.radius - 0.1,
            this.conf.numOfSegments,
            radialPos
        );

        this.animator = new this.TextureAnimator( map, 4, 1, 4, 200 );

        var material = new THREE.MeshBasicMaterial( {
            map: map,
            side:THREE.DoubleSide,
            transparent: true
        });

        return new THREE.Mesh(geometry, material);
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
        u = 0;

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

