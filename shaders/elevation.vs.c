attribute vec4 a_position;

uniform mat4 u_matrix;

varying vec2 v_texcoord;
varying vec4 v_position;

uniform sampler2D elevationTexture;

void main() {
    v_texcoord = a_position.xz / 999.0;

    v_position = a_position;
    float asl = texture2D(elevationTexture, v_texcoord).x;
    gl_Position = u_matrix * (a_position + vec4(0, asl, 0, 0));
}