import { ArcOverlayBackdrop } from './ArcOverlayBackdrop';
export {ArcOverlayManager};

/**
 * The class was originallt designed by Polymer team.
 */
declare class ArcOverlayManager {

  /**
   * The shared backdrop element.
   */
  readonly backdropElement: ArcOverlayBackdrop;

  /**
   * The deepest active element.
   */
  readonly deepActiveElement: HTMLElement;
  constructor();

  /**
   * Adds the overlay and updates its z-index if it's opened, or removes it if
   * it's closed. Also updates the backdrop z-index.
   */
  addOrRemoveOverlay(overlay: HTMLElement): void;

  /**
   * Tracks overlays for z-index and focus management.
   * Ensures the last added overlay with always-on-top remains on top.
   */
  addOverlay(overlay: HTMLElement): void;
  removeOverlay(overlay: HTMLElement): void;

  /**
   * Returns the current overlay.
   */
  currentOverlay(): HTMLElement|undefined;

  /**
   * Returns the current overlay z-index.
   */
  currentOverlayZ(): number;

  /**
   * Ensures that the minimum z-index of new overlays is at least `minimumZ`.
   * This does not effect the z-index of any existing overlays.
   */
  ensureMinimumZ(minimumZ: number): void;
  focusOverlay(): void;

  /**
   * Updates the backdrop z-index.
   */
  trackBackdrop(): void;
  getBackdrops(): HTMLElement[];

  /**
   * Returns the z-index for the backdrop.
   */
  backdropZ(): number;
  _keyboardEventMatchesKeys(e: KeyboardEvent, key: string): boolean;
}
