/**
 * @author WestLangley / https://github.com/WestLangley
 * @author zz85 / https://github.com/zz85
 * @author miningold / https://github.com/miningold
 *
 * Modified from the TubeGeometry by @alexsabov
 *
 * Creates a tube which extrudes along a 3d spline
 *
 * Uses parallel transport frames as described in
 * http://www.cs.indiana.edu/pub/techreports/TR425.pdf
 */

THREE.TubePieceGeometry = function(path, shift, length, segments, radius, radialSegments) {

    THREE.Geometry.call( this );

    this.path = path;
    this.shift = shift || 0;
    this.length = length || 100;
    this.segments = segments || 64;
    this.radius = radius || 1;
    this.radialSegments = radialSegments || 8;

    this.getPoint = function(index) {
        var ratio = this.length / this.path.getLength();
        var shift = this.shift / this.path.getLength();
        return ratio * (index / this.segments) + shift;
    };

    this.grid = [];

    var scope = this,

        tangent,
        normal,
        binormal,

        numpoints = this.segments + 1,

        x, y, z,
        tx, ty, tz,
        u, v,

        cx, cy,
        pos, pos2 = new THREE.Vector3(),
        i, j,
        ip, jp,
        a, b, c, d,
        uva, uvb, uvc, uvd;


    var pathLength = this.path.getLength();
    var segmentLength = this.length / this.segments;
    var segmentsNum = Math.round(pathLength / segmentLength);
    var shiftSegmentsNum = Math.round(this.shift / segmentLength);

    var frames = new THREE.TubePieceGeometry.FrenetFrames( this.path, segmentsNum, this);
    var tangents = [];
    var normals = [];
    var binormals = [];

    for(i = shiftSegmentsNum, j = 0; i < shiftSegmentsNum + this.segments + 1; i++, j++) {
        tangents[j]  = frames.tangents[i];
        normals[j]   = frames.normals[i];
        binormals[j] = frames.binormals[i];
    }

        //tangents = frames.tangents,
        //normals = frames.normals,
        //binormals = frames.binormals;

    // proxy internals
    this.tangents = tangents;
    this.normals = normals;
    this.binormals = binormals;

    function vert( x, y, z ) {

        return scope.vertices.push( new THREE.Vector3( x, y, z ) ) - 1;

    }


    // consruct the grid


    for ( i = 0; i < numpoints; i++ ) {

        this.grid[ i ] = [];

        u = this.getPoint(i);

        pos = path.getPointAt( u );

        tangent = tangents[ i ];
        normal = normals[ i ];
        binormal = binormals[ i ];

        for ( j = 0; j < this.radialSegments; j++ ) {

            v = j / this.radialSegments * 2 * Math.PI;

            cx = -this.radius * Math.cos( v ); // TODO: Hack: Negating it so it faces outside.
            cy = this.radius * Math.sin( v );

            pos2.copy( pos );
            pos2.x += cx * normal.x + cy * binormal.x;
            pos2.y += cx * normal.y + cy * binormal.y;
            pos2.z += cx * normal.z + cy * binormal.z;

            this.grid[ i ][ j ] = vert( pos2.x, pos2.y, pos2.z );

        }
    }

    // construct the mesh

    for ( i = 0; i < this.segments; i++ ) {

        for ( j = 0; j < this.radialSegments; j++ ) {

            ip = i + 1;
            jp = (j + 1) % this.radialSegments;

            a = this.grid[ i ][ j ];		// *** NOT NECESSARILY PLANAR ! ***
            b = this.grid[ ip ][ j ];
            c = this.grid[ ip ][ jp ];
            d = this.grid[ i ][ jp ];

            uva = new THREE.Vector2( i / this.segments, j / this.radialSegments );
            uvb = new THREE.Vector2( ( i + 1 ) / this.segments, j / this.radialSegments );
            uvc = new THREE.Vector2( ( i + 1 ) / this.segments, ( j + 1 ) / this.radialSegments );
            uvd = new THREE.Vector2( i / this.segments, ( j + 1 ) / this.radialSegments );

            this.faces.push( new THREE.Face3( a, b, d ) );
            this.faceVertexUvs[ 0 ].push( [ uva, uvb, uvd ] );

            this.faces.push( new THREE.Face3( b, c, d ) );
            this.faceVertexUvs[ 0 ].push( [ uvb.clone(), uvc, uvd.clone() ] );

        }
    }

    this.computeCentroids();
    this.computeFaceNormals();
    this.computeVertexNormals();

};

THREE.TubePieceGeometry.prototype = Object.create( THREE.Geometry.prototype );


// For computing of Frenet frames, exposing the tangents, normals and binormals the spline
/*THREE.TubePieceGeometry.FrenetFrames = function(path, segments, tubeGeometry) {

    var tangent = new THREE.Vector3(),
        normal = new THREE.Vector3(),
        binormal = new THREE.Vector3(),

        tangents = [],
        normals = [],
        binormals = [],

        vec = new THREE.Vector3(),
        mat = new THREE.Matrix4(),

        numpoints = segments + 1,
        theta,
        epsilon = 0.0001,
        smallest,

        tx, ty, tz,
        i, u, v;


    // expose internals
    this.tangents = tangents;
    this.normals = normals;
    this.binormals = binormals;

    // compute the tangent vectors for each segment on the path

    //for ( i = 0; i < numpoints; i++ ) {

        u = tubeGeometry.getPoint(i);

        tangents[ i ] = path.getTangentAt( u );
        tangents[ i ].normalize();

    }

    initialNormal3();
    initialNormal4();

    function initialNormal1(lastBinormal) {
        // fixed start binormal. Has dangers of 0 vectors
        normals[ 0 ] = new THREE.Vector3();
        binormals[ 0 ] = new THREE.Vector3();
        if (lastBinormal===undefined) lastBinormal = new THREE.Vector3( 0, 0, 1 );
        normals[ 0 ].crossVectors( lastBinormal, tangents[ 0 ] ).normalize();
        binormals[ 0 ].crossVectors( tangents[ 0 ], normals[ 0 ] ).normalize();
    }

    function initialNormal2() {

        // This uses the Frenet-Serret formula for deriving binormal
        var t2 = path.getTangentAt( epsilon );

        normals[ 0 ] = new THREE.Vector3().subVectors( t2, tangents[ 0 ] ).normalize();
        binormals[ 0 ] = new THREE.Vector3().crossVectors( tangents[ 0 ], normals[ 0 ] );

        normals[ 0 ].crossVectors( binormals[ 0 ], tangents[ 0 ] ).normalize(); // last binormal x tangent
        binormals[ 0 ].crossVectors( tangents[ 0 ], normals[ 0 ] ).normalize();

    }

    function initialNormal3() {
        // select an initial normal vector perpenicular to the first tangent vector,
        // and in the direction of the smallest tangent xyz component

        normals[ 0 ] = new THREE.Vector3();
        binormals[ 0 ] = new THREE.Vector3();
        smallest = Number.MAX_VALUE;
        tx = Math.abs( tangents[ 0 ].x );
        ty = Math.abs( tangents[ 0 ].y );
        tz = Math.abs( tangents[ 0 ].z );

        if ( tx <= smallest ) {
            smallest = tx;
            normal.set( 1, 0, 0 );
        }

        if ( ty <= smallest ) {
            smallest = ty;
            normal.set( 0, 1, 0 );
        }

        if ( tz <= smallest ) {
            normal.set( 0, 0, 1 );
        }

        vec.crossVectors( tangents[ 0 ], normal ).normalize();

        normals[ 0 ].crossVectors( tangents[ 0 ], vec );
        binormals[ 0 ].crossVectors( tangents[ 0 ], normals[ 0 ] );
    }

    function initialNormal4() {
        // select an initial normal vector perpenicular to the first tangent vector,
        // and in the direction of the smallest tangent xyz component

        normals[ 1 ] = new THREE.Vector3();
        binormals[ 1 ] = new THREE.Vector3();
        smallest = Number.MAX_VALUE;
        tx = Math.abs( tangents[ 1 ].x );
        ty = Math.abs( tangents[ 1 ].y );
        tz = Math.abs( tangents[ 1 ].z );

        if ( tx <= smallest ) {
            smallest = tx;
            normal.set( 1, 0, 0 );
        }

        if ( ty <= smallest ) {
            smallest = ty;
            normal.set( 0, 1, 0 );
        }

        if ( tz <= smallest ) {
            normal.set( 0, 0, 1 );
        }

        vec.crossVectors( tangents[ 1 ], normal ).normalize();

        normals[ 1 ].crossVectors( tangents[ 1 ], vec );
        binormals[ 1 ].crossVectors( tangents[ 1 ], normals[ 1 ] );
    }

    // compute the slowly-varying normal and binormal vectors for each segment on the path

    //for ( i = 1; i < numpoints; i++ ) {

        //normals[ i ] = normals[ i-1 ].clone();

        //binormals[ i ] = binormals[ i-1 ].clone();

        //console.log(normals[i]);

        //vec.crossVectors( tangents[ i-1 ], tangents[ i ] );

        //if ( vec.length() > epsilon ) {

            //vec.normalize();

            //theta = Math.acos( THREE.Math.clamp( tangents[ i-1 ].dot( tangents[ i ] ), -1, 1 ) ); // clamp for floating pt errors

            //normals[ i ].applyMatrix4( mat.makeRotationAxis( vec, theta ) );

        //}
        //console.log(normals[i]);

        //binormals[ i ].crossVectors( tangents[ i ], normals[ i ] );

    }
    //console.log(binormals[0]);
    //console.log(binormals[1]);
    //console.log(normals[0]);
    //console.log(normals[1]);
    //console.log(tangents[0]);
    //console.log(tangents[1]);

};
*/

// For computing of Frenet frames, exposing the tangents, normals and binormals the spline
THREE.TubePieceGeometry.FrenetFrames = function(path, segments, tubeGeometry) {

    var closed = false;
    var tangent = new THREE.Vector3(),
        normal = new THREE.Vector3(),
        binormal = new THREE.Vector3(),

        tangents = [],
        normals = [],
        binormals = [],

        vec = new THREE.Vector3(),
        mat = new THREE.Matrix4(),

        numpoints = segments + 1,
        theta,
        epsilon = 0.0001,
        smallest,

        tx, ty, tz,
        i, u, v;


    // expose internals
    this.tangents = tangents;
    this.normals = normals;
    this.binormals = binormals;

    // compute the tangent vectors for each segment on the path

    for ( i = 0; i < numpoints; i++ ) {

        u = i / ( numpoints - 1 );

        tangents[ i ] = path.getTangentAt( u );
        tangents[ i ].normalize();

    }

    initialNormal3();

    function initialNormal1(lastBinormal) {
        // fixed start binormal. Has dangers of 0 vectors
        normals[ 0 ] = new THREE.Vector3();
        binormals[ 0 ] = new THREE.Vector3();
        if (lastBinormal===undefined) lastBinormal = new THREE.Vector3( 0, 0, 1 );
        normals[ 0 ].crossVectors( lastBinormal, tangents[ 0 ] ).normalize();
        binormals[ 0 ].crossVectors( tangents[ 0 ], normals[ 0 ] ).normalize();
    }

    function initialNormal2() {

        // This uses the Frenet-Serret formula for deriving binormal
        var t2 = path.getTangentAt( epsilon );

        normals[ 0 ] = new THREE.Vector3().subVectors( t2, tangents[ 0 ] ).normalize();
        binormals[ 0 ] = new THREE.Vector3().crossVectors( tangents[ 0 ], normals[ 0 ] );

        normals[ 0 ].crossVectors( binormals[ 0 ], tangents[ 0 ] ).normalize(); // last binormal x tangent
        binormals[ 0 ].crossVectors( tangents[ 0 ], normals[ 0 ] ).normalize();

    }

    function initialNormal3() {
        // select an initial normal vector perpenicular to the first tangent vector,
        // and in the direction of the smallest tangent xyz component

        normals[ 0 ] = new THREE.Vector3();
        binormals[ 0 ] = new THREE.Vector3();
        smallest = Number.MAX_VALUE;
        tx = Math.abs( tangents[ 0 ].x );
        ty = Math.abs( tangents[ 0 ].y );
        tz = Math.abs( tangents[ 0 ].z );

        if ( tx <= smallest ) {
            smallest = tx;
            normal.set( 1, 0, 0 );
        }

        if ( ty <= smallest ) {
            smallest = ty;
            normal.set( 0, 1, 0 );
        }

        if ( tz <= smallest ) {
            normal.set( 0, 0, 1 );
        }

        vec.crossVectors( tangents[ 0 ], normal ).normalize();

        normals[ 0 ].crossVectors( tangents[ 0 ], vec );
        binormals[ 0 ].crossVectors( tangents[ 0 ], normals[ 0 ] );
    }


    // compute the slowly-varying normal and binormal vectors for each segment on the path

    for ( i = 1; i < numpoints; i++ ) {

        normals[ i ] = normals[ i-1 ].clone();

        binormals[ i ] = binormals[ i-1 ].clone();

        vec.crossVectors( tangents[ i-1 ], tangents[ i ] );

        if ( vec.length() > epsilon ) {

            vec.normalize();

            theta = Math.acos( THREE.Math.clamp( tangents[ i-1 ].dot( tangents[ i ] ), -1, 1 ) ); // clamp for floating pt errors

            normals[ i ].applyMatrix4( mat.makeRotationAxis( vec, theta ) );

        }

        binormals[ i ].crossVectors( tangents[ i ], normals[ i ] );

    }


    // if the curve is closed, postprocess the vectors so the first and last normal vectors are the same

    if ( closed ) {

        theta = Math.acos( THREE.Math.clamp( normals[ 0 ].dot( normals[ numpoints-1 ] ), -1, 1 ) );
        theta /= ( numpoints - 1 );

        if ( tangents[ 0 ].dot( vec.crossVectors( normals[ 0 ], normals[ numpoints-1 ] ) ) > 0 ) {

            theta = -theta;

        }

        for ( i = 1; i < numpoints; i++ ) {

            // twist a little...
            normals[ i ].applyMatrix4( mat.makeRotationAxis( tangents[ i ], theta * i ) );
            binormals[ i ].crossVectors( tangents[ i ], normals[ i ] );

        }

    }
};

