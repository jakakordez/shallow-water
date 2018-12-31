attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_matrix;

varying vec2 v_texcoord;
varying vec4 v_position;

uniform sampler2D u_texture;

void main() {
    v_texcoord = a_position.xz / 128.0;

    v_position = a_position;
    gl_Position = u_matrix * (a_position + vec4(0, texture2D(u_texture, v_texcoord).x, 0, 0));
    
    //v_texcoord = a_texcoord;
}