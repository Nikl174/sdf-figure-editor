import { vec3 } from "../lib/matrix.js";

const template = document.createElement("template");

template.innerHTML = `
<style>

  :host {
    display: block;
    width: 100%;
  }

  fieldset {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    margin: 0;
    display: flex;
    flex-direction: column;
  }

  legend {
    padding: 0 8px;
    color: var(--text-muted);
    font-size: 0.9em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  #itemDisplay {
    align-items: right;
    justify-content: right;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    width: fit-content;
    min-width: 70px;
    max-width: 50%;
  }

  #sdfSelect {
    -webkit-appearance: none;
    -moz-appearance: none;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 4px 6px;
    font-family: var(--font-mono);
    font-size: 0.85em;
    width: fit-content;
    min-width: 70px;
    max-width: 50%;
    text-align: right;
    cursor: pointer;
    color: var(--text-main);
  }

  #sdfSelect:focus {
    outline: none;
    border-color: var(--accent);
  }


  .slider-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .slider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5em;
  }

  .slider-header label {
    font-size: 0.9em;
    color: var(--text-muted);
  }

  .value-input {
      -webkit-appearance: none;
      -moz-appearance: textfield;
    width: 70px;
    padding: 4px 6px;
    background: var(--bg-input);
    color: var(--text-main);
    border: 1px solid var(--border);
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 0.85em;
    text-align: right;
  }

  .color-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  input[type="color"] {
    width: 40px;
    height: 30px;
    padding: 2px;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: 4px;
    cursor: pointer;
  }

  .value-input:focus {
    outline: none;
    border-color: var(--accent);
  }

  input[type="range"] {
    width: 100%;
    margin: 0;
    accent-color: var(--accent);
    cursor: pointer;
    background: #0f0;
  }
</style>

<datalist id="piTicks">
  <option value="-3.14" label="-π"></option>
  <option value="-1.57" label="-π/2"></option>
  <option value="0" label="0"></option>
  <option value="1.57" label="π/2"></option>
  <option value="3.14" label="π"></option>
</datalist>

<datalist id="radiusTicks">
  <option value="0"></option>
  <option value="0.5"></option>
  <option value="1"></option>
  <option value="1.5"></option>
  <option value="2"></option>
</datalist>

<fieldset>
  <legend>Edit Part</legend>

  <!-- Node Name -->
  <div class="slider-group">
    <div class="slider-header">
      <label for="radiusSlider">Name</label>
      <input class="value-input" type="string" id="itemDisplay" >
    </div>
  </div>

  <!-- SDFs -->
  <div class="slider-group">
    <div class="slider-header">
      <label for="sdfSelect">SDF</label>
      <select id="sdfSelect"></select>
    </div>
  </div>

  <!-- Radius -->
  <div class="slider-group">
    <div class="slider-header">
      <label for="radiusSlider">Radius</label>
      <input class="value-input" type="number" id="radiusInput" min="0.1" max="2.0" step="0.01">
    </div>
    <input type="range" id="radiusSlider" min="0" max="2.0" step="0.01" list="radiusTicks">
  </div>

  <!-- Phi -->
  <div class="slider-group">
    <div class="slider-header">
      <label for="phiSlider">Phi</label>
      <input class="value-input" type="number" id="phiInput" min="-3.1416" max="3.1416" step="0.01">
    </div>
    <input type="range" id="phiSlider" min="-3.14" max="3.14" step="0.01" list="piTicks">
  </div>

  <!-- Theta -->
  <div class="slider-group">
    <div class="slider-header">
      <label for="thetaSlider">Theta</label>
      <input class="value-input" type="number" id="thetaInput" min="-3.1416" max="3.1416" step="0.01">
    </div>
    <input type="range" id="thetaSlider" min="-3.14" max="3.14" step="0.01" list="piTicks">
  </div>

  <!-- Color -->
  <div class="slider-group">
    <div class="slider-header">
      <label for="colorInput">Color</label>
      <div class="color-controls">
        <input type="color" id="colorInput" value="#ffffff">
        <input
          class="value-input"
          type="text"
          id="colorHexInput"
          value="#ffffff"
          maxlength="7"
          pattern="^#[0-9a-fA-F]{6}$"
          spellcheck="false"
          aria-label="Hex color"
        >
      </div>
    </div>
  </div>

</fieldset>
`;

export class FigureNodeEditor extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    // TODO
    this.sdfOptions = null;

    this.partName = null;
  }

  // TODO
  connectedCallback() {
    // Elements
    this.itemDisplay = this.shadowRoot.querySelector("#itemDisplay");

    // Radius
    this.radiusSlider = this.shadowRoot.querySelector("#radiusSlider");
    this.radiusInput = this.shadowRoot.querySelector("#radiusInput");

    // Phi
    this.phiSlider = this.shadowRoot.querySelector("#phiSlider");
    this.phiInput = this.shadowRoot.querySelector("#phiInput");

    // Theta
    this.thetaSlider = this.shadowRoot.querySelector("#thetaSlider");
    this.thetaInput = this.shadowRoot.querySelector("#thetaInput");

    // Color
    this.colorInput = this.shadowRoot.getElementById("colorInput");
    this.colorHexInput = this.shadowRoot.getElementById("colorHexInput");

    // sdf menu
    this.sdfSelect = this.shadowRoot.getElementById("sdfSelect");

    // Set up the sdfOptions property TODO
    Object.defineProperty(this, "sdfOptions", {
      set: function (options) {
        this._sdfOptions = options;
        this._updateSdfSelect();
      },
      enumerable: true,
      configurable: true,
    });

    // Function to update the dropdown from options
    this._updateSdfSelect = function () {
      const select = this.sdfSelect;
      select.innerHTML = "";
      if (!this._sdfOptions) return;
      this._sdfOptions.forEach((option) => {
        const opt = document.createElement("option");
        opt.value = option.value;
        opt.textContent = option.label;
        select.appendChild(opt);
      });
    };

    // Slider listeners
    this.radiusInput.addEventListener("input", (e) => {
      this.emitValueChange("radius", parseFloat(e.target.value));
    });

    this.phiInput.addEventListener("input", (e) => {
      this.emitValueChange("phi", parseFloat(e.target.value));
    });

    this.thetaInput.addEventListener("input", (e) => {
      this.emitValueChange("theta", parseFloat(e.target.value));
    });

    // color listeners
    this.colorInput.addEventListener("input", (e) => {
      this.emitValueChange("color", this._hexToVec3(e.target.value));
      this.colorHexInput.value = e.target.value;
    });

    this.colorHexInput.addEventListener("input", (e) => {
      const value = e.target.value;

      // TODO
      if (/^#[0-9a-fA-F]{6}$/.test(value)) {
        this.colorInput.value = value;
        this.emitValueChange("color", this._hexToVec3(value));
      }
    });

    // listener for SDF dropdown
    this.sdfSelect.addEventListener("change", (event) => {
      this.dispatchEvent(
        new CustomEvent("value-change", {
          detail: {
            property: "sdf",
            value: event.target.value,
          },
          bubbles: true,
          composed: true,
        }),
      );
    });

    // sync slider and input field
    this.bindControl(
      "radius",
      this.radiusSlider,
      this.radiusInput,
    );

    this.bindControl(
      "phi",
      this.phiSlider,
      this.phiInput,
    );

    this.bindControl(
      "theta",
      this.thetaSlider,
      this.thetaInput,
    );

    this._render();
  }

  updateDisplay() {
    if (this.partName === null) {
      this.style.display = "none";
    } else {
      this.style.display = "block"; // or 'flex', 'inline', etc.
    }
  }

  bindControl(property, slider, input) {
    // Slider -> input
    slider.addEventListener("input", () => {
      input.value = slider.value;

      this.emitValueChange(
        property,
        parseFloat(slider.value),
      );
    });

    // Input -> slider
    input.addEventListener("input", () => {
      slider.value = input.value;

      this.emitValueChange(
        property,
        parseFloat(input.value),
      );
    });
  }

  emitValueChange(property, value) {
    // Emit event
    this.dispatchEvent(
      new CustomEvent("value-change", {
        detail: {
          property: property,
          value: value,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * @param {vec3} color color in RGB to set
   */
  setValues({ radius, phi, theta }, color, sdf) {
    this.radiusSlider.value = radius;
    this.radiusInput.value = radius;

    this.phiSlider.value = phi;
    this.phiInput.value = phi;

    this.thetaSlider.value = theta;
    this.thetaInput.value = theta;

    this.sdfSelect.value = sdf

    this.colorInput.value = this._vec3ToHex(color);
    this.colorHexInput.value = this._vec3ToHex(color);
  }

  setSelection(name) {
    this.partName = name;
    this.updateDisplay();
    this._render();
  }

  // TODO
  _render() {
    this.itemDisplay.value = `
    ${this.partName}`;
  }

  // TODO
  _hexToVec3(hex) {
    // Remove leading '#' if present
    hex = hex.replace(/^#/, "");

    // Handle short hex format (3 characters)
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    } // Handle long hex with alpha (8 characters): take first 6 characters
    else if (hex.length === 8) {
      hex = hex.slice(0, 6);
    } // Ensure the string is exactly 6 characters long (valid RGB)
    else if (hex.length !== 6) {
      throw new Error(
        "Invalid hex color format. Expected format: #RRGGBB, #RGB, or #RRGGBBAA.",
      );
    }

    // Extract R, G, B components
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Normalize to the range [0, 1]
    return vec3.fromValues(
      r / 255,
      g / 255,
      b / 255,
    );
  }

  // TODO
  _vec3ToHex(vec) {
    // Clamp each component to [0, 1] to avoid unexpected values
    const r = Math.max(0, Math.min(1, vec[0]));
    const g = Math.max(0, Math.min(1, vec[1]));
    const b = Math.max(0, Math.min(1, vec[2]));

    // Convert to integers in the range [0, 255]
    let rInt = Math.round(r * 255);
    let gInt = Math.round(g * 255);
    let bInt = Math.round(b * 255);

    // Ensure values are within the 0–255 range
    rInt = Math.max(0, Math.min(255, rInt));
    gInt = Math.max(0, Math.min(255, gInt));
    bInt = Math.max(0, Math.min(255, bInt));

    // Helper function to convert integer to 2-digit hex string (uppercase)
    const toHex = (n) => {
      return n.toString(16).padStart(2, "0").toUpperCase();
    };

    // Return the full hex string
    return `#${toHex(rInt)}${toHex(gInt)}${toHex(bInt)}`;
  }
}

customElements.define(
  "figure-node-editor",
  FigureNodeEditor,
);
