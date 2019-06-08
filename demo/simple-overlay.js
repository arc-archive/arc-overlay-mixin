import { LitElement, html, css } from 'lit-element';
import { ArcOverlayMixin } from '../arc-overlay-mixin.js';

class SimpleOverlay extends ArcOverlayMixin(LitElement) {
  static get styles() {
    return css`
    :host {
      background: white;
        color: black;
        padding: 24px;
        box-shadow: rgba(0, 0, 0, 0.24) -2px 5px 12px 0px, rgba(0, 0, 0, 0.12) 0px 0px 12px 0px;
    }`;
  }

  render() {
    return html`<slot></slot>`;
  }
}
window.customElements.define('simple-overlay', SimpleOverlay);
