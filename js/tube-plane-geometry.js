THREE.TubePlaneGeometry = function(path, shift, length, segments, radius, radialSegments, radialSegmentNum) {

    THREE.Geometry.call( this );

    this.path = path;
    this.shift = shift || 0;
    this.length = length || 100;
    this.segments = segments || 64;
    this.radius = radius || 1;
    this.radialSegments = radialSegments || 8;
    this.radialSegmentNum = radialSegmentNum || 0;

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


    function vert( x, y, z ) {
        return scope.vertices.push( new THREE.Vector3( x, y, z ) ) - 1;
    }


    // consruct the grid


    for ( i = 0; i < numpoints; i++ ) {

        this.grid[ i ] = [];

        u = this.getPoint(i);

        pos = path.getPointAt( u );

        tangent = this.path.getTangentAt(u);
        normal = this.path.getNormalAt(u);
        binormal = this.path.getBinormalAt(u);

        for ( j = this.radialSegmentNum; j < this.radialSegmentNum + 2; j++ ) {

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

        for ( j = this.radialSegmentNum; j < this.radialSegmentNum + 1; j++ ) {
        //for ( j = 0; j < this.radialSegmentNum; j++ ) {

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

            this.faces.push(new THREE.Face3( a, b, d ));
            this.faceVertexUvs[ 0 ].push( [ uva, uvb, uvd ] );

            this.faces.push(new THREE.Face3( b, c, d ));
            this.faceVertexUvs[ 0 ].push( [ uvb.clone(), uvc, uvd.clone() ] );
        }
    }

    this.computeCentroids();
    this.computeFaceNormals();
    this.computeVertexNormals();

};

THREE.TubePlaneGeometry.prototype = Object.create( THREE.Geometry.prototype );
