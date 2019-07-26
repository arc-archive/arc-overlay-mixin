import { ArcFitMixin } from '@advanced-rest-client/arc-fit-mixin/arc-fit-mixin.js';
import { ArcResizableMixin } from '@advanced-rest-client/arc-resizable-mixin/arc-resizable-mixin.js';
import { ArcFocusablesHelper } from './arc-focusables-helper.js';
import { ArcOverlayManager } from './arc-overlay-manager.js';
import { pushScrollLock, removeScrollLock } from './arc-scroll-manager.js';

/**
 * This mixin is a port of [IronOverlayBehavior](https://github.com/PolymerElements/iron-overlay-behavior)
 * that works with LitElement.
 *
 * Use `ArcOverlayMixin` to implement an element that can be hidden
 * or shown, and displays on top of other content. It includes an optional
 * backdrop, and can be used to implement a variety of UI controls including
 * dialogs and drop downs. Multiple overlays may be displayed at once.
 * See the [demo source
 * code](https://github.com/advanced-rest-client/arc-overlay-mixin/blob/master/demo/simple-overlay.html)
 * for an example.
 *
 * ### Closing and canceling
 *
 * An overlay may be hidden by closing or canceling. The difference between close
 * and cancel is user intent. Closing generally implies that the user
 * acknowledged the content on the overlay. By default, it will cancel whenever
 * the user taps outside it or presses the escape key. This behavior is
 * configurable with the `nocancelonesckey` and the
 * `nocancelonoutsideclick` properties. `close()` should be called explicitly
 * by the implementer when the user interacts with a control in the overlay
 * element. When the dialog is canceled, the overlay fires an
 * 'iron-overlay-canceled' event. Call `preventDefault` on this event to prevent
 * the overlay from closing.
 *
 * ### Positioning
 *
 * By default the element is sized and positioned to fit and centered inside the
 * window. You can position and size it manually using CSS. See `ArcFitMixin`.
 *
 * ### Backdrop
 *
 * Set the `withbackdrop` attribute to display a backdrop behind the overlay.
 * The backdrop is appended to `<body>` and is of type `<arc-overlay-backdrop>`.
 * See its doc page for styling options.
 * In addition, `withbackdrop` will wrap the focus within the content in the
 * light DOM. Override the [`_focusableNodes`
 * getter](#ArcOverlayMixin:property-_focusableNodes) to achieve a
 * different behavior.
 *
 * ### Limitations
 *
 * The element is styled to appear on top of other content by setting its
 * `z-index` property. You must ensure no element has a stacking context with a
 * higher `z-index` than its parent stacking context. You should place this
 * element as a child of `<body>` whenever possible.
 *
 *
 * ## Usage
 *
 * ```javascript
 * import { LitElement } from 'lit-element';
 * import { ArcOverlayMixin } from '@advanced-rest-client/arc-overlay-mixin/arc-overlay-mixin.js';
 *
 * class ArcOverlayImpl extends ArcOverlayMixin(LitElement) {
 *  ...
 * }
 * ```
 *
 * @demo demo/index.html
 * @param {Class} superClass
 * @return {Class}
 */
export const ArcOverlayMixin = (superClass) => class extends ArcFitMixin(ArcResizableMixin(superClass)) {
  static get properties() {
    return {
      /**
       * True if the overlay is currently displayed.
       */
      opened: { type: Boolean, reflect: true },
      /**
       * True if the overlay was canceled when it was last closed.
       */
      __canceled: { type: Boolean, reflect: true, attribute: 'canceled' },
      /**
       * Set to true to display a backdrop behind the overlay. It traps the focus
       * within the light DOM of the overlay.
       */
      withBackdrop: { type: Boolean, reflect: true },
      _oldWithBackdrop: { type: Boolean, attribute: 'with-backdrop' },
      /**
       * Set to true to disable auto-focusing the overlay or child nodes with
       * the `autofocus` attribute` when the overlay is opened.
       */
      noAutoFocus: { type: Boolean, reflect: true },
      _oldNoAutoFocus: { type: Boolean, attribute: 'no-auto-focus' },
      /**
       * Set to true to disable canceling the overlay with the ESC key.
       */
      noCancelOnEscKey: { type: Boolean, reflect: true },
      _oldNoCancelOnEscKey: { type: Boolean, attribute: 'no-cancel-on-esc-key' },
      /**
       * Set to true to disable canceling the overlay by clicking outside it.
       */
      noCancelOnOutsideClick: { type: Boolean, reflect: true },
      _oldNoCancelOnOutsideClick: { type: Boolean, attribute: 'no-cancel-on-outside-click' },
      /**
       * Contains the reason(s) this overlay was last closed (see
       * `iron-overlay-closed`). `IronOverlayBehavior` provides the `canceled`
       * reason; implementers of the behavior can provide other reasons in
       * addition to `canceled`.
       */
      closingReason: { type: Object },
      /**
       * Set to true to enable restoring of focus when overlay is closed.
       */
      restoreFocusOnClose: { type: Boolean, reflect: true },
      _oldRestoreFocusOnClose: { type: Boolean, attribute: 'restore-focus-on-close' },
      /**
       * Set to true to allow clicks to go through overlays.
       * When the user clicks outside this overlay, the click may
       * close the overlay below.
       */
      allowClickThrough: { type: Boolean, reflect: true },
      _oldAllowClickThrough: { type: Boolean, attribute: 'allow-click-through' },
      /**
       * Set to true to keep overlay always on top.
       */
      alwaysOnTop: { type: Boolean, reflect: true },
      _oldAlwaysOnTop: { type: Boolean, attribute: 'always-on-top' },
      /**
       * Determines which action to perform when scroll outside an opened overlay
       * happens. Possible values: lock - blocks scrolling from happening, refit -
       * computes the new position on the overlay cancel - causes the overlay to
       * close
       */
      scrollAction: { type: String, reflect: true },
      _oldScrollAction: { type: String, attribute: 'scroll-action' },
      /**
       * Shortcut to access to the overlay manager.
       * @private
       * @type {!IronOverlayManagerClass}
       */
      _manager: { type: Object },
      /**
       * The node being focused.
       * @type {?Node}
       */
      _focusedChild: { type: Object }
    };
  }
  /**
   * True if the overlay is currently displayed.
   */
  get opened() {
    return this._opened;
  }

  set opened(value) {
    const old = this._opened;
    if (value === old) {
      return;
    }
    this._opened = value;
    if (this.requestUpdate) {
      this.requestUpdate('opened', old);
    }
    this._openedChanged(value);
    this.__updateScrollObservers(this._isAttached, value, this.scrollAction);
    this.dispatchEvent(new CustomEvent('opened-changed', {
      detail: {
        value
      }
    }));
  }
  /**
   * True if the overlay was canceled when it was last closed.
   */
  get canceled() {
    return this.__canceled;
  }

  get _canceled() {
    return this.__canceled;
  }

  set _canceled(value) {
    if (value === this.__canceled) {
      return;
    }
    this.__canceled = value;
    this._canceledChanged(value);
  }

  /**
   * Set to true to display a backdrop behind the overlay. It traps the focus
   * within the light DOM of the overlay.
   */
  get withBackdrop() {
    return this._withBackdrop;
  }

  set withBackdrop(value) {
    const old = this._withBackdrop;
    if (value === old) {
      return;
    }
    this._withBackdrop = value;
    if (this.requestUpdate) {
      this.requestUpdate('withBackdrop', old);
    }
    this._withBackdropChanged(value);
  }

  get _oldWithBackdrop() {
    return this.withBackdrop;
  }

  set _oldWithBackdrop(value) {
    this.withBackdrop = value;
  }

  get _oldNoAutoFocus() {
    return this.noAutoFocus;
  }

  set _oldNoAutoFocus(value) {
    this.noAutoFocus = value;
  }

  get _oldNoCancelOnEscKey() {
    return this.noCancelOnEscKey;
  }

  set _oldNoCancelOnEscKey(value) {
    this.noCancelOnEscKey = value;
  }

  get _oldNoCancelOnOutsideClick() {
    return this.noCancelOnOutsideClick;
  }

  set _oldNoCancelOnOutsideClick(value) {
    this.noCancelOnOutsideClick = value;
  }

  get _oldRestoreFocusOnClose() {
    return this.restoreFocusOnClose;
  }

  set _oldRestoreFocusOnClose(value) {
    this.restoreFocusOnClose = value;
  }

  get _oldAllowClickThrough() {
    return this.allowClickThrough;
  }

  set _oldAllowClickThrough(value) {
    this.allowClickThrough = value;
  }

  get _oldAlwaysOnTop() {
    return this.alwaysOnTop;
  }

  set _oldAlwaysOnTop(value) {
    this.alwaysOnTop = value;
  }

  get _oldScrollAction() {
    return this.scrollAction;
  }

  set _oldScrollAction(value) {
    this.scrollAction = value;
  }

  get 'scroll-action'() {
    return this.scrollAction;
  }

  set 'scroll-action'(value) {
    this.scrollAction = value;
  }

  get isAttached() {
    return this._isAttached;
  }

  set isAttached(value) {
    this._isAttached = value;
    this.__updateScrollObservers(value, this._opened, this.scrollAction);
  }

  get scrollAction() {
    return this._scrollAction;
  }

  set scrollAction(value) {
    this._scrollAction = value;
    this.__updateScrollObservers(this._isAttached, this._opened, value);
  }

  /**
   * The backdrop element.
   * @return {!Element}
   */
  get backdropElement() {
    return this._manager.backdropElement;
  }

  /**
   * Returns the node to give focus to.
   * @return {!Node}
   */
  get _focusNode() {
    return this._focusedChild || this.querySelector('[autofocus]') || this;
  }

  /**
   * Array of nodes that can receive focus (overlay included), ordered by
   * `tabindex`. This is used to retrieve which is the first and last focusable
   * nodes in order to wrap the focus for overlays `with-backdrop`.
   *
   * If you know what is your content (specifically the first and last focusable
   * children), you can override this method to return only `[firstFocusable,
   * lastFocusable];`
   * @return {!Array<!Node>}
   * @protected
   */
  get _focusableNodes() {
    return ArcFocusablesHelper.getTabbableNodes(this);
  }

  constructor() {
    super();
    this._opened = false;
    this._canceled = false;
    this.noAutoFocus = false;
    this.noCancelOnEscKey = false;
    this.noCancelOnOutsideClick = false;
    this.restoreFocusOnClose = false;
    this._manager = ArcOverlayManager;

    // Used to skip calls to notifyResize and refit while the overlay is
    // animating.
    this.__isAnimating = false;
    // with-backdrop needs tabindex to be set in order to trap the focus.
    // If it is not set, IronOverlayBehavior will set it, and remove it if
    // with-backdrop = false.
    this.__shouldRemoveTabIndex = false;
    // Used for wrapping the focus on TAB / Shift+TAB.
    this.__firstFocusableNode = this.__lastFocusableNode = null;
    // Used by to keep track of the RAF callbacks.
    this.__rafs = {};
    // Focused node before overlay gets opened. Can be restored on close.
    this.__restoreFocusNode = null;
    // Scroll info to be restored.
    this.__scrollTop = this.__scrollLeft = null;
    // Root nodes hosting the overlay, used to listen for scroll events on them.
    this.__rootNodes = null;

    this._onIronResize = this._onIronResize.bind(this);
    this.__onCaptureScroll = this.__onCaptureScroll.bind(this);
    this._boundSchedule = this._boundSchedule.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('iron-resize', this._onIronResize);

    if (!this._elementReady) {
      this._elementReady = true;
      this.updateComplete.then(() => {
        this._ensureSetup();
      });
    }

    // Call _openedChanged here so that position can be computed correctly.
    if (this.opened) {
      this._openedChanged(this.opened);
    }
    this._setupSlotListeners();
    this._ensureAria();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('iron-resize', this._onIronResize);
    this._removeSlotListeners();

    Object.keys(this.__rafs).forEach((cb) => {
      if (this.__rafs[cb] !== null) {
        cancelAnimationFrame(this.__rafs[cb]);
      }
    });
    this.__rafs = {};
    this._manager.removeOverlay(this);
    // We got detached while animating, ensure we show/hide the overlay
    // and fire iron-overlay-opened/closed event!
    if (this.__isAnimating) {
      if (this.opened) {
        this._finishRenderOpened();
      } else {
        // Restore the focus if necessary.
        this._applyFocus();
        this._finishRenderClosed();
      }
    }
  }

  _setupSlotListeners() {
    const observer = new MutationObserver((mutations) => {
      this._processMutations(mutations);
    });
    this._childrenObserver = observer;
    this._childrenObserver.observe(this, { childList: true });
  }

  _removeSlotListeners() {
    this._unlistenSlots(this.children);
    this._childrenObserver.disconnect();
    this._childrenObserver = null;
  }

  _processMutations(mutations) {
    if (mutations) {
      for (let i=0; i < mutations.length; i++) {
        let mutation = mutations[i];
        if (mutation.addedNodes) {
          this._listenSlots(mutation.addedNodes);
        }
        if (mutation.removedNodes) {
          this._unlistenSlots(mutation.removedNodes);
        }
      }
      this._onNodesChange();
    }
  }

  /**
   * @param {!Array<!Node>|!NodeList<!Node>} nodeList Nodes that could change
   * @return {void}
   * @private
   */
  _listenSlots(nodeList) {
    for (let i=0; i < nodeList.length; i++) {
      let n = nodeList[i];
      if (n.localName === 'slot') {
        n.addEventListener('slotchange', this._boundSchedule);
      }
    }
  }

  /**
   * @param {!Array<!Node>|!NodeList<!Node>} nodeList Nodes that could change
   * @return {void}
   * @private
   */
  _unlistenSlots(nodeList) {
    for (let i=0; i < nodeList.length; i++) {
      let n = nodeList[i];
      if (n.localName === 'slot') {
        n.removeEventListener('slotchange', this._boundSchedule);
      }
    }
  }

  _boundSchedule() {
    setTimeout(() => {
      this._onNodesChange();
    });
  }

  /**
   * Toggle the opened state of the overlay.
   */
  toggle() {
    this._canceled = false;
    this.opened = !this.opened;
  }

  /**
   * Open the overlay.
   */
  open() {
    this._canceled = false;
    this.opened = true;
  }

  /**
   * Close the overlay.
   */
  close() {
    this._canceled = false;
    this.opened = false;
  }

  /**
   * Cancels the overlay.
   * @param {Event=} event The original event
   */
  cancel(event) {
    const cancelEvent = new CustomEvent('iron-overlay-canceled', {
      cancelable: true,
      bubbles: true,
      composed: true,
      detail: event
    });
    this.dispatchEvent(cancelEvent);
    if (cancelEvent.defaultPrevented) {
      return;
    }

    this._canceled = true;
    this.opened = false;
  }

  /**
   * Invalidates the cached tabbable nodes. To be called when any of the
   * focusable content changes (e.g. a button is disabled).
   */
  invalidateTabbables() {
    this.__firstFocusableNode = this.__lastFocusableNode = null;
  }

  _ensureSetup() {
    if (this._overlaySetup) {
      return;
    }
    this._overlaySetup = true;
    this.style.outline = 'none';
    this.style.display = 'none';
  }

  /**
   * Called when `opened` changes.
   * @param {boolean=} opened
   * @protected
   */
  _openedChanged(opened) {
    this._ensureAria(opened);
    // Defer any animation-related code on attached
    // (_openedChanged gets called again on attached).
    if (!this.isAttached) {
      return;
    }

    this.__isAnimating = true;

    // Deraf for non-blocking rendering.
    this.__deraf('__openedChanged', this.__openedChanged);
  }

  _ensureAria(opened) {
    if (opened === undefined) {
      opened = this.opened;
    }
    if (opened) {
      this.removeAttribute('aria-hidden');
    } else {
      this.setAttribute('aria-hidden', 'true');
    }
  }

  _canceledChanged() {
    this.closingReason = this.closingReason || {};
    this.closingReason.canceled = this.canceled;
  }

  _withBackdropChanged() {
    // If tabindex is already set, no need to override it.
    if (this.withBackdrop && !this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '-1');
      this.__shouldRemoveTabIndex = true;
    } else if (this.__shouldRemoveTabIndex) {
      this.removeAttribute('tabindex');
      this.__shouldRemoveTabIndex = false;
    }
    if (this.opened && this.isAttached) {
      this._manager.trackBackdrop();
    }
  }

  /**
   * tasks which must occur before opening; e.g. making the element visible.
   * @protected
   */
  _prepareRenderOpened() {
    // Store focused node.
    this.__restoreFocusNode = this._manager.deepActiveElement;

    // Needed to calculate the size of the overlay so that transitions on its
    // size will have the correct starting points.
    this._preparePositioning();
    this.refit();
    this._finishPositioning();

    // Safari will apply the focus to the autofocus element when displayed
    // for the first time, so we make sure to return the focus where it was.
    if (this.noAutoFocus && document.activeElement === this._focusNode) {
      this._focusNode.blur();
      this.__restoreFocusNode.focus();
    }
  }

  /**
   * Tasks which cause the overlay to actually open; typically play an
   * animation.
   * @protected
   */
  _renderOpened() {
    this._finishRenderOpened();
  }

  /**
   * Tasks which cause the overlay to actually close; typically play an
   * animation.
   * @protected
   */
  _renderClosed() {
    this._finishRenderClosed();
  }

  /**
   * Tasks to be performed at the end of open action. Will fire
   * `iron-overlay-opened`.
   * @protected
   */
  _finishRenderOpened() {
    this.notifyResize();
    this.__isAnimating = false;

    this.dispatchEvent(new CustomEvent('iron-overlay-opened', {
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Tasks to be performed at the end of close action. Will fire
   * `iron-overlay-closed`.
   * @protected
   */
  _finishRenderClosed() {
    // Hide the overlay.
    this.style.display = 'none';
    // Reset z-index only at the end of the animation.
    this.style.zIndex = '';
    this.notifyResize();
    this.__isAnimating = false;
    this.dispatchEvent(new CustomEvent('iron-overlay-closed', {
      bubbles: true,
      composed: true,
      detail: this.closingReason
    }));
  }

  _preparePositioning() {
    this.style.transition = this.style.webkitTransition = 'none';
    this.style.transform = this.style.webkitTransform = 'none';
    this.style.display = '';
  }

  _finishPositioning() {
    // First, make it invisible & reactivate animations.
    this.style.display = 'none';
    // Force reflow before re-enabling animations so that they don't start.
    // Set scrollTop to itself so that Closure Compiler doesn't remove this.
    this.scrollTop = this.scrollTop;
    this.style.transition = this.style.webkitTransition = '';
    this.style.transform = this.style.webkitTransform = '';
    // Now that animations are enabled, make it visible again
    this.style.display = '';
    // Force reflow, so that following animations are properly started.
    // Set scrollTop to itself so that Closure Compiler doesn't remove this.
    this.scrollTop = this.scrollTop;
  }

  /**
   * Applies focus according to the opened state.
   * @protected
   */
  _applyFocus() {
    if (this.opened) {
      if (!this.noAutoFocus) {
        this._focusNode.focus();
      }
    } else {
      // Restore focus.
      if (this.restoreFocusOnClose && this.__restoreFocusNode) {
        // If the activeElement is `<body>` or inside the overlay,
        // we are allowed to restore the focus. In all the other
        // cases focus might have been moved elsewhere by another
        // component or by an user interaction (e.g. click on a
        // button outside the overlay).
        const activeElement = this._manager.deepActiveElement;
        if (activeElement === document.body ||
            this.shadowRoot.contains(activeElement) ||
            this.contains(activeElement)) {
          this.__restoreFocusNode.focus();
        }
      }
      this.__restoreFocusNode = null;
      this._focusNode.blur();
      this._focusedChild = null;
    }
  }

  /**
   * Cancels (closes) the overlay. Call when click happens outside the overlay.
   * @param {!Event} event
   * @protected
   */
  _onCaptureClick(event) {
    if (!this.noCancelOnOutsideClick) {
      this.cancel(event);
    }
  }

  /**
   * Keeps track of the focused child. If withBackdrop, traps focus within
   * overlay.
   * @param {!Event} event
   * @protected
   */
  _onCaptureFocus(event) {
    if (!this.withBackdrop) {
      return;
    }
    const cp = event.composedPath && event.composedPath();
    const path = cp ? cp : event.path;
    if (path.indexOf(this) === -1) {
      event.stopPropagation();
      this._applyFocus();
    } else {
      this._focusedChild = path[0];
    }
  }

  /**
   * Handles the ESC key event and cancels (closes) the overlay.
   * @param {!Event} event
   * @protected
   */
  _onCaptureEsc(event) {
    if (!this.noCancelOnEscKey) {
      this.cancel(event);
    }
  }

  /**
   * Handles TAB key events to track focus changes.
   * Will wrap focus for overlays withBackdrop.
   * @param {!Event} event
   * @protected
   */
  _onCaptureTab(event) {
    if (!this.withBackdrop) {
      return;
    }
    this.__ensureFirstLastFocusables();
    // TAB wraps from last to first focusable.
    // Shift + TAB wraps from first to last focusable.
    const shift = event.shiftKey;
    const nodeToCheck =
        shift ? this.__firstFocusableNode : this.__lastFocusableNode;
    const nodeToSet =
        shift ? this.__lastFocusableNode : this.__firstFocusableNode;
    let shouldWrap = false;
    if (nodeToCheck === nodeToSet) {
      // If nodeToCheck is the same as nodeToSet, it means we have an overlay
      // with 0 or 1 focusables; in either case we still need to trap the
      // focus within the overlay.
      shouldWrap = true;
    } else {
      // In dom=shadow, the manager will receive focus changes on the main
      // root but not the ones within other shadow roots, so we can't rely on
      // _focusedChild, but we should check the deepest active element.
      const focusedNode = this._manager.deepActiveElement;
      // If the active element is not the nodeToCheck but the overlay itself,
      // it means the focus is about to go outside the overlay, hence we
      // should prevent that (e.g. user opens the overlay and hit Shift+TAB).
      shouldWrap = (focusedNode === nodeToCheck || focusedNode === this);
    }

    if (shouldWrap) {
      // When the overlay contains the last focusable element of the document
      // and it's already focused, pressing TAB would move the focus outside
      // the document (e.g. to the browser search bar). Similarly, when the
      // overlay contains the first focusable element of the document and it's
      // already focused, pressing Shift+TAB would move the focus outside the
      // document (e.g. to the browser search bar).
      // In both cases, we would not receive a focus event, but only a blur.
      // In order to achieve focus wrapping, we prevent this TAB event and
      // force the focus. This will also prevent the focus to temporarily move
      // outside the overlay, which might cause scrolling.
      event.preventDefault();
      this._focusedChild = nodeToSet;
      this._applyFocus();
    }
  }

  /**
   * Refits if the overlay is opened and not animating.
   * @protected
   */
  _onIronResize() {
    if (this.opened && !this.__isAnimating) {
      this.__deraf('refit', this.refit);
    }
  }

  /**
   * Will call notifyResize if overlay is opened.
   * Can be overridden in order to avoid multiple observers on the same node.
   * @protected
   */
  _onNodesChange() {
    if (this.opened && !this.__isAnimating) {
      // It might have added focusable nodes, so invalidate cached values.
      this.invalidateTabbables();
      this.notifyResize();
    }
  }

  /**
   * Updates the references to the first and last focusable nodes.
   * @private
   */
  __ensureFirstLastFocusables() {
    const focusableNodes = this._focusableNodes;
    this.__firstFocusableNode = focusableNodes[0];
    this.__lastFocusableNode = focusableNodes[focusableNodes.length - 1];
  }

  /**
   * Tasks executed when opened changes: prepare for the opening, move the
   * focus, update the manager, render opened/closed.
   * @private
   */
  __openedChanged() {
    if (this.opened) {
      // Make overlay visible, then add it to the manager.
      this._prepareRenderOpened();
      this._manager.addOverlay(this);
      // Move the focus to the child node with [autofocus].
      this._applyFocus();

      this._renderOpened();
    } else {
      // Remove overlay, then restore the focus before actually closing.
      this._manager.removeOverlay(this);
      this._applyFocus();

      this._renderClosed();
    }
  }

  /**
   * Debounces the execution of a callback to the next animation frame.
   * @param {!string} jobname
   * @param {!Function} callback Always bound to `this`
   * @private
   */
  __deraf(jobname, callback) {
    const rafs = this.__rafs;
    if (rafs[jobname] !== null) {
      cancelAnimationFrame(rafs[jobname]);
    }
    rafs[jobname] = requestAnimationFrame(function nextAnimationFrame() {
      rafs[jobname] = null;
      callback.call(this);
    }.bind(this));
  }

  /**
   * @param {boolean} isAttached
   * @param {boolean} opened
   * @param {string=} scrollAction
   * @private
   */
  __updateScrollObservers(isAttached, opened, scrollAction) {
    if (!isAttached || !opened || !this.__isValidScrollAction(scrollAction)) {
      removeScrollLock(this);
      this.__removeScrollListeners();
    } else {
      if (scrollAction === 'lock') {
        this.__saveScrollPosition();
        pushScrollLock(this);
      }
      this.__addScrollListeners();
    }
  }

  /**
   * @private
   */
  __addScrollListeners() {
    if (!this.__rootNodes) {
      this.__rootNodes = [];
      // Listen for scroll events in all shadowRoots hosting this overlay only
      // when in native ShadowDOM.
      let node = this;
      while (node) {
        if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE && node.host) {
          this.__rootNodes.push(node);
        }
        node = node.host || node.assignedSlot || node.parentNode;
      }
      this.__rootNodes.push(document);
    }
    this.__rootNodes.forEach((el) => {
      el.addEventListener('scroll', this.__onCaptureScroll, {
        capture: true,
        passive: true,
      });
    });
  }

  /**
   * @private
   */
  __removeScrollListeners() {
    if (this.__rootNodes) {
      this.__rootNodes.forEach((el) => {
        el.removeEventListener('scroll', this.__onCaptureScroll, {
          capture: true,
          passive: true,
        });
      });
    }
    if (!this.isAttached) {
      this.__rootNodes = null;
    }
  }

  /**
   * @param {string=} scrollAction
   * @return {boolean}
   * @private
   */
  __isValidScrollAction(scrollAction) {
    return scrollAction === 'lock' || scrollAction === 'refit' ||
        scrollAction === 'cancel';
  }

  __onCaptureScroll(event) {
    if (this.__isAnimating) {
      return;
    }
    // Check if scroll outside the overlay.
    const cp = event.composedPath && event.composedPath();
    const path = cp ? cp : event.path;
    if (path.indexOf(this) >= 0) {
      return;
    }
    switch (this.scrollAction) {
      case 'lock':
        // NOTE: scrolling might happen if a scroll event is not cancellable, or
        // if user pressed keys that cause scrolling (they're not prevented in
        // order not to break a11y features like navigate with arrow keys).
        this.__restoreScrollPosition();
        break;
      case 'refit':
        this.__deraf('refit', this.refit);
        break;
      case 'cancel':
        this.cancel(event);
        break;
    }
  }

  /**
   * Memoizes the scroll position of the outside scrolling element.
   * @private
   */
  __saveScrollPosition() {
    if (document.scrollingElement) {
      this.__scrollTop = document.scrollingElement.scrollTop;
      this.__scrollLeft = document.scrollingElement.scrollLeft;
    } else {
      // Since we don't know if is the body or html, get max.
      this.__scrollTop =
          Math.max(document.documentElement.scrollTop, document.body.scrollTop);
      this.__scrollLeft = Math.max(
          document.documentElement.scrollLeft, document.body.scrollLeft);
    }
  }

  /**
   * Resets the scroll position of the outside scrolling element.
   * @private
   */
  __restoreScrollPosition() {
    if (document.scrollingElement) {
      document.scrollingElement.scrollTop = this.__scrollTop;
      document.scrollingElement.scrollLeft = this.__scrollLeft;
    } else {
      // Since we don't know if is the body or html, set both.
      document.documentElement.scrollTop = document.body.scrollTop =
          this.__scrollTop;
      document.documentElement.scrollLeft = document.body.scrollLeft =
          this.__scrollLeft;
    }
  }

  /**
   * Fired after the overlay opens.
   * @event iron-overlay-opened
   */

  /**
   * Fired when the overlay is canceled, but before it is closed.
   * @event iron-overlay-canceled
   * @param {Event} event The closing of the overlay can be prevented
   * by calling `event.preventDefault()`. The `event.detail` is the original event
   * that originated the canceling (e.g. ESC keyboard event or click event outside
   * the overlay).
   */

  /**
   * Fired after the overlay closes.
   * @event iron-overlay-closed
   * @param {Event} event The `event.detail` is the `closingReason` property
   * (contains `canceled`, whether the overlay was canceled).
   */
};
