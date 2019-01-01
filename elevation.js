
function loadElevationFile(size){
    console.log("Started loading elevation");
    var promise = new Promise(function(resolve, reject) {
        axios.get('/GK1_435_133.asc').then(function(d){
            var topography = new Float32Array(size * size);
            var lines = d.data.split('\n');
            for(var i = 0; i < size; i++){
                for(var j = 0; j < size; j++){
                    var index = j*size + i;
                    var value = parseFloat(lines[index].split(';')[2]);
                    topography[index] = value;            
                }
            }
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
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
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
