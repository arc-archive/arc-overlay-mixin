import { LitElement, html, css } from 'lit-element';
import './test-overlay.js';

class TestScrollable extends LitElement {
  static get styles() {
    return css`
    #scrollable, #overlay {
      max-width: 200px;
      max-height: 200px;
      overflow: auto;
    }`;
  }

  render() {
    return html`<div id="scrollable">
      <slot name="scrollable-content"></slot>
    </div>
    <test-overlay id="overlay">
      <slot name="overlay-content"></slot>
    </test-overlay>`;
  }
}
window.customElements.define('test-scrollable', TestScrollable);
