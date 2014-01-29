var Path = function(curve, segments) {
    this.curve = curve;
    this.segments = segments;
    this.length = curve.getLength();

    this.tangents  = [];
    this.normals   = [];
    this.binormals = [];

    this.calcTangets();
    this.calcNormalsAndBinormals();
};

Path.prototype = {
    getPointAt: function(u) {
        return this.curve.getPointAt(u);
    },
    getTangentAt: function(u) {
        return this.curve.getTangentAt(u);
    },
    getTangent: function(index) {
        return this.tangents[index];
    },
    getNormalAt: function(u) {
        var i = this.getIndexAt(u);
        return this.getNormal(i);
    },
    getNormal: function(index) {
        return this.normals[index];
    },
    getBinormalAt: function(u) {
        var i = this.getIndexAt(u);
        return this.getBinormal(i);
    },
    getBinormal: function(index) {
        return this.binormals[index];
    },
    getIndexAt: function(u) {
        return Math.round(this.segments * u);
    },
    getLength: function() {
        return this.curve.getLength();
    },
    calcTangets: function() {
        for(var i = 0; i < this.segments; i++) {

            var u = i / (this.segments - 1);

            this.tangents[i] = this.curve.getTangentAt(u);
            this.tangents[i].normalize();

        }
    },
    calcNormalsAndBinormals: function() {

        var theta;
        var epsilon = 0.0001;
        var normal = new THREE.Vector3();
        var vec = new THREE.Vector3();
        var mat = new THREE.Matrix4();

        this.normals[ 0 ] = new THREE.Vector3();
        this.binormals[ 0 ] = new THREE.Vector3();
        var smallest = Number.MAX_VALUE;

        var tx = Math.abs( this.tangents[ 0 ].x );
        var ty = Math.abs( this.tangents[ 0 ].y );
        var tz = Math.abs( this.tangents[ 0 ].z );

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

        vec.crossVectors( this.tangents[ 0 ], normal ).normalize();

        this.normals[ 0 ].crossVectors( this.tangents[ 0 ], vec );
        this.binormals[ 0 ].crossVectors( this.tangents[ 0 ], this.normals[ 0 ] );

        for (var i = 1; i < this.segments; i++ ) {

            this.normals[i] = this.normals[i - 1].clone();

            this.binormals[i] = this.binormals[i - 1].clone();

            vec.crossVectors(this.tangents[i - 1], this.tangents[i]);

            if(vec.length() > epsilon) {
                vec.normalize();

                theta = Math.acos(THREE.Math.clamp(this.tangents[i - 1].dot(this.tangents[i]), -1, 1)); // clamp for floating pt errors

                this.normals[i].applyMatrix4(mat.makeRotationAxis(vec, theta));
            }

            this.binormals[i].crossVectors(this.tangents[i], this.normals[i]);
        }
    }
};

