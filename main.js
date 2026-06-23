import {
  computeCameraPosition,
  mat3Rotation,
  rotatedPos,
} from "./lib/utils.js";
import { SDFCanvas } from "./components/SDFCanvas.js";
import { SDFEditor } from "./components/FigureEditor.js";
import { FigureNodeEditor } from "./components/FigureNodeEditor.js";
import { SDF_PRIMITIES, SDFPart } from "./lib/figure.js";
import { FigureNode } from "./lib/figureGraph.js";
import { mat3, vec3 } from "./lib/matrix.js";

/**
 * @import {AnimVars} from "./components/SDFCanvas.js"
 * @import {FigureList} from "./lib/figureGraph.js"
 */

const CAM_ROT_INC_RAD = -0.040;
// horizontal angle
const CAM_THETA = 0;
// vertical angle (avoid 0 or π)
const CAM_PHI = 2;
// radius from camera to [0,0,0]
const CAM_RADIUS = 10;

// camera movement TODO
let radius = CAM_RADIUS;
let theta = CAM_THETA;
let phi = CAM_PHI;
let dragging = false;
let rotating = false;

const fig_pos = vec3.fromValues(0, 0, 0);
// const identity = mat3.create();
// deno-fmt-ignore
const identity = mat3.fromValues(
      1, 0, 0,
      0, 0, 1,
      0, 1, 0,
    );

/** @typedef {[{name: string, node: FigureNode}]} ComponentList */
/** @type {ComponentList} */
const fig_component_list = [];
let current_figure_id = 0;

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
    phi: 0,
    theta: 0,
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
    theta: 0,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: pants,
    extra_param: [0.25, 0.0, 0.0],
  });
  const lowerLeg_left = FigureNode.create({
    radius: 1.2,
    phi: 0,
    theta: 0,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: pants,
    extra_param: [0.25, 0.0, 0.0],
  });

  fig_component_list.push({ name: "body", node: body });
  fig_component_list.push({ name: "pelvis", node: pelvis });
  fig_component_list.push({ name: "head", node: head });
  fig_component_list.push({ name: "upperArm_right", node: upperArm_right });
  fig_component_list.push({ name: "lowerArm_right", node: lowerArm_right });
  fig_component_list.push({ name: "upperArm_left", node: upperArm_left });
  fig_component_list.push({ name: "lowerArm_left", node: lowerArm_left });
  fig_component_list.push({ name: "upperLeg_right", node: upperLeg_right });
  fig_component_list.push({ name: "lowerLeg_right", node: lowerLeg_right });
  fig_component_list.push({ name: "upperLeg_left", node: upperLeg_left });
  fig_component_list.push({ name: "lowerLeg_left", node: lowerLeg_left });
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

/** @brief update the visual values inside of the editor
 * @param {FigureNodeEditor} editor the node editor
 * @param {ComponentList} nodes the list of nodes from which one is selected
 * @param {Number} index index of the selected node
 */
function updateNodeEditor(editor, nodes, index) {
  editor.setSelection(index, nodes.length, nodes[index].name);
  editor.setValues(nodes[index].node.vector);
}

function main() {
  const canvas =
    /** @type {SDFCanvas|null} */ (document.getElementById("sdf-view"));
  const editor =
    /** @type {SDFEditor|null} */ (document.getElementById("sdf-editor"));

  if (!canvas || !editor) {
    throw new Error("Canvas or editor not found in document!");
  }
  canvas.animateCallback = animate;

  // Mouse interaction callbacks TODO
  // ---------
  canvas.canvas.addEventListener("mousedown", (e) => {
    if (e.buttons == 1) {
      dragging = true;
      canvas.requestPointerLock();
    }
  });
  canvas.canvas.addEventListener("mouseup", (e) => {
    dragging = false;
    document.exitPointerLock();
  });
  canvas.canvas.addEventListener("wheel", (e) => {
    radius += e.deltaY * 0.01;
    radius = Math.max(1, Math.min(20, radius));
  });
  canvas.canvas.addEventListener("mousemove", (e) => {
    // left mouse button pressed
    if (dragging) {
      const dx = e.movementX;
      const dy = e.movementY;
      theta += dy * 0.01;
      phi += -dx * 0.01; // Clamp phi to avoid flipping
      const eps = 0.1;
      phi = Math.max(eps, Math.min(Math.PI - eps, phi));
    }
  });
  // ---------

  // Settings
  // ---------
  const rotate_box = /** @type {HTMLInputElement|null}*/ (document
    .getElementById("rotate"));
  rotating = rotate_box.checked;
  const animate_box = /** @type {HTMLInputElement|null}*/ (document
    .getElementById("animate"));
  canvas.animating = animate_box.checked;
  const edit_figure_box = /** @type {HTMLInputElement|null}*/ (document
    .getElementById("edit"));
  const node_editor = /** @type {FigureNodeEditor|null}*/ (document
    .getElementById("node-editor"));
  node_editor.style.display = edit_figure_box.checked ? "block" : "none";

  animate_box?.addEventListener("change", (event) => {
    canvas.animating = event.target.checked;
  });
  rotate_box?.addEventListener("change", (event) => {
    rotating = event.target.checked;
  });
  edit_figure_box.addEventListener("change", (event) => {
    node_editor.style.display = event.target.checked ? "block" : "none";
  });

  node_editor.addEventListener("previous-item", () => {
    if (current_figure_id > 0) {
      current_figure_id--;
      updateNodeEditor(node_editor, fig_component_list, current_figure_id);
    }
  });
  node_editor.addEventListener("next-item", () => {
    if (current_figure_id < fig_component_list.length) {
      current_figure_id++;
      updateNodeEditor(node_editor, fig_component_list, current_figure_id);
    }
  });
  node_editor.addEventListener("value-change", (event) => {
    const node = fig_component_list[current_figure_id].node;
    const vec = node.vector;
    vec[event.detail.property] = event.detail.value;
    node.vector = vec;

    const figure_list = figure.transformToList(fig_pos, identity);
    canvas.figure = convertFigureListToSDFPart(figure_list);
  });
  // ---------

  // figure handling
  // ---------
  figure = createFigure();
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
