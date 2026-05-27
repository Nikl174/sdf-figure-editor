import { computeCameraPosition, rotatedPos } from "./lib/utils.js";
import { SDFCanvas } from "./components/SDFCanvas.js";
import { SDFEditor } from "./components/FigureEditor.js";
import { SDF_PRIMITIES, SDFPart } from "./lib/figure.js";
import { FigureNode } from "./lib/figureGraph.js";
import { mat3, vec3 } from "./lib/matrix.js";

/**
 * @import {AnimVars} from "./components/SDFCanvas.js"
 * @import {FigureList} from "./lib/figureGraph.js"
 */

const CAM_ROT_INC_RAD = -0.040;
let X_INC = 0.010;
// horizontal angle
const CAM_THETA = 0;
// vertical angle (avoid 0 or π)
const CAM_PHI = 1.2;
// radius from camera to [0,0,0]
const CAM_RADIUS = 10;

// camera movement TODO
let radius = CAM_RADIUS;
let theta = CAM_THETA;
let phi = CAM_PHI;
let dragging = false;
let rotating = false;

let fig_pos = vec3.fromValues(0, 0, 0);

let figure = new FigureNode();
/**
 * @param {AnimVars} animVars description
 */
function animate(animVars) {
  let camRotRad = animVars.custom.get("camRotRad");
  if (camRotRad === undefined) {
    animVars.custom.set("camRotRad", 0);
    camRotRad = 0;
  }
  // let x = animVars.figure[6].end_point.x;
  // if (x < -1.5 || x > -1.3) {
  //   X_INC *= -1;
  // }
  // animVars.figure[6].end_point.x += X_INC;
  // animVars.figure[7].end_point.x -= X_INC;
  if (dragging) {
    animVars.camPos = computeCameraPosition(
      [0, 0, 0],
      radius,
      phi,
      theta,
    );
  } else if (rotating) {
    animVars.camPos = rotatedPos(radius, camRotRad, animVars.camPos[1]);
    camRotRad += CAM_ROT_INC_RAD;
  }

  animVars.custom.set("camRotRad", camRotRad);
}

/** TODO typechecking for ANY type of parameters!!
 * @brief Convert Figure Graph List to shader list
 * @param {FigureList} list list of nodes
 * @return {SDFPart[]} SDFPart list used to give to the shader
 */
function convertFigureListToSDFPart(list) {
  /** @type {SDFPart[]}*/
  const parts = [];
  for (const node of list) {
    // TODO WARNING typecheck!!
    parts.push(
      new SDFPart(
        node.param.sdf,
        node.start,
        node.end,
        node.param.color,
        node.param.smooth_min,
        node.param.extra_param,
      ),
    );
  }
  return parts;
}

/**
 * @brief Construct an example human figure using FigureNode structure
 * @return {FigureNode} the constructed human figure
 */
function createFigure() {
  const skin = vec3.fromValues(1.0, 0.75, 0.6);
  const shirt = vec3.fromValues(0.2, 0.2, 0.25);
  const pants = vec3.fromValues(0.1, 0.1, 0.5);

  const body = FigureNode.create({
    radius: 1.2,
    phi: 0,
    theta: 0,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: shirt,
    extra_param: [0.29, 0.0, 0.0],
  });
  const pelvis = FigureNode.create({
    radius: 0.2,
    phi: Math.PI,
    theta: Math.PI,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: pants,
    extra_param: [0.3, 0.0, 0.0],
  });
  const head = FigureNode.create({
    radius: 0.35,
    phi: 0,
    theta: 0,
  }, {
    sdf: SDF_PRIMITIES.SDF_SPHERE,
    smooth_min: 0.03,
    color: skin,
    extra_param: [0.37, 0.0, 0.0],
  });
  const upperArm_right = FigureNode.create({
    radius: 0.8,
    phi: 0,
    theta: Math.PI / 2,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: shirt,
    extra_param: [0.23, 0.0, 0.0],
  });
  const upperArm_left = FigureNode.create({
    radius: 0.8,
    phi: 0,
    theta: -Math.PI / 2,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: shirt,
    extra_param: [0.23, 0.0, 0.0],
  });
  const lowerArm_right = FigureNode.create({
    radius: 1.0,
    phi: 0,
    theta: 0,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: skin,
    extra_param: [0.20, 0.0, 0.0],
  });
  const lowerArm_left = FigureNode.create({
    radius: 1.0,
    phi: 0,
    theta: 0,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: skin,
    extra_param: [0.20, 0.0, 0.0],
  });
  const upperLeg_right = FigureNode.create({
    radius: 1.0,
    phi: 0,
    theta: Math.PI / 8,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: pants,
    extra_param: [0.28, 0.0, 0.0],
  });
  const upperLeg_left = FigureNode.create({
    radius: 1.0,
    phi: 0,
    theta: -Math.PI / 8,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: pants,
    extra_param: [0.28, 0.0, 0.0],
  });
  const lowerLeg_right = FigureNode.create({
    radius: 1.2,
    phi: 0,
    theta: -Math.PI / 8,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: pants,
    extra_param: [0.25, 0.0, 0.0],
  });
  const lowerLeg_left = FigureNode.create({
    radius: 1.2,
    phi: 0,
    theta: Math.PI / 8,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: pants,
    extra_param: [0.25, 0.0, 0.0],
  });

  body.addChild(head, 1.5);
  body.addChild(pelvis, 0);
  body.addChild(upperArm_left, 1);
  body.addChild(upperArm_right, 1);
  pelvis.addChild(upperLeg_left, 1);
  pelvis.addChild(upperLeg_right, 1);
  upperLeg_left.addChild(lowerLeg_left, 1);
  upperLeg_right.addChild(lowerLeg_right, 1);
  upperArm_left.addChild(lowerArm_left, 1);
  upperArm_right.addChild(lowerArm_right, 1);

  return body;
}

}

function main() {
  const canvas =
    /** @type {SDFCanvas|null} */ (document.getElementById("sdf-view"));
  const editor =
    /** @type {SDFEditor|null} */ (document.getElementById("sdf-editor"));
  const rotate_box = /** @type {HTMLInputElement|null}*/ (document
    .getElementById("rotate"));
  const animate_box = /** @type {HTMLInputElement|null}*/ (document
    .getElementById("animate"));
  rotate_box?.addEventListener("click", (event) => {
    rotating = event.target.checked;
  });

  if (!canvas || !editor) {
    throw new Error("Canvas or editor not found in document!");
  }
  canvas.animateCallback = animate;

  // Mouse interaction callbacks TODO
  // ---------
  canvas.canvas.addEventListener("mousedown", async (e) => {
    if (e.buttons == 1) {
      dragging = true;
      await e.currentTarget.requestPointerLock();
    }

    // console.log("Dragging", dragging, e);
  });
  canvas.canvas.addEventListener("mouseup", (e) => {
    dragging = false;
    document.exitPointerLock();
    // console.log("Stopped Dragging", dragging, e);
  });
  canvas.canvas.addEventListener("wheel", (e) => {
    radius += e.deltaY * 0.01;
    radius = Math.max(1, Math.min(20, radius));
  });
  canvas.canvas.addEventListener("mousemove", (e) => {
    // left mouse button pressed
    if (dragging) {
      // if (!dragging) return;
      // const dx = e.clientX - lastX;
      // const dy = e.clientY - lastY;
      // lastX = e.clientX;
      // lastY = e.clientY; // Sensitivity
      const dx = e.movementX;
      const dy = e.movementY;
      theta += dx * 0.01;
      phi += -dy * 0.01; // Clamp phi to avoid flipping
      const eps = 0.1;
      phi = Math.max(eps, Math.min(Math.PI - eps, phi));
    }
  });
  // ---------
  // figure handling
  // ---------
  figure = createFigure();
  const identity = mat3.create();
  const figure_list = figure.transformToList(fig_pos, identity);
  canvas.figure = convertFigureListToSDFPart(figure_list);
  editor.figureText = JSON.stringify(figure);

  SDFEditor.onFigureEvent(editor, (event) => {
    const figure_json = JSON.parse(event.detail.figureJson);
    const fig = FigureNode.fromJSON(figure_json);
    const fig_list = fig.transformToList(fig_pos, identity);
    console.log(fig_list);

    canvas.figure = convertFigureListToSDFPart(fig_list);
    updateNodeEditor(node_editor, fig_component_list, current_figure_id);
  });
  // ---------
}

globalThis.onload = main;
