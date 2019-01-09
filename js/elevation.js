
function loadElevationFile(size, name){
    console.log("Started loading elevation");
    var promise = new Promise(function(resolve, reject) {
        axios.get(name).then(function(d){
            var topography = new Float32Array(size * size * 4);
            var minx = 10000000;
            var miny = 10000000;
            var lines = d.data.split('\n');
            var points = [];
            lines.forEach(function(l) {
                var value = l.split(';');
                var r = {
                    x: parseInt(value[0]),
                    y: parseInt(value[1]),
                    h: parseFloat(value[2])
                }; 
                if(r.x < minx) minx = r.x;
                if(r.y < miny) miny = r.y;
                points.push(r);
            });
            points.forEach(function(p) {
                var index = (p.x - minx) * size + (p.y - miny);
                topography[index * 4] = p.h;
            });

            /*for(var i = 0; i < size; i++){
                for(var j = 0; j < size; j++){
                    var index = i*size + j;
                    topography[index * 4] = i*0.3;
                }
            }*/

            console.log("Finished with elevation")
            resolve(topography);        
        });
    });
    return promise;
}

function getElevationTexture(gl, size, elevationData){
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F,
                    size, size, 0,
                    gl.RGBA, gl.FLOAT, elevationData);
    
        // set the filtering so we don't need mips
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    return tex;
}
