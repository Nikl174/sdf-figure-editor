/**
 * @typedef {Object} FigureDetail
 * @property {string} figureJson Json string of the SDFPart figure representation
 */

/**
 * @typedef {CustomEvent<FigureDetail>} FigureEvent
 */

const template = document.createElement("template");
template.innerHTML = `
<style>
  :host {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  #editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1rem;
    gap: 12px;
  }

  label {
    font-weight: 600;
    color: var(--text-muted);
    font-size: 0.9em;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  textarea {
    flex: 1;
    width: 100%;
    min-height: 200px;
    box-sizing: border-box;
    padding: 12px;
    font-family: var(--font-mono);
    font-size: 14px;
    line-height: 1.5;
    background: var(--bg-input);
    color: var(--text-main);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    resize: none;
  }

  textarea:focus {
    outline: none;
    border-color: var(--accent);
  }

  button {
    width: 100%;
    padding: 12px;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: var(--radius);
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  button:hover {
    background: var(--accent-hover);
  }
</style>

<div id="editor">
  <label for="figure_in">Current Figure</label>
  <textarea name="figure_in" id="figure_in" spellcheck="false"></textarea>
  <button id="update" type="button">Update Figure</button>
</div>
`;

export class SDFEditor extends HTMLElement {
  #updateBtn;
  #textArea;

  /**
   *  * Adds a typed event listener for FigureEvent
   *   * @param {EventTarget} target
   *    * @param {(event: FigureEvent) => void} callback
   *     * @returns {() => void} Cleanup function
   */
  static onFigureEvent(target, callback) {
    target.addEventListener(
      "update-figure",
      /** @type {EventListener} */ (callback),
    );

    return () => {
      target.removeEventListener(
        "update-figure",
        /** @type {EventListener} */ (callback),
      );
    };
  }

  constructor() {
    super();

    // Attach HTML structure
    {
      this.attachShadow({ mode: "open" });

      if (!this.shadowRoot) {
        throw new Error("SDFEditor could not attach ShadowDom!");
      }

      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    // Initialize event Handling
    {
      const updateBtn =
        /** @type {HTMLButtonElement | null} */ (this.shadowRoot.getElementById(
          "update",
        ));
      const textArea = /** @type {HTMLTextAreaElement | null}*/ (this.shadowRoot
        .getElementById("figure_in"));

      if (!updateBtn || !textArea) {
        throw new Error("Some elements in SDFEditor not found!");
      }

      this.#updateBtn = updateBtn;
      this.#textArea = textArea;
    }
  }
  connectedCallback() {
    this.#updateBtn.addEventListener(
      "click",
      (_event) => {
        /** @type {FigureEvent}*/
        const updateEvent = new CustomEvent(
          "update-figure",
          {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: {
              figureJson: this.figureText,
            },
          },
        );
        this.dispatchEvent(
          updateEvent,
        );
      },
    );
  }
  set figureText(value) {
    this.#textArea.innerHTML = value;
  }
  get figureText() {
    return this.#textArea.value;
  }
}

customElements.define("sdf-editor", SDFEditor);
