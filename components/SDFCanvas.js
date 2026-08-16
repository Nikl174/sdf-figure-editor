import { SDF_PRIMITIES, SDFPart, updateFigureBuffer } from "../lib/figure.js";
import { vec3 } from "../lib/matrix.js";
import {
  getVariableLocations,
  initShaderProgram,
  initVerticeBufferRayMarching,
  rotatedPos,
} from "../lib/utils.js";
// TODO import templateHTML from "./template.html" assert { type: "text" };

// TODO refactor

/**
 * @typedef {{ camPos: vec3, lightPos: vec3, figure: SDFPart[], custom: Map<string,any> }} AnimVars
 * Type for parameters passed to and returned by the animation callback in SDFCanvas
 * custom is used for custom states for the animation
 */

const NUM_OF_PARTS_NAME = "numOfPart";
const template = document.createElement("template");
template.innerHTML = `
<style>
  :host {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--bg-main);
  }

  #view {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  p {
    text-align: center;
    color: var(--text-muted);
    font-size: 0.9em;
    margin: 12px 0 0 0;
  }

  .gl_container {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  canvas {
    display: block;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  }

  #fps {
    position: absolute;
    top: 16px;
    left: 16px;
    padding: 4px 10px;
    background: var(--bg-input);
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: bold;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    backdrop-filter: blur(4px);
  }
</style>

<div id="view">
  <p>Click to move, Scroll while clicked to zoom</p>
  <div class="gl_container">
    <canvas id="glCanvas" width="500" height="500"></canvas>
    <div id="fps">FPS: ⏸</div>
  </div>
</div>
`;

/**
 * @class Canvas for creating a raytracer and using Signed Distance functions to render
 */
export class SDFCanvas extends HTMLElement {
  /** Initial figure
   * @type {SDFPart[]} */
  static SDF_FIGURE = [];
  // initial position TODO
  static CAM_POSITION = vec3.fromValues(-5, 5, 4);
  static LIGHT_POSITION = vec3.fromValues(-15, 10, 8);
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
  schedule;
  #readyPromise;
  #width;
  #height;

  async initialise() {
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
    // prepare vertices for Ray Marching Window
    initVerticeBufferRayMarching(this.#gl);

    this.#vars_loc = getVariableLocations(this.#gl, this.#shader_program, [
      "camPos",
      "lightPos",
      "width",
      "height",
    ]);

    updateFigureBuffer(this.#gl, this.#shader_program, this.#figure);
  }

  /** @brief Initialise basic variables and structures necessary for it to work */
  constructor() {
    // WebComponent initialisation
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
      this.fps = 0;
      this.frameCount = 0; // frames accumulated in the current second
      this.lastTime = Date.now(); // timestamp of previous frame
    }

    // WebGL
    {
      // Initialise GL context with transparent background

      let frag = SDFCanvas.FRAG_SHADER_PATH;
      let vert = SDFCanvas.VERT_SHADER_PATH;
      let width = SDFCanvas.WIDTH;
      let height = SDFCanvas.HEIGHT;

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
      this.#width = width;
      this.#height = height;

      this.canvas =
        /** @type {HTMLCanvasElement | null} */ (this.shadowRoot.getElementById(
          "glCanvas",
        ));
      if (!this.canvas) throw new Error("WebGL Canvas not found!");
      const gl = this.canvas.getContext("webgl2", {
        // preserveDrawingBuffer: true,
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
    this.#figure = SDFCanvas.SDF_FIGURE;

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
      this.schedule = false;
      this.#animating = false;
      this.#animVars = {
        camPos: SDFCanvas.CAM_POSITION,
        lightPos: SDFCanvas.LIGHT_POSITION,
        figure: this.figure,
        custom: new Map(),
      };

      this.#readyPromise = this.initialise();
    }
  }

  /** @brief Returns when initialisation is ready
   */
  async whenReady() {
    await this.#readyPromise;
  }

  /** @brief When the element is actually attached to DOM, this starts the actual render, getting the shader files, compiling it and starting an animation
   */
  async connectedCallback() {
    await this.#readyPromise;
    this.width = this.#width;
    this.height = this.#height;
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
    this.#gl.uniform3fv(
      this.#vars_loc.get("camPos"),
      SDFCanvas.CAM_POSITION,
    ); // 3d-vector (x,y,z)
    this.#gl.uniform3fv(
      this.#vars_loc.get("lightPos"),
      SDFCanvas.LIGHT_POSITION,
    ); // 3d-vector (x,y,z)
    this.#gl.uniform1i(
      this.#vars_loc.get("width"),
      SDFCanvas.WIDTH,
    ); // int
    this.#gl.uniform1i(
      this.#vars_loc.get("height"),
      SDFCanvas.HEIGHT,
    ); // int

    this.updateSceneRender();
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
    this.updateSceneRender();

    if (this.#animating) {
      this.updateFps(SDFCanvas.FPS_INTERVAL);
      globalThis.requestAnimationFrame(this._animateStep);
    } else {
      this.fpsDisplay.textContent = `FPS: ⏸`;
    }
  }
  updateSceneRender() {
    if (this.animateCallback) this.animateCallback(this.#animVars);

    if (this.#animVars) {
      // TODO
      this.#gl.uniform3fv(this.#vars_loc.get("camPos"), this.#animVars.camPos);
      this.#gl.uniform3fv(
        this.#vars_loc.get("lightPos"),
        this.#animVars.lightPos,
      );
      this.customAnimValues = this.#animVars.custom;
    }

    // to not have to many concurrent requests, schedule them
    if (this.schedule) return;
    this.schedule = true;

    globalThis.requestAnimationFrame(
      () => {
        this.schedule = false;
        const offset = 0;
        const vertexCount = 4;
        updateFigureBuffer(this.#gl, this.#shader_program, this.#figure);
        this.#gl.drawArrays(this.#gl.TRIANGLE_STRIP, offset, vertexCount);
      },
    );
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
      this.#updateNumOfParts();
      this.updateSceneRender();
    }
  }
  /** @brief return current figure constructed of SDFPart */
  get figure() {
    return this.#figure;
  }
  set width(value) {
    // TODO
    this.canvas.width = value;
    // TODO
    this.#gl.uniform1i(
      this.#vars_loc.get("width"),
      value,
    );
    this.#gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    // this.#gl.clearColor(0.0, 0.0, 0.0, 0.0); // Clear to black, fully opaque
    // this.#gl.clearDepth(1.0); // Clear everything
    // this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);
  }
  get width() {
    // TODO
    return this.#width;
  }
  set height(value) {
    // TODO
    this.canvas.height = value;

    // TODO
    this.#gl.uniform1i(
      this.#vars_loc.get("height"),
      value,
    );
    this.#gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    // this.#gl.clearColor(0.0, 0.0, 0.0, 0.0); // Clear to black, fully opaque
    // this.#gl.clearDepth(1.0); // Clear everything
    // this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);
  }
  get height() {
    // TODO
    return this.#height;
  }

  /**
   * @brief update the shader uniform variable
   */
  #updateNumOfParts() {
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
