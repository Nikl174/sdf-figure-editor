// @ts-check

import {
  SDF_PRIMITIES,
  SDFPart,
  updateFigureBuffer as updateFigureBuffer,
} from "./figure.js";
import { getVariableLocations, initShaderProgram } from "./utils.js";

// global vars TODO
let gl;
let vars_loc;
let cam_rot_rad;
let shader_program;

const CAM_ROT_INC_RAD = 0.010;
let X_INC = 0.010;

let lastTime = Date.now(); // timestamp of previous frame
let frameCount = 0; // frames accumulated in the current second
let fps = 0; // most recent FPS value
const fpsDisplay = document.getElementById("fps");

let animating = false;

let radius = 10;
let camera_position = [0, 0, 0];
let locked = false;

let theta = 0; // horizontal angle
let phi = 1.2; // vertical angle (avoid 0 or π)

/**
 * @type {SDFPart[]}
 */
let figure = [
  // head sphere
  new SDFPart(
    SDF_PRIMITIES.SDF_SPHERE,
    { x: 0.0, y: 0.8 + 1.8 * 0.5, z: 0.0 },
    { x: 0.0, y: 0.0, z: 0.0 },
    0.3,
    [0.5, 0.0, 0.0],
  ),

  // big belly (round cone)
  new SDFPart(
    SDF_PRIMITIES.SDF_CAPSULE,
    { x: 0.0, y: 0.0, z: 0.0 }, // body_bottom
    { x: 0.0, y: 0.8, z: 0.0 }, // body_top
    0.1,
    [0.40, 0.4, 0.8],
  ),

  // // right upper arm
  new SDFPart(
    SDF_PRIMITIES.SDF_CAPSULE,
    { x: 0.0, y: 0.8, z: 0.0 }, // body_top
    { x: 1.0, y: 1.0, z: 0.0 }, // elbow_right
    0.1,
    [0.32, 0.0, 0.0],
  ),

  // left upper arm
  new SDFPart(
    SDF_PRIMITIES.SDF_CAPSULE,
    { x: 0.0, y: 0.8, z: 0.0 }, // body_top
    { x: -1.0, y: 1.0, z: 0.0 }, // elbow_left
    0.1,
    [0.32, 0.0, 0.0],
  ),

  // right thigh
  new SDFPart(
    SDF_PRIMITIES.SDF_CAPSULE,
    { x: 0.2, y: -0.3, z: 0.0 }, // hip_right
    { x: 0.25, y: -0.8, z: 0.5 }, // knee_right
    0.1,
    [0.32, 0.0, 0.0],
  ),

  // left thigh
  new SDFPart(
    SDF_PRIMITIES.SDF_CAPSULE,
    { x: -0.2, y: -0.3, z: 0.0 }, // hip_left
    { x: -0.25, y: -1.0, z: -0.2 }, // knee_left
    0.1,
    [0.32, 0.0, 0.0],
  ),

  // left forearm
  new SDFPart(
    SDF_PRIMITIES.SDF_CAPSULE,
    { x: -1.0, y: 1.0, z: 0.0 }, // elbow_left
    { x: -1.5, y: 1.5, z: 0.0 }, // left_hand
    0.1,
    [0.32, 0.0, 0.0],
  ),

  // right forearm
  new SDFPart(
    SDF_PRIMITIES.SDF_CAPSULE,
    { x: 1.0, y: 1.0, z: 0.0 }, // elbow_right
    { x: 1.5, y: 1.5, z: 0.0 }, // right_hand
    0.1,
    [0.32, 0.0, 0.0],
  ),

  // left foot
  new SDFPart(
    SDF_PRIMITIES.SDF_CAPSULE,
    { x: -0.25, y: -1.0, z: -0.2 }, // knee_left
    { x: -0.25, y: -1.8, z: -0.8 }, // left_foot
    0.01,
    [0.32, 0.0, 0.0],
  ),

  // right foot
  new SDFPart(
    SDF_PRIMITIES.SDF_CAPSULE,
    { x: 0.25, y: -0.8, z: 0.5 }, // knee_right
    { x: 0.25, y: -1.8, z: 0.8 }, // right_foot
    0.01,
    [0.32, 0.0, 0.0],
  ),
];

/** @brief Initialise buffer content for vertices needed to draw, in this case only a canvas to draw on with the fragment shader
 * @param {WebGL2RenderingContext} gl gl render context for creating the vertices in
 */
function initVerticeBuffer(gl) {
  // Init vertice buffers, just 2 vertices to allow the fragment shader to show

  // Create a buffer for the square's positions.
  const positionBuffer = gl.createBuffer();
  // The array of positions for the square.
  const positions = [
    1.0,
    1.0,
    -1.0,
    1.0,
    1.0,
    -1.0,
    -1.0,
    -1.0,
  ];

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  { // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    const numComponents = 2; // pull out 2 values per iteration
    const type = gl.FLOAT; // the data in the buffer is 32bit floats
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set of values to the next
    // 0 = use type and numComponents above
    const offset = 0; // how many bytes inside the buffer to start from

    // use the first buffer currently bound with above properties
    gl.vertexAttribPointer(0, numComponents, type, normalize, stride, offset);
    // also enable the vertices to use them in the shader
    gl.enableVertexAttribArray(0);
  }
}

/**
 * @brief calculate rotation arround a point
 *
 * @param {number} point distance to camera
 * @param {number} radian the radian number describing the current rotation arround the 0-point
 * @param {number} yPos y position of the calculated position
 */
function rotatedPos(point, radian, yPos) {
  const pos = [
    Math.sin(radian) * point, //   camPosZX_rad =   0deg -> (0,  0,  e) -> on pos. z axis
    yPos, //   camPosZX_rad =  90deg -> (e,  0,  0)
    Math.cos(radian) * point, //   camPosZX_rad = 180deg -> (0,  0, -e) -> on neg. z axis
  ];
  return pos;
}

/**
 * TODO
 */
function drawScene(gl, shader_prog, vars_loc) {
  gl.clearColor(0.0, 0.0, 0.0, 0.0); // Clear to black, fully opaque
  gl.clearDepth(1.0); // Clear everything
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things
  // gl.enable(gl.BLEND);
  // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // Clear the canvas before type="module"we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(shader_prog);

  const cam_pos = rotatedPos(12.0, -0.5);
  const light_pos = [-15, 10, 8];
  // TODO
  gl.uniform3fv(vars_loc.get("camPos"), cam_pos); // it is a 3d-vector (x,y,z)
  gl.uniform3fv(vars_loc.get("lightPos"), light_pos); // it is a 3d-vector (x,y,z)

  updateFigureBuffer(gl, shader_program, figure);
  // Tell WebGL to use our program when drawing
  {
    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}

/**
 * TODO
 */
function updateFps(now) {
  const delta = now - lastTime; // ms since last frame
  frameCount++;

  // Update once per second (you can adjust the interval)
  if (delta >= 1000) {
    fps = (frameCount * 1000) / delta; // frames per second
    fpsDisplay.textContent = `FPS: ${fps.toFixed(1)}`;
    // Reset counters for the next interval
    frameCount = 0;
    lastTime = now;
  }
}

// TODO
function animate() {
  // console.log("Animating...");
  updateFps(Date.now());
  let x = figure[6].end_point.x;
  if (x < -1.5 || x > -1.3) {
    X_INC *= -1;
  }
  figure[6].end_point.x += X_INC;
  figure[7].end_point.x -= X_INC;
  updateFigureBuffer(gl, shader_program, figure);

  let cam_pos = computeCameraPosition();

  // if (!locked) {
  //   cam_pos = getRotatedCamPos(12.0, cam_rot_rad);
  // }
  // const light_pos = getCamPos(10.0, cam_rot_rad + Math.PI / 6);
  // gl.uniform3fv(vars_loc.get("camPos"), cam_pos); // it is a 3d-vector (x,y,z)
  // gl.uniform3fv(vars_loc.get("lightPos"), light_pos); // it is a 3d-vector (x,y,z)
  // Tell WebGL to use our program when drawing
  {
    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
  cam_rot_rad = cam_rot_rad + CAM_ROT_INC_RAD;
  if (animating) globalThis.requestAnimationFrame(animate);
}

// TODO
function computeCameraPosition(camera_position, radius, phi, theta) {
  const x = camera_position[0] + radius * Math.sin(phi) * Math.cos(theta);
  const y = Math.max(camera_position[1] + radius * Math.cos(phi), -10.1);
  const z = camera_position[2] + radius * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}

// TODO
async function main() {
  /** @type {HTMLCanvasElement} */
  let canvas = document.querySelector("#glCanvas");
  canvas.style.display = "block";

  // Initialize the GL context
  /** @type {WebGL2RenderingContext} */
  gl = canvas.getContext("webgl2", {
    preserveDrawingBuffer: true,
    alpha: true,
  });

  // check for initialisation error
  if (gl === null) {
    // Only continue if WebGL is available and working
    alert(
      "Unable to initialize WebGL! Aborting...",
    );
    return;
  }
  // gl.viewport(0, 0, 500, 500);

  //  get the fragmentShader from a glsl file
  const fs_req = new Request("s_frag.glsl");
  const fs_src = await fetch(fs_req).then((response) => {
    if (response.ok) {
      return response.text();
    } else {
      throw new Error(
        "HTTP error, couldn't retreive frag_shader.glsl! Status: ${response.status}",
      );
    }
  });

  //  get the vertexShader from a glsl file
  const vs_req = new Request("s_vert.glsl");
  const vs_src = await fetch(vs_req).then((response) => {
    if (response.ok) {
      // console.log(response.text())
      return response.text();
    } else {
      throw new Error(
        "HTTP error, couldn't retreive vert_shader.glsl! Status: ${response.status}",
      );
    }
  });
  canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
    locked = true;
  });
  canvas.addEventListener("wheel", (e) => {
    radius += e.deltaY * 0.01;
    radius = Math.max(1, Math.min(20, radius));
  });
  document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement !== canvas) {
      locked = false;
    }
  });
  document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement === canvas) {
      // if (!dragging) return;
      // const dx = e.clientX - lastX;
      // const dy = e.clientY - lastY;
      // lastX = e.clientX;
      // lastY = e.clientY; // Sensitivity
      const dx = e.movementX;
      const dy = e.movementY;
      theta += dx * 0.01;
      phi += dy * 0.01; // Clamp phi to avoid flipping
      const eps = 0.1;
      phi = Math.max(eps, Math.min(Math.PI - eps, phi));
    }
  });

  // initialize gl program
  shader_program = initShaderProgram(gl, vs_src, fs_src);
  initVerticeBuffer(gl);

  vars_loc = getVariableLocations(gl, shader_program, ["camPos", "lightPos"]);
  console.log(vars_loc);
  updateFigureBuffer(gl, shader_program, figure);
  drawScene(gl, shader_program, vars_loc);
  cam_rot_rad = 0.0;
  // console.log(JSON.stringify(figure));
  document.getElementById("figure_in").textContent = JSON.stringify(figure);
}

// TODO

document.getElementById("update").addEventListener("click", (event) => {
  // console.log(document.getElementById("figure_in").value);
  figure = JSON.parse(document.getElementById("figure_in").value).map((obj) =>
    SDFPart.fromJSON(obj)
  );
  drawScene(gl, shader_program, vars_loc);

  console.log(figure);
});

document.getElementById("toggle").addEventListener("click", (event) => {
  // const toggle_btn = document.getElementById("toggle");
  const toggle_btn = event.currentTarget;
  animating = !animating;
  if (animating) {
    toggle_btn.textContent = `Toggle Animation: ▶`;
    globalThis.requestAnimationFrame(animate);
  } else {
    toggle_btn.textContent = `Toggle Animation: ⏸`;
  }
});

globalThis.onload = main;
