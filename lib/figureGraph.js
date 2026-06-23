import { mat3, vec3 } from "./matrix.js";
import {
  calcSphericalBaseMatrix,
  mat3Rotation,
  Serializable,
  sphericalToCatesianCoordinates,
  sphericalToVec3,
  vec3ToSpherical,
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
  static INITIAL_ATTACHMENT = 1;
  /** @type {vec3}*/
  #end_point;
  /** @type {vec3}*/
  #start_point;
  /** @type {mat3}*/
  #sphere_vec_base;
  /** @type {vec3} */
  #vector;

  toJSON() {
    return {
      vector: this.vector,
      param: this.param,
      attachment: this.attachment,
      childs: this.childs,
    };
  }

  // TODO
  constructor() {
    super();
    this.#start_point = vec3.create();
    this.#end_point = vec3.create();
    this.#sphere_vec_base = mat3.create();
    this.#vector = vec3.create();

    /** @type {FigureNode[]}*/
    this.childs = [];
    /** @type {SphereCoordinates}*/
    this.vector = { radius: 0, phi: 0, theta: 0 };

    /** @type {*}*/
    this.param = {};
    /** @type {Number}*/
    this.attachment = FigureNode.INITIAL_ATTACHMENT;
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
   * @param {SphereCoordinates} new_vec new vector for part in spherical coordinates
   */
  set vector(new_vec) {
    this.#vector = sphericalToVec3(new_vec);
    // TODO vielleicht gleich transponiert aufschreiben + auslagern + dokumentieren
    this.#sphere_vec_base = calcSphericalBaseMatrix(new_vec);
  }
  /**
   * @return {SphereCoordinates} the current vector used this part
   */
  get vector() {
    return vec3ToSpherical(this.#vector);
  }

  /**
   * @brief Applies transformation recursively constructing the figure 'scene' structure and converting it to the list of points and parameters
   *
   * @param {vec3} start_point vector point to start the transformation from
   * @param {mat3} vector_base TODO implement static basic one
   * @return {FigureList} the list representation of the transformed node structure
   * TODO REFACTOR especially the spherical and normal vector conversion
   */
  transformToList(start_point, vector_base) {
    this.#start_point = start_point;

    let conv_trans_vec = sphericalToCatesianCoordinates(this.vector);
    mat3.transformVec3(
      conv_trans_vec,
      vector_base,
      conv_trans_vec,
    );
    // TODO als initiale vector_base
    //swap rows to correct x and z axis

    vec3.add(
      this.#end_point,
      // corrected_vec,
      conv_trans_vec,
      start_point,
    );

    // calculate new base by applying base base TODO
    const new_sphere_vec_base = mat3.create();
    mat3.multiply(
      new_sphere_vec_base,
      vector_base,
      this.#sphere_vec_base,
    );

    // ---- Recursion ----
    // create list of points for the shader
    let list = [{
      start: this.#start_point,
      end: this.#end_point,
      param: this.param,
    }];

    if (this.childs != null) {
      //
      // recursively apply transformation to childs
      for (const child of this.childs) {
        const att = child.attachment;
        const new_start_vec = vec3.create();
        const tmp_vec = vec3.create();
        const tmp_new_sphere_base = mat3.create();
        // actually copy the object or else end point is always referenced to the first one
        // Object.assign(tmp_vec, conv_trans_vec);
        // Object.assign(tmp_new_sphere_base, new_sphere_vec_base);
        vec3.copy(tmp_vec, conv_trans_vec);
        mat3.copy(tmp_new_sphere_base, new_sphere_vec_base);

        // recalculate the base vector used to calculate the next tree
        // when attachment points is shifted in child
        if (att != FigureNode.INITIAL_ATTACHMENT) {
          vec3.scale(tmp_vec, conv_trans_vec, att);
          // rotate base if attachment below half
          if (att < 0.5) {
            const rot_z = mat3Rotation("z", Math.PI);
            const rot_mat = mat3.create();
            mat3.multiply(rot_mat, rot_mat, rot_z);
            // flip coordinate system -> make it right-handed after rotation
            // deno-fmt-ignore
            const flip_z = mat3.fromValues(
                  1, 0, 0,
                  0, 1, 0,
                  0, 0,-1,
                );
            mat3.multiply(tmp_new_sphere_base, flip_z, tmp_new_sphere_base);
            mat3.multiply(tmp_new_sphere_base, rot_mat, tmp_new_sphere_base);
          }
        }

        // calculate the new spherical base vector for the next coordinate system of the childs
        vec3.add(
          new_start_vec,
          start_point,
          tmp_vec,
        );

        // calculate recursively and add to list
        const c_list = child.transformToList(
          new_start_vec,
          tmp_new_sphere_base,
        );
        list = list.concat(c_list);
      }
    }
    // ---------------------

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
