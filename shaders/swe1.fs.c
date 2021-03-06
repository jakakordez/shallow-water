precision mediump float;

// Passed in from the vertex shader.
varying vec2 v_texcoord;

// The texture.
uniform sampler2D waterTexture;
uniform sampler2D elevationTexture;

#define max(x, y)  ((x > y)?(x):(y))
#define min(x, y)  ((x > y)?(y):(x))

#define maxy(a, b)  ((a.y > b.y)?(a):(b))
#define miny(a, b)  ((a.y > b.y)?(b):(a))

#define maxz(a, b)  ((a.z > b.z)?(a):(b))
#define minz(a, b)  ((a.z > b.z)?(b):(a))

#define g   9.81
#define Manning 0.0
#define dX  1.0
#define K0 0.01
#define kappa K0*max(1.0, dX)
#define theta 1.3

#define h(Q)    (Q.x)
#define u(Q)    (Q.y)
#define v(Q)    (Q.z)
#define hu(Q)   (Q.x*Q.y)
#define hv(Q)   (Q.x*Q.z)

float MM(float a, float b, float c){
    //return b;
    if (a < 0.0 && b < 0.0 && c < 0.0){
        return min(min(a, b), c);
    }
    if(a > 0.0 && b > 0.0 && c > 0.0){
        return max(max(a, b), c);
    }
    return 0.0;
}

vec4 MMv(vec4 a, vec4 b, vec4 c){
    return vec4(
        MM(a.x, b.x, c.x),
        MM(a.y, b.y, c.y),
        MM(a.z, b.z, c.z),
        b.w
    );
}

vec4 MMy(vec4 a, vec4 b, vec4 c){
    if (a.y < 0.0 && b.y < 0.0 && c.y < 0.0){
        return miny(miny(a, b), c);
    }
    if(a.y > 0.0 && b.y > 0.0 && c.y > 0.0){
        return maxy(maxy(a, b), c);
    }
    b.y = 0.0;
    return b;
}

vec4 MMz(vec4 a, vec4 b, vec4 c){
    if (a.z < 0.0 && b.z < 0.0 && c.z < 0.0){
        return minz(minz(a, b), c);
    }
    if(a.z > 0.0 && b.z > 0.0 && c.z > 0.0){
        return maxz(maxz(a, b), c);
    }
    //b.z = 0.0;
    return b;
}

float desingularize(float hu, float h){
    if(h == 0.0) return 0.0;
    if(h >= kappa) return hu/h;
    float h4 = pow(h, 4.0);
    return h*(sqrt(2.0)*h*hu)
        / sqrt(h4 + max(h4, kappa));
}

vec4 G(vec4 Q){
    return vec4(
        hv(Q),
        hu(Q)*v(Q),
        pow(hv(Q), 2.0)+0.5*g*pow(h(Q), 2.0),
        0
    );
}

vec4 F(vec4 Q){
    return vec4(
        hu(Q),
        pow(hu(Q), 2.0)+0.5*g*pow(h(Q), 2.0),
        hu(Q)*v(Q),
        0
    );
}

vec4 Hf(vec4 Q, float Czs){
    float u = Q.x/Q.y;
    float v = Q.x/Q.z;
    float s = -g*sqrt((u*u)+(v*v))/Czs;
    return vec4(
        0,
        u*s,
        v*s,
        0
    );
}

vec4 Hb(vec4 Q){
    return vec4(0, 0, 0, 0);
}

vec4 R(vec4 Q, vec4 Qu, vec4 Qd, vec4 Qr, vec4 Ql){
    return Hb(Q) 
    - (F(Qu) - F(Qd))/*MMv(theta*(F(Qu) - F(Q)), F(Qu) - F(Qd), theta*(F(Q) - F(Qd)))*/
    - (G(Qr) - G(Ql))/*MMv(theta*(G(Qr) - G(Q)), G(Qr) - G(Ql), theta*(G(Q) - G(Ql)))*/;
}

void main() {
    vec4 Q = texture2D(waterTexture, v_texcoord);
    /*if(c.y < 0.5){
        gl_FragColor = c+vec4(0, 0.001, 0, 1);
    }
    else{
        gl_FragColor = c;
    }*/
    vec2 tc = v_texcoord;
    vec2 tdn = vec2(1.0/128.0, 0);
    vec2 tde = vec2(0, 1.0/128.0);
    int x = int(floor(v_texcoord.x*128.0));
    int y = int(floor(v_texcoord.y*128.0));
    vec4 Qu = texture2D(waterTexture, tc+tdn);
    vec4 Qd = texture2D(waterTexture, tc-tdn);
    vec4 Ql = texture2D(waterTexture, tc+tde);
    vec4 Qr = texture2D(waterTexture, tc-tde);

    float Cz = pow(Q.x, 0.1667)/Manning;
    float Czs = Cz*Cz;

    vec4 dQ = 
        /*Hf(Q, Czs) 
        +*/ R(Q, Qu, Qd, Qr, Ql);

    float deltaT = 0.005;
    //vec4 Qs = Q + 
    vec4 nQ = vec4(h(Q), hu(Q), hv(Q), 0) + dQ*0.005;
    if(h(nQ) < 0.0) nQ.x = 0.0;
    if(h(nQ) < kappa){
        nQ.y = desingularize(nQ.y, h(nQ));
        nQ.z = desingularize(nQ.z, h(nQ));
    }
    else{
        nQ.y /= h(nQ);
        nQ.z /= h(nQ);
    }

    gl_FragColor = nQ;
    //gl_FragColor = (up+down+left+right+c)/5.0;
    //gl_FragColor = vec4(float(x)/64.0, float(y)/64.0, 0.5, 1);
}