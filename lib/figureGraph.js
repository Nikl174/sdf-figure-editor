import { Serializable } from "./utils.js";
import { mat4, vec4 } from "./matrix.js";

/**
 * @import { ExtraParam, SDFPart } from "./figure.js"
 */

// /**
//  * @typedef {{primitive: SDF_PRIMITIES, extra_param: ExtraParam}} FigureParam
//  * Parameter used for the SDF in the current node
//  * TODO: maybe remove?
//  */

/**
 * @typedef {{start: vec4, end: vec4, param: *}[]} FigureList
 * @typedef {{yaw: number, pitch: number, roll: number}} EulerAngle
 */

class FigureNode extends Serializable {
  /**
   * @override
   */
  static schema = {
    param: "object",
    childs: [FigureNode],
  };
  /** @type {vec4}*/
  #end_point;
  /** @type {vec4}*/
  #start_point;

  /**
   * @param {SphereCoordinates} position_vector direction and length of the new part as spherical coordinates
   * TODO: type needed?
   * @param {*} param additional parameter for the current nodes SDF
   */
  constructor(position_vector, param) {
    super();
    /** @type {FigureNode[]}*/
    this.childs = [];
    this.vector = position_vector;
    this.param = param;
    // homogenus
    this.#start_point = vec4.fromValues(0, 0, 0, 1);
    this.#end_point = vec4.fromValues(0, 0, 0, 1);
  }

  /**
   * @param {FigureNode} node child node to add
   */
  addChild(node) {
    this.childs.push(node);
  }

  /** TODO: change to used operation type for MatMul
   * @brief Applies transformation recursively constructing the figure 'scene' structure and converting it to the list of points and parameters
   *
   * @param {mat4} transformMat initial matrix transformation should be applied to (e.g. from parent)
   * @param {vec4} start_point homogenus point to start the transformation from
   * @return {FigureList} the list representation of the transformed node structure
   */
  transformToList(start_point) {
    // TODO
    // const mat = mat4.create();
    // const cosY = Math.cos(this.angles.yaw);
    // const sinY = Math.sin(this.angles.yaw);
    // const cosP = Math.cos(this.angles.pitch);
    // const sinP = Math.sin(this.angles.pitch);
    // const cosR = Math.cos(this.angles.roll);
    // const sinR = Math.sin(this.angles.roll);
    // // deno-fmt-ignore
    // const localTransform = mat4.fromValues(
    //     cosY*cosP, cosY*sinP*sinR - sinY*cosR, cosY*sinP*cosR + sinY*sinR, 0,
    //     sinY*cosP, sinY*sinP*sinR + cosY*cosR, sinY*sinP*cosR - cosY*sinR, 0,
    //     -sinP,     cosP*sinR,                  cosP*cosR,                  0,
    //     0,         0,                          0,                          1,
    // );
    // mat4.multiply(mat, transformMat, localTransform);
    // mat4.transformVec4(this.#start_point, transformMat, this.#start_point);
    // mat4.transformVec4(this.#end_point, mat, this.#start_point);
    this.#start_point = start_point;
    this.#end_point = 

    let list = [{
      start: this.#start_point,
      end: this.#end_point,
      param: this.param,
    }];

    // recursively apply transformation to childs
    for (const child of this.childs) {
      const c_list = child.transformToList(mat);
      list = list.concat(c_list);
    }
    return list;
  }

  /**
   * @brief constructs a list representation of THE CURRENT and child nodes
   * WARNING: does not transform and calculate start and end points
   * @return {FigureList} the list representation the node structure
   */
  getList() {
    let list = [{
      start: this.#start_point,
      end: this.#end_point,
      param: this.param,
    }];
    for (const child of this.childs) {
      list = list.concat(child.getList());
    }
    return list;
  }
}
