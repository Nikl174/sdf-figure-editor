import {
  rotatedPos,
  sphericalToCatesianCoordinates,
} from "./lib/utils.js";
import { SDFCanvas } from "./components/SDFCanvas.js";
import { SDFEditor } from "./components/FigureEditor.js";
import { FigureNodeEditor } from "./components/FigureNodeEditor.js";
import { FigureTree } from "./components/FigureTree.js";
import { SDF_PRIMITIES, SDFPart } from "./lib/figure.js";
import { FigureNode } from "./lib/figureGraph.js";
import { mat3, vec3 } from "./lib/matrix.js";

/**
 * @import {AnimVars} from "./components/SDFCanvas.js"
 * @import {FigureList} from "./lib/figureGraph.js"
 */

const CAM_ROT_INC_RAD = -0.040;
// horizontal angle
const CAM_THETA = Math.PI / 2;
// vertical angle (avoid 0 or π)
const CAM_PHI = Math.PI / 2;
// radius from camera to [0,0,0]
const CAM_RADIUS = 12;

// camera movement TODO
let radius = CAM_RADIUS;
let theta = CAM_THETA;
let phi = CAM_PHI;
let dragging = false;
let rotating = false;

const fig_pos = vec3.fromValues(0, 0, 0);
// deno-fmt-ignore
const identity = mat3.fromValues(
      1, 0, 0,
      0, 0, 1,
      0, 1, 0,
    );

/** @typedef {[{name: string, node: FigureNode}]} ComponentList */
/** @type {ComponentList} */
let current_figure_id = null;

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
  animVars.camPos = sphericalToCatesianCoordinates({
    radius: radius,
    phi: phi,
    theta: theta,
  });

  // switch y and z axis because of rotated coordinate system
  animVars.camPos = vec3.fromValues(
    animVars.camPos[0],
    animVars.camPos[2],
    animVars.camPos[1],
  );

  if (rotating && !dragging) {
    animVars.camPos = rotatedPos(radius, phi, animVars.camPos[1]);
    phi += CAM_ROT_INC_RAD;
  }

  animVars.custom.set("camRotRad", camRotRad);
}

/**
 * @brief Construct an example human figure using FigureNode structure
 * @return {FigureNode} the constructed human figure
 */
function createFigure() {
  const skin = vec3.fromValues(1.0, 0.75, 0.6);
  const shirt = vec3.fromValues(0.2, 0.2, 0.25);
  const pants = vec3.fromValues(0.1, 0.1, 0.5);

  const body = FigureNode.create("body", {
    radius: 1.2,
    phi: 0,
    theta: 0,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: shirt,
    extra_param: [0.29, 0.0, 0.0],
  });
  const pelvis = FigureNode.create("pelvis", {
    radius: 0.2,
    phi: 0,
    theta: 0,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: pants,
    extra_param: [0.3, 0.0, 0.0],
  });
  const head = FigureNode.create("head", {
    radius: 0.35,
    phi: 0,
    theta: 0,
  }, {
    sdf: SDF_PRIMITIES.SDF_SPHERE,
    smooth_min: 0.03,
    color: skin,
    extra_param: [0.37, 0.0, 0.0],
  });
  const upperArm_right = FigureNode.create("upperArm_right", {
    radius: 0.8,
    phi: 0,
    theta: Math.PI / 2,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: shirt,
    extra_param: [0.23, 0.0, 0.0],
  });
  const upperArm_left = FigureNode.create("upperArm_left", {
    radius: 0.8,
    phi: 0,
    theta: -Math.PI / 2,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: shirt,
    extra_param: [0.23, 0.0, 0.0],
  });
  const lowerArm_right = FigureNode.create("lowerArm_right", {
    radius: 1.0,
    phi: 0,
    theta: 0,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: skin,
    extra_param: [0.20, 0.0, 0.0],
  });
  const lowerArm_left = FigureNode.create("lowerArm_left", {
    radius: 1.0,
    phi: 0,
    theta: 0,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: skin,
    extra_param: [0.20, 0.0, 0.0],
  });
  const upperLeg_right = FigureNode.create("upperLeg_right", {
    radius: 1.0,
    phi: 0,
    theta: Math.PI / 8,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: pants,
    extra_param: [0.28, 0.0, 0.0],
  });
  const upperLeg_left = FigureNode.create("upperLeg_left", {
    radius: 1.0,
    phi: 0,
    theta: -Math.PI / 8,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: pants,
    extra_param: [0.28, 0.0, 0.0],
  });
  const lowerLeg_right = FigureNode.create("lowerLeg_right", {
    radius: 1.2,
    phi: 0,
    theta: 0,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: pants,
    extra_param: [0.25, 0.0, 0.0],
  });
  const lowerLeg_left = FigureNode.create("lowerLeg_left", {
    radius: 1.2,
    phi: 0,
    theta: 0,
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

/** TODO typechecking for ANY type of parameters!!??
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

/** @brief update the visual values inside of the editor
 * @param {FigureNodeEditor} editor the node editor
 * @param {FigureNode} root root node of the figure
 * * @param {Number} name name of the new node
 */
function updateNodeEditor(editor, root, name) {
  const node = root.findNodeByName(name);
  console.log(name, node, root);
  editor.setSelection(name);
  editor.setValues(node.vector, node.param.color, node.param.sdf);
  // TODO color
}

async function main() {
  const canvas =
    /** @type {SDFCanvas|null} */ (document.getElementById("sdf-view"));
  const editor =
    /** @type {SDFEditor|null} */ (document.getElementById("sdf-editor"));
  figure = createFigure();

  if (!canvas || !editor) {
    throw new Error("Canvas or editor not found in document!");
  }
  await canvas.whenReady();
  canvas.animateCallback = animate;

  // Mouse interaction callbacks TODO
  // ---------
  canvas.canvas.addEventListener("mousedown", (e) => {
    if (e.button === 0 && e.buttons > 0) {
      canvas.requestPointerLock();
    }
  });
  document.addEventListener("pointerlockchange", () => {
    dragging = document.pointerLockElement === canvas;
  });

  document.addEventListener("mouseup", (e) => {
    if (e.button === 0 && dragging) {
      document.exitPointerLock();
    }
  });

  canvas.canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    radius += e.deltaY * 0.01;
    radius = Math.max(1, Math.min(20, radius));
    canvas.updateSceneRender();

    // TODO??
  }, { passive: false });

  document.addEventListener("wheel", (e) => {
    if (!dragging) return;

    e.preventDefault();
    radius += e.deltaY * 0.01;
    radius = Math.max(1, Math.min(20, radius));
    canvas.updateSceneRender();
  }, { passive: false });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    theta += -e.movementY * 0.01;
    phi += e.movementX * 0.01; // Clamp phi to avoid flipping
    canvas.updateSceneRender();
  });
  // ---------

  // Settings
  // ---------
  // TODO TODO
  const rotate_box = /** @type {HTMLInputElement|null}*/ (document
    .getElementById("rotate"));
  rotating = rotate_box.checked;
  const animate_box = /** @type {HTMLInputElement|null}*/ (document
    .getElementById("animate"));
  canvas.animating = animate_box.checked;
  const resolution_width_box = /** @type {HTMLInputElement|null}*/ (document
    .getElementById("width"));
  const resolution_height_box = /** @type {HTMLInputElement|null}*/ (document
    .getElementById("height"));
  const edit_figure_box = /** @type {HTMLInputElement|null}*/ (document
    .getElementById("edit"));
  const node_editor = /** @type {FigureNodeEditor|null}*/ (document
    .getElementById("node-editor"));
  const node_tree = /** @type {FigureTree|null}*/ (document
    .getElementById("node-tree"));
  node_editor.style.display =
    edit_figure_box.checked && current_figure_id !== null ? "block" : "none";
  node_tree.style.display = edit_figure_box.checked ? "block" : "none";

  const config = {
    nameKey: "name",
    childrenKey: "childs",
    typeKey: "type",
  };
  const sdf_options = [
    { label: "None", value: -1 },
    { label: "Sphere", value: 0 },
    { label: "Capsule", value: 1 },
    { label: "Bend Capsule", value: 2 },
    { label: "Round Cone", value: 3 },
    { label: "Ellipsoid", value: 4 },
  ];
  node_editor.sdfOptions = sdf_options;
  node_tree.style.display = edit_figure_box.checked ? "block" : "none";
  node_tree.config = config;

  node_tree?.addEventListener("select", (event) => {
    node_editor.setSelection(event.detail);
    updateNodeEditor(node_editor, figure, event.detail);
    current_figure_id = event.detail;
  });

  canvas.height = resolution_height_box.valueAsNumber;
  canvas.width = resolution_width_box.valueAsNumber;
  resolution_height_box.addEventListener("focusout", (event) => {
    // console.log(event.target);
    canvas.height = event.target.valueAsNumber;
  });
  resolution_width_box.addEventListener("focusout", (event) => {
    // console.log(event.target);
    canvas.width = event.target.valueAsNumber;
  });
  animate_box?.addEventListener("change", (event) => {
    canvas.animating = event.target.checked;
  });
  rotate_box?.addEventListener("change", (event) => {
    rotating = event.target.checked;
  });
  edit_figure_box.addEventListener("change", (event) => {
    node_editor.style.display =
      event.target.checked && current_figure_id !== null ? "block" : "none";
    node_tree.style.display = event.target.checked ? "block" : "none";
  });

  node_editor.addEventListener("value-change", (event) => {
    const node = figure.findNodeByName(current_figure_id);
    if (node === null) return;
    switch (event.detail.property) {
      case "color":
        node.param.color = event.detail.value;
        break;
      case "theta":
      case "radius":
      case "phi": {
        const vec = node.vector;
        vec[event.detail.property] = event.detail.value;
        node.vector = vec;
        break;
      }
      case "sdf":
        node.param.sdf = event.detail.value;
        break;
      default:
        console.warn("property not defined!", event.detail.property);
    }

    const figure_list = figure.transformToList(fig_pos, identity);
    canvas.figure = convertFigureListToSDFPart(figure_list);
    editor.figureText = JSON.stringify(figure);
  });
  // ---------

  // figure handling
  // ---------
  const figure_list = figure.transformToList(fig_pos, identity);
  canvas.figure = convertFigureListToSDFPart(figure_list);
  editor.figureText = JSON.stringify(figure);
  console.log("Figure: ", editor.figureText);
  node_tree.figure = JSON.parse(editor.figureText);
  // updateNodeEditor(node_editor, figure, current_figure_id);
  SDFEditor.onFigureEvent(editor, (event) => {
    const figure_json = JSON.parse(event.detail.figureJson);
    const fig = FigureNode.fromJSON(figure_json);
    const fig_list = fig.transformToList(fig_pos, identity);
    console.log(fig_list);

    canvas.figure = convertFigureListToSDFPart(fig_list);
    updateNodeEditor(node_editor, figure, current_figure_id);
  });
  // ---------
}

globalThis.onload = main;
