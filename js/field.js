
function setFieldVertices(gl, size){
    var pts = size+1;
    var field = new Float32Array(pts * pts * 3);
    for(var i = 0; i < pts; i++){
      for(var j = 0; j < pts; j++){
        var index = (j*pts + i)*3;
        field[index+0] = i;
        field[index+2] = j;
      }
    }
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, field, gl.STATIC_DRAW);
    return buf;
}
  
function setFieldIndices(gl, size){
    var pts = size+1;
    var indices = new Int32Array(size*size*6);
    for(var i = 0; i < size; i++){
      for(var j = 0; j < size; j++){
        var index = (j*size + i)*6;
        indices[index+0] = (pts*j)+i+1;
        indices[index+1] = (pts*j)+i;
        indices[index+2] = (pts*(j+1))+i;
  
        indices[index+3] = (pts*j)+i+1;
        indices[index+4] = (pts*(j+1))+i;
        indices[index+5] = (pts*(j+1))+i+1;
      }
    }
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    return buf;
}

  function drawField(aspect) {
    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, fieldVertices);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, fieldIndices);

    // Turn on the teccord attribute
    //gl.enableVertexAttribArray(texcoordLocation);

    // Bind the position buffer.
    //gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    //gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

    // Compute the projection matrix
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    var cameraPosition = [-2, 10, -2];
    var up = [0, 1, 0];
    var target = [20, -5, 20];

    // Compute the camera's matrix using look at.
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    var matrix = m4.xRotate(viewProjectionMatrix, modelXRotationRadians);
    matrix = m4.yRotate(matrix, modelYRotationRadians);

    // Set the matrix.
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    // Tell the shader to use texture unit 0 for u_texture
    gl.uniform1i(textureLocation, 0);

    // Draw the geometry.
    gl.drawElements(gl.TRIANGLES, waterSize*waterSize*6, gl.UNSIGNED_INT, 0);
  }