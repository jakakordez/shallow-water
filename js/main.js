"use strict";

function main(promises) {

  var wvs = promises[0].data;
  var wfs = promises[1].data;
  var evs = promises[2].data;
  var efs = promises[3].data;
  var vs = promises[4].data;
  var fs = promises[5].data;
  var elevationData = promises[6];
  var ortophoto = promises[7];

  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.getElementById("glCanvas");

  var gl = canvas.getContext("webgl2");//webgl
  if (!gl) return;

  var waterSize = 999;

  gl.getExtension('OES_texture_float');
  gl.getExtension('OES_texture_float_linear');
  gl.getExtension('OES_element_index_uint');

  gl.getExtension('EXT_color_buffer_float');
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGB32F, waterSize+1, waterSize+1);

  // setup GLSL program
  var waterProgram = webglUtils.createProgramFromSources(gl, [wvs, wfs]);
  var elevationProgram = webglUtils.createProgramFromSources(gl, [evs, efs]);
  var sweProgram = webglUtils.createProgramFromSources(gl, [vs, fs]);

  var wPositionLocation = gl.getAttribLocation(waterProgram, "a_position");
  var wMatrixLocation = gl.getUniformLocation(waterProgram, "u_matrix");
  var wWaterTexLocation = gl.getUniformLocation(waterProgram, "waterTexture");
  var wElevationTexLocation = gl.getUniformLocation(waterProgram, "elevationTexture");
  
  var ePositionLocation = gl.getAttribLocation(elevationProgram, "a_position");
  var eMatrixLocation = gl.getUniformLocation(elevationProgram, "u_matrix");
  var eElevationTexLocation = gl.getUniformLocation(elevationProgram, "elevationTexture");
  var eOrtophotoTexLocation = gl.getUniformLocation(elevationProgram, "ortophotoTexture");

  var sPositionLocation = gl.getAttribLocation(sweProgram, "a_position");
  var sWaterTexLocation = gl.getUniformLocation(sweProgram, "waterTexture");
  var sRainLocation = gl.getUniformLocation(sweProgram, "rain");
  var sElevationTexLocation = gl.getUniformLocation(sweProgram, "elevationTexture");
  
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
  const elevationTexture = getElevationTexture(gl, waterSize+1, elevationData)
  const ortophotoTexture = getOrtophotoTexture(gl, URL.createObjectURL(ortophoto.data));

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

  function drawWater(matrix, size) {
    gl.useProgram(waterProgram); // Tell it to use our program (pair of shaders)
    gl.enableVertexAttribArray(wPositionLocation); // Turn on the position attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, waterVertices); // Bind the position buffer.
    gl.vertexAttribPointer(wPositionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, waterIndices);

    gl.uniformMatrix4fv(wMatrixLocation, false, matrix); // Set the matrix.

    // Tell the shader to use texture unit 0 for u_texture
    gl.uniform1i(wWaterTexLocation, 0);
    gl.uniform1i(wElevationTexLocation, 1);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, waterTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, elevationTexture);

    // Draw the geometry.
    gl.drawElements(gl.TRIANGLES, size*size*6, gl.UNSIGNED_INT, 0);
  }

  function drawElevation(matrix, size) {
    gl.useProgram(elevationProgram); // Tell it to use our program (pair of shaders)
    gl.enableVertexAttribArray(ePositionLocation); // Turn on the position attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, elevationVertices); // Bind the position buffer.
    gl.vertexAttribPointer(ePositionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elevationIndices);

    gl.uniformMatrix4fv(eMatrixLocation, false, matrix); // Set the matrix.

    gl.uniform1i(eElevationTexLocation, 0);
    gl.uniform1i(eOrtophotoTexLocation, 1);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, elevationTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, ortophotoTexture);

    // Draw the geometry.
    gl.drawElements(gl.TRIANGLES, size*size*6, gl.UNSIGNED_INT, 0);
  }

  var steps = 30;
  var rain = 0;

  // Draw the scene.
  function drawScene(time) {
    var t0 = performance.now();

    setSize();

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    

    for(var ite = 0; ite < steps; ite++) {
      
      
      // render to our targetTexture by binding the framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);      

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, waterSize, waterSize);

      // Clear the canvas AND the depth buffer.
      //gl.clearColor(0, 0, 1, 1);   // clear to blue
      //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(sweProgram);

        // Turn on the position attribute
      gl.enableVertexAttribArray(sPositionLocation);

      // Bind the position buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer2);

      // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
      gl.vertexAttribPointer(sPositionLocation, 3, gl.FLOAT, false, 0, 0);

      // Tell the shader to use texture unit 0 for u_texture
      gl.uniform1i(sWaterTexLocation, 0);
      gl.uniform1i(sElevationTexLocation, 1);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, waterTexture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, elevationTexture);

      if(ite == 0){
        gl.uniform1f(sRainLocation, rain * 0.001);
      }
      else gl.uniform1f(sRainLocation, 0.0);

      // Draw the geometry.
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.bindTexture(gl.TEXTURE_2D, waterTexture);
      gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, waterSize, waterSize, 0);
    }

    {
      // render to the canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      // Tell WebGL how to convert from clip space to pixels
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      // Clear the canvas AND the depth buffer.
      gl.clearColor(0.3, 0.8, 1, 1);   // clear to white
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      // Compute the projection matrix
      var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

      var cameraPosition = [250, 600, 250];
      var up = [0, 1, 0];
      var target = [400, 500, 400];

      // Compute the camera's matrix using look at.
      var cameraMatrix = m4.lookAt(cameraPosition, target, up);

      // Make a view matrix from the camera matrix.
      var viewMatrix = m4.inverse(cameraMatrix);

      var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      drawElevation(viewProjectionMatrix, waterSize+1);
      drawWater(viewProjectionMatrix, waterSize);
      gl.disable(gl.BLEND);
    }

    //requestAnimationFrame(drawScene);
    var t1 = performance.now();
    $("#lblDrawTime").text(t1-t0);
  }

  var timer = null;
  $("#btnStart").on('click', function(){
    if(timer){
      clearInterval(timer);
      timer = null;
      $(this).text("Start");
    }
    else{
      timer = setInterval(drawScene, 30);
      $(this).text("Stop");
    }
  });

  $("#rngSteps").on('input', function(){
    steps = this.value;
    $("#lblSteps").text(steps);
  });

  $("#rngRain").on('input', function(){
    rain = Math.floor(Math.pow(2, this.value));
    $("#lblRain").text(rain);
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
  axios.get('shaders/water.vs.c'),
  axios.get('shaders/water.fs.c'),
  axios.get('shaders/elevation.vs.c'),
  axios.get('shaders/elevation.fs.c'),
  axios.get('shaders/swe2.vs.c'),
  axios.get('shaders/swe2.fs.c'),
  loadElevationFile(1000),
  axios.get('orto-photo.png', {responseType: 'blob', timeout: 30000})
];

Promise.all(promises).then(main);

function setSize(){
  var canvas = document.getElementById("glCanvas");
  canvas.height = document.body.clientHeight;
}

