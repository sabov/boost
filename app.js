/*jQuery(function() {
    var container;

    var camera, scene, renderer, cameraTarget;

    var has_gl = false;
    var keyboard = new THREEx.KeyboardState();

    var delta;
    var time;
    var oldTime;
    var angle = 0;
    var radians;
    var shift = 0;

    var uniforms, uniforms2;
    var mesh, mesh2;
    var uniformsArr = [];

    init();
    animate();

    function init() {

        container = document.createElement( 'div' );
        document.body.appendChild( container );

        try {
            // renderer
            renderer = new THREE.WebGLRenderer({antialias: true});
            renderer.setSize( window.innerWidth, window.innerHeight );

            container.appendChild( renderer.domElement );
            has_gl = true;
        }
        catch (e) {
            // need webgl
            console.log('No WebGL!');
            return;
        }

        scene = new THREE.Scene();
        
        cameraTarget = new THREE.Vector3(0,0,-70);
        camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.lookAt( cameraTarget );
        scene.add( camera );


        scene.add(createTube());
        scene.add(createObstacle(4, 0xcb3131, 200.0) );//add a mesh with geometry to it

        scene.add(createArrows(16, 0x338eda, 280.0));

        //scene.add(createCube(6, 0xcb3131, 200.0));
        //scene.add(createObstacle(12, 0x338eda, 290.0));
        //scene.add(createObstacle(-2, 0xd03ddd, 490.0));
        scene.add(createObstacle(0, 0xcb3131, 420.0) );//add a mesh with geometry to it
        //scene.add(createObstacle(10, 0x43cb31, 360.0));
        //scene.add(createObstacle(18, 0x338eda, 400.0));
        //scene.add(createObstacle(16, 0x338eda, 500.0));
        //scene.add(createObstacle(0, 0x43cb31, 690.0));
        //scene.add(createObstacle(4, 0x43cb31, 650.0));

        THREEx.WindowResize(renderer, camera);
        window.addEventListener("deviceorientation", function(e) {
            shift = e.beta;
        }, true);

    }


    function createTube() {

        var lng = 600;
        var tube = new THREE.CylinderGeometry(30, 30, lng, 12, 60, true);
        tube.applyMatrix( new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-Math.PI/2,0,0)));
        tube.applyMatrix( new THREE.Matrix4().setPosition( new THREE.Vector3( 0, 0, -lng/2 ) ) );

        var map = THREE.ImageUtils.loadTexture( "textures/sq2.jpg" );
        
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        var maxAnisotropy = renderer.getMaxAnisotropy();
        map.anisotropy = maxAnisotropy;

        var attributes = {};

        uniforms = {
            color:      { type: "c", value: new THREE.Color( 0xffffff ) },
            texture:    { type: "t", value: map },
            globalTime: { type: "f", value: 0.0 },
            highlight:  { type: "f", value: 1.0 },
            uvScale:    { type: "v2", value: new THREE.Vector2( 12.0, 30.0 ) }
        };

        var material = new THREE.ShaderMaterial( {
            uniforms:       uniforms,
            attributes:     attributes,
            vertexShader:   document.getElementById( 'vertexshader' ).textContent,
            fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
            side:           THREE.BackSide
        });

        mesh = new THREE.Mesh( tube, material );
        return mesh;
    }

    function createObstacle(pos, color, pause) {
        group = new THREE.Object3D();
        group.add(createCube(pos, color, pause));
        group.add(createPath(pos, color, pause));
        return group;
    }

    function createCube(pos, color, pause) {
        var r = 15.4;
        var geometry = new THREE.CubeGeometry(r, r, 20);
        geometry.applyMatrix( new THREE.Matrix4().setPosition( new THREE.Vector3( 0, 21.5, -30 -20*9 ) ) );
        geometry.applyMatrix( new THREE.Matrix4().makeRotationZ(Math.PI/12 + Math.PI/12*pos));
        var map = THREE.ImageUtils.loadTexture( "textures/mask.png" );
        
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        var maxAnisotropy = renderer.getMaxAnisotropy();
        map.anisotropy = maxAnisotropy;

        var attributes = {};

        var uni = {
            color:      { type: "c", value: new THREE.Color(color) },
            texture:    { type: "t", value: map },
            globalTime: { type: "f", value: 0.0 },
            highlight:  { type: "f", value: pos === 0? 2.0 : 1.0 },
            pause:      { type: "f", value: pause },
            uvScale:    { type: "v2", value: new THREE.Vector2( 1.0, 1.0 ) }
        };

        var material = new THREE.ShaderMaterial( {
            uniforms:       uni,
            attributes:     attributes,
            vertexShader:   document.getElementById( 'cube.vsh' ).textContent,
            fragmentShader: document.getElementById( 'fragmentshader' ).textContent
        });
        uniformsArr.push(uni);
        return new THREE.Mesh( geometry, material );
    }

    function createPath(pos, color, pause) {
        var geometry = new THREE.PlaneGeometry(15.4,200, 1, 20);
        geometry.applyMatrix( new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.PI/2,0,0)));
        geometry.applyMatrix( new THREE.Matrix4().setPosition( new THREE.Vector3( 0, 28.95, -199.93 + 100) ) );
        geometry.applyMatrix( new THREE.Matrix4().makeRotationZ(Math.PI/12 + Math.PI/12*pos));
        var map = THREE.ImageUtils.loadTexture( "textures/mask.png" );
        
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        var maxAnisotropy = renderer.getMaxAnisotropy();
        map.anisotropy = maxAnisotropy;

        var attributes = {};

        var uni = {
            color:      { type: "c", value: new THREE.Color(color) },
            texture:    { type: "t", value: map },
            globalTime: { type: "f", value: 0.0 },
            highlight:  { type: "f", value: pos === 0? 2.0 : 1.0 },
            pause:      { type: "f", value: pause },
            uvScale:    { type: "v2", value: new THREE.Vector2( 1.0, 10.0 ) }
        };

        var material = new THREE.ShaderMaterial( {
            uniforms:       uni,
            attributes:     attributes,
            vertexShader:   document.getElementById( 'cube.vsh' ).textContent,
            fragmentShader: document.getElementById( 'fragmentshader' ).textContent
        });
        uniformsArr.push(uni);
        return new THREE.Mesh( geometry, material );
    }


    function createArrows(pos, color, pause) {
        var geometry = new THREE.PlaneGeometry(16,200, 1, 20);
        geometry.applyMatrix( new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.PI/2,0,0)));
        geometry.applyMatrix( new THREE.Matrix4().setPosition( new THREE.Vector3( 0, 28.7, -200 + 100) ) );
        geometry.applyMatrix( new THREE.Matrix4().makeRotationZ(Math.PI/12 + Math.PI/12*pos));
        var map = THREE.ImageUtils.loadTexture( "textures/arrow.png" );
        
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        var maxAnisotropy = renderer.getMaxAnisotropy();
        map.anisotropy = maxAnisotropy;

        var attributes = {};

        var uni = {
            color:      { type: "c", value: new THREE.Color(color) },
            texture:    { type: "t", value: map },
            globalTime: { type: "f", value: 0.0 },
            pause:      { type: "f", value: pause },
            uvScale:    { type: "v2", value: new THREE.Vector2( 1.0, 10.0 ) }
        };

        var material = new THREE.ShaderMaterial( {
            transparent:    true,
            uniforms:       uni,
            attributes:     attributes,
            vertexShader:   document.getElementById( 'cube.vsh' ).textContent,
            fragmentShader: document.getElementById( 'transparent.fsh' ).textContent
        });
        uniformsArr.push(uni);
        return new THREE.Mesh( geometry, material );
    }

    function animate() {

        requestAnimationFrame( animate );

        render();

    }

    function render() {

        time = new Date().getTime();
        delta = time - oldTime;
        oldTime = time;

        if (isNaN(delta) || delta > 1000 || delta === 0 ) {
            delta = 1000/60;
        }

        if(keyboard.pressed("left")) {
            angle += 2;
        } else if(keyboard.pressed("right")) {
            angle -= 2;
        }
        if(shift !== 0) {
            angle -= shift * 0.15;
        }
        radians = angle * Math.PI / 180;

        uniforms.globalTime.value += delta*0.0006;
        uniformsArr.forEach(function(uniform) {
            uniform.globalTime.value = uniforms.globalTime.value;
        });


        //cameraTarget.x = -10 * Math.sin(time/3000);
        //cameraTarget.y = -10 * Math.cos(time/4000);

        //mesh.rotation.z += Math.abs(Math.sin(time/4000))*0.01;
        
        //mesh2.rotation.z = mesh.rotation.z;

        //camera.position.x = 13 * Math.sin(time/2000);
        //camera.position.y = 13 * Math.cos(time/2000);
        camera.position.x = 25 * Math.sin(radians);
        camera.position.y = 25 * Math.cos(radians);
        //camera.position.y = -23;
        camera.lookAt( cameraTarget );

        camera.up.x = -Math.sin(radians);
        camera.up.y = -Math.cos(radians);

        if (has_gl) {
            renderer.render( scene, camera );
        }

    }
});*/

conf = {
    colors: [0xcb3131, 0x338eda, 0xd03ddd],
    radius: 30,
    length: 600,
    numOfSegments: 12,
    textureLength: 10,
    speed: 10,
    pathLength: 20
};

G = function() {

    this.oldTime = 0;
    this.globalTime = 0;
    this.angle = 0;
    this.uniformsArr = [];

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
    this.init();
    this.animate();
};

G.prototype = {
    init: function(){
        this.scene = new THREE.Scene();
        this.camera = this.createCamera();
        this.scene.add(this.camera);
        this.scene.add(this.createTube(conf.radius, conf.length, conf.numOfSegments, conf.textureLength, conf.speed));
        this.scene.add(this.createPath(10, conf.colors[0], 10, 20));

        THREEx.WindowResize(this.renderer, this.camera);
    },
    createCamera: function() {
        cameraTarget = new THREE.Vector3(0,0,-70);
        camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.lookAt( cameraTarget );
        return camera;
    },
    createTube: function(radius, length, numOfSegments, textureLength, speed) {
        var geometry = new THREE.CylinderGeometry(radius, radius, length, numOfSegments, length/textureLength, true);
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
            speed:      { type: "f", value: speed },
            highlight:  { type: "f", value: 1.0 },
            uvScale:    { type: "v2", value: new THREE.Vector2( numOfSegments, length/textureLength ) }
        };
        this.uniformsArr.push(uniforms);

        var material = new THREE.ShaderMaterial( {
            uniforms:       uniforms,
            attributes:     attributes,
            vertexShader:   document.getElementById( 'vertexshader' ).textContent,
            fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
            side:           THREE.BackSide
        });

        mesh = new THREE.Mesh( geometry, material );
        return mesh;
    },
    createObstacle: function() {
    },
    createCube: function() {
    },
    createPath: function(pos, color, distance, length) {

        var geometry = new THREE.PlaneGeometry(15.4,200, 1, 20);
        geometry.applyMatrix( new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.PI/2,0,0)));
        geometry.applyMatrix( new THREE.Matrix4().setPosition( new THREE.Vector3( 0, 28.95, -199.93 + 100) ) );
        geometry.applyMatrix( new THREE.Matrix4().makeRotationZ(Math.PI/12 + Math.PI/12*pos));
        var map = THREE.ImageUtils.loadTexture( "textures/mask.png" );

        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        var maxAnisotropy = this.renderer.getMaxAnisotropy();
        map.anisotropy = maxAnisotropy;

        var attributes = {};

        var uniforms = {
            color:      { type: "c", value: new THREE.Color(color) },
            texture:    { type: "t", value: map },
            globalTime: { type: "f", value: 0.0 },
            highlight:  { type: "f", value: pos === 0? 2.0 : 1.0 },
            pause:      { type: "f", value: 100},
            speed:      { type: "f", value: conf.speed},
            uvScale:    { type: "v2", value: new THREE.Vector2( 1.0, 10.0 ) }
        };

        var material = new THREE.ShaderMaterial( {
            uniforms:       uniforms,
            attributes:     attributes,
            vertexShader:   document.getElementById( 'cube.vsh' ).textContent,
            fragmentShader: document.getElementById( 'fragmentshader' ).textContent
        });
        this.uniformsArr.push(uniforms);
        return new THREE.Mesh( geometry, material );
    },
    createArrows: function() {
    },
    getCollisions: function() {
    },
    rotateCamera: function(angle) {
        this.angle += angle;
    },
    runBoostEffect: function() {
    },
    runCrashEffect: function() {
    },
    highlightObstacle: function() {
    },
    animate: function() {
        requestAnimationFrame(this.animate.bind(this));
        this.render();
    },
    render: function() {

        var time = new Date().getTime();
        var delta = time - this.oldTime;
        this.oldTime = time;

        if (isNaN(delta) || delta > 1000 || delta === 0 ) {
            delta = 1000/60;
        }


        var radians = this.angle * Math.PI / 180;

        //uniforms.globalTime.value += delta*0.0006;
        this.globalTime += delta * 0.0006;
        this.uniformsArr.forEach(function(uniform) {
            uniform.globalTime.value = this.globalTime;
        }.bind(this));


        //cameraTarget.x = -10 * Math.sin(time/3000);
        //cameraTarget.y = -10 * Math.cos(time/4000);

        //mesh.rotation.z += Math.abs(Math.sin(time/4000))*0.01;
        
        //mesh2.rotation.z = mesh.rotation.z;

        //camera.position.x = 13 * Math.sin(time/2000);
        //camera.position.y = 13 * Math.cos(time/2000);
        this.camera.position.x = 25 * Math.sin(radians);
        this.camera.position.y = 25 * Math.cos(radians);
        //this.camera.position.y = -23;
        //camera.lookAt( cameraTarget );

        this.camera.up.x = -Math.sin(radians);
        this.camera.up.y = -Math.cos(radians);

        this.renderer.render(this.scene, this.camera);
    }
};

Boost = function(config) {
    this.G = new G();
    this.bindKeyboard();
    this.keyboard = new THREEx.KeyboardState();
};

Boost.prototype = {
    setSpeed: function() {
    },
    bindKeyboard: function() {
        jQuery(window).on('keypress', function() {
            if(this.keyboard.pressed("left")) {
                this.G.rotateCamera(2);
            } else if(this.keyboard.pressed("right")) {
                this.G.rotateCamera(-2);
            }
        }.bind(this));
    },
    bindOrientation: function() {
        window.addEventListener("deviceorientation", function(e) {
            //shift = e.beta;
        }, true);
    },
    generateObstacles: function() {
    }
};

jQuery(function(){
    new Boost();
});
