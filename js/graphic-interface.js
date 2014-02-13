var GraphicInterface = function(conf, pathConf, onError) {

    this.conf = conf;
    this.pathConf = pathConf;
    this.oldTime = 0;
    this.runAnimation = true;
    this.globalTime = 0;
    this.distance = 0;
    this.speed = this.conf.speed;
    this.cameraAngle = 0;
    this.cameraPosition = 0;
    this.onRenderFunctions = [];
    this.flashEffect = false;
    this.shakeAnimation = false;
    this.animator = null;
    this.lastPos = 0;
    //this.clock = new THREE.Clock();

    this.tubePieces = [];
    this.objects    = [];

    try {
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }
    catch (e) {
        if(onError) onError();
        return;
    }
    SHADER_LOADER.load(function(data) {

        this.fragmentShader = data.commonShader.fragment;
        this.vertexShader = data.commonShader.vertex;
        
        this.initTextures();
        this.initPath();

    }.bind(this));
};

GraphicInterface.prototype = {
    init: function(){

        this.setupStats();

        var container = document.createElement( 'div' );
        document.body.appendChild( container );
        container.appendChild( this.renderer.domElement );


/*        var width = window.innerWidth || 2;*/
        //var height = window.innerHeight || 2;
        //var effectHBlur = new THREE.ShaderPass( THREE.HorizontalBlurShader );
        //var effectVBlur = new THREE.ShaderPass( THREE.VerticalBlurShader );
        //effectVBlur.renderToScreen = true;
        //var rtParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: true };
        //effectHBlur.uniforms.h.value = 2 / ( width / 2 );
        //effectVBlur.uniforms.v.value = 2 / ( height / 2 );
        //composerScene = new THREE.EffectComposer( this.renderer);
        //composerScene.addPass( effectHBlur );
        //composerScene.addPass( effectVBlur );
        ////renderScene = new THREE.TexturePass( composerScene.renderTarget2 );

        var SCREEN_WIDTH = window.innerWidth;
        var SCREEN_HEIGHT = window.innerHeight;

        var conf = this.conf;
        this.scene = new THREE.Scene();
        this.camera = this.createCamera();
        this.scene.add(this.camera);

        //hblur = new THREE.ShaderPass( THREE.ShaderExtras[ "horizontalTiltShift" ] );
        //vblur = new THREE.ShaderPass( THREE.ShaderExtras[ "verticalTiltShift" ] );

        hblur = new THREE.ShaderPass( THREE.HorizontalTiltShiftShader );
        vblur = new THREE.ShaderPass( THREE.VerticalTiltShiftShader);

        var bluriness = 7;

        hblur.uniforms[ 'h' ].value = bluriness / SCREEN_WIDTH;
        vblur.uniforms[ 'v' ].value = bluriness / SCREEN_HEIGHT;
        hblur.uniforms[ 'r' ].value = vblur.uniforms[ 'r' ].value = 0.6;


        var renderModel = new THREE.RenderPass( this.scene, this.camera );

        vblur.renderToScreen = true;

        composer = new THREE.EffectComposer( this.renderer);

        edgeEffect2 = new THREE.ShaderPass( THREE.EdgeShader2 );
        edgeEffect2.uniforms[ 'aspect' ].value.x = window.innerWidth;
        edgeEffect2.uniforms[ 'aspect' ].value.y = window.innerHeight;

        composer.addPass( renderModel );
        //composer.addPass( edgeEffect2 );
        composer.addPass( hblur );
        composer.addPass( vblur );

        //cube = this.createCube(this.conf.colors[0], this.textures.simple);
        //this.setCubePosiotion(cube, 3, 6);
        //this.scene.add(this.createPath(3, 5, this.conf.colors[2], this.textures.simple));
        //this.scene.add(cube);

        this.createTube();
        this.generateObstacles(1000);

        setInterval(function() {
            this.generateArrows();
        }.bind(this), 5000);
        

        //this.scene.add(this.createArrows(155, 6, this.textures.arrowColorSprite));
        //this.scene.add(this.createArrows(155, 0, this.textures.arrowColorSprite));

        THREEx.WindowResize(this.renderer, this.camera);
    },
    generateObstacles: function(time) {
        setTimeout(this.generateObstacles.bind(this, time*0.99 ), time);
        var tex = this.textures.simple;
        console.log(time);
        var l = this.conf.tubePieceLength;
        if(this.distance > l * 31 ) {
            tex = this.textures.corner;
            console.log('now');
        }
        if(this.distance > l * 62 ) {
            tex = this.textures.cornerInverted;
        }
        if(this.distance < l * 2) return;
        if(this.distance > l * 26 && this.distance < l * 31) return;
        if(this.distance > l * 56 && this.distance < l * 62) return;
        this.generateRandomObstacle(tex);
    },
    generateRandomObstacle: function(texture) {
        var radialPos = Math.floor(Math.random() * 11) - 1;
        var pos = Math.round(this.distance / this.conf.textureLength) - Math.floor(Math.random() * 10);
        if(pos === this.lastPos) {
            this.lastPos = ++pos;
        }
        var color = Math.floor(Math.random() * 3);
        this.scene.add(this.createObstacle(pos, radialPos, this.conf.colors[color], texture));
    },
    generateArrows: function() {
        var radialPos = Math.floor(Math.random() * 4) + 1;
        var pos = Math.round(this.distance / this.conf.textureLength) + 40;
        this.scene.add(this.createArrows(pos, radialPos, this.textures.arrowColorSprite));
        this.scene.add(this.createArrows(pos, radialPos + 6, this.textures.arrowColorSprite));
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
        //var camera = new THREE.Camera( 65, window.innerWidth / window.innerHeight, 1, 10000 );
        return camera;
    },
    createTube: function(spline) {
        var i = 0;
        var tubePiece;
        while(i < 30) {
            tubePiece = this.createTubePiece(i++, this.textures.simple, 0xFFFFFF);
            this.scene.add(tubePiece);
        }
        this.scene.add(this.createTubePiece(i++, this.textures.inverted, 0x000000));
        this.scene.add(this.createTubePiece(i++, this.textures.inverted, 0x000000));
        while(i < 62) {
            tubePiece = this.createTubePiece(i++, this.textures.corner, 0xFFFFFF);
            this.scene.add(tubePiece);
        }
        while(i < 92) {
            tubePiece = this.createTubePiece(i++, this.textures.cornerInverted, 0x000000);
            this.scene.add(tubePiece);
        }

    },
    createTubePiece: function(num, map, color) {

        var segments = this.conf.tubePieceLength / this.conf.textureLength;

        var geometry = new THREE.TubePieceGeometry(
            this.path,
            this.conf.tubePieceLength * num,
            this.conf.tubePieceLength,
            segments,
            this.conf.radius,
            this.conf.numOfSegments
        );

        map.repeat.set( 10, 12 );
        var uniforms = {
            color:     { type: "c", value: new THREE.Color(color) },
            highlight: { type: "f", value: 1.0 },
            texture:   { type: "t", value: map },
            uvScale:   { type: "v2", value: new THREE.Vector2(segments, this.conf.numOfSegments) }
        };

        var material = new THREE.ShaderMaterial({
            uniforms:       uniforms,
            vertexShader:   this.vertexShader,
            fragmentShader: this.fragmentShader,
            side:           THREE.BackSide
        });

        return new THREE.Mesh( geometry, material );
    },
    createObstacle: function(position, radialPos, color, texture, type) {
        type = type || 'cube';
        group = new THREE.Object3D();
        var types = {
            cube: function() {
                var cube = this.createCube(color, texture);
                this.setCubePosiotion(cube, position + this.conf.pathLength, radialPos);
                group.add(cube);
                group.add(this.createPath(position, radialPos, color, texture));
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

        var uniforms = {
            color:     { type: "c", value: new THREE.Color(color) },
            highlight: { type: "f", value: 1.0 },
            texture:   { type: "t", value: map },
            uvScale:   { type: "v2", value: new THREE.Vector2( 1.0, 1.0) }
        };

        var material = new THREE.ShaderMaterial( {
            uniforms:       uniforms,
            vertexShader:   this.vertexShader,
            fragmentShader: this.fragmentShader
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

        if(radialPos < 0) {
            radialPos = 12 + radialPos;
        }
        this.objects.push({
            type:      'cube',
            uniforms:  cube.material.uniforms,
            pos:       pos,
            radialPos: radialPos
        });
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
    createPath: function(pos, radialPos, color, map) {

        var length = this.conf.pathLength * this.conf.textureLength;

        var geometry = new THREE.TubePlaneGeometry(
            this.path,
            this.conf.textureLength * pos,
            length,
            this.conf.pathLength,
            this.conf.radius - 0.1,
            this.conf.numOfSegments,
            radialPos
        );

        var uniforms = {
            color:     { type: "c", value: new THREE.Color(color) },
            highlight: { type: "f", value: 1.0 },
            texture:   { type: "t", value: map },
            uvScale:   { type: "v2", value: new THREE.Vector2(1.0, 1.0) }
        };

        var material = new THREE.ShaderMaterial( {
            uniforms:       uniforms,
            vertexShader:   this.vertexShader,
            fragmentShader: this.fragmentShader,
            side:           THREE.BackSide
        });

        if(radialPos < 0) {
            radialPos = 12 + radialPos;
        }
        this.objects.push({
            type:      'path',
            uniforms:  uniforms,
            pos:       pos,
            radialPos: radialPos
        });

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

        this.objects.push({
            type:      'arrows',
            pos:       pos,
            radialPos: radialPos
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
    getPositionAt: function(u, radius, angle) {

        var point = this.path.getPointAt(u);
        var normal = this.path.getNormalAt(u);
        var binormal = this.path.getBinormalAt(u);

        var radians = angleToRadians(angle);
        var cx = -radius * Math.cos(radians);
        var cy = radius * Math.sin(radians);

        point.x += cx * normal.x + cy * binormal.x;
        point.y += cx * normal.y + cy * binormal.y;
        point.z += cx * normal.z + cy * binormal.z;

        return point;
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
        return this.speed;
    },
    setSpeed: function(speed) {
        this.speed = speed;
    },
    slowDownTo: function(newSpeed, step, callback) {
        var index = this.onRender(function() {
            if(this.speed + step > newSpeed) {
                this.speed += step;
            } else {
                this.speed = newSpeed;
                this.removeOnRenderHandler(index);
                if(callback) callback();
            }
        }.bind(this));
    },
    onCollisions: function(callback) {
        var index = this.onRender(function() {
            var o;
            var p = this.getCameraPosition();
            var l = this.conf.textureLength;
            for(var i = 0; i < this.objects.length; i++) {
                o = this.objects[i];
                if(o.radialPos === p && this.isObstacle(o) &&
                   o.pos * l - l/2 < this.distance && o.pos * l + l  > this.distance) {
                    if(callback) callback();
                    this.removeOnRenderHandler(index);
                }
            }
        }.bind(this));
        
    },
    onArrowCollisions: function(callback) {
         var index = this.onRender(function() {
            var o;
            var p = this.getCameraPosition();
            var t = this.conf.textureLength;
            var l = t * this.conf.arrowLength;
            for(var i = 0; i < this.objects.length; i++) {
                o = this.objects[i];
                if(o.radialPos === p && o.type === 'arrows' &&
                   o.pos * t - t/2 < this.distance && o.pos * t + l  > this.distance) {
                    if(callback) callback();
                    this.removeOnRenderHandler(index);
                }
            }
        }.bind(this));
    },
    stopAnimation: function() {
        this.runAnimation = false;
    },
    toggleAnimation: function() {
        this.runAnimation = !this.runAnimation;
        if(this.runAnimation) {
            this.animate();
        }
    },
    getCameraPosition: function() {
        return this.cameraPosition;
    },
    rotateCamera: function(angle) {
        this.cameraAngle += angle;

        var num = this.conf.numOfSegments;
        var position = Math.floor(this.cameraAngle / (360 / num));
        if(position >= num || position < 0) {
            var divisor = Math.floor(position / num);
            position = position - divisor * num;
        }
        this.cameraPosition = position;
    },
    shakeCamera: function(callback) {
        var i = 0;
        var index = this.onRender(function() {
            var u = this.distance / this.path.getLength();
            var shift = Math.sin(i * 7) * 15 * Math.exp(-i * 0.7);
            this.cameraTarget = this.getPositionAt(u + 0.01, this.conf.cameraRadius + shift, this.cameraAngle);
            this.camera.lookAt(this.cameraTarget);
            var sign = shift/Math.abs(shift);
            shift = -sign * (Math.abs(shift) - 0.1);
            i += 0.1;
            if(i > 10) {
                if(callback) callback();
                this.removeOnRenderHandler(index);
            }
        }.bind(this));
    },
    highlightLine: function(radialPos) {
        this.objects.forEach(function(object) {
            if((object.radialPos === radialPos) && 
               (object.type === 'cube' || object.type === 'path')) {
                if(object.uniforms) object.uniforms.highlight.value = 2.0;
            } else {
                if(object.uniforms) object.uniforms.highlight.value = 1.0;
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
    isObstacle: function(object) {
        return object.type === 'cube' ||
               object.type === 'pillar';
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
        return this.onRenderFunctions.push(func) - 1;
    },
    removeOnRenderHandler: function(index) {
        //this.onRenderFunctions.splice(index, 1);
        this.onRenderFunctions[index] = null;
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

        //var delta = this.clock.getDelta(); 
        //this.animator.update(1000 * delta);


        var time = new Date().getTime();
        delta = time - this.oldTime;
        this.oldTime = time;

        if (isNaN(delta) || delta > 1000 || delta === 0 ) {
            delta = 1000/60;
        }

        var radians = angleToRadians(this.cameraAngle);

        this.globalTime += delta * 0.0006;

        this.distance += this.speed;
        var u = this.distance / this.path.getLength();

        var point = this.path.getPointAt(u);
        var cameraPosition = this.getCameraPositionAt(u);
        this.cameraTarget = this.getCameraPositionAt(u + 0.001);
        var up = new THREE.Vector3();
        up.subVectors(point, cameraPosition);

        this.camera.position = cameraPosition;
        this.camera.up = up;
        this.camera.lookAt(this.cameraTarget);

        this.onRenderFunctions.forEach(function(func) {
            if(func) func(this.renderer);
        }.bind(this));

        //this.renderer.render(this.scene, this.camera);
        //this.renderer.clear();
        //composerScene.render();
        //composerScene.render();

        //this.renderer.clear(); 
        //composer.render();
        //composer.render( 0.1 );
        //cube.rotation.z += 0.01;
        this.renderer.render(this.scene, this.camera);


        this.stats.end();
    }
};

