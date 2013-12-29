jQuery(function() {
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
            var gl = renderer.context;
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.BLEND);
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

        var lng = 600;

        var tube = new THREE.CylinderGeometry(30, 30, lng, 12, 50, true);
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
        scene.add(mesh);
        scene.add(createCube(0, 0xd03ddd, 0.0));
        scene.add(createCube(6, 0xcb3131, 200.0));
        scene.add(createCube(12, 0x338eda, 200.0));
        scene.add(createCube(0, 0xd03ddd, 400.0));
        scene.add(createCube(10, 0x43cb31, 400.0));
        scene.add(createCube(18, 0x338eda, 400.0));
        scene.add(createCube(16, 0x338eda, 600.0));
        scene.add(createCube(0, 0x43cb31, 600.0));

        THREEx.WindowResize(renderer, camera);
        window.addEventListener("deviceorientation", function(e) {
            shift = e.beta;
        }, true);

    }

    function createCube(pos, color, pause) {
        var geometry = new THREE.CubeGeometry(15,15,15);
        geometry.applyMatrix( new THREE.Matrix4().setPosition( new THREE.Vector3( 0, 21.5, -400 ) ) );
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
});
