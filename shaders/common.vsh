uniform vec2 uvScale;

varying vec2 vUv;
varying vec3 vNormal;

void main() {

    vNormal = normal;
    vUv = uvScale * uv;

    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

    gl_Position = projectionMatrix * mvPosition;

}


