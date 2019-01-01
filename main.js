"use strict";

function main(promises) {

  var rvs = promises[0].data;
  var rfs = promises[1].data;
  var vs = promises[2].data;
  var fs = promises[3].data;
  var elevationData = promises[4].data;

  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.getElementById("glCanvas");

  var gl = canvas.getContext("webgl");
  if (!gl) return;

  gl.getExtension('OES_texture_float');
  gl.getExtension('OES_texture_float_linear');
  gl.getExtension('OES_element_index_uint');

  var waterSize = 999;

  // setup GLSL program
  var program = webglUtils.createProgramFromSources(gl, [rvs, rfs]);
  var program2 = webglUtils.createProgramFromSources(gl, [vs, fs]);

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

  var waterVertices = setFieldVertices(gl, waterSize);
  var waterIndices = setFieldIndices(gl, waterSize);
  
  var elevationVertices = setFieldVertices(gl, waterSize+1);
  var elevationIndices = setFieldIndices(gl, waterSize+1);

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

  const targetTexture = getTargetTexture(gl, waterSize);
  const waterTexture = getWaterTexture(gl, waterSize);
  const elevationTexture = getElevationTexture(gl, waterSize-1, elevationData)

  // Create and bind the framebuffer
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

  // attach the texture as the first color attachment
  const attachmentPoint = gl.COLOR_ATTACHMENT0;
  const level = 0;
  gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var fieldOfViewRadians = degToRad(60);
  var modelXRotationRadians = degToRad(0);
  var modelYRotationRadians = degToRad(0);

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

  function drawField(matrix, size, vertices, indices) {
    gl.useProgram(program); // Tell it to use our program (pair of shaders)
    gl.enableVertexAttribArray(positionLocation); // Turn on the position attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, vertices); // Bind the position buffer.
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
    
    //gl.enableVertexAttribArray(texcoordLocation); // Turn on the teccord attribute
    //gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer); // Bind the position buffer.
    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    //gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(matrixLocation, false, matrix); // Set the matrix.

    // Tell the shader to use texture unit 0 for u_texture
    gl.uniform1i(textureLocation, 0);

    // Draw the geometry.
    gl.drawElements(gl.TRIANGLES, size*size*6, gl.UNSIGNED_INT, 0);
  }

  // Draw the scene.
  function drawScene(time) {
    var t0 = performance.now();

    setSize();

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    {
      // render to our targetTexture by binding the framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

      // render cube with our 3x2 texture
      gl.bindTexture(gl.TEXTURE_2D, waterTexture);

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, waterSize, waterSize);

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

      gl.bindTexture(gl.TEXTURE_2D, waterTexture);
      gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, waterSize, waterSize, 0);
    }

    {
      // render to the canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      // render the cube with the texture we just rendered to
      gl.bindTexture(gl.TEXTURE_2D, waterTexture);

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      // Clear the canvas AND the depth buffer.
      gl.clearColor(0.3, 0.8, 1, 1);   // clear to white
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
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

      //drawCudrawCube(aspect);
      drawField(matrix, waterSize, waterVertices, waterIndices);
      drawField(matrix, waterSize+1, elevationVertices, elevationIndices);
    }

    //requestAnimationFrame(drawScene);
    var t1 = performance.now();
    $("#lblDrawTime").text(t1-t0);
  }

  $("#btnStart").on('click', function(){
    setInterval(drawScene, 30);
  });

  $("#lblLoading,.progress").remove();

  console.log("Initialized");
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

var promises = [
  axios.get('render.vs.c'),
  axios.get('render.fs.c'),
  axios.get('swe2.vs.c'),
  axios.get('swe2.fs.c'),
  loadElevationFile(1000)
];

Promise.all(promises).then(main);

function setSize(){
  var canvas = document.getElementById("glCanvas");
  canvas.height = document.body.clientHeight;
}

