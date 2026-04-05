import { computeCameraPosition, rotatedPos } from "./lib/utils.js";
import { SDFCanvas } from "./components/SDFCanvas.js";
import { SDFEditor } from "./components/FigureEditor.js";
import { SDFPart } from "./lib/figure.js";
import { FigureNode} from "./lib/figureGraph.js"

/** @import {AnimVars} from "./components/SDFCanvas.js" */

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

async function main() {
  const canvas =
    /** @type {SDFCanvas|null} */ (document.getElementById("sdf-view"));
  const editor =
    /** @type {SDFEditor|null} */ (document.getElementById("sdf-editor"));

  if (!canvas || !editor) {
    throw new Error("Canvas or editor not found in document!");
  }

  canvas.animateCallback = animate;
  editor.figureText = JSON.stringify(canvas.figure);

  SDFEditor.onFigureEvent(editor, (event) => {
    const figure = JSON.parse(event.detail.figureJson).map((
      /**@type {String}*/ obj,
    ) => SDFPart.fromJSON(obj));

    canvas.figure = figure;
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
