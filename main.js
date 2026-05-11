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
function createHumanFigure() {
  const body = FigureNode.create({
    radius: 1,
    phi: Math.PI / 2,
    theta: Math.PI / 2,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.0,
    color: vec3.fromValues(0.1, 0.1, 0.1),
    extra_param: [0.3, 0.0, 0.0],
  });
  const head = FigureNode.create({
    radius: 0.2,
    phi: 0,
    theta: 0,
  }, {
    sdf: SDF_PRIMITIES.SDF_SPHERE,
    smooth_min: 0.01,
    color: vec3.fromValues(1.0, 0.7, 0.4),
    extra_param: [0.4, 0.0, 0.0],
  });
  const arm_left = FigureNode.create({
    radius: 1,
    phi: Math.PI / 2,
    theta: Math.PI,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.1,
    color: vec3.fromValues(1.0, 0.7, 0.4),
    extra_param: [0.25, 0.0, 0.0],
  });
  const arm_right = FigureNode.create({
    radius: 1,
    phi: Math.PI / 2,
    theta: 0,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.10,
    color: vec3.fromValues(1.0, 0.7, 0.4),
    extra_param: [0.25, 0.0, 0.0],
  });
  const leg_left = FigureNode.create({
    radius: 1,
    phi: Math.PI / 2,
    theta: 5 * Math.PI / 4,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.01,
    color: vec3.fromValues(0.1, 0.1, 0.5),
    extra_param: [0.25, 0.0, 0.0],
  });
  const leg_right = FigureNode.create({
    radius: 1,
    phi: -Math.PI / 2,
    theta: Math.PI / 4,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.01,
    color: vec3.fromValues(0.1, 0.1, 0.5),
    extra_param: [0.25, 0.0, 0.0],
  });
  const foot_left = FigureNode.create({
    radius: 0.8,
    phi: -Math.PI / 2,
    theta: Math.PI / 2,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.01,
    color: vec3.fromValues(1.0, 0.7, 0.4),
    extra_param: [0.25, 0.0, 0.0],
  });
  const foot_right = FigureNode.create({
    radius: 0.8,
    phi: -Math.PI / 2,
    theta: Math.PI / 2,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.01,
    color: vec3.fromValues(1.0, 0.7, 0.4),
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

function createHumanFigureAdvanced() {
  const skin = vec3.fromValues(1.0, 0.75, 0.6);
  const shirt = vec3.fromValues(0.2, 0.2, 0.25);
  const pants = vec3.fromValues(0.1, 0.1, 0.5);

  // --- Core body ---
  const pelvis = FigureNode.create({
    radius: 0.6,
    phi: Math.PI / 2,
    theta: Math.PI / 2,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: pants,
    extra_param: [0.35, 0.0, 0.0],
  });

  const chest = FigureNode.create({
    radius: 0.9,
    phi: Math.PI / 2,
    theta: Math.PI / 2,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.05,
    color: shirt,
    extra_param: [0.45, 0.0, 0.0],
  });

  const neck = FigureNode.create({
    radius: 0.50,
    phi: Math.PI / 2,
    theta: Math.PI / 2,
  }, {
    sdf: SDF_PRIMITIES.SDF_CAPSULE,
    smooth_min: 0.02,
    color: skin,
    extra_param: [0.12, 0.0, 0.0],
  });

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

  // --- Arms ---
  function createArm(side = 1) {
    const upper = FigureNode.create({
      radius: 0.7,
      phi: Math.PI / 2,
      theta: side * (Math.PI / 1.3),
    }, {
      sdf: SDF_PRIMITIES.SDF_CAPSULE,
      smooth_min: 0.05,
      color: shirt,
      extra_param: [0.18, 0.0, 0.0],
    });

    const lower = FigureNode.create({
      radius: 0.7,
      phi: Math.PI / 2,
      theta: side * (Math.PI / 1.5),
    }, {
      sdf: SDF_PRIMITIES.SDF_CAPSULE,
      smooth_min: 0.05,
      color: skin,
      extra_param: [0.16, 0.0, 0.0],
    });

    const hand = FigureNode.create({
      radius: 0.2,
      phi: Math.PI / 2,
      theta: side * (Math.PI / 1.5),
    }, {
      sdf: SDF_PRIMITIES.SDF_SPHERE,
      smooth_min: 0.01,
      color: skin,
      extra_param: [0.0, 0.0, 0.0],
    });

    upper.addChild(lower, 1.0);
    lower.addChild(hand, 1.0);

    return upper;
  }

  // --- Legs ---
  function createLeg(side = 1) {
    const upper = FigureNode.create({
      radius: 0.9,
      phi: Math.PI / 2,
      theta: side * (Math.PI / 4 + 0.3),
    }, {
      sdf: SDF_PRIMITIES.SDF_CAPSULE,
      smooth_min: 0.03,
      color: pants,
      extra_param: [0.22, 0.0, 0.0],
    });

    const lower = FigureNode.create({
      radius: 0.9,
      phi: Math.PI / 2,
      theta: side * (Math.PI / 2 - 0.2),
    }, {
      sdf: SDF_PRIMITIES.SDF_CAPSULE,
      smooth_min: 0.03,
      color: pants,
      extra_param: [0.2, 0.0, 0.0],
    });

    const foot = FigureNode.create({
      radius: 0.4,
      phi: -Math.PI / 2,
      theta: Math.PI / 2,
    }, {
      sdf: SDF_PRIMITIES.SDF_CAPSULE,
      smooth_min: 0.02,
      color: vec3.fromValues(0.05, 0.05, 0.05),
      extra_param: [0.18, 0.0, 0.0],
    });

    upper.addChild(lower, 1.0);
    lower.addChild(foot, 1.0);

    return upper;
  }

  // --- Build hierarchy ---
  pelvis.addChild(chest, 1.0);
  chest.addChild(neck, 1.1);
  neck.addChild(head, 1);

  const armL = createArm(1);
  const armR = createArm(-1);

  const legL = createLeg(1);
  const legR = createLeg(-1);

  chest.addChild(armL, 0.9);
  chest.addChild(armR, 0.9);

  pelvis.addChild(legL, 0.0);
  pelvis.addChild(legR, 0.0);

  return pelvis;
}

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
    theta: (3 * Math.PI / 2 + 0.3),
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

function createFullHumanRig() {
  const skin = vec3.fromValues(1.0, 0.75, 0.6);
  const shirt = vec3.fromValues(0.2, 0.2, 0.25);
  const pants = vec3.fromValues(0.1, 0.1, 0.5);

  // ======================
  // 🦴 ROOT + SPINE
  // ======================
  const pelvis = FigureNode.create(
    { radius: 0.3, phi: Math.PI / 2, theta: Math.PI / 2 },
    {
      sdf: SDF_PRIMITIES.SDF_CAPSULE,
      smooth_min: 0.08,
      color: pants,
      extra_param: [0.3, 0, 0],
    },
  );

  const spineLower = FigureNode.create(
    { radius: 0.6, phi: Math.PI / 2, theta: Math.PI / 2 },
    {
      sdf: SDF_PRIMITIES.SDF_CAPSULE,
      smooth_min: 0.05,
      color: shirt,
      extra_param: [0.3, 0, 0],
    },
  );

  const spineUpper = FigureNode.create(
    { radius: 0.7, phi: Math.PI / 2, theta: Math.PI / 2 },
    {
      sdf: SDF_PRIMITIES.SDF_CAPSULE,
      smooth_min: 0.05,
      color: shirt,
      extra_param: [0.35, 0, 0],
    },
  );

  const neck = FigureNode.create(
    { radius: 0.2, phi: Math.PI / 2, theta: Math.PI / 2 },
    {
      sdf: SDF_PRIMITIES.SDF_CAPSULE,
      smooth_min: 0.02,
      color: skin,
      extra_param: [0.15, 0, 0],
    },
  );

  const head = FigureNode.create(
    { radius: 0.35, phi: 0, theta: 0 },
    {
      sdf: SDF_PRIMITIES.SDF_SPHERE,
      smooth_min: 0.02,
      color: skin,
      extra_param: [0.3, 0, 0],
    },
  );

  // ======================
  // 💪 ARM BUILDER
  // ======================
  function createArm(side = 1) {
    const shoulder = FigureNode.create(
      { radius: 0.2, phi: Math.PI / 2, theta: side * Math.PI },
      {
        sdf: SDF_PRIMITIES.SDF_SPHERE,
        smooth_min: 0.1,
        color: shirt,
        extra_param: [0, 0, 0],
      },
    );

    const upperArm = FigureNode.create(
      { radius: 0.7, phi: Math.PI / 2, theta: side * Math.PI / 4 },
      {
        sdf: SDF_PRIMITIES.SDF_CAPSULE,
        smooth_min: 0.05,
        color: shirt,
        extra_param: [0.18, 0, 0],
      },
    );

    const elbow = FigureNode.create(
      { radius: 0.15, phi: Math.PI / 2, theta: side * Math.PI },
      {
        sdf: SDF_PRIMITIES.SDF_SPHERE,
        smooth_min: 0.1,
        color: shirt,
        extra_param: [0, 0, 0],
      },
    );

    const lowerArm = FigureNode.create(
      { radius: 0.7, phi: Math.PI / 2, theta: side * Math.PI },
      {
        sdf: SDF_PRIMITIES.SDF_CAPSULE,
        smooth_min: 0.05,
        color: skin,
        extra_param: [0.15, 0, 0],
      },
    );

    const hand = FigureNode.create(
      { radius: 0.25, phi: Math.PI / 2, theta: side * Math.PI },
      {
        sdf: SDF_PRIMITIES.SDF_SPHERE,
        smooth_min: 0.02,
        color: skin,
        extra_param: [0, 0, 0],
      },
    );

    shoulder.addChild(upperArm, 0.3);
    upperArm.addChild(elbow, 1.0);
    elbow.addChild(lowerArm, 0.3);
    lowerArm.addChild(hand, 1.0);

    return shoulder;
  }

  // ======================
  // 🦵 LEG BUILDER
  // ======================
  function createLeg(side = 1) {
    const hip = FigureNode.create(
      { radius: 0.2, phi: Math.PI / 2, theta: side * Math.PI },
      {
        sdf: SDF_PRIMITIES.SDF_SPHERE,
        smooth_min: 0.1,
        color: pants,
        extra_param: [0, 0, 0],
      },
    );

    const upperLeg = FigureNode.create(
      { radius: 0.9, phi: Math.PI / 2, theta: -Math.PI / 2 + side * 0.2 },
      {
        sdf: SDF_PRIMITIES.SDF_CAPSULE,
        smooth_min: 0.03,
        color: pants,
        extra_param: [0.22, 0, 0],
      },
    );

    const knee = FigureNode.create(
      { radius: 0.15, phi: Math.PI / 2, theta: Math.PI / 2 },
      {
        sdf: SDF_PRIMITIES.SDF_SPHERE,
        smooth_min: 0.1,
        color: pants,
        extra_param: [0, 0, 0],
      },
    );

    const lowerLeg = FigureNode.create(
      { radius: 0.9, phi: Math.PI / 2, theta: Math.PI / 2 },
      {
        sdf: SDF_PRIMITIES.SDF_CAPSULE,
        smooth_min: 0.03,
        color: pants,
        extra_param: [0.2, 0, 0],
      },
    );

    const ankle = FigureNode.create(
      { radius: 0.12, phi: Math.PI / 2, theta: Math.PI / 2 },
      {
        sdf: SDF_PRIMITIES.SDF_SPHERE,
        smooth_min: 0.1,
        color: pants,
        extra_param: [0, 0, 0],
      },
    );

    const foot = FigureNode.create(
      { radius: 0.4, phi: -Math.PI / 2, theta: Math.PI / 2 },
      {
        sdf: SDF_PRIMITIES.SDF_CAPSULE,
        smooth_min: 0.02,
        color: vec3.fromValues(0.05, 0.05, 0.05),
        extra_param: [0.2, 0, 0],
      },
    );

    hip.addChild(upperLeg, 0.3);
    upperLeg.addChild(knee, 1.0);
    knee.addChild(lowerLeg, 0.3);
    lowerLeg.addChild(ankle, 1.0);
    ankle.addChild(foot, 0.2);

    return hip;
  }

  // ======================
  // 🔗 HIERARCHY
  // ======================
  pelvis.addChild(spineLower, 1.0);
  spineLower.addChild(spineUpper, 1.0);
  spineUpper.addChild(neck, 1.0);
  neck.addChild(head, 0.6);

  // arms
  const armL = createArm(1);
  const armR = createArm(-1);

  spineUpper.addChild(armL, 0.9);
  spineUpper.addChild(armR, 0.9);

  // legs
  const legL = createLeg(1);
  const legR = createLeg(-1);

  pelvis.addChild(legL, 0.0);
  pelvis.addChild(legR, 0.0);

  return pelvis;
}

function main() {
  const canvas =
    /** @type {SDFCanvas|null} */ (document.getElementById("sdf-view"));
  const editor =
    /** @type {SDFEditor|null} */ (document.getElementById("sdf-editor"));

  if (!canvas || !editor) {
    throw new Error("Canvas or editor not found in document!");
  }

  figure = createRiggedHuman();
  const figure_list = figure.transformToList(vec3.fromValues(0, 0, 0));
  console.log("FigureListSize:", figure_list.length);

  canvas.animateCallback = animate;
  editor.figureText = JSON.stringify(figure);
  // console.log(convertFigureListToSDFPart(figure_list));
  canvas.figure = convertFigureListToSDFPart(figure_list);

  SDFEditor.onFigureEvent(editor, (event) => {
    // const figure = JSON.parse(event.detail.figureJson).map((
    //   /**@type {String}*/ obj,
    // ) => SDFPart.fromJSON(obj));
    const figure_json = JSON.parse(event.detail.figureJson);
    const fig = FigureNode.fromJSON(figure_json);
    const fig_list = fig.transformToList(vec3.fromValues(0, 0, 0));

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
