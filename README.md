# Ray Marching and Signed Distance Functions (SDFs) with WebGL

- [web components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) for modular structure
- WebGl 2 and GLSL ES 3 compatible graphics pipeline, using only the fragment shader

## Starting

just use a webserver, e.g.:

```bash
# start the webserver on local network interface in this directory with port 8000
python -m http.server -b 127.0.0.1 -d . 8000
```

## Development notes

- Developed in separate files:
    - Pro: easier to develop and work with (software structure, editor support, separation of domains)
    - Con: you need a webserver to see the result
- typechecking in javascript
    - [JSDoc](https://jsdoc.app/) for adding typehints in javascript
    ``` javascript
    /**
     * @type {number}
     */
    const NUM_OF_EXTRA_PARAM = 4;
    ```
    - to lint and check to code, use `deno`:
    ```bash
    deno lint
    ```
    - for tests, see e.g.: [matrix.test.js](./lib/matrix.test.js)
    ```bash
    deno test [filename]
    ```
- bundle for smaller (but less readable) single files in a deployment (removing comments, whitespace, multible files etc.) with [esbuild](https://esbuild.github.io/):
    ``` bash
    # uses esbuild but not from the system, it downloads it with npm
    deno bundle --minify -o b_main.js main.js
    # or directly call it
    esbuild --bundle  --minify --outfile=b_main.js main.js 
    
    ```
