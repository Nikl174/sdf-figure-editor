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
    padding: 1rem;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  legend {
    padding: 0 8px;
    color: var(--text-muted);
    font-size: 0.9em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .switcher {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 4px;
  }

  .switcher button {
    background: transparent;
    color: var(--text-main);
    border: none;
    padding: 6px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: background 0.2s;
  }

  .switcher button:hover {
    background: var(--border);
  }

  #itemDisplay {
    font-family: var(--font-mono);
    font-size: 0.9em;
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
  }

  .slider-header label {
    font-size: 0.9em;
    color: var(--text-muted);
  }

  .value-input {
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

  .value-input:focus {
    outline: none;
    border-color: var(--accent);
  }

  input[type="range"] {
    width: 100%;
    margin: 0;
    accent-color: var(--accent);
    cursor: pointer;
  }
</style>

<fieldset>
  <legend>Edit Part</legend>

  <div class="switcher">
    <button id="prevBtn">&lt;</button>
    <div id="itemDisplay">1 / 1</div>
    <button id="nextBtn">&gt;</button>
  </div>

  <!-- Radius -->
  <div class="slider-group">
    <div class="slider-header">
      <label for="radiusSlider">Radius</label>
      <input class="value-input" type="number" id="radiusInput" min="0.1" max="2.0" step="0.01">
    </div>
    <input type="range" id="radiusSlider" min="0.1" max="2.0" step="0.01">
  </div>

  <!-- Phi -->
  <div class="slider-group">
    <div class="slider-header">
      <label for="phiSlider">Phi</label>
      <input class="value-input" type="number" id="phiInput" min="${-Math.PI.toFixed(4)}" max="${Math.PI.toFixed(4)}" step="0.01">
    </div>
    <input type="range" id="phiSlider" min="${-Math.PI.toFixed(4)}" max="${Math.PI.toFixed(4)}" step="0.01">
  </div>

  <!-- Theta -->
  <div class="slider-group">
    <div class="slider-header">
      <label for="thetaSlider">Theta</label>
      <input class="value-input" type="number" id="thetaInput" min="${-Math.PI.toFixed(4)}" max="${Math.PI.toFixed(4)}" step="0.01">
    </div>
    <input type="range" id="thetaSlider" min="${-Math.PI.toFixed(4)}" max="${Math.PI.toFixed(4)}" step="0.01">
  </div>
</fieldset>
`;

export class FigureNodeEditor extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.selectedIndex = 0;
    this.totalItems = 0;
  }

  connectedCallback() {
    // // Elements
    // this.radiusInput = this.shadowRoot.querySelector("#radius");
    // this.phiInput = this.shadowRoot.querySelector("#phi");
    // this.thetaInput = this.shadowRoot.querySelector("#theta");
    //
    // this.radiusVal = this.shadowRoot.querySelector("#radiusVal");
    // this.phiVal = this.shadowRoot.querySelector("#phiVal");
    // this.thetaVal = this.shadowRoot.querySelector("#thetaVal");
    //
    this.itemDisplay = this.shadowRoot.querySelector("#itemDisplay");

    this.prevBtn = this.shadowRoot.querySelector("#prevBtn");
    this.nextBtn = this.shadowRoot.querySelector("#nextBtn");

    // Radius
    this.radiusSlider = this.shadowRoot.querySelector("#radiusSlider");

    this.radiusInput = this.shadowRoot.querySelector("#radiusInput");

    // Phi
    this.phiSlider = this.shadowRoot.querySelector("#phiSlider");

    this.phiInput = this.shadowRoot.querySelector("#phiInput");

    // Theta
    this.thetaSlider = this.shadowRoot.querySelector("#thetaSlider");

    this.thetaInput = this.shadowRoot.querySelector("#thetaInput");

    // Slider listeners
    this.radiusInput.addEventListener("input", (e) => {
      this.emitValueChange("radius", e.target.value);
    });

    this.phiInput.addEventListener("input", (e) => {
      this.emitValueChange("phi", e.target.value);
    });

    this.thetaInput.addEventListener("input", (e) => {
      this.emitValueChange("theta", e.target.value);
    });

    // Navigation listeners
    this.prevBtn.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("previous-item", {
          bubbles: true,
          composed: true,
        }),
      );
    });

    this.nextBtn.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("next-item", {
          bubbles: true,
          composed: true,
        }),
      );
    });

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
    const numericValue = parseFloat(value);

    // Emit event
    this.dispatchEvent(
      new CustomEvent("value-change", {
        detail: {
          property,
          value: numericValue,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  setValues({ radius, phi, theta }) {
    this.radiusSlider.value = radius;
    this.radiusInput.value = radius;

    this.phiSlider.value = phi;
    this.phiInput.value = phi;

    this.thetaSlider.value = theta;
    this.thetaInput.value = theta;
  }

  setSelection(index, total) {
    this.selectedIndex = index;
    this.totalItems = total;

    this._render();
  }

  _render() {
    this.itemDisplay.textContent = `${
      this.selectedIndex + 1
    } / ${this.totalItems}`;

    this.prevBtn.disabled = this.selectedIndex <= 0;
    this.nextBtn.disabled = this.selectedIndex >= this.totalItems - 1;
  }
}

customElements.define(
  "figure-node-editor",
  FigureNodeEditor,
);
