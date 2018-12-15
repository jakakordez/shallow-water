"use strict";

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.getElementById("glCanvas");
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }
  gl.getExtension('OES_texture_float');
  gl.getExtension('OES_texture_float_linear');
  gl.getExtension('OES_element_index_uint');

  var waterSize = 32;

  // setup GLSL program
  var program = webglUtils.createProgramFromScripts(gl, ["3d-vertex-shader", "3d-fragment-shader"]);
  var program2 = webglUtils.createProgramFromScripts(gl, ["3d-vertex-shader2", "3d-fragment-shader2"]);

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

  // lookup uniforms
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");
  var textureLocation = gl.getUniformLocation(program, "u_texture");

  var positionLocation2 = gl.getAttribLocation(program2, "a_position");
  var textureLocation2 = gl.getUniformLocation(program2, "u_texture");

  // Create a buffer for positions
  var positionBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Put the positions in the buffer
  setCanvas(gl);

  var fieldVertices = setFieldVertices(gl, waterSize);
  var fieldIndices = setFieldIndices(gl, waterSize);

  // Create a buffer for positions
  var positionBuffer2 = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer2);
  // Put the positions in the buffer
  setCanvas(gl);

  // provide texture coordinates for the rectangle.
  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  // Set Texcoords.
  setTexcoords(gl);

  // Create a texture to render to
  const targetTextureWidth = waterSize;
  const targetTextureHeight = waterSize;
  const targetTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, targetTexture);
  {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                  targetTextureWidth, targetTextureHeight, 0,
                  gl.RGBA, gl.FLOAT, null);

    // set the filtering so we don't need mips
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  // Create and bind the framebuffer
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

  // attach the texture as the first color attachment
  const attachmentPoint = gl.COLOR_ATTACHMENT0;
  const level = 0;
  gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);

  const targetTexture2 = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, targetTexture2);
  {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                  targetTextureWidth, targetTextureHeight, 0,
                  gl.RGBA, gl.FLOAT, getWater(targetTextureHeight));

    // set the filtering so we don't need mips
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var fieldOfViewRadians = degToRad(60);
  var modelXRotationRadians = degToRad(0);
  var modelYRotationRadians = degToRad(0);

  // Get the starting time.
  var then = 0;

  requestAnimationFrame(drawScene);

  function drawCube(aspect) {
    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    // Turn on the teccord attribute
    gl.enableVertexAttribArray(texcoordLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

    // Compute the projection matrix
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    var cameraPosition = [0, 0, 2];
    var up = [0, 1, 0];
    var target = [0, 0, 0];

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
    gl.drawArrays(gl.TRIANGLES, 0, 6);
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

  // Draw the scene.
  function drawScene(time) {
    // convert to seconds
    time *= 0.001;
    // Subtract the previous time from the current time
    var deltaTime = time - then;
    // Remember the current time for the next frame.
    then = time;

    // Animate the rotation
    //modelYRotationRadians += -0.7 * deltaTime;
    //modelXRotationRadians += -0.4 * deltaTime;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    {
      // render to our targetTexture by binding the framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

      // render cube with our 3x2 texture
      gl.bindTexture(gl.TEXTURE_2D, targetTexture2);

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, targetTextureWidth, targetTextureHeight);

      // Clear the canvas AND the depth buffer.
      gl.clearColor(0, 0, 1, 1);   // clear to blue
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(program2);

        // Turn on the position attribute
      gl.enableVertexAttribArray(positionLocation2);

      // Bind the position buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer2);

      // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
      gl.vertexAttribPointer(positionLocation2, 3, gl.FLOAT, false, 0, 0);

      // Tell the shader to use texture unit 0 for u_texture
      gl.uniform1i(textureLocation2, 0);

      // Draw the geometry.
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.bindTexture(gl.TEXTURE_2D, targetTexture2);
      gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, targetTextureWidth, targetTextureHeight, 0);
    }

    {
      // render to the canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      // render the cube with the texture we just rendered to
      gl.bindTexture(gl.TEXTURE_2D, targetTexture2);

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      // Clear the canvas AND the depth buffer.
      gl.clearColor(0.3, 0.8, 1, 1);   // clear to white
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      //drawCudrawCube(aspect);
      drawField(aspect);
    }

    //requestAnimationFrame(drawScene);
  }

  setInterval(drawScene, 100);
}

function setCanvas(gl){
    var positions = new Float32Array(
        [
          -1, -1, 0,
          1, -1, 0,
          -1,  1, 0,
          -1,  1, 0,
          1, -1, 0,
          1,  1, 0,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

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
  console.log(field);
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
  console.log(indices);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  return buf;
}

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

// Fill the buffer with texture coordinates the cube.
function setTexcoords(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(
        [
          0, 0,
          0, 1,
          1, 0,
          1, 0,
          0, 1,
          1, 1
      ]),
      gl.STATIC_DRAW);
}

main();