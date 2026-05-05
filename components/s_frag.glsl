#version 300 es
precision highp float;

uniform vec3 lightPos;
uniform vec3 camPos;
uniform int numOfPart;

in vec2 xyCoo; // the current xy-coordinate as calculated based on the vertex
// shader positions during polygon filling (normalized -1..1)
out vec4 fragColor; // in WebGl 1.0 we had the predifined gl_FragColor, but in
// WebGl 2.0 we have to define it here

const float epsPos = 1e-3;
const float epsNrm = 1e-4;
const vec3 n1 =
  vec3(epsNrm, epsNrm,
    epsNrm); // These are offsets to be used for normal approximation.
const vec3 n2 =
  vec3(-epsNrm, epsNrm,
    -epsNrm); // They may be seen as 4 of the 8 corner points of a cube
const vec3 n3 =
  vec3(epsNrm, -epsNrm,
    -epsNrm); // which have no common edge (you may also use the other 4;-)
const vec3 n4 =
  vec3(-epsNrm, -epsNrm,
    epsNrm); // They will form a nice thetrahedron around the position

// TODO how much
const int MAX_NUM_OF_PART = 24;
const int NUM_OF_EXTRA_PARAM = 3;

const int SDF_NONE = -1;
const int SDF_SPHERE = 0;
const int SDF_CAPSULE = 1;
const int SDF_BEND_CAPSULE = 2;
const int SDF_ROUND_CONE = 3;
const int SDF_ELLIPSOID = 4;

struct FigurePart {
  float sdf;
  vec3 start_point;
  vec3 end_point;
  vec3 color;
  float smooth_min;
  // TODO no array because of std140 alignment, or change alignment
  float extra_param[NUM_OF_EXTRA_PARAM];
  // float extra_points[NUM_OF_EXTRA_PARAM];
};

layout(std140) uniform FigurePartBlock {
  FigurePart parts[MAX_NUM_OF_PART];
};

// ------------------------------------------------------------
// Global definition for the figure parts
// ------------------------------------------------------------

// ---------SDF Primitives-------------
float sd_plane(vec3 p, vec3 n, float h) {
  // n must be normalized
  return dot(p, n) + h;
}

float sd_sphere(vec3 p, float s) {
  return length(p) - s;
}

float sd_capsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

float sd_bend_capsule(vec3 p, vec3 a, vec3 b, float r, float k) {
  float c = cos(k * p.x);
  float s = sin(k * p.x);
  mat2 m = mat2(c, -s, s, c);
  vec3 q = vec3(m * p.xy, p.z);
  return sd_capsule(q, a, b, r);
}

float sd_round_cone(vec3 p, float r1, float r2, float h) {
  float b = (r1 - r2) / h;
  float a = sqrt(1.0 - b * b);

  vec2 q = vec2(length(p.xz), p.y);
  float k = dot(q, vec2(-b, a));
  if (k < 0.0)
    return length(q) - r1;
  if (k > a * h)
    return length(q - vec2(0.0, h)) - r2;
  return dot(q, vec2(a, b)) - r1;
}

float sd_ellipsoid(vec3 p, vec3 r) {
  float k0 = length(p / r);
  float k1 = length(p / (r * r));
  return k0 * (k0 - 1.0) / k1;
}

float smoothMin(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return mix(d2, d1, h) - k * h * (1.0 - h);
}
// ---------SDF Primitives-------------

// axis aligned, center at the origin, dimensions "boxSize" TODO for optimizing the ray tracing?
// vec2 boxIntersection( in vec3 ro, in vec3 rd, vec3 boxSize, out vec3 oNormal )
// {
//     vec3 m = 1.0/rd; // can precompute if traversing a set of aligned boxes
//     vec3 n = m*ro;   // can precompute if traversing a set of aligned boxes
//     vec3 k = abs(m)*boxSize;
//     vec3 t1 = -n - k;
//     vec3 t2 = -n + k;
//     float tN = max( max( t1.x, t1.y ), t1.z );
//     float tF = min( min( t2.x, t2.y ), t2.z );
//     if( tN>tF || tF<0.0) return vec2(-1.0); // no intersection
//     oNormal = (tN>0.0) ? step(vec3(tN),t1)) : // ro ouside the box
//                            step(t2,vec3(tF)));  // ro inside the box
//     oNormal *= -sign(rd);
//     return vec2( tN, tF );
// }
// ---------END SDF Primitives-------------

vec4 calc_sdf_for_figure_part(vec3 point, FigurePart part) {
  float dist = 0.0;
  switch (int(part.sdf)) {
    case (SDF_SPHERE):
    {
      dist = sd_sphere(point - part.start_point, part.extra_param[0]);
    }
    ;
    break;
    case (SDF_CAPSULE):
    {
      dist = sd_capsule(point, part.start_point, part.end_point,
          part.extra_param[0]);
    }
    ;
    break;
    case (SDF_BEND_CAPSULE):
    {
      dist = sd_bend_capsule(point, part.start_point, part.end_point,
          part.extra_param[0], part.extra_param[1]);
    }
    ;
    break;
    // case (SDF_ELLIPSOID): {
    //                        return sd_ellipsoid(point - part.start_point,
    //                                   part.extra_param[0]);
    //
    // }; break;
    case (SDF_ROUND_CONE):
    {
      dist = sd_round_cone(point - part.start_point, part.extra_param[0],
          part.extra_param[1], part.extra_param[2]);
    }
    ;
    break;
    default:
    // TODO
    dist = 0.0;
  }
  return vec4(part.color, dist);
}

vec4 dist_to_figure(in vec3 point, FigurePart parts[MAX_NUM_OF_PART]) {

  // if (MAX_NUM_OF_PART <= 0)
  //   return -1.0;

  vec4 distance = vec4(0.8, 0.8, 0.8, 0.0);

  distance.w = sd_plane(point + vec3(0.5, 0.0, 0), vec3(0, 1, 0), 2.0);

  // if (parts.length() >= 2) {
  // TODO: check that numOfPart<MAX_NUM_OF_PART
  for (int i = 0; i < MAX_NUM_OF_PART; i++) {
    if (i >= numOfPart) {
      break;
    }

    FigurePart part = parts[i];
    vec4 dist_color = calc_sdf_for_figure_part(point, part);
    if (distance.w > dist_color.w) distance = dist_color;
    //i > 0 ?
    //TODO
    // smoothMin(distance, dist_color, part.smooth_min); // : dist_color;
  }

  // return min(distance, p1);
  return distance;
}

vec4 distToScene(in vec3 point) {
  return dist_to_figure(point, parts);
}

vec3 approxNormal(in vec3 pos) {
  // we assume that pos is approximated with epsPos epsilon
  // vec3 n = vec3(0.0);
  // for (int i = 0; i < 4; i++)
  // {
  //   vec3 e = 0.5773 * (2.0 * vec3((((i + 3) >> 1) & 1), ((i >> 1) & 1), (i & 1)) - 1.0);
  //   n += e * distToScene(pos + 0.0005 * e);
  // }
  // return normalize(n);
  return normalize(n1 * distToScene(pos + n1).w + n2 * distToScene(pos + n2).w +
      n3 * distToScene(pos + n3).w + n4 * distToScene(pos + n4).w);
}

void main() {
  // define eye and direction from eye position to the pixel (finally the ray
  // into the scene)
  const float ed = 4.0; // distance of the projection plane from the eye
  vec3 light_pos = lightPos;
  vec3 cam_pos = camPos;
  // vec3 light_pos = vec3(10,3,5);
  // vec3 cam_pos = vec3(8,6,10);

  vec2 pxy = (2.0 * xyCoo - 1.0) *
      vec2(500 / 500, 1.0); // position of the fragment (pixel) in the 2d
  // camera plane (in front of the eye)
  vec3 eye = cam_pos; // the position of the eye
  vec3 toO = normalize(-eye); // from the eye/cam to the origin (usually the
  // middle of the scene), todo? calc middle?
  vec3 pix = eye + ed * toO + vec3(toO.z, 0, -toO.x) * pxy.x +
      vec3(0, 1, 0) * pxy.y; // todo compacter;-)
  vec3 dir = normalize(
      pix - eye); // in this direction we are looking to (from eye to pixel)
  // vec3 lgt = vec3(10.0, 2.0, 5.0);               // here is the light
  // position
  vec3 lgt = light_pos;
  vec3 mat =
    vec3(0.8, 0.8, 0.8); // the material color (used for ambient and diffuse
  // reflection); NOTE: we assume white light

  float ka = 0.2; // rflCoe.x; // e.g. 0.3;
  float kd = 0.8; // rflCoe.y; // e.g. 0.8;
  float ks = 1.0; // rflCoe.z; // e.g. 1.0;

  // get intersection point (encoded as parameter t) with the scene for the
  // current pixel
  const float tBeg = 0.0;
  float tEnd = 25.0;
  float t = tBeg;
  for (int i = 0; i < 128 && t < tEnd; i++) {
    vec4 color_dist = distToScene(eye + t * dir);
    float h = color_dist.w;
    if (abs(h) < epsPos) {
      mat = color_dist.xyz;
      break;
    }
    t += h;
  }

  vec3 rgb = vec3(0.0, 0.0,
      0.0); // background color as RGB (ray did not hit the scene)
  fragColor = vec4(rgb, 0.0);
  if (t < tEnd) {
    // ray did hit the scene -> we can calculate an object color

    // that is the intersection point
    vec3 pos = eye + t * dir;
    // the normal at the intersection point
    vec3 nrm = approxNormal(pos);
    // the direction of the light (seen from current pos)
    vec3 toL = normalize(lgt - pos);
    // cosine of angle between normal and direction to the light
    float coA = dot(nrm, toL);
    // the direction of the eye (seen from current pos)
    vec3 toE = normalize(eye - pos);
    // direction of ideal reflextion
    vec3 idR = nrm * coA * 2.0 - toL;
    // cosine of angle between ideal reflection and direction to the eye
    float coT = coA <= 0.0 ? 0.0 : dot(idR, toE);
    // define the ambient part as constant, same for each part of the object
    float amb = ka;
    // diffuse part of reflection according of the cos between normal and light,
    // clamped to 0..1
    float dif = kd * clamp(coA, 0.0, 1.0);
    // specular part
    float spc = ks * pow(clamp(coT, 0.0, 1.0), 30.0);
    t = 0.8;
    tEnd = 8.0;
    rgb = vec3(0.0, 0.0, 0.0);
    if (dif > epsPos) {
      for (int i = 0; i < 32; i++) {
        vec4 h = distToScene(pos + t * toL);
        if (abs(h.w) < epsPos || (t >= tEnd && coA > epsNrm)) {
          // shadow
          break;
        }
        t += h.w;
      }
    }
    if (t >= tEnd && coA > epsNrm) {
      // infinit shadow -> no shadow
      // calc the color at the point, where the ray hit the scene (no specular
      // reflection -> no high lights)
      rgb = mat * (amb + dif) +
          vec3(spc); // note: the material color is not used in the specular
    }

    // rgb = mat * (amb + dif) +
    //       vec3(spc); // note: the material color is not used in the specular

    // part and we assume white light
    fragColor = vec4(rgb, 1.0); // append 1.0 as alpha (rgb -> rgbA)
  }
}
