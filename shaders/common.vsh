uniform float globalTime;
uniform float speed;
uniform float distance;
uniform bool dynamic;
uniform vec2 uvScale;

varying vec2 vUv;
varying vec3 vNormal;

void main() {

    vNormal = normal;
    vUv = uvScale * uv;

    vec3 animated = position;

    animated.z += globalTime * speed - distance;
    if(dynamic) {
        //animated.z += globalTime * speed - distance;
    } else {
        //vUv.y += globalTime*speed;
    }

    float force = animated.z*0.1;

    /*animated.x += cos(globalTime + (animated.z/90.0))*force; */
    /*animated.y += sin(globalTime + (animated.z/60.0))*force; */

    vec4 mvPosition = modelViewMatrix * vec4( animated, 1.0 );

    gl_Position = projectionMatrix * mvPosition;

}


