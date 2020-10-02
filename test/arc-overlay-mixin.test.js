/* eslint-disable no-plusplus */
/* eslint-disable no-shadow */
import { fixture, assert, nextFrame } from '@open-wc/testing';
// @ts-ignore
import sinon from 'sinon/pkg/sinon-esm.js';
import { pressAndReleaseKeyOn, tap, focus } from '@polymer/iron-test-helpers/mock-interactions.js';
import { ArcOverlayManager } from '../arc-overlay-manager.js';

import './test-overlay.js';
import './test-overlay2.js';
import './test-buttons.js';
import './test-menu-button.js';

/** @typedef {import('./test-overlay').TestOverlay} TestOverlay */
/** @typedef {import('./test-menu-button').TestMenuButton} TestMenuButton */

const s = document.createElement('style');
s.type = 'text/css';
s.innerHTML = `
arc-overlay-backdrop {
  /* For quicker tests */
  --arc-overlay-backdrop-transition: none;
}
`;
document.getElementsByTagName('head')[0].appendChild(s);

const b = document.createElement('test-buttons');
b.id = 'buttons';
document.body.appendChild(b);

const i = document.createElement('input');
i.id = 'focusInput';
i.placeholder = 'focus input';
document.body.appendChild(i);

describe('ArcOverlayMixin', () => {
  /**
   * @returns {Promise<TestOverlay>}
   */
  async function basicFixture() {
    return (fixture(`<test-overlay>
      Basic Overlay
    </test-overlay>`));
  }
  /**
   * @returns {Promise<TestOverlay>}
   */
  async function openedFixture() {
    return (fixture(`<test-overlay opened>
      Basic Overlay
    </test-overlay>`));
  }
  /**
   * @returns {Promise<TestOverlay>}
   */
  async function autofocusFixture() {
    return (fixture(`<test-overlay>
      Autofocus
      <button autofocus>button</button>
    </test-overlay>`));
  }
  /**
   * @returns {Promise<TestOverlay>}
   */
  async function focusablesFixture() {
    return (fixture(`
    <test-overlay tabindex="-1">
      <h2>Focusables (no tabindex)</h2>
      <div>
        <input class="focusable1" placeholder="1 (nested)">
      </div>
      <button class="focusable2">1</button>
      <button disabled> disabled button</button>
      <div tabindex="-1">not focusable</div>
      <button class="focusable3">2</button>
    </test-overlay>
    <test-overlay tabindex="-1">
      <h2>Focusables (with tabindex)</h2>
      <div tabindex="-1">not focusable</div>
      <div tabindex="3" class="focusable3">3</div>
      <div tabindex="4" class="focusable4">4</div>
      <div tabindex="5" class="focusable5">5</div>
      <div>
        <div tabindex="1" class="focusable1">1 (nested)</div>
        <div tabindex="6" class="focusable6">6 (nested)</div>
      </div>
      <div tabindex="2" class="focusable2">2</div>
    </test-overlay>
    <test-overlay2>
      Overlay with optimized focusableNodes getter
      <button class="focusable1">1</button>
    </test-overlay2>`));
  }
  /**
   * @returns {Promise<TestOverlay>}
   */
  async function backdropFixture() {
    return (fixture(`<test-overlay withbackdrop>
      Overlay with backdrop
      <input disabled>
      <input>
      <input disabled>
    </test-overlay>`));
  }
  /**
   * @returns {Promise<TestOverlay>}
   */
  async function multipleFixture() {
    return (fixture(`<test-overlay class="overlay-1">
      Test overlay 1
    </test-overlay>
    <test-overlay class="overlay-2">
      Test overlay 2
      <button>Click</button>
    </test-overlay>
    <test-overlay2 class="overlay-3">
      Other overlay 3
    </test-overlay2>`));
  }
  /**
   * @returns {Promise<TestMenuButton>}
   */
  async function composedFixture() {
    return (fixture(`<test-menu-button></test-menu-button>`));
  }
  
  function runAfterOpen(overlay, callback) {
    overlay.addEventListener('overlay-opened', callback);
    overlay.open();
  }

  function runAfterClose(overlay, callback) {
    overlay.addEventListener('overlay-closed', callback);
    overlay.close();
  }

  describe('basic overlay', () => {
    let overlay;
    beforeEach(async () => {
      overlay = await basicFixture();
      await nextFrame();
    });

    it('overlay starts hidden', () => {
      assert.isFalse(overlay.opened, 'overlay starts closed');
      assert.equal(
          getComputedStyle(overlay).display, 'none', 'overlay starts hidden');
    });

    it('_renderOpened called only after is attached', async () => {
      // const TestOverlay = customElements.get('test-overlay');
      // const overlay = new TestOverlay();
      const overlay = document.createElement('test-overlay');
      await nextFrame();
      // The overlay is ready at this point, but not yet attached.
      const spy = sinon.spy(overlay, '_renderOpened');
      // This triggers _openedChanged.
      // @ts-ignore
      overlay.opened = true;
      // Wait long enough for requestAnimationFrame callback.
      await nextFrame();
      assert.isFalse(spy.called, '_renderOpened not called');
      // Because not attached yet, overlay should not be the current overlay!
      assert.isNotOk(
          // @ts-ignore
          overlay._manager.currentOverlay(), 'currentOverlay not set');
    });

    it('overlay open/close events', (done) => {
      let nevents = 0;
      overlay.addEventListener('overlay-opened', () => {
        nevents += 1;
        overlay.opened = false;
      });
      overlay.addEventListener('overlay-closed', () => {
        nevents += 1;
        assert.equal(nevents, 2, 'opened and closed events fired');
        done();
      });
      overlay.opened = true;
    });

    it('overlay legacy iron- open/close events', (done) => {
      let nevents = 0;
      overlay.addEventListener('iron-overlay-opened', () => {
        nevents += 1;
        overlay.opened = false;
      });
      overlay.addEventListener('iron-overlay-closed', () => {
        nevents += 1;
        assert.equal(nevents, 2, 'opened and closed events fired');
        done();
      });
      overlay.opened = true;
    });

    it('overlay opened-changed event', (done) => {
      overlay.addEventListener('opened-changed', () => {
        done();
      });
      overlay.opened = true;
    });

    it('open() refits overlay only once', (done) => {
      const spy = sinon.spy(overlay, 'refit');
      runAfterOpen(overlay, () => {
        assert.equal(spy.callCount, 1, 'overlay did refit only once');
        done();
      });
    });

    it('open overlay refits on iron-resize', (done) => {
      runAfterOpen(overlay, () => {
        const spy = sinon.spy(overlay, 'refit');
        overlay.dispatchEvent(new CustomEvent('iron-resize', {
          composed: true,
          bubbles: true
        }));
        nextFrame().then(() => {
          assert.isTrue(spy.called, 'overlay did refit');
          done();
        });
      });
    });
  });

  describe('basic overlay', () => {
    async function waitTimeout() {
      return new Promise((resolve) => {
        setTimeout(() => resolve());
      });
    }
    let overlay;
    beforeEach(async () => {
      overlay = await basicFixture();
      await nextFrame();
      // ArcResizableMixin requests parents info in setTimeout(() => {...});
      // Because of that some tests below may fail and this need to wait until
      // the function is executed.
      await waitTimeout();
    });

    it('overlay starts hidden', () => {
      assert.isFalse(overlay.opened, 'overlay starts closed');
      assert.equal(
          getComputedStyle(overlay).display, 'none', 'overlay starts hidden');
    });

    it('_renderOpened called only after is attached', (done) => {
      const overlay = /** @type TestOverlay */ (document.createElement('test-overlay'));
      // The overlay is ready at this point, but not yet attached.
      const spy = sinon.spy(overlay, '_renderOpened');
      // This triggers _openedChanged.
      overlay.opened = true;
      // Wait long enough for requestAnimationFrame callback.
      setTimeout(() => {
        assert.isFalse(spy.called, '_renderOpened not called');
        // Because not attached yet, overlay should not be the current overlay!
        assert.isNotOk(
            overlay._manager.currentOverlay(), 'currentOverlay not set');
        done();
      }, 100);
    });

    it('overlay open/close events', (done) => {
      let nevents = 0;
      overlay.addEventListener('overlay-opened', () => {
        nevents += 1;
        overlay.opened = false;
      });
      overlay.addEventListener('overlay-closed', () => {
        nevents += 1;
        assert.equal(nevents, 2, 'opened and closed events fired');
        done();
      });
      overlay.opened = true;
    });

    it('overlay legacy iron- open/close events', (done) => {
      let nevents = 0;
      overlay.addEventListener('iron-overlay-opened', () => {
        nevents += 1;
        overlay.opened = false;
      });
      overlay.addEventListener('iron-overlay-closed', () => {
        nevents += 1;
        assert.equal(nevents, 2, 'opened and closed events fired');
        done();
      });
      overlay.opened = true;
    });

    it('open() refits overlay only once', (done) => {
      const spy = sinon.spy(overlay, 'refit');
      runAfterOpen(overlay, () => {
        assert.equal(spy.callCount, 1, 'overlay did refit only once');
        done();
      });
    });

    it('open overlay refits on iron-resize', (done) => {
      runAfterOpen(overlay, () => {
        const spy = sinon.spy(overlay, 'refit');
        overlay.dispatchEvent(new CustomEvent('iron-resize', {
          composed: true,
          bubbles: true
        }));
        nextFrame().then(() => {
          assert.isTrue(spy.called, 'overlay did refit');
          done();
        });
      });
    });

    it('closed overlay does not refit on iron-resize', (done) => {
      const spy = sinon.spy(overlay, 'refit');
      overlay.dispatchEvent(new CustomEvent('iron-resize', {
        composed: true,
        bubbles: true
      }));
      nextFrame().then(() => {
        assert.isFalse(spy.called, 'overlay should not refit');
        done();
      });
    });

    it('open() triggers iron-resize', (done) => {
      let callCount = 0;
      // Ignore iron-resize triggered by window resize.
      window.addEventListener('resize', () => {
        callCount--;
      }, true);
      overlay.addEventListener('iron-resize', () => {
        callCount++;
      });
      runAfterOpen(overlay, () => {
        assert.isAbove(
            callCount, 0, 'iron-resize called before iron-overlay-opened');
        done();
      });
    });

    it('close() triggers iron-resize', (done) => {
      runAfterOpen(overlay, () => {
        const spy = sinon.stub();
        overlay.addEventListener('iron-resize', spy);
        runAfterClose(overlay, () => {
          assert.equal(
              spy.callCount,
              1,
              'iron-resize called once before iron-overlay-closed');
          done();
        });
      });
    });

    it('closed overlay does not trigger iron-resize when its content changes', (done) => {
      // Ignore iron-resize triggered by window resize.
      let callCount = 0;
      window.addEventListener('resize', () => {
        callCount--;
      }, true);
      overlay.addEventListener('iron-resize', () => {
        callCount++;
      });
      overlay.appendChild(document.createElement('div'));
      // Wait for MutationObserver to be executed.
      setTimeout(() => {
        assert.equal(callCount, 0, 'iron-resize should not be called');
        done();
      });
    });

    it('open overlay triggers iron-resize when its content changes', (done) => {
      runAfterOpen(overlay, () => {
        const spy = sinon.stub();
        overlay.addEventListener('iron-resize', spy);
        overlay.appendChild(document.createElement('div'));
        // Wait for MutationObserver to be executed.
        setTimeout(() => {
          assert.equal(spy.callCount, 1, 'iron-resize should be called once');
          done();
        });
      });
    });

    it('close an overlay quickly after open', (done) => {
      // first, open the overlay
      overlay.open();
      setTimeout(() => {
        // during the opening transition, close the overlay
        overlay.close();
        // wait for any exceptions to be thrown until the transition is done
        setTimeout(() => {
          done();
        }, 300);
      });
    });

    it('clicking an overlay does not close it', (done) => {
      runAfterOpen(overlay, () => {
        const spy = sinon.stub();
        overlay.addEventListener('overlay-closed', spy);
        overlay.click();
        setTimeout(() => {
          assert.isFalse(spy.called, 'overlay-closed should not fire');
          done();
        }, 10);
      });
    });

    it('open overlay on mousedown does not close it', (done) => {
      const btn = document.createElement('button');
      btn.addEventListener('mousedown', overlay.open.bind(overlay));
      document.body.appendChild(btn);
      // It triggers mousedown, mouseup, and click.
      btn.click();

      const clickEvent = document.createEvent('MouseEvents');
      clickEvent.initEvent('mousedown', true, true);
      btn.dispatchEvent(clickEvent);

      document.body.removeChild(btn);
      assert.isTrue(overlay.opened, 'overlay opened');
      setTimeout(() => {
        assert.isTrue(overlay.opened, 'overlay is still open');
        done();
      }, 10);
    });

    it('clicking outside fires overlay-canceled', (done) => {
      runAfterOpen(overlay, () => {
        overlay.addEventListener('overlay-canceled', (event) => {
          assert.equal(
              event.detail.target,
              document.body,
              'detail contains original click event');
          done();
        });
        document.body.click();
      });
    });

    it('clicking outside fires legacy iron-overlay-canceled', (done) => {
      runAfterOpen(overlay, () => {
        overlay.addEventListener('iron-overlay-canceled', (event) => {
          assert.equal(
              event.detail.target,
              document.body,
              'detail contains original click event');
          done();
        });
        document.body.click();
      });
    });

    it('clicking outside closes the overlay', (done) => {
      runAfterOpen(overlay, () => {
        overlay.addEventListener('overlay-closed', (event) => {
          assert.isTrue(event.detail.canceled, 'overlay is canceled');
          done();
        });
        document.body.click();
      });
    });

    it('overlay-canceled event can be prevented', (done) => {
      runAfterOpen(overlay, () => {
        overlay.addEventListener('overlay-canceled', (event) => {
          event.preventDefault();
        });
        const spy = sinon.stub();
        overlay.addEventListener('overlay-closed', spy);
        document.body.click();
        setTimeout(() => {
          assert.isTrue(overlay.opened, 'overlay is still open');
          assert.isFalse(spy.called, 'overlay-closed not fired');
          done();
        }, 10);
      });
    });

    it('legacy iron-overlay-canceled event can be prevented', (done) => {
      runAfterOpen(overlay, () => {
        overlay.addEventListener('iron-overlay-canceled', (event) => {
          event.preventDefault();
        });
        const spy = sinon.stub();
        overlay.addEventListener('iron-overlay-closed', spy);
        document.body.click();
        setTimeout(() => {
          assert.isTrue(overlay.opened, 'overlay is still open');
          assert.isFalse(spy.called, 'iron-overlay-closed not fired');
          done();
        }, 10);
      });
    });

    it('cancel an overlay with esc key', (done) => {
      runAfterOpen(overlay, () => {
        overlay.addEventListener('overlay-canceled', (event) => {
          assert.equal(event.detail.type, 'keydown');
          done();
        });
        // @ts-ignore
        pressAndReleaseKeyOn(document, 27, '', 'Escape');
      });
    });

    it('close an overlay with esc key', (done) => {
      runAfterOpen(overlay, () => {
        overlay.addEventListener('overlay-closed', (event) => {
          assert.isTrue(event.detail.canceled, 'overlay is canceled');
          done();
        });
        // @ts-ignore
        pressAndReleaseKeyOn(document, 27, '', 'Escape');
      });
    });

    it('nocancelonoutsideclick property', (done) => {
      overlay.noCancelOnOutsideClick = true;
      runAfterOpen(overlay, () => {
        const spy = sinon.stub();
        overlay.addEventListener('overlay-closed', spy);
        tap(document.body);
        setTimeout(() => {
          assert.isFalse(spy.called, 'overlay-closed should not fire');
          done();
        }, 10);
      });
    });

    it('nocancelonesckey property', (done) => {
      overlay.noCancelOnEscKey = true;
      runAfterOpen(overlay, () => {
        const spy = sinon.stub();
        overlay.addEventListener('overlay-closed', spy);
        // @ts-ignore
        pressAndReleaseKeyOn(document, 27);
        setTimeout(() => {
          assert.isFalse(spy.called, 'overlay-cancel should not fire');
          done();
        }, 10);
      });
    });

    it('with-backdrop sets tabindex=-1 and removes it', () => {
      overlay.withBackdrop = true;
      assert.equal(overlay.getAttribute('tabindex'), '-1', 'tabindex is -1');
      overlay.withBackdrop = false;
      assert.isFalse(overlay.hasAttribute('tabindex'), 'tabindex removed');
    });

    it('with-backdrop does not override tabindex if already set', () => {
      overlay.setAttribute('tabindex', '1');
      overlay.withBackdrop = true;
      assert.equal(overlay.getAttribute('tabindex'), '1', 'tabindex is 1');
      overlay.withBackdrop = false;
      assert.equal(overlay.getAttribute('tabindex'), '1', 'tabindex is still 1');
    });
  });

  describe('keyboard event listener', () => {
    let overlay;
    const preventKeyDown = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    before(() => {
      // Worst case scenario: listener with useCapture = true that prevents &
      // stops propagation added before the overlay is initialized.
      document.addEventListener('keydown', preventKeyDown, true);
    });

    beforeEach(async () => {
      overlay = await basicFixture();
      await nextFrame();
    });

    after(() => {
      document.removeEventListener('keydown', preventKeyDown, true);
    });

    it('cancel an overlay with esc key even if event is prevented by other listeners', (done) => {
      runAfterOpen(overlay, () => {
        overlay.addEventListener('overlay-canceled', () => {
          done();
        });
        // @ts-ignore
        pressAndReleaseKeyOn(document, 27, '', 'Escape');
      });
    });
  });

  describe('click event listener', () => {
    let overlay;
    const preventTap = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    before(() => {
      // Worst case scenario: listener with useCapture = true that prevents &
      // stops propagation added before the overlay is initialized.
      document.body.addEventListener('click', preventTap);
    });

    after(() => {
      document.removeEventListener('click', preventTap);
    });

    beforeEach(async () => {
      overlay = await basicFixture();
      await nextFrame();
    });

    it('cancel an overlay with tap outside even if event is prevented by other listeners', (done) => {
      runAfterOpen(overlay, () => {
        overlay.addEventListener('overlay-canceled', () => {
          done();
        });
        tap(document.body);
      });
    });
  });

  describe('opened overlay', () => {
    let overlay;
    beforeEach(async () => {
      overlay = await openedFixture();
    });

    it('overlay open by default', (done) => {
      overlay.addEventListener('overlay-opened', () => {
        assert.isTrue(overlay.opened, 'overlay starts opened');
        assert.notEqual(
            getComputedStyle(overlay).display, 'none', 'overlay starts showing');
        done();
      });
    });

    it('overlay positioned & sized properly', (done) => {
      overlay.addEventListener('overlay-opened', () => {
        const s = getComputedStyle(overlay);
        assert.closeTo(
            parseFloat(s.left),
            (window.innerWidth - overlay.offsetWidth) / 2,
            1,
            'centered horizontally');
        assert.closeTo(
            parseFloat(s.top),
            (window.innerHeight - overlay.offsetHeight) / 2,
            1,
            'centered vertically');
        done();
      });
    });
  });

  describe('focus handling', () => {
    let overlay;
    beforeEach(async () => {
      // Ensure focus is set to document.body
      document.body.focus();
      overlay = await autofocusFixture();
      await nextFrame();
    });

    it('node with autofocus is focused', (done) => {
      runAfterOpen(overlay, () => {
        assert.equal(
            overlay.querySelector('[autofocus]'),
            document.activeElement,
            '<button autofocus> is focused');
        done();
      });
    });

    it('no-auto-focus will not focus node with autofocus', (done) => {
      overlay.noAutoFocus = true;
      runAfterOpen(overlay, () => {
        assert.notEqual(
            overlay.querySelector('[autofocus]'),
            document.activeElement,
            '<button autofocus> not focused after opened');
        done();
      });
      // In Safari the element with autofocus will immediately receive focus when
      // displayed for the first time http://jsbin.com/woroci/2/ Ensure this is
      // not the case for overlay.
      assert.notEqual(
          overlay.querySelector('[autofocus]'),
          document.activeElement,
          '<button autofocus> not immediately focused');
    });

    it('no-cancel-on-outside-click property; focus stays on overlay when click outside', (done) => {
      overlay.noCancelOnOutsideClick = true;
      runAfterOpen(overlay, () => {
        tap(document.body);
        setTimeout(() => {
          assert.equal(
              overlay.querySelector('[autofocus]'),
              document.activeElement,
              '<button autofocus> is focused');
          done();
        }, 10);
      });
    });

    it('with-backdrop traps the focus within the overlay', (done) => {
      const focusSpy = sinon.stub();
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.addEventListener('focus', focusSpy, true);
      overlay.withBackdrop = true;
      runAfterOpen(overlay, () => {
        // Try to steal the focus
        focus(button);
        assert.equal(
            overlay.querySelector('[autofocus]'),
            document.activeElement,
            '<button autofocus> is focused');
        assert.equal(
            focusSpy.callCount, 0, 'button in body did not get the focus');
        document.body.removeChild(button);
        done();
      });
    });

    it('overlay with-backdrop and 1 focusable: prevent TAB and trap the focus', (done) => {
      overlay.withBackdrop = true;
      runAfterOpen(overlay, () => {
        // 1ms timeout needed by IE10 to have proper focus switching.
        setTimeout(() => {
          // Spy keydown.
          const tabSpy = sinon.spy();
          document.addEventListener('keydown', tabSpy);
          // Simulate TAB.
          // @ts-ignore
          pressAndReleaseKeyOn(document, 9, '', 'Tab');
          assert.equal(
              overlay.querySelector('[autofocus]'),
              document.activeElement,
              'focus stays on button');
          assert.isTrue(tabSpy.calledOnce, 'keydown spy called');
          assert.isTrue(
              tabSpy.getCall(0).args[0].defaultPrevented,
              'keydown default prevented');
          // Cleanup.
          document.removeEventListener('keydown', tabSpy);
          done();
        }, 1);
      });
    });

    it('empty overlay with-backdrop: prevent TAB and trap the focus', (done) => {
      autofocusFixture()
      .then((el) => {
        overlay = el;
        overlay.withBackdrop = true;
        runAfterOpen(overlay, () => {
          // 1ms timeout needed by IE10 to have proper focus switching.
          setTimeout(() => {
            // Spy keydown.
            const tabSpy = sinon.spy();
            document.addEventListener('keydown', tabSpy);
            // Simulate TAB.
            // @ts-ignore
            pressAndReleaseKeyOn(document, 9, '', 'Tab');
            // Cleanup.
            document.removeEventListener('keydown', tabSpy);
            assert.isTrue(overlay.contains(document.activeElement), 'focus stays inside overlay');
            assert.isTrue(tabSpy.calledOnce, 'keydown spy called');
            assert.isTrue(
                tabSpy.getCall(0).args[0].defaultPrevented,
                'keydown default prevented');
            done();
          }, 1);
        });
      });
    });
  });

  describe('focusable nodes', () => {
    let overlay;
    let overlayWithTabIndex;
    let overlayFocusableNodes;

    beforeEach(async () => {
      overlay = await focusablesFixture();
      overlayWithTabIndex = overlay.nextElementSibling;
      overlayFocusableNodes = overlayWithTabIndex.nextElementSibling;
    });

    it('_focusableNodes returns nodes that are focusable', (done) => {
      runAfterOpen(overlay, () => {
        const focusableNodes = overlay._focusableNodes;
        assert.equal(focusableNodes.length, 3, '3 nodes are focusable');
        assert.equal(
            focusableNodes[0], overlay.querySelector('.focusable1'));
        assert.equal(
            focusableNodes[1], overlay.querySelector('.focusable2'));
        assert.equal(
            focusableNodes[2], overlay.querySelector('.focusable3'));
        done();
      });
    });

    it('_focusableNodes includes overlay if it has a valid tabindex', (done) => {
      runAfterOpen(overlay, () => {
        overlay.setAttribute('tabindex', '0');
        const focusableNodes = overlay._focusableNodes;
        assert.equal(focusableNodes.length, 4, '4 focusable nodes');
        assert.notEqual(
            focusableNodes.indexOf(overlay), -1, 'overlay is included');
        done();
      });
    });

    it('_focusableNodes respects the tabindex order', (done) => {
      runAfterOpen(overlayWithTabIndex, () => {
        const focusableNodes = overlayWithTabIndex._focusableNodes;
        assert.equal(focusableNodes.length, 6, '6 nodes are focusable');
        assert.equal(
            focusableNodes[0],
            overlayWithTabIndex.querySelector('.focusable1'));
        assert.equal(
            focusableNodes[1],
            overlayWithTabIndex.querySelector('.focusable2'));
        assert.equal(
            focusableNodes[2],
            overlayWithTabIndex.querySelector('.focusable3'));
        assert.equal(
            focusableNodes[3],
            overlayWithTabIndex.querySelector('.focusable4'));
        assert.equal(
            focusableNodes[4],
            overlayWithTabIndex.querySelector('.focusable5'));
        assert.equal(
            focusableNodes[5],
            overlayWithTabIndex.querySelector('.focusable6'));
        done();
      });
    });

    it('_focusableNodes can be overridden', (done) => {
      runAfterOpen(overlayFocusableNodes, () => {
        // It has 1 focusable in the light dom, and 2 in the shadow dom.
        const focusableNodes = overlayFocusableNodes._focusableNodes;
        assert.equal(focusableNodes.length, 2, 'length ok');
        assert.equal(
            focusableNodes[0], overlayFocusableNodes.shadowRoot.querySelector('#first'), 'first ok');
        assert.equal(focusableNodes[1], overlayFocusableNodes.shadowRoot.querySelector('#last'), 'last ok');
        done();
      });
    });

    it('with-backdrop: TAB & Shift+TAB wrap focus', (done) => {
      overlay.withBackdrop = true;
      runAfterOpen(overlay, () => {
        const focusableNodes = overlay._focusableNodes;
        // 1ms timeout needed by IE10 to have proper focus switching.
        setTimeout(() => {
          // Go to last element.
          focusableNodes[focusableNodes.length - 1].focus();
          // Spy keydown.
          const tabSpy = sinon.spy();
          document.addEventListener('keydown', tabSpy);
          // Simulate TAB.
          // @ts-ignore
          pressAndReleaseKeyOn(document, 9, '', 'Tab');
          assert.equal(
              focusableNodes[0],
              document.activeElement,
              'focus wrapped to first focusable');
          assert.isTrue(tabSpy.calledOnce, 'keydown spy called');
          assert.isTrue(
              tabSpy.getCall(0).args[0].defaultPrevented,
              'keydown default prevented');
          // Simulate Shift+TAB.
          // @ts-ignore
          pressAndReleaseKeyOn(document, 9, ['shift'], 'Tab');
          assert.equal(
              focusableNodes[focusableNodes.length - 1],
              document.activeElement,
              'focus wrapped to last focusable');
          assert.isTrue(tabSpy.calledTwice, 'keydown spy called again');
          assert.isTrue(
              tabSpy.getCall(1).args[0].defaultPrevented,
              'keydown default prevented again');
          // Cleanup.
          document.removeEventListener('keydown', tabSpy);
          done();
        }, 1);
      });
    });

    it('with-backdrop: TAB & Shift+TAB wrap focus respecting tabindex', (done) => {
      overlayWithTabIndex.withBackdrop = true;
      runAfterOpen(overlayWithTabIndex, () => {
        const focusableNodes = overlayWithTabIndex._focusableNodes;
        // 1ms timeout needed by IE10 to have proper focus switching.
        setTimeout(() => {
          // Go to last element.
          focusableNodes[focusableNodes.length - 1].focus();
          // Simulate TAB.
          // @ts-ignore
          pressAndReleaseKeyOn(document, 9, '', 'Tab');
          assert.equal(
              focusableNodes[0],
              document.activeElement,
              'focus wrapped to first focusable');
          // Simulate Shift+TAB.
          // @ts-ignore
          pressAndReleaseKeyOn(document, 9, ['shift'], 'Tab');
          assert.equal(
              focusableNodes[focusableNodes.length - 1],
              document.activeElement,
              'focus wrapped to last focusable');
          done();
        }, 1);
      });
    });

    it('with-backdrop: Shift+TAB after open wrap focus', (done) => {
      overlay.withBackdrop = true;
      runAfterOpen(overlay, () => {
        const focusableNodes = overlay._focusableNodes;
        // 1ms timeout needed by IE10 to have proper focus switching.
        setTimeout(() => {
          // Spy keydown.
          const tabSpy = sinon.spy();
          document.addEventListener('keydown', tabSpy);
          // Simulate Shift+TAB.
          // @ts-ignore
          pressAndReleaseKeyOn(document, 9, ['shift'], 'Tab');
          assert.equal(
              focusableNodes[focusableNodes.length - 1],
              document.activeElement,
              'focus wrapped to last focusable');
          assert.isTrue(tabSpy.calledOnce, 'keydown spy called');
          assert.isTrue(
              tabSpy.getCall(0).args[0].defaultPrevented,
              'keydown default prevented');
          // Cleanup.
          document.removeEventListener('keydown', tabSpy);
          done();
        }, 1);
      });
    });

    it('with-backdrop: after open, update last focusable node and then Shift+TAB', (done) => {
      overlay.withBackdrop = true;
      runAfterOpen(overlay, () => {
        const focusableNodes = overlay._focusableNodes;
        // 1ms timeout needed by IE10 to have proper focus switching.
        setTimeout(() => {
          // Before tabbing, make lastFocusable non-tabbable. This will make
          // the one before it (focusableNodes.length - 2), the new last
          // focusable node.
          focusableNodes[focusableNodes.length - 1].setAttribute(
              'tabindex', '-1');
          overlay.invalidateTabbables();
          // Simulate Shift+TAB.
          // @ts-ignore
          pressAndReleaseKeyOn(document, 9, ['shift'], 'Tab');
          assert.equal(
              focusableNodes[focusableNodes.length - 2],
              document.activeElement,
              'focus wrapped correctly');
          done();
        }, 1);
      });
    });

    it('with-backdrop: Shift+TAB wrap focus in shadowDOM', (done) => {
      overlayFocusableNodes.withBackdrop = true;
      runAfterOpen(overlayFocusableNodes, () => {
        // 1ms timeout needed by IE10 to have proper focus switching.
        setTimeout(() => {
          // Spy keydown.
          const tabSpy = sinon.spy();
          document.addEventListener('keydown', tabSpy);
          // Simulate Shift+TAB.
          // @ts-ignore
          pressAndReleaseKeyOn(document, 9, ['shift'], 'Tab');
          assert.equal(
              overlayFocusableNodes.shadowRoot.querySelector('#last'),
              ArcOverlayManager.deepActiveElement,
              'focus wrapped to last focusable in the shadowDOM');
          assert.isTrue(tabSpy.calledOnce, 'keydown spy called');
          assert.isTrue(
              tabSpy.getCall(0).args[0].defaultPrevented,
              'keydown default prevented');
          // Cleanup.
          document.removeEventListener('keydown', tabSpy);
          done();
        }, 1);
      });
    });
    const testName =
        'with-backdrop: __firstFocusableNode and __lastFocusableNode are ' +
        'updated after pressing tab.';
    it(testName, (done) => {
      const TAB = 9;
      backdropFixture()
      .then((overlay) => {
        const inputs = overlay.querySelectorAll('input');
        runAfterOpen(overlay, () => {
          // @ts-ignore
          pressAndReleaseKeyOn(document, TAB, '', 'Tab');
          // @ts-ignore
          assert.equal(overlay.__firstFocusableNode, inputs[1]);
          // @ts-ignore
          assert.equal(overlay.__lastFocusableNode, inputs[1]);
          inputs[0].removeAttribute('disabled');
          inputs[2].removeAttribute('disabled');
          // @ts-ignore
          pressAndReleaseKeyOn(document, TAB, '', 'Tab');
          // @ts-ignore
          assert.equal(overlay.__firstFocusableNode, inputs[0]);
          // @ts-ignore
          assert.equal(overlay.__lastFocusableNode, inputs[2]);
          done();
        });
      });
    });
  });

  describe('ArcOverlayManager.deepActiveElement', () => {
    it('handles document.body', () => {
      document.body.focus();
      assert.equal(ArcOverlayManager.deepActiveElement, document.body);
    });

    it('handles light dom', () => {
      const focusable = document.getElementById('focusInput');
      focusable.focus();
      assert.equal(
          ArcOverlayManager.deepActiveElement, focusable, 'input is handled');
      focusable.blur();
    });

    it('handles shadow dom', () => {
      const focusable = document.getElementById('buttons').shadowRoot.querySelector('#button0');
      // @ts-ignore
      focusable.focus();
      assert.equal(ArcOverlayManager.deepActiveElement, focusable);
      // @ts-ignore
      focusable.blur();
    });
  });

  describe('restore-focus-on-close', () => {
    let overlay;
    beforeEach(async () => {
      overlay = await autofocusFixture();
      overlay.restoreFocusOnClose = true;
    });

    afterEach(() => {
      // No matter what, return the focus to body!
      document.body.focus();
    });

    it('does not return focus on close by default (restore-focus-on-close=false)', (done) => {
      overlay.restoreFocusOnClose = false;
      const focusable = document.getElementById('focusInput');
      focusable.focus();
      runAfterOpen(overlay, () => {
        runAfterClose(overlay, () => {
          assert.notEqual(
              ArcOverlayManager.deepActiveElement,
              focusable,
              'focus is not restored to focusable');
          done();
        });
      });
    });

    it('overlay returns focus on close', (done) => {
      const focusable = document.getElementById('focusInput');
      focusable.focus();
      runAfterOpen(overlay, () => {
        runAfterClose(overlay, () => {
          assert.equal(
              ArcOverlayManager.deepActiveElement,
              focusable,
              'focus restored to focusable');
          done();
        });
      });
    });

    it('overlay returns focus on close (ShadowDOM)', (done) => {
      const focusable = document.getElementById('buttons').shadowRoot.querySelector('#button0');
      // @ts-ignore
      focusable.focus();
      runAfterOpen(overlay, () => {
        runAfterClose(overlay, () => {
          assert.equal(
              ArcOverlayManager.deepActiveElement,
              focusable,
              'focus restored to focusable');
          done();
        });
      });
    });

    it('avoids restoring focus if focus changed', (done) => {
      const button0 = document.getElementById('buttons').shadowRoot.querySelector('#button0');
      const button1 = document.getElementById('buttons').shadowRoot.querySelector('#button1');
      // @ts-ignore
      button0.focus();
      runAfterOpen(overlay, () => {
        // @ts-ignore
        button1.focus();
        runAfterClose(overlay, () => {
          assert.equal(
              ArcOverlayManager.deepActiveElement,
              button1,
              'focus was not modified');
          done();
        });
      });
    });

    it('focus restored if overlay detached before closing is done', (done) => {
      const focusable = document.getElementById('focusInput');
      focusable.focus();
      runAfterOpen(overlay, () => {
        // Close overlay and remove it from the DOM.
        runAfterClose(overlay, () => {
          assert.equal(
              ArcOverlayManager.deepActiveElement,
              focusable,
              'focus restored to focusable');
          done();
        });
        overlay.parentNode.removeChild(overlay);
      });
    });
  });

  describe('overlay with backdrop', () => {
    let overlay;
    beforeEach(async () => {
      overlay = await backdropFixture();
      await nextFrame();
    });

    it('backdrop is opened when overlay is opened', (done) => {
      assert.isOk(overlay.backdropElement, 'backdrop is defined');
      runAfterOpen(overlay, () => {
        assert.isTrue(overlay.backdropElement.opened, 'backdrop is opened');
        assert.isOk(
            overlay.backdropElement.parentNode,
            'backdrop is inserted in the DOM');
        done();
      });
    });

    it('backdrop appears behind the overlay', (done) => {
      runAfterOpen(overlay, () => {
        const styleZ = parseInt(window.getComputedStyle(overlay).zIndex, 10);
        const backdropStyleZ =
            parseInt(window.getComputedStyle(overlay.backdropElement).zIndex, 10);
        assert.isTrue(
            styleZ > backdropStyleZ, 'overlay has higher z-index than backdrop');
        done();
      });
    });

    it('backdrop is removed when overlay is closed', (done) => {
      runAfterOpen(overlay, () => {
        runAfterClose(overlay, () => {
          assert.isFalse(overlay.backdropElement.opened, 'backdrop is closed');
          assert.isNotOk(
            overlay.backdropElement.parentNode,
            'backdrop is removed from the DOM');
          assert.lengthOf(
            document.querySelectorAll('arc-overlay-backdrop'),
            0,
            'no backdrop elements on body');
            done();
        });
      });
    });

    it('backdrop is removed when the element is removed from DOM', (done) => {
      runAfterOpen(overlay, () => {
        overlay.parentNode.removeChild(overlay);
        // Ensure detached is executed.
        nextFrame().then(() => {
          assert.isFalse(overlay.backdropElement.opened, 'backdrop is closed');
          assert.isNotOk(
              overlay.backdropElement.parentNode,
              'backdrop is removed from the DOM');
          assert.lengthOf(
              document.querySelectorAll('arc-overlay-backdrop'),
              0,
              'no backdrop elements on body');
          assert.isNotOk(
              overlay._manager.currentOverlay(), 'currentOverlay ok');
          done();
        });
      });
    });

    it('manager.getBackdrops() updated on opened changes', (done) => {
      runAfterOpen(overlay, () => {
        assert.equal(
            ArcOverlayManager.getBackdrops().length,
            1,
            'overlay added to manager backdrops');
        runAfterClose(overlay, () => {
          assert.equal(
              ArcOverlayManager.getBackdrops().length,
              0,
              'overlay removed from manager backdrops');
          done();
        });
      });
    });

    it('updating with-backdrop to false closes backdrop', (done) => {
      runAfterOpen(overlay, () => {
        overlay.withBackdrop = false;
        assert.isFalse(overlay.backdropElement.opened, 'backdrop is closed');
        assert.isNotObject(
            overlay.backdropElement.parentNode,
            'backdrop is removed from document');
        done();
      });
    });

    it('backdrop is removed when toggling overlay opened', (done) => {
      overlay.open();
      runAfterClose(overlay, () => {
        assert.isFalse(overlay.backdropElement.opened, 'backdrop is closed');
        assert.isNotOk(
            overlay.backdropElement.parentNode,
            'backdrop is removed from document');
        done();
      });
    });

    it('withBackdrop = false does not prevent click outside event', (done) => {
      overlay.withBackdrop = false;
      runAfterOpen(overlay, () => {
        overlay.addEventListener('overlay-canceled', (event) => {
          assert.isFalse(
              event.detail.defaultPrevented, 'click event not prevented');
          done();
        });
        tap(document.body);
      });
    });
  });

  describe('multiple overlays', () => {
    let overlay1;
    let overlay2;

    beforeEach(async () => {
      overlay1 = await multipleFixture();
      overlay2 = overlay1.nextElementSibling;
      await nextFrame();
    });

    it('new overlays appear on top', (done) => {
      runAfterOpen(overlay1, () => {
        runAfterOpen(overlay2, () => {
          const styleZ = parseInt(window.getComputedStyle(overlay1).zIndex, 10);
          const styleZ1 = parseInt(window.getComputedStyle(overlay2).zIndex, 10);
          assert.isTrue(styleZ1 > styleZ, 'overlay2 has higher z-index than overlay1');
          done();
        });
      });
    });

    it('ESC closes only the top overlay', (done) => {
      runAfterOpen(overlay1, () => {
        runAfterOpen(overlay2, () => {
          // @ts-ignore
          pressAndReleaseKeyOn(document, 27, '', 'Escape');
          assert.isFalse(overlay2.opened, 'overlay2 was closed');
          assert.isTrue(overlay1.opened, 'overlay1 is still opened');
          done();
        });
      });
    });

    it('close an overlay in proximity to another overlay', (done) => {
      // Open and close a separate overlay.
      overlay1.open();
      overlay1.close();
      // Open the overlay we care about.
      overlay2.open();
      // Immediately close the first overlay.
      // Wait for infinite recursion, otherwise we win.
      runAfterClose(overlay2, () => {
        done();
      });
    });

    it('allow-click-through allows overlay below to handle click', (done) => {
      overlay2.allowClickThrough = true;
      runAfterOpen(overlay1, () => {
        runAfterOpen(overlay2, () => {
          tap(document.body);
          assert.isFalse(overlay1.opened, 'overlay1 was closed');
          assert.isFalse(overlay2.opened, 'overlay2 was closed');
          done();
        });
      });
    });

    it('allow-click-through and no-cancel-on-outside-click combo', (done) => {
      overlay2.allowClickThrough = true;
      overlay2.noCancelOnOutsideClick = true;
      runAfterOpen(overlay1, () => {
        runAfterOpen(overlay2, () => {
          tap(document.body);
          assert.isTrue(overlay2.opened, 'overlay2 still open');
          assert.isFalse(overlay1.opened, 'overlay1 was closed');
          done();
        });
      });
    });
  });

  describe('Manager overlays in sync', () => {
    let overlays;
    let overlay1;
    let overlay2;

    beforeEach(async () => {
      overlay1 = await multipleFixture();
      overlay2 = overlay1.nextElementSibling;
      overlays = ArcOverlayManager._overlays;
      await nextFrame();
    });

    it('no duplicates after attached', (done) => {
      overlay1 = document.createElement('test-overlay');
      runAfterOpen(overlay1, () => {
        assert.equal(overlays.length, 1, 'correct count after open and attached');
        document.body.removeChild(overlay1);
        done();
      });
      document.body.appendChild(overlay1);
    });

    it('call open multiple times handled', (done) => {
      overlay1.open();
      overlay1.open();
      runAfterOpen(overlay1, () => {
        assert.equal(overlays.length, 1, '1 overlay after open');
        done();
      });
    });

    it('close handled', (done) => {
      runAfterOpen(overlay1, () => {
        runAfterClose(overlay1, () => {
          assert.equal(overlays.length, 0, '0 overlays after close');
          done();
        });
      });
    });

    it('open/close brings overlay on top', (done) => {
      overlay1.open();
      runAfterOpen(overlay2, () => {
        assert.equal(overlays.indexOf(overlay1), 0, 'overlay1 at index 0');
        assert.equal(overlays.indexOf(overlay2), 1, 'overlay2 at index 1');
        overlay1.close();
        runAfterOpen(overlay1, () => {
          assert.equal(
              overlays.indexOf(overlay1), 1, 'overlay1 moved at index 1');
          assert.isAbove(
              // eslint-disable-next-line radix
              parseInt(overlay1.style.zIndex),
              // eslint-disable-next-line radix
              parseInt(overlay2.style.zIndex),
              'overlay1 on top of overlay2');
          done();
        });
      });
    });
  });

  describe('z-ordering', () => {
    let originalMinimumZ;
    let overlay1;

    beforeEach(async () => {
      overlay1 = await multipleFixture();
      originalMinimumZ = ArcOverlayManager._minimumZ;
      await nextFrame();
    });

    afterEach(() => {
      ArcOverlayManager._minimumZ = originalMinimumZ;
    });

    // for iframes
    it('default z-index is greater than 100', (done) => {
      runAfterOpen(overlay1, () => {
        const styleZ = parseInt(window.getComputedStyle(overlay1).zIndex, 10);
        assert.isTrue(styleZ > 100, 'overlay1 z-index is <= 100');
        done();
      });
    });

    it('ensureMinimumZ() effects z-index', (done) => {
      ArcOverlayManager.ensureMinimumZ(1000);
      runAfterOpen(overlay1, () => {
        const styleZ = parseInt(window.getComputedStyle(overlay1).zIndex, 10);
        assert.isTrue(styleZ > 1000, 'overlay1 z-index is <= 1000');
        done();
      });
    });

    it('ensureMinimumZ() never decreases the minimum z-index', (done) => {
      ArcOverlayManager.ensureMinimumZ(1000);
      ArcOverlayManager.ensureMinimumZ(500);
      runAfterOpen(overlay1, () => {
        const styleZ = parseInt(window.getComputedStyle(overlay1).zIndex, 10);
        assert.isTrue(styleZ > 1000, 'overlay1 z-index is <= 1000');
        done();
      });
    });
  });

  describe('multiple overlays with backdrop', () => {
    let overlay1;
    let overlay2;
    let overlay3;

    beforeEach(async () => {
      overlay1 = await multipleFixture();
      overlay2 = overlay1.nextElementSibling;
      overlay3 = overlay2.nextElementSibling;
      // @ts-ignore
      overlay1.withBackdrop = true;
      // @ts-ignore
      overlay2.withBackdrop = true;
      // @ts-ignore
      overlay3.withBackdrop = true;
      await nextFrame();
    });

    it('multiple overlays share the same backdrop', () => {
      assert.isTrue(
          overlay1.backdropElement === overlay2.backdropElement,
          'overlay1 and overlay2 have the same backdrop element');
      assert.isTrue(
          overlay1.backdropElement === overlay3.backdropElement,
          'overlay1 and overlay3 have the same backdrop element');
    });

    it('only one arc-overlay-backdrop in the DOM', (done) => {
      // Open them all.
      overlay1.opened = true;
      overlay2.opened = true;
      runAfterOpen(overlay3, () => {
        assert.lengthOf(
            document.querySelectorAll('arc-overlay-backdrop'),
            1,
            'only one backdrop element in the DOM');
        done();
      });
    });

    it('arc-overlay-backdrop is removed from the DOM when all overlays with backdrop are closed', (done) => {
      // Open & close them all.
      overlay1.opened = true;
      overlay2.opened = true;
      runAfterOpen(overlay3, () => {
        overlay1.opened = false;
        overlay2.opened = false;
        runAfterClose(overlay3, () => {
          assert.lengthOf(
              document.querySelectorAll('arc-overlay-backdrop'),
              0,
              'backdrop element removed from the DOM');
          done();
        });
      });
    });

    it('newest overlay appear on top', (done) => {
      runAfterOpen(overlay1, () => {
        runAfterOpen(overlay2, () => {
          const style1Z = parseInt(window.getComputedStyle(overlay1).zIndex, 10);
          const style2Z = parseInt(window.getComputedStyle(overlay2).zIndex, 10);
          const bgStyleZ = parseInt(
              window.getComputedStyle(overlay1.backdropElement).zIndex, 10);
          assert.isAbove(style2Z, style1Z, 'overlay2 above overlay1');
          assert.isAbove(style2Z, bgStyleZ, 'overlay2 above backdrop');
          assert.isBelow(style1Z, bgStyleZ, 'overlay1 below backdrop');
          done();
        });
      });
    });

    it('updating with-backdrop updates z-index', (done) => {
      runAfterOpen(overlay1, () => {
        runAfterOpen(overlay2, () => {
          overlay2.withBackdrop = false;
          const style1Z = parseInt(window.getComputedStyle(overlay1).zIndex, 10);
          const style2Z = parseInt(window.getComputedStyle(overlay2).zIndex, 10);
          const bgStyleZ = parseInt(
              window.getComputedStyle(overlay1.backdropElement).zIndex, 10);
          assert.isAbove(style2Z, bgStyleZ, 'overlay2 above backdrop');
          assert.isAbove(style1Z, bgStyleZ, 'overlay1 below backdrop');
          done();
        });
      });
    });

    it('click event handled only by top overlay', (done) => {
      runAfterOpen(overlay1, () => {
        runAfterOpen(overlay2, () => {
          const btn = overlay2.querySelector('button');
          btn.addEventListener('click', () => {
            overlay2.close();
          });
          tap(btn);
          assert.isFalse(overlay2.opened, 'overlay2 closed');
          assert.isTrue(overlay1.opened, 'overlay1 opened');
          done();
        });
      });
    });
  });

  describe('overlay in composed tree', () => {
    let composed;
    let overlay;
    let trigger;

    beforeEach((done) => {
      composedFixture().then((el) => {
        composed = el;
        overlay = composed.shadowRoot.querySelector('#overlay');
        trigger = composed.shadowRoot.querySelector('#trigger');
        // @ts-ignore
        overlay.withBackdrop = true;
        overlay.addEventListener('overlay-opened', () => {
          done();
        });
        tap(trigger);
      });
    });

    it('click on overlay content does not close it', (done) => {
      // Tap on button inside overlay.
      tap(overlay.querySelector('button'));
      setTimeout(() => {
        assert.isTrue(overlay.opened, 'overlay still opened');
        done();
      }, 1);
    });

    it('with-backdrop wraps the focus within the overlay', (done) => {
      // 1ms timeout needed by IE10 to have proper focus switching.
      setTimeout(() => {
        const buttons = overlay.querySelectorAll('button');
        // Go to last element.
        buttons[buttons.length - 1].focus();
        // Spy keydown.
        const tabSpy = sinon.spy();
        document.addEventListener('keydown', tabSpy);
        // Simulate TAB.
        // @ts-ignore
        pressAndReleaseKeyOn(document, 9, '', 'Tab');
        assert.equal(
            buttons[0],
            ArcOverlayManager.deepActiveElement,
            'focus wrapped to first focusable');
        assert.isTrue(tabSpy.calledOnce, 'keydown spy called');
        assert.isTrue(
            tabSpy.getCall(0).args[0].defaultPrevented,
            'keydown default prevented');
        // Simulate Shift+TAB.
        // @ts-ignore
        pressAndReleaseKeyOn(document, 9, ['shift'], 'Tab');
        assert.equal(
            buttons[buttons.length - 1],
            ArcOverlayManager.deepActiveElement,
            'focus wrapped to last focusable');
        assert.isTrue(tabSpy.calledTwice, 'keydown spy called again');
        assert.isTrue(
            tabSpy.getCall(1).args[0].defaultPrevented,
            'keydown default prevented again');
        // Cleanup.
        document.removeEventListener('keydown', tabSpy);
        done();
      }, 1);
    });
  });

  describe('always-on-top', () => {
    let overlay1;
    let overlay2;

    beforeEach(async () => {
      overlay1 = await multipleFixture();
      overlay2 = overlay1.nextElementSibling;
      overlay1.alwaysOnTop = true;
      await nextFrame();
    });

    it('stays on top', (done) => {
      runAfterOpen(overlay1, () => {
        runAfterOpen(overlay2, () => {
          const zIndex1 = parseInt(window.getComputedStyle(overlay1).zIndex, 10);
          const zIndex2 = parseInt(window.getComputedStyle(overlay2).zIndex, 10);
          assert.isAbove(zIndex1, zIndex2, 'overlay1 on top');
          assert.equal(
              ArcOverlayManager.currentOverlay(), overlay1, 'currentOverlay ok');
          done();
        });
      });
    });

    it('stays on top also if another overlay is with-backdrop', (done) => {
      overlay2.withBackdrop = true;
      runAfterOpen(overlay1, () => {
        runAfterOpen(overlay2, () => {
          const zIndex1 = parseInt(window.getComputedStyle(overlay1).zIndex, 10);
          const zIndex2 = parseInt(window.getComputedStyle(overlay2).zIndex, 10);
          assert.isAbove(zIndex1, zIndex2, 'overlay1 on top');
          assert.equal(
              ArcOverlayManager.currentOverlay(), overlay1, 'currentOverlay ok');
          done();
        });
      });
    });

    it('last overlay with always-on-top wins', (done) => {
      overlay2.alwaysOnTop = true;
      runAfterOpen(overlay1, () => {
        runAfterOpen(overlay2, () => {
          const zIndex1 = parseInt(window.getComputedStyle(overlay1).zIndex, 10);
          const zIndex2 = parseInt(window.getComputedStyle(overlay2).zIndex, 10);
          assert.isAbove(zIndex2, zIndex1, 'overlay2 on top');
          assert.equal(
              ArcOverlayManager.currentOverlay(), overlay2, 'currentOverlay ok');
          done();
        });
      });
    });
  });

  describe('animations', () => {
    let overlay;
    beforeEach(async () => {
      overlay = await basicFixture();
      overlay.animated = true;
      await nextFrame();
    });

    it('overlay animations correctly triggered', (done) => {
      overlay.addEventListener('simple-overlay-open-animation-start', () => {
        // Since animated overlay will transition center + 300px to center,
        // we should not find the element at the center when the open animation
        // starts.
        const centerElement = document.elementFromPoint(
            window.innerWidth / 2, window.innerHeight / 2);
        assert.notEqual(
            centerElement, overlay, 'overlay should not be centered already');
        done();
      });
      overlay.open();
    });

    it('overlay detached before opening animation is done', (done) => {
      // Test will fail if `done` is called more than once.
      runAfterOpen(overlay, () => {
        assert.equal(overlay.style.display, '', 'overlay displayed');
        assert.notEqual(overlay.style.zIndex, '', 'z-index ok');
        done();
      });
      // After some time, but before the animation is completed...
      setTimeout(() => {
        // Animation is not done yet, but we remove the overlay already.
        overlay.parentNode.removeChild(overlay);
      }, 50);
    });

    it('overlay detached before closing animation is done', (done) => {
      runAfterOpen(overlay, () => {
        // Test will fail if `done` is called more than once.
        runAfterClose(overlay, () => {
          assert.equal(overlay.style.display, 'none', 'overlay hidden');
          assert.equal(overlay.style.zIndex, '', 'z-index reset');
          done();
        });
        // After some time, but before the animation is completed...
        setTimeout(() => {
          // Animation is not done yet, but we remove the overlay already.
          overlay.parentNode.removeChild(overlay);
        }, 50);
      });
    });
  });

  describe('onopenedchanged', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Getter returns previously registered handler', () => {
      assert.isUndefined(element.onopenedchanged);
      const f = () => {};
      element.onopenedchanged = f;
      assert.isTrue(element.onopenedchanged === f);
    });

    it('Calls registered function', () => {
      let called = false;
      const f = () => {
        called = true;
      };
      element.onopenedchanged = f;
      element.opened = true;
      element.onopenedchanged = null;
      assert.isTrue(called);
    });

    it('Unregisteres old function', () => {
      let called1 = false;
      let called2 = false;
      const f1 = () => {
        called1 = true;
      };
      const f2 = () => {
        called2 = true;
      };
      element.onopenedchanged = f1;
      element.onopenedchanged = f2;
      element.opened = true;
      element.onopenedchanged = null;
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });

  describe('onoverlaycanceled', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Getter returns previously registered handler', () => {
      assert.isUndefined(element.onoverlaycanceled);
      const f = () => {};
      element.onoverlaycanceled = f;
      assert.isTrue(element.onoverlaycanceled === f);
    });

    it('Calls registered function', () => {
      let called = false;
      const f = () => {
        called = true;
      };
      element.onoverlaycanceled = f;
      element.cancel();
      element.onoverlaycanceled = null;
      assert.isTrue(called);
    });

    it('Unregisteres old function', () => {
      let called1 = false;
      let called2 = false;
      const f1 = () => {
        called1 = true;
      };
      const f2 = () => {
        called2 = true;
      };
      element.onoverlaycanceled = f1;
      element.onoverlaycanceled = f2;
      element.cancel();
      element.onoverlaycanceled = null;
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });

  describe('onoverlayopened', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Getter returns previously registered handler', () => {
      assert.isUndefined(element.onoverlayopened);
      const f = () => {};
      element.onoverlayopened = f;
      assert.isTrue(element.onoverlayopened === f);
    });

    it('Calls registered function', () => {
      let called = false;
      const f = () => {
        called = true;
      };
      element.onoverlayopened = f;
      element._finishRenderOpened();
      element.onoverlayopened = null;
      assert.isTrue(called);
    });

    it('Unregisteres old function', () => {
      let called1 = false;
      let called2 = false;
      const f1 = () => {
        called1 = true;
      };
      const f2 = () => {
        called2 = true;
      };
      element.onoverlayopened = f1;
      element.onoverlayopened = f2;
      element._finishRenderOpened();
      element.onoverlayopened = null;
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });

  describe('onopened', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Getter returns previously registered handler', () => {
      assert.isUndefined(element.onopened);
      const f = () => {};
      element.onopened = f;
      assert.isTrue(element.onopened === f);
    });

    it('Calls registered function', () => {
      let called = false;
      const f = () => {
        called = true;
      };
      element.onopened = f;
      element._finishRenderOpened();
      element.onopened = null;
      assert.isTrue(called);
    });

    it('Unregisteres old function', () => {
      let called1 = false;
      let called2 = false;
      const f1 = () => {
        called1 = true;
      };
      const f2 = () => {
        called2 = true;
      };
      element.onopened = f1;
      element.onopened = f2;
      element._finishRenderOpened();
      element.onopened = null;
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });

  describe('onoverlayclosed', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Getter returns previously registered handler', () => {
      assert.isUndefined(element.onoverlayclosed);
      const f = () => {};
      element.onoverlayclosed = f;
      assert.isTrue(element.onoverlayclosed === f);
    });

    it('Calls registered function', () => {
      let called = false;
      const f = () => {
        called = true;
      };
      element.onoverlayclosed = f;
      element._finishRenderClosed();
      element.onoverlayclosed = null;
      assert.isTrue(called);
    });

    it('Unregisteres old function', () => {
      let called1 = false;
      let called2 = false;
      const f1 = () => {
        called1 = true;
      };
      const f2 = () => {
        called2 = true;
      };
      element.onoverlayclosed = f1;
      element.onoverlayclosed = f2;
      element._finishRenderClosed();
      element.onoverlayclosed = null;
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });

  describe('onclosed', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Getter returns previously registered handler', () => {
      assert.isUndefined(element.onclosed);
      const f = () => {};
      element.onclosed = f;
      assert.isTrue(element.onclosed === f);
    });

    it('Calls registered function', () => {
      let called = false;
      const f = () => {
        called = true;
      };
      element.onclosed = f;
      element._finishRenderClosed();
      element.onclosed = null;
      assert.isTrue(called);
    });

    it('Unregisteres old function', () => {
      let called1 = false;
      let called2 = false;
      const f1 = () => {
        called1 = true;
      };
      const f2 = () => {
        called2 = true;
      };
      element.onclosed = f1;
      element.onclosed = f2;
      element._finishRenderClosed();
      element.onclosed = null;
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });

  describe('oncancel', () => {
    let element;
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Calls registered function', () => {
      let called = false;
      const f = () => {
        called = true;
      };
      element.oncancel = f;
      element.cancel();
      element.oncancel = null;
      assert.isTrue(called);
    });

    it('Unregisteres old function', () => {
      let called1 = false;
      let called2 = false;
      const f1 = () => {
        called1 = true;
      };
      const f2 = () => {
        called2 = true;
      };
      element.oncancel = f1;
      element.oncancel = f2;
      element.cancel();
      element.oncancel = null;
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });

  describe('a11y', () => {
    it('overlay has aria-hidden=true when opened', async () => {
      const overlay = await basicFixture();
      assert.equal(
          overlay.getAttribute('aria-hidden'),
          'true',
          'overlay has aria-hidden="true"');
      overlay.open();
      assert.isFalse(
          overlay.hasAttribute('aria-hidden'),
          'overlay does not have aria-hidden attribute');
      overlay.close();
      assert.equal(
          overlay.getAttribute('aria-hidden'),
          'true',
          'overlay has aria-hidden="true"');
    });
  });
});
