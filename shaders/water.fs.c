precision mediump float;
        
// Passed in from the vertex shader.
varying vec2 v_texcoord;
varying vec4 v_position;

uniform sampler2D waterTexture;
uniform sampler2D elevationTexture;



void main() {
    vec4 c = texture2D(waterTexture, v_texcoord);
    float asl = texture2D(elevationTexture, v_texcoord).x;
    gl_FragColor = vec4(abs(c.x), abs(c.y), abs(c.z), 1);
    //gl_FragColor = vec4(0, 0, v_position.y, 1);
        
}