// Template definition
const template = document.createElement("template");
template.innerHTML = `
  <style>

    :host {
      display: block;
      /* width: 100%; */
    }

    fieldset {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      /* margin: 0 0.5em; */
      display: flex;
      flex-direction: column;
      gap: 16px;
      /* height: 100%; */
    }
    legend {
      padding: 0 8px;
      color: var(--text-muted);
      font-size: 0.9em;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .tree-panel {
      /* padding: 10px; */
      margin: 0px;
      font-family: var(--font-mono);
      color: var(--text-main);
      
    }
    #root {
      padding-left: 0px;
      margin: 0px;

    }
    .tree-panel li::marker {
      content: "";
    }
    .tree-panel li ul {
      padding-left: 1.5em;
    }
    .node-row {
      padding-top: 5px;
      cursor: pointer;
    }
    .node-row.selected {
      background-color: var(--border);
    }
    .toggle {
      /* margin-right: 5px; */
      cursor: pointer;
    }
    .node-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .node-type {
      color: #757575;
      font-size: 0.9em;
      /* margin-left: 5px; */
    }
/* Ensure buttons are styled consistently with the current design language */
.buttons {
  display: none;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 0.5rem 0; /* Optional: Adds vertical padding inside the buttons container */
}

.buttons button {
  padding: 0.5rem 1rem;
  font-family: var(--font-mono);
  font-size: 0.9em;
  color: var(--text-main);
  background-color: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}
#delete:hover {
  /* TODO */
  background-color: #792329;
  border-color: var(--border-hover);
}

.buttons button:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-hover);
}

.buttons button:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-outline);
}

  </style>

  <fieldset>
    <legend>Tree</legend>
    <div class="tree-panel"></div>
    <div class="buttons">
      <button type="button">add same</button>
      <button type="button">add below</button>
      <button id="delete" type="button">delete</button>
    </div>
  </fieldset>
`;

/**
 * A custom element for rendering and interacting with a hierarchical figure data structure (tree).
 * This component allows users to visualize and select nodes within a scene graph.
 *
 * @extends HTMLElement
 */
export class FigureTree extends HTMLElement {
  /**
   * @typedef {Object} Config
   * @property {string} nameKey - The key used for node names (default: "name")
   * @property {string} typeKey - The key used for node types (default: "type")
   * @property {string} childrenKey - The key used to access node children (default: "children")
   */

  /**
   * @typedef {Object} TreeNode
   * @property {string} [name] - Display name of the node (key: nameKey)
   * @property {string} [type] - Type or category of the node (key: typeKey)
   * @property {Array<TreeNode>} [children] - Child nodes (key: childrenKey)
   */

  /**
   * @typedef {Object} SceneGraphData
   * @property {string} [name] - Name of the root node
   * @property {string} [type] - Type of the root node
   * @property {Array<TreeNode>} [children] - Children of the root node
   */

  /**
   * @type {SceneGraphData|null} Internal reference to the scene graph data.
   * @private
   */
  _figure;

  /**
   * @type {string|null} ID of the currently selected node.
   * @private
   */
  _selectedNodeId;

  /**
   * @type {Config|null} Configuration options for parsing the scene graph data.
   * @private
   */
  _config;

  /**
   * Constructor for the FigureTree component.
   */
  constructor() {
    super();
    this._figure = null;
    this._selectedNodeId = null;
    this._config = null;

    // Attach shadow DOM
    this.attachShadow({ mode: "open" });

    // Initial HTML structure
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // Store references
    this._treeContainer = this.shadowRoot.querySelector(".tree-panel");
    this._buttonsContainer = this.shadowRoot.querySelector(".buttons");

    // Event delegation for tree clicks TODO?
    this._treeContainer?.addEventListener(
      "click",
      this._onTreeClick.bind(this),
    );
  }

  /**
   * Getter/Setter for the scene graph data.
   * When set, the tree will be re-rendered.
   *
   * @type {SceneGraphData|null}
   */
  get figure() {
    return this._figure;
  }

  set figure(value) {
    this._figure = value;
    this._selectedNodeId = null;
    this._renderTree();
  }

  /**
   * Getter/Setter for the configuration options.
   * Sets the keys used for parsing the tree structure.
   *
   * @type {Config|null}
   */
  get config() {
    return this._config;
  }

  set config(value) {
    this._config = {
      nameKey: value?.nameKey || "name",
      typeKey: value?.typeKey || "type",
      childrenKey: value?.childrenKey || "children",
    };
  }

  /**
   * Returns a deep clone of the current scene graph data.
   * TODO needed?
   *
   * @returns {SceneGraphData|null} A deep clone of the figure data.
   */
  getData() {
    return structuredClone(this._figure);
  }

  /**
   * Selects a node by its name, if found.
   *
   * @param {string} name - Name of the node to select.
   */
  selectNode(name) {
    const node = this._findNodeByName(this._figure, name);
    if (node) {
      this._selectedNodeId = node[this._config.nameKey];
      this.dispatchEvent(
        new CustomEvent("select", { detail: this._selectedNodeId }),
      );
    }
  }

  // ----------------------------------------------------------------------
  // Internal rendering
  // ----------------------------------------------------------------------

  /**
   * Renders the entire tree view based on the current figure data.
   * If no figure is provided, displays a "No data" message.
   */
  _renderTree() {
    if (!this._figure) {
      this._treeContainer.innerHTML = '<p style="color:#999">No data</p>';
      return;
    }

    const treeHtml = this._renderTreeNode(this._figure);
    this._treeContainer.innerHTML = `<ul id='root'>${treeHtml}</ul>`;
  }

  /**
   * Recursively generates HTML for a tree node.
   *
   * @param {TreeNode} node - Node to render.
   * @returns {string} HTML string representing the node.
   */
  _renderTreeNode(node) {
    const hasChildren = node[this._config.childrenKey] &&
      node[this._config.childrenKey].length > 0;
    const isSelected = node[this._config.nameKey] === this._selectedNodeId;

    const rowClass = `node-row${isSelected ? " selected" : ""}`;
    const toggleHtml = hasChildren
      ? `<span class="toggle" data-action="toggle">▼</span>`
      : `<span class="toggle" >-</span>`; // TODO

    const nodeName = node[this._config.nameKey]; // || "Unnamed";
    const nodeType = node[this._config.typeKey]
      ? `<span class="node-type">(${node[this._config.typeKey]})</span>`
      : "";

    let html = `<li data-node-id="${node[this._config.nameKey]}">
      <div class="${rowClass}" data-action="select">
        ${toggleHtml}
        <span class="node-name">${this._escapeHtml(nodeName)}${nodeType}</span>
      </div>`;

    if (hasChildren) {
      html += `<ul>`;
      for (const child of node[this._config.childrenKey]) {
        html += this._renderTreeNode(child);
      }
      html += `</ul>`;
    }

    html += `</li>`;
    return html;
  }

  // ----------------------------------------------------------------------
  // Event handlers
  // ----------------------------------------------------------------------

  /**
   * Handles click events within the tree panel.
   *
   * @param {Event} event - The click event.
   */
  _onTreeClick(event) {
    const target = event.target;

    // Find the closest li element with data-node-id
    const li = target.closest("li[data-node-id]");
    if (!li) return;

    const nodeId = li.dataset.nodeId;

    // Determine action
    const action = target.dataset.action;
    if (action === "toggle") {
      // Collapse/expand: toggle a class on the parent li (or use hidden attribute)
      // We'll simply toggle the display of the child ul
      const childUl = li.querySelector(":scope > ul");
      if (childUl) {
        const isHidden = childUl.style.display === "none";
        childUl.style.display = isHidden ? "" : "none";
        // Update the toggle icon based on expand/collapse state
        const toggle = li.querySelector(".toggle");
        toggle.textContent = isHidden ? "▼" : "▶";
      }
      return;
    }

    // If action is "select" or unspecified, handle node selection
    if (this._selectedNodeId === nodeId) {
      // deselect
      this._selectedNodeId = null;
      this._buttonsContainer.style.display = "none";
    } else {
      // this._buttonsContainer.style.display = "flex";
      this._selectedNodeId = nodeId;
    }
    this.dispatchEvent(
      new CustomEvent("select", { detail: this._selectedNodeId }),
    );
    this._renderTree();
  }

  /**
   * Handles click events on the add below button.
   *
   * @param {Event} event - The click event.
   */
  _onTreeChange(event) {}

  // ----------------------------------------------------------------------
  // Helper methods
  // ----------------------------------------------------------------------

  /**
   * Recursively searches the tree for a node with the specified name.
   *
   * @param {SceneGraphData} node - Root node to search from.
   * @param {string} name - Name to match.
   * @returns {TreeNode | null} The matching node, or null if not found.
   */
  _findNodeByName(node, name) {
    // Check if current node matches the name
    const nameKey = this._config.nameKey;
    if (node[nameKey] === name) {
      return node;
    }

    const childrenKey = this._config.childrenKey;
    if (!node[childrenKey] || !Array.isArray(node[childrenKey])) {
      return null;
    }

    // Recursively search children
    for (const child of node[childrenKey]) {
      const result = this._findNodeByName(child, name);
      if (result) {
        return result;
      }
    }

    return null;
  }

  /**
   * Escapes HTML characters in a string to prevent XSS attacks.
   *
   * @param {string} text - Text to escape.
   * @returns {string} HTML-escaped text.
   */
  _escapeHtml(text) {
    return text.replace(/[&<>"'`]/g, (match) => {
      switch (match) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&#039;";
        case "`":
          return "&#96;";
        default:
          return match;
      }
    });
  }
}

customElements.define("figure-tree", FigureTree);
