precision mediump float;
        
// Passed in from the vertex shader.
varying vec2 v_texcoord;
varying vec4 v_position;

uniform sampler2D elevationTexture;

float GradU(vec2 tc){
    int x = int(floor(tc.x*999.0));
    int y = int(floor(tc.y*999.0));

    vec2 etc = vec2(float(x) / 1000.0, float(y) / 1000.0);
    etc = etc + vec2(0.5/1000.0, 0);
    vec2 etce = etc + vec2(1.0/1000.0, 0);

    vec4 E = texture2D(elevationTexture, etc);
    vec4 Ee = texture2D(elevationTexture, etce);
    return E.x - Ee.x;
    //return 0.0;
}

float GradV(vec2 tc){
    int x = int(floor(tc.x*999.0));
    int y = int(floor(tc.y*999.0));

    vec2 etc = vec2(float(x) / 1000.0, float(y) / 1000.0);
    etc = etc + vec2(0, 0.5/1000.0);
    vec2 etcs = etc + vec2(0, 1.0/1000.0);

    vec4 E = texture2D(elevationTexture, etc);
    vec4 Es = texture2D(elevationTexture, etcs);
    return E.x - Es.x;
    //return 0.0;
}

void main() {
    //vec4 c = texture2D(waterTexture, v_texcoord);
    float asl = texture2D(elevationTexture, v_texcoord).x/2.0;
    gl_FragColor = vec4(/*asl - floor(asl)*/abs(GradU(v_texcoord)), abs(GradV(v_texcoord)), 0, 1);
    //gl_FragColor = vec4(0, 0, v_position.y, 1);
        
}