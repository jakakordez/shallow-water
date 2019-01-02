precision mediump float;

// Passed in from the vertex shader.
varying vec2 v_texcoord;

uniform sampler2D waterTexture;
uniform sampler2D elevationTexture;

#define g   9.81

#define h(Q)    (Q.x)
#define u(Q)    (Q.y)
#define v(Q)    (Q.z)

#define df  999.0
#define idf 1.0/df
#define dt  0.005
#define H   100.0

#define tde vec2(idf, 0)
#define tds vec2(0, idf)

bool EastEdge(float x){
    return abs(x+idf - df) < idf;
}

bool WestEdge(float x){
    return abs(x) < idf;
}

#define SouthEdge(y) (EastEdge(y))
#define NorthEdge(y) (WestEdge(y))

float u_np(vec2 tc, vec4 Q){
    if(EastEdge(tc.x)) return 0.0;

    vec4 Qe = texture2D(waterTexture, tc+tde);
    return u(Q) - (g * dt * (h(Qe) - h(Q)));
}

float v_np(vec2 tc, vec4 Q){
    if(SouthEdge(tc.y)) return 0.0;

    vec4 Qs = texture2D(waterTexture, tc+tds);
    return v(Q) - (g * dt * (h(Qs) - h(Q)));
}

void main() {
    vec4 Q = texture2D(waterTexture, v_texcoord);
    vec2 tc = v_texcoord;
    //int x = int(floor(tc.x*128.0));
    //int y = int(floor(tc.y*128.0));
    vec4 Qs = texture2D(waterTexture, tc+tds);
    vec4 Qn = texture2D(waterTexture, tc-tds);
    vec4 Qe = texture2D(waterTexture, tc+tde);
    vec4 Qw = texture2D(waterTexture, tc-tde);

    float u_np1 = u_np(tc, Q);
    float v_np1 = v_np(tc, Q);

    float u_np2 = u_np(tc-tde, Qw);
    float v_np2 = v_np(tc-tds, Qn);

    float h_e, h_w, h_n, h_s;

    if(EastEdge(tc.x)) h_e = h(Q) + H;
    else h_e = u_np1 > 0.0 ? h(Q) + H : h(Qe) + H;

    if(WestEdge(tc.x)) h_w = h(Q) + H;
    else h_w = u_np2 > 0.0 ? h(Qw) + H : h(Q) + H;

    if(SouthEdge(tc.y)) h_n = h(Q) + H;
    else h_n = v_np1 > 0.0 ? h(Q) + H : h(Qs) + H;

    if(NorthEdge(tc.y)) h_s = h(Q) + H;
    else h_s = v_np2 > 0.0 ? h(Qn) + H : h(Q) + H;

    float uhwe, vhns;

    if(WestEdge(tc.x)) uhwe = u_np1 * h_e;
    else uhwe = u_np1 * h_e - u_np2 * h_w;

    if(NorthEdge(tc.y)) vhns = v_np1 * h_n;
    else vhns = v_np1 * h_n - v_np2 * h_s;

    vec4 nQ = vec4(
        h(Q) - dt * (uhwe + vhns),
        u_np1,
        v_np1,
        0
    );

    gl_FragColor = nQ;
}