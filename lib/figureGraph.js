import { vec3 } from "./matrix.js";
import {
  clamp,
  Serializable,
  sphericalToCatesianCoordinates,
} from "./utils.js";

/**
 * @import { SphereCoordinates } from "./utils.js"
 */

/**
 * List later converted to the format needed for the shader
 * @typedef {{start: vec3, end: vec3, param: *}[]} FigureList
 */

const ATTACHMENT_MIN = 0;
const ATTACHMENT_MAX = 1;

export class FigureNode extends Serializable {
  /**
   * @override
   */
  static schema = {
    vector: "object",
    param: "object",
    attachment: "number",
    childs: [FigureNode],
  };
  /** @type {vec3}*/
  #end_point;
  /** @type {vec3}*/
  #start_point;

  // TODO
  constructor() {
    super();
    /** @type {FigureNode[]}*/
    this.childs = [];
    this.vector = { radius: 0, phi: 0, theta: 0 };

    /** @type {*}*/
    this.param = {};
    /** @type {Number}*/
    this.attachment = 1;
    this.#start_point = vec3.create();
    this.#end_point = vec3.create();
  }

  /**
   * @param {SphereCoordinates} position_vector direction and length of the new part as spherical coordinates
   * TODO: type needed?
   * @param {*} param additional parameter for the current nodes SDF
   * @return {FigureNode} the newly created figure node
   */
  static create = function (position_vector, param) {
    let fn = new FigureNode();
    /** @type {FigureNode[]}*/
    fn.childs = [];
    fn.vector = position_vector;
    fn.param = param;
    /** @type {Number}*/
    fn.attachment = 1;
    fn.#start_point = vec3.create();
    fn.#end_point = vec3.create();
    return fn;
  };

  /**
   * @param {FigureNode} node child node to add
   * @param {number|null} attachment attachment ratio along the current node to place the child one, values clamped between 0 and 1
   */
  addChild(node, attachment) {
    if (attachment !== null) {
      node.attachment = attachment; // = clamp(attachment, ATTACHMENT_MIN, ATTACHMENT_MAX);
    }
    this.childs.push(node);
  }

  /**
   * @brief Applies transformation recursively constructing the figure 'scene' structure and converting it to the list of points and parameters
   *
   * @param {vec3} start_point Cartesian point to start the transformation from
   * @return {FigureList} the list representation of the transformed node structure
   */
  transformToList(start_point) {
    // TODO
    this.#start_point = start_point;

    // console.log(this.vector);
    const cart_vec = sphericalToCatesianCoordinates(this.vector);
    const vec = vec3.fromValues(cart_vec.x, cart_vec.y, cart_vec.z);
    // TODO?
    this.#end_point = vec3.add(this.#end_point, start_point, vec);

    // create list of points for the shader
    let list = [{
      start: this.#start_point,
      end: this.#end_point,
      param: this.param,
    }];

    // recursively apply transformation to childs
    if (this.childs != null) {
      for (const child of this.childs) {
        const att = child.attachment;
        let end = vec3.create();
        Object.assign(end, this.#end_point);
        console.log("endpoint", end);
        // recalculate the endpoint used to calculate the next tree
        // when attachment points is shifted in child
        if (att != 1) {
          const new_vec = vec3.create();
          vec3.scale(new_vec, vec, att);
          end = vec3.add(end, this.#start_point, new_vec);
        }
        // calculate recursively and add to list
        const c_list = child.transformToList(end);
        list = list.concat(c_list);
      }
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
