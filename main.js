import { computeCameraPosition, rotatedPos } from "./lib/utils.js";
import { SDFCanvas } from "./components/SDFCanvas.js";
import { SDFEditor } from "./components/FigureEditor.js";
import { SDF_PRIMITIES, SDFPart } from "./lib/figure.js";
import { FigureNode } from "./lib/figureGraph.js";
import { vec3 } from "./lib/matrix.js";

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
function createRiggedHuman() {
  const skin = vec3.fromValues(1.0, 0.75, 0.6);
  const shirt = vec3.fromValues(0.2, 0.2, 0.25);
  const pants = vec3.fromValues(0.1, 0.1, 0.5);

  // --- ROOT (Pelvis / main body mass) ---
  const pelvis = FigureNode.create({
    radius: 0.2,
    phi: Math.PI / 2,
    theta: Math.PI / 2,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.08,
    color: pants,
    extra_param: [0.3, 0.0, 0.0],
  });

  // --- SPINE / CHEST ---
  const spine = FigureNode.create({
    radius: 0.8,
    phi: Math.PI / 2,
    theta: Math.PI / 2,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: shirt,
    extra_param: [0.29, 0.0, 0.0],
  });

  // --- HEAD ---
  const head = FigureNode.create({
    radius: 0.35,
    phi: 0,
    theta: 0,
  }, {
    sdf: SDF_PRIMITIES.SDF_SPHERE,
    smooth_min: 0.02,
    color: skin,
    extra_param: [0.3, 0.0, 0.0],
  });

  // =========================
  // 🎯 SHOULDER RIG (ONE SIDE)
  // =========================
  const shoulder_left = FigureNode.create({
    radius: 0.2,
    phi: Math.PI / 2,
    theta: Math.PI, // left side
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE, // joint visualization
    smooth_min: 0.1,
    color: shirt,
    extra_param: [0.2, 0.0, 0.0],
  });
  const shoulder_right = FigureNode.create({
    radius: 0.2,
    phi: Math.PI / 2,
    theta: 2 * Math.PI, // right side
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE, // joint visualization
    smooth_min: 0.1,
    color: shirt,
    extra_param: [0.2, 0.0, 0.0],
  });

  const upperArm_left = FigureNode.create({
    radius: 0.7,
    phi: Math.PI / 2,
    theta: Math.PI,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: shirt,
    extra_param: [0.18, 0.0, 0.0],
  });
  const upperArm_right = FigureNode.create({
    radius: 0.7,
    phi: Math.PI / 2,
    theta: 2 * Math.PI,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: shirt,
    extra_param: [0.18, 0.0, 0.0],
  });

  const lowerArm_left = FigureNode.create({
    radius: 0.7,
    phi: Math.PI / 2,
    theta: Math.PI,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: skin,
    extra_param: [0.15, 0.0, 0.0],
  });
  const lowerArm_right = FigureNode.create({
    radius: 0.7,
    phi: Math.PI / 2,
    theta: 2 * Math.PI,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: skin,
    extra_param: [0.15, 0.0, 0.0],
  });

  // ======================
  // 🦵 HIP RIG (ONE SIDE)
  // ======================
  const hip_left = FigureNode.create({
    radius: 0.2,
    phi: Math.PI / 2,
    theta: Math.PI,
  }, {
    sdf: SDF_PRIMITIES.SDF_SPHERE,
    smooth_min: 0.1,
    color: pants,
    extra_param: [0.0, 0.0, 0.0],
  });
  const hip_right = FigureNode.create({
    radius: 0.2,
    phi: Math.PI / 2,
    theta: -Math.PI,
  }, {
    sdf: SDF_PRIMITIES.SDF_SPHERE,
    smooth_min: 0.1,
    color: pants,
    extra_param: [0.0, 0.0, 0.0],
  });

  const upperLeg_left = FigureNode.create({
    radius: 0.9,
    phi: Math.PI / 2,
    theta: -1 * (Math.PI / 2 + 0.3),
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.03,
    color: pants,
    extra_param: [0.22, 0.0, 0.0],
  });
  const upperLeg_right = FigureNode.create({
    radius: 0.9,
    phi: Math.PI / 2,
    theta: 3 * Math.PI / 2 + 0.3,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.03,
    color: pants,
    extra_param: [0.22, 0.0, 0.0],
  });

  const lowerLeg_left = FigureNode.create({
    radius: 0.9,
    phi: Math.PI / 2,
    theta: -Math.PI / 2,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.03,
    color: pants,
    extra_param: [0.2, 0.0, 0.0],
  });

  const lowerLeg_right = FigureNode.create({
    radius: 0.9,
    phi: Math.PI / 2,
    theta: -Math.PI / 2,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.03,
    color: pants,
    extra_param: [0.2, 0.0, 0.0],
  });
  // ======================
  // 🔗 HIERARCHY (THE RIG)
  // ======================

  pelvis.addChild(spine, 1.0);
  spine.addChild(head, 1.5);

  // shoulder chain
  spine.addChild(shoulder_left, 0.9);
  spine.addChild(shoulder_right, 0.9);
  shoulder_left.addChild(upperArm_left, 1.0);
  shoulder_right.addChild(upperArm_right, 1.0);
  upperArm_left.addChild(lowerArm_left, 1.0);
  upperArm_right.addChild(lowerArm_right, 1.0);

  // hip chain
  pelvis.addChild(hip_left, 0.0);
  hip_left.addChild(upperLeg_left, 0.3);
  hip_left.addChild(upperLeg_right, -0.3);
  upperLeg_left.addChild(lowerLeg_left, 1.0);
  upperLeg_right.addChild(lowerLeg_right, 1.0);

  return pelvis;
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

  figure = createRiggedHuman();
  const figure_list = figure.transformToList(vec3.fromValues(0, 1, 0));

  canvas.animateCallback = animate;
  editor.figureText = JSON.stringify(figure);
  // console.log(convertFigureListToSDFPart(figure_list));
  canvas.figure = convertFigureListToSDFPart(figure_list);
  animate_box?.addEventListener("click", (event) => {
    canvas.animating = event.target.checked;
  });

  SDFEditor.onFigureEvent(editor, (event) => {
    // const figure = JSON.parse(event.detail.figureJson).map((
    //   /**@type {String}*/ obj,
    // ) => SDFPart.fromJSON(obj));
    const figure_json = JSON.parse(event.detail.figureJson);
    const fig = FigureNode.fromJSON(figure_json);
    const fig_list = fig.transformToList(fig_pos);

    canvas.figure = convertFigureListToSDFPart(fig_list);
    // canvas._animateStep()
  });
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
}

globalThis.onload = main;
