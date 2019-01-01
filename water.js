
function getWater(size){
    var water = new Float32Array(size * size * 4);
    
    for(var i = 0; i < size; i++){
        for(var j = 0; j < size; j++){
            var index = (j*size + i)*4;
            if(i > size/3 && j > size/3 && i < 2*size/3 && j < 2*size/3){
                //water[index+0] = (Math.random()*0.75)+0.25;
                water[index] = 2.0;
            }
            else water[index] = 0.1;
            /*if(i == 10 && j == 10) water[index] = 5.0;
            if(i == 10 && j == 11) water[index] = 5.0;
            if(i == 11 && j == 10) water[index] = 5.0;
            if(i == 11 && j == 11) water[index] = 5.0;*/
            //water[index+3] = 1;
            
        }
    }
    return water;
}

function getWaterTexture(gl, size){
    var targetTexture2 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, targetTexture2);
    {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                    size, size, 0,
                    gl.RGBA, gl.FLOAT, getWater(size));
    
        // set the filtering so we don't need mips
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    return targetTexture2;
}