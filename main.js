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

const CAM_ROT_INC_RAD = 0.010;
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
  let x = animVars.figure[6].end_point.x;
  if (x < -1.5 || x > -1.3) {
    X_INC *= -1;
  }
  animVars.figure[6].end_point.x += X_INC;
  animVars.figure[7].end_point.x -= X_INC;
  if (dragging) {
    animVars.camPos = computeCameraPosition(
      [0, 0, 0],
      radius,
      phi,
      theta,
    );
  } else {
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
function createHumanFigure() {
  const body = FigureNode.create({
    radius: 1,
    phi: Math.PI / 2,
    theta: Math.PI / 2,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.1,
    extra_param: [0.3, 0.0, 0.0],
  });
  const head = FigureNode.create({
    radius: 0.2,
    phi: 0,
    theta: 0,
  }, {
    sdf: SDF_PRIMITIES.SDF_SPHERE,
    smooth_min: 0.0,
    extra_param: [0.4, 0.0, 0.0],
  });
  const arm_left = FigureNode.create({
    radius: 1,
    phi: Math.PI / 2,
    theta: Math.PI,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.0,
    extra_param: [0.25, 0.0, 0.0],
  });
  const arm_right = FigureNode.create({
    radius: 1,
    phi: Math.PI / 2,
    theta: 0,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.0,
    extra_param: [0.25, 0.0, 0.0],
  });
  const leg_left = FigureNode.create({
    radius: 1,
    phi: Math.PI / 2,
    theta: 5 * Math.PI / 4,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.0,
    extra_param: [0.25, 0.0, 0.0],
  });
  const leg_right = FigureNode.create({
    radius: 1,
    phi: -Math.PI / 2,
    theta: Math.PI / 4,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.0,
    extra_param: [0.25, 0.0, 0.0],
  });
  const foot_left = FigureNode.create({
    radius: 0.8,
    phi: -Math.PI / 2,
    theta: Math.PI / 2,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.0,
    extra_param: [0.25, 0.0, 0.0],
  });
  const foot_right = FigureNode.create({
    radius: 0.8,
    phi: -Math.PI / 2,
    theta: Math.PI / 2,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.0,
    extra_param: [0.25, 0.0, 0.0],
  });
  body.addChild(head, 1.5);
  body.addChild(arm_right, 1);
  body.addChild(arm_left, 1);
  body.addChild(leg_right, 0);
  body.addChild(leg_left, 0);
  leg_right.addChild(foot_right, 1);
  leg_left.addChild(foot_left, 1);

  return body;
}

function main() {
  const canvas =
    /** @type {SDFCanvas|null} */ (document.getElementById("sdf-view"));
  const editor =
    /** @type {SDFEditor|null} */ (document.getElementById("sdf-editor"));

  if (!canvas || !editor) {
    throw new Error("Canvas or editor not found in document!");
  }

  figure = createHumanFigure();
  const figure_list = figure.transformToList(vec3.fromValues(0, 0, 0));
  console.log("FigList", convertFigureListToSDFPart(figure_list));

  canvas.animateCallback = animate;
  editor.figureText = JSON.stringify(figure);
  // console.log(convertFigureListToSDFPart(figure_list));
  // canvas.figure = convertFigureListToSDFPart(figure_list);

  SDFEditor.onFigureEvent(editor, (event) => {
    // const figure = JSON.parse(event.detail.figureJson).map((
    //   /**@type {String}*/ obj,
    // ) => SDFPart.fromJSON(obj));
    const figure_json = JSON.parse(event.detail.figureJson);
    console.log("Figure JSON", figure_json);
    const fig = FigureNode.fromJSON(figure_json);
    console.log("Parsed JSON", fig);
    const fig_list = fig.transformToList(vec3.fromValues(0, 0, 0));

    console.log("json fig_list", fig_list);
    canvas.figure = convertFigureListToSDFPart(fig_list);
    // canvas._animateStep()
  });
  // Mouse interaction callbacks TODO
  // ---------
  // canvas.addEventListener("click", (e) => {
  //   canvas.requestPointerLock();
  // });
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
      phi += dy * 0.01; // Clamp phi to avoid flipping
      const eps = 0.1;
      phi = Math.max(eps, Math.min(Math.PI - eps, phi));
    }
  });
  // ---------
}

globalThis.onload = main;
