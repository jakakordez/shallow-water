precision mediump float;
        
// Passed in from the vertex shader.
varying vec2 v_texcoord;
varying vec4 v_position;

uniform sampler2D u_texture;

void main() {
    vec4 c = texture2D(u_texture, v_texcoord);
    gl_FragColor = vec4(c.x, c.y, 0, 1);
    //gl_FragColor = vec4(0, 0, v_position.y, 1);
        
}