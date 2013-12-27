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

    var uniforms, uniforms2;
    var mesh, mesh2;

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

        var lng = 600;

        var tube = new THREE.CylinderGeometry(5, 30, lng, 100, 50, true);
        tube.applyMatrix( new THREE.Matrix4().makeRotationFromEuler( new
                                                                    THREE.Euler(-Math.PI/2,0,0)) );
        tube.applyMatrix( new THREE.Matrix4().setPosition( new THREE.Vector3( 0, 0, -lng/2 ) ) );

        var map = THREE.ImageUtils.loadTexture( "textures/sq.jpg" );
        
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
        scene.add( mesh );

       /* // tube 2*/
        //var tube2 = new THREE.CylinderGeometry(20, 3, lng, 50, 50, true);
        //tube2.applyMatrix( new THREE.Matrix4().makeRotationFromEuler(
            //new THREE.Euler( -Math.PI / 2, 0, 0 ) ) );
        //tube2.applyMatrix( new THREE.Matrix4().setPosition( new THREE.Vector3( 0, 0, -lng/2 ) ) );

        //var map = THREE.ImageUtils.loadTexture( "textures/dstripe_flipped.jpg" );
        
        //map.wrapS = map.wrapT = THREE.RepeatWrapping;
        //var maxAnisotropy = renderer.getMaxAnisotropy();
        //map.anisotropy = maxAnisotropy;
        

        //uniforms2 = {

            //color:      { type: "c", value: new THREE.Color( 0xffffff ) },
            //texture:    { type: "t", value: map },
            //globalTime: { type: "f", value: 0.0 },
            //uvScale:    { type: "v2", value: new THREE.Vector2( 2.0, 10.0 ) },
            //light:      { type: "v3", value: new THREE.Vector3( 1.0, 1.0, 0.5 ) },
            //shadow:     { type: "f", value: 0.0 }

        //};


        //var material = new THREE.ShaderMaterial( {

            //uniforms:       uniforms2,
            //attributes:     attributes,
            //vertexShader:   document.getElementById( 'vertexshader' ).textContent,
            //fragmentShader: document.getElementById( 'fragmentshader' ).textContent
            
        //});

        //mesh2 = new THREE.Mesh( tube2, material );
        //scene.add( mesh2 );

        THREEx.WindowResize(renderer, camera);

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
        radians = angle * Math.PI / 180;

        uniforms.globalTime.value += delta*0.0006;
        //uniforms2.globalTime.value = uniforms.globalTime.value;

        //cameraTarget.x = -10 * Math.sin(time/3000);
        //cameraTarget.y = -10 * Math.cos(time/4000);

        //mesh.rotation.z += Math.abs(Math.sin(time/4000))*0.01;
        
        //mesh2.rotation.z = mesh.rotation.z;

        //camera.position.x = 13 * Math.sin(time/2000);
        //camera.position.y = 13 * Math.cos(time/2000);
        camera.position.x = 20 * Math.sin(radians);
        camera.position.y = 20 * Math.cos(radians);
        //camera.position.y = -23;
        camera.lookAt( cameraTarget );

        camera.up.x = -Math.sin(radians);
        camera.up.y = -Math.cos(radians);

        if (has_gl) {
            renderer.render( scene, camera );
        }

    }
});
