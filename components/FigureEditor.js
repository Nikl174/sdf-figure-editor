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
    #editor {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-items: stretch;
      margin: auto;
      padding: 2he;
    }
    </style>
    <div id="editor">
      <textarea name="figure_in" id="figure_in" rows="20" cols="30"></textarea>
      <button id="update" type="button">Update figure</button>
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
