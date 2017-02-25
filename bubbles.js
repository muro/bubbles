var canvas;
var gl;
var squareVerticesBuffer;
var verticesCount;
var mvMatrix;
var shaderProgram;
var vertexPositionAttribute;
var perspectiveMatrix;

function start() {
  var canvas = document.getElementById('glCanvas');

  // Initialize the GL context
  gl = initWebGL(canvas);
  if (gl) {
    gl.clearColor(1.0, 1.0, 1.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    initShaders();
    initBuffers();
    setInterval(drawScene, 15);
  }
}

function initWebGL(canvas) {
  gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    alert('Unable to initialize WebGL. Your browser may not support it.');
  }
  return gl;
}

function initShaders() {
  var fragmentShader = getShader(gl, 'shader-fs');
  var vertexShader = getShader(gl, 'shader-vs');
  
  // Create the shader program
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  
  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
  }
  
  gl.useProgram(shaderProgram);
  
  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
  gl.enableVertexAttribArray(vertexPositionAttribute);
}

function getShader(gl, id, type) {
  var shaderScript, theSource, currentChild, shader;
  
  shaderScript = document.getElementById(id);
  
  if (!shaderScript) {
    return null;
  }
  theSource = shaderScript.text;

  if (!type) {
    if (shaderScript.type == 'x-shader/x-fragment') {
      type = gl.FRAGMENT_SHADER;
    } else if (shaderScript.type == 'x-shader/x-vertex') {
      type = gl.VERTEX_SHADER;
    } else {
      // Unknown shader type
      return null;
    }
  }
  shader = gl.createShader(type);
  gl.shaderSource(shader, theSource);
  gl.compileShader(shader);  
    
  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {  
      console.log('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));  
      gl.deleteShader(shader);
      return null;  
  }
  return shader;
}

var horizAspect = 800.0/800.0;

function prepareVertices() {
  // sphere:
  var vertices = [];
  for (var i = 0; i < 2; i += 0.1) {
    for (var j = 0; j < 2; j += 0.1) {
      var v = [
        i, j, 0.0,
        i + 0.1, j + .1, 0.1,
        i, j + 0.1, -0.1,
        i + 0.1, j, 0.0
      ];
      vertices = vertices.concat(v);
    }
  }
//  var vertices = [
//    1.0,  1.0,  0.0,
//    -1.0, 1.2,  0.0,
//    1.0,  -1.0, 0.0,
//    -1.0, -1.0, 0.0
//  ];
  verticesCount = vertices.length / 3;
  return vertices; 
}

function initBuffers() {
  squareVerticesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);

  var vertices = prepareVertices();
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}

var angle = 0;

function drawScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  perspectiveMatrix = makePerspective(45, 800.0/800.0, 0.1, 100.0);

  angle += 0.05;
  if (angle > 6.28) {
    angle -= 6.28;
  }
  
  loadIdentity();
  mvTranslate([-0.0, 0.0, -6.0]);
  mvRotate(angle, $V([1, .2, 0.1]));
  
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, verticesCount);
}

function loadIdentity() {
  mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
}

function mvRotate(angle, axis) {
  var m = Matrix.Rotation(angle, axis).ensure4x4();
  multMatrix(m);
}

function mvTranslate(v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}