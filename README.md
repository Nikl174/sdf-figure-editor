# Ray Marching and Signed Distance Functions (SDFs) with WebGL

## Development notes

- Developed in separate files:
    - Pro: easier to develop and work with (software structure, editor support, separation of domains)
    - Con: you need a webserver to see the result
- webserver with python:

```bash
# start the webserver on local network interface in this directory
python -m http.server -b 127.0.0.1 -d .
```
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
