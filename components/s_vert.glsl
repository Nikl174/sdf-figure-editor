#version 300 es

precision highp float;

in vec4 aVertexPosition;
out vec2 xyCoo;

//uniform mat4 uModelViewMatrix;
//uniform mat4 uProjectionMatrix;

void main() {
  xyCoo = aVertexPosition.xy*0.5 + 0.5;            // this xy-position in the projection plane will be interpolated for each fragment

  gl_Position = aVertexPosition;
}
