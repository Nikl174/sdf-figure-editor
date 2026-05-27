import { SDF_PRIMITIES, SDFPart, updateFigureBuffer } from "../lib/figure.js";
import { vec3 } from "../lib/matrix.js";
import {
  getVariableLocations,
  initShaderProgram,
  initVerticeBufferRayMarching,
  rotatedPos,
} from "../lib/utils.js";

/**
 * @typedef {{ camPos: number[], lightPos: number[], figure: SDFPart[], custom: Map<string,any> }} AnimVars
 * Type for parameters passed to and returned by the animation callback in SDFCanvas
 * custom is used for custom states for the animation
 */

const NUM_OF_PARTS_NAME = "numOfPart";
const template = document.createElement("template");
template.innerHTML = `
<style>
.gl_container {
  position: relative;
}

#sdf {
  display: flex;
  flex-direction: row;
  align-items: stretch;
}
#view {
  margin: auto;
  display: flex;
  align-items: center;
  flex-direction: column;
  color: #0f0;
}

canvas {
  display: block;
  margin: 0 auto;
}

button {
  display: block;
  margin: 0 auto;
  font-size: 1em;
}

p {
  text-align: center;
}

#fps {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.6);
  color: #0f0;
  font-family: monospace;
  font-size: 14px;
  border-radius: 4px;
}
</style>
<div id="view">
  <p>Click to move, Scroll to zoom, Esc to unlock mouse</p>
  <div class="gl_container">
    <canvas id="glCanvas" width="500" height="500" style="max-width:100%;height:auto;">
    </canvas>
    <div id="fps">FPS: —</div>
  </div>
</div>
`;

/**
 * @class Canvas for creating a raytracer and using Signed Distance functions to render
 */
export class SDFCanvas extends HTMLElement {
  /** Initial figure
   * @type {SDFPart[]} */
  static SDF_FIGURE = [
    // // head sphere
    // new SDFPart(
    //   SDF_PRIMITIES.SDF_SPHERE,
    //   { x: 0.0, y: 0.8 + 1.8 * 0.5, z: 0.0 },
    //   { x: 0.0, y: 0.0, z: 0.0 },
    //   0.3,
    //   [0.5, 0.0, 0.0],
    //   vec3.fromValues(0.8,0.8,0.8),
    // ),
    //
    // // big belly (round cone)
    // new SDFPart(
    //   SDF_PRIMITIES.SDF_CAPSULE,
    //   { x: 0.0, y: 0.0, z: 0.0 }, // body_bottom
    //   { x: 0.0, y: 0.8, z: 0.0 }, // body_top
    //   0.1,
    //   [0.40, 0.4, 0.8],
    //   vec3.fromValues(0.8,0.8,0.8),
    // ),
    //
    // // // right upper arm
    // new SDFPart(
    //   SDF_PRIMITIES.SDF_CAPSULE,
    //   { x: 0.0, y: 0.8, z: 0.0 }, // body_top
    //   { x: 1.0, y: 1.0, z: 0.0 }, // elbow_right
    //   0.1,
    //   [0.32, 0.0, 0.0],
    //   vec3.fromValues(0.8,0.8,0.8),
    // ),
    //
    // // left upper arm
    // new SDFPart(
    //   SDF_PRIMITIES.SDF_CAPSULE,
    //   { x: 0.0, y: 0.8, z: 0.0 }, // body_top
    //   { x: -1.0, y: 1.0, z: 0.0 }, // elbow_left
    //   0.1,
    //   [0.32, 0.0, 0.0],
    //   vec3.fromValues(0.8,0.8,0.8),
    // ),
    //
    // // right thigh
    // new SDFPart(
    //   SDF_PRIMITIES.SDF_CAPSULE,
    //   { x: 0.2, y: -0.3, z: 0.0 }, // hip_right
    //   { x: 0.25, y: -0.8, z: 0.5 }, // knee_right
    //   0.1,
    //   [0.32, 0.0, 0.0],
    //   vec3.fromValues(0.8,0.8,0.8),
    // ),
    //
    // // left thigh
    // new SDFPart(
    //   SDF_PRIMITIES.SDF_CAPSULE,
    //   { x: -0.2, y: -0.3, z: 0.0 }, // hip_left
    //   { x: -0.25, y: -1.0, z: -0.2 }, // knee_left
    //   0.1,
    //   [0.32, 0.0, 0.0],
    //   vec3.fromValues(0.8,0.8,0.8),
    // ),
    //
    // // left forearm
    // new SDFPart(
    //   SDF_PRIMITIES.SDF_CAPSULE,
    //   { x: -1.0, y: 1.0, z: 0.0 }, // elbow_left
    //   { x: -1.5, y: 1.5, z: 0.0 }, // left_hand
    //   0.1,
    //   [0.32, 0.0, 0.0],
    //   vec3.fromValues(0.8,0.8,0.8),
    // ),
    //
    // // right forearm
    // new SDFPart(
    //   SDF_PRIMITIES.SDF_CAPSULE,
    //   { x: 1.0, y: 1.0, z: 0.0 }, // elbow_right
    //   { x: 1.5, y: 1.5, z: 0.0 }, // right_hand
    //   0.1,
    //   [0.32, 0.0, 0.0],
    //   vec3.fromValues(0.8,0.8,0.8),
    // ),
    //
    // // left foot
    // new SDFPart(
    //   SDF_PRIMITIES.SDF_CAPSULE,
    //   { x: -0.25, y: -1.0, z: -0.2 }, // knee_left
    //   { x: -0.25, y: -1.8, z: -0.8 }, // left_foot
    //   0.01,
    //   [0.32, 0.0, 0.0],
    //   vec3.fromValues(0.8,0.8,0.8),
    // ),
    //
    // // right foot
    // new SDFPart(
    //   SDF_PRIMITIES.SDF_CAPSULE,
    //   { x: 0.25, y: -0.8, z: 0.5 }, // knee_right
    //   { x: 0.25, y: -1.8, z: 0.8 }, // right_foot
    //   0.01,
    //   [0.32, 0.0, 0.0],
    //   vec3.fromValues(0.8,0.8,0.8),
    // ),
  ];
  // initial position
  static CAM_POSITION = rotatedPos(12.0, -0.5, 3);
  static LIGHT_POSITION = [-15, 10, 8];
  // interval for updating FPS view in ms
  static FPS_INTERVAL = 1000;
  // default for the canvas
  static WIDTH = 500;
  static HEIGHT = 500;
  static FRAG_SHADER_PATH = "./components/s_frag.glsl";
  static VERT_SHADER_PATH = "./components/s_vert.glsl";
  #gl;
  /**@type {WebGLProgram | null}*/
  #shader_program;
  /**@type {Map<string,WebGLUniformLocation|null> | null}*/
  #vars_loc;
  #fs_req;
  /**@type {AnimVars}*/
  #animVars;
  #vs_req;
  #figure;
  #animating;

  /** @brief Initialise basic variables and structures necessary for it to work */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    if (!this.shadowRoot) {
      throw new Error("Could not attach ShadowDOM to SDFCanvas!");
    }
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // FPS display TODO
    {
      this.fpsDisplay = this.shadowRoot.getElementById("fps");
      if (!this.fpsDisplay) throw new Error("FPS display not found!");
      this.fpsDisplay.textContent = "FPS: —";
      this.fps = 0;
      this.frameCount = 0; // frames accumulated in the current second
      this.lastTime = Date.now(); // timestamp of previous frame
      // shadowRoot.appendChild(this.fpsDisplay);
    }

    // WebGL
    {
      // Initialise GL context with transparent background
      console.log(this);

      let width = SDFCanvas.WIDTH;
      let height = SDFCanvas.HEIGHT;
      let frag = SDFCanvas.FRAG_SHADER_PATH;
      let vert = SDFCanvas.VERT_SHADER_PATH;

      // Parameter from HTML
      if (this.hasAttribute("width")) {
        width = Number(this.getAttribute("width"));
      }
      if (this.hasAttribute("height")) {
        height = Number(this.getAttribute("height"));
      }
      if (this.hasAttribute("frag_shader_link")) {
        frag = String(this.getAttribute("frag_shader_link"));
      }
      if (this.hasAttribute("vert_shader_link")) {
        vert = String(this.getAttribute("vert_shader_link"));
      }

      this.canvas =
        /** @type {HTMLCanvasElement | null} */ (this.shadowRoot.getElementById(
          "glCanvas",
        ));
      if (!this.canvas) throw new Error("WebGL Canvas not found!");
      this.canvas.width = width;
      this.canvas.height = height;
      const gl = this.canvas.getContext("webgl2", {
        preserveDrawingBuffer: true,
        alpha: true,
      });

      // check for initialisation error
      if (gl != null) {
        this.#gl = gl;
      } else {
        // Only continue if WebGL is available and working
        alert(
          "Unable to initialize WebGL! Aborting...",
        );
        throw new Error("Unable to initialize WebGL! Aborting...");
      }
      //TODO?
      this.#shader_program = null;
      this.#vars_loc = null;

      // prepare shader file requests TODO
      this.#fs_req = new Request(frag);
      this.#vs_req = new Request(vert);
    }

    // SDF figure
    {
      this.#figure = SDFCanvas.SDF_FIGURE;
    }

    // animation
    // bind the currently constructed object to the function so it can use its properties/functions
    // @ts-ignore TODO
    {
      this._animateStep = this._animateStep.bind(this);

      /**
       * @brief callback used to animate the scene giving the current values and retrieving updated ones
       * set by user
       * (called with the current state of them that gets updated (pass by reference))
       * @type {(function(AnimVars): void) | null}
       */
      this.animateCallback = null;
      this.#animating = false;
      this.#animVars = {
        camPos: SDFCanvas.CAM_POSITION,
        lightPos: SDFCanvas.LIGHT_POSITION,
        figure: this.figure,
        custom: new Map(),
      };
      // this.shadowRoot.getElementById("toggle")?.addEventListener(
      //   "click",
      //   (event) => {
      //     const toggle_btn = event.currentTarget;
      //     this.#animating = !this.#animating;
      //     if (this.#animating) {
      //       toggle_btn.textContent = `Toggle Animation: ▶`;
      //       globalThis.requestAnimationFrame(this._animateStep);
      //     } else {
      //       toggle_btn.textContent = `Toggle Animation: ⏸`;
      //     }
      //   },
      // );
    }
  }
  /** @brief When the element is actually attached to DOM, this starts the actual render, getting the shader files, compiling it and starting an animation
   */
  async connectedCallback() {
    console.log(this);
    //  get the fragmentShader from a glsl file
    this.fs_src = await fetch(this.#fs_req).then((response) => {
      if (response.ok) {
        return response.text();
      } else {
        throw new Error(
          "HTTP error, couldn't retreive frag_shader.glsl! Status: ${response.status}",
        );
      }
    });
    //  get the vertexShader from a glsl file
    this.vs_src = await fetch(this.#vs_req).then((response) => {
      if (response.ok) {
        // console.log(response.text())
        return response.text();
      } else {
        throw new Error(
          "HTTP error, couldn't retreive vert_shader.glsl! Status: ${response.status}",
        );
      }
    });

    // shader programm and animation loop
    this.#shader_program = initShaderProgram(
      this.#gl,
      this.vs_src,
      this.fs_src,
    );
    initVerticeBufferRayMarching(this.#gl);
    //TODO
    this.#vars_loc = getVariableLocations(this.#gl, this.#shader_program, [
      "camPos",
      "lightPos",
    ]);
    // updateFigureBuffer(this.gl, this.shader_program, this.figure);
    this.#drawScene();
    if (this.animating) this._animateStep();
  }

  /** @brief Create the transparent scene, initialise used variables and */
  #drawScene() {
    this.#gl.clearColor(0.0, 0.0, 0.0, 0.0); // Clear to black, fully opaque
    this.#gl.clearDepth(1.0); // Clear everything
    this.#gl.enable(this.#gl.DEPTH_TEST); // Enable depth testing
    this.#gl.depthFunc(this.#gl.LEQUAL); // Near things obscure far things
    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Clear the canvas before type="module"we start drawing on it.
    this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);
    this.#gl.useProgram(this.#shader_program);

    // TODO
    this.#gl.uniform3fv(this.#vars_loc.get("camPos"), SDFCanvas.CAM_POSITION); // it is a 3d-vector (x,y,z)
    this.#gl.uniform3fv(
      this.#vars_loc.get("lightPos"),
      SDFCanvas.LIGHT_POSITION,
    ); // it is a 4d-vector (x,y,z)

    updateFigureBuffer(this.#gl, this.#shader_program, this.#figure);
    // Tell WebGL to use our program when drawing
    {
      const offset = 0;
      const vertexCount = 4;
      this.#gl.drawArrays(this.#gl.TRIANGLE_STRIP, offset, vertexCount);
    }
  }
  /** TODO
   * @brief Updates the FPS display text, should be called every frame
   * @param {number} interval interval in ms when to update the fps display
   */
  updateFps(interval) {
    const now = Date.now();
    const delta = now - this.lastTime; // ms since last frame
    this.frameCount++;

    // Update once after interval reached
    if (delta >= interval) {
      this.fps = (this.frameCount * interval) / delta; // frames per second
      this.fpsDisplay.textContent = `FPS: ${this.fps.toFixed(1)}`;
      // Reset counters for the next interval
      this.frameCount = 0;
      this.lastTime = now;
    }
  }
  /** @brief main animation loop function for requestAnimationFrame */
  _animateStep() {
    if (this.animateCallback) this.animateCallback(this.#animVars);

    if (this.#animVars) {
      this.#gl.uniform3fv(this.#vars_loc.get("camPos"), this.#animVars.camPos);
      this.#gl.uniform3fv(
        this.#vars_loc.get("lightPos"),
        this.#animVars.lightPos,
      );
      this.customAnimValues = this.#animVars.custom;
    }

    // update scene
    {
      const offset = 0;
      const vertexCount = 4;
      this.updateFps(SDFCanvas.FPS_INTERVAL);
      updateFigureBuffer(this.#gl, this.#shader_program, this.#figure);
      this.#gl.drawArrays(this.#gl.TRIANGLE_STRIP, offset, vertexCount);
    }
    if (this.#animating) {
      globalThis.requestAnimationFrame(this._animateStep);
    }
  }
  /** @param {boolean} value new value starting the animation when true */
  set animating(value) {
    if (!this.#animating && value) {
      globalThis.requestAnimationFrame(this._animateStep);
    }
    this.#animating = value;
  }
  /** @brief return animating value indicating if animation started */
  get animating() {
    return this.#animating;
  }
  /** @param {SDFPart[]} value new figure */
  set figure(value) {
    this.#figure = value;
    // TODO necessary? + await for shader_program!
    if (this.#shader_program != null) {
      this._updateNumOfParts();
      updateFigureBuffer(this.#gl, this.#shader_program, this.#figure);
      {
        const offset = 0;
        const vertexCount = 4;
        this.#gl.drawArrays(this.#gl.TRIANGLE_STRIP, offset, vertexCount);
      }
    }
  }
  /** @brief return current figure constructed of SDFPart */
  get figure() {
    return this.#figure;
  }

  /**
   * @brief update the shader uniform variable
   */
  _updateNumOfParts() {
    const num_of_parts_loc = this.#gl.getUniformLocation(
      this.#shader_program,
      NUM_OF_PARTS_NAME,
    );
    this.#gl.useProgram(this.#shader_program);
    // TODO set the actual number of parts past to the shader
    this.#gl.uniform1i(
      num_of_parts_loc,
      this.#figure.length,
    );
  }
}

globalThis.customElements.define(
  "sdf-canvas",
  SDFCanvas,
);
