import { fixture, assert, html } from '@open-wc/testing';

import './test-overlay.js';

describe('Attributes compatibility', function() {
  // with-backdrop
  it('Sets legacy with-backdrop in the template from a variable', async () => {
    const el = await fixture(html`<test-overlay ?with-backdrop="${true}"></test-overlay>`);
    assert.isTrue(el.withBackdrop);
  });

  it('Sets legacy with-backdrop in the template from a literal', async () => {
    const el = await fixture(html`<test-overlay with-backdrop></test-overlay>`);
    assert.isTrue(el.withBackdrop);
  });

  it('Gets legacy _oldWithBackdrop', async () => {
    const el = await fixture(html`<test-overlay ?with-backdrop="${true}"></test-overlay>`);
    assert.isTrue(el._oldWithBackdrop);
  });

  // no-auto-focus
  it('Sets legacy no-auto-focus in the template from a variable', async () => {
    const el = await fixture(html`<test-overlay ?no-auto-focus="${true}"></test-overlay>`);
    assert.isTrue(el.noAutoFocus);
  });

  it('Sets legacy no-auto-focus in the template from a literal', async () => {
    const el = await fixture(html`<test-overlay no-auto-focus></test-overlay>`);
    assert.isTrue(el.noAutoFocus);
  });

  it('Gets legacy _oldNoAutoFocus', async () => {
    const el = await fixture(html`<test-overlay no-auto-focus></test-overlay>`);
    assert.isTrue(el._oldNoAutoFocus);
  });

  // no-cancel-on-esc-key
  it('Sets legacy no-cancel-on-esc-key in the template from a variable', async () => {
    const el = await fixture(html`<test-overlay ?no-cancel-on-esc-key="${true}"></test-overlay>`);
    assert.isTrue(el.noCancelOnEscKey);
  });

  it('Sets legacy no-cancel-on-esc-key in the template from a literal', async () => {
    const el = await fixture(html`<test-overlay no-cancel-on-esc-key></test-overlay>`);
    assert.isTrue(el.noCancelOnEscKey);
  });

  it('Gets legacy _oldNoCancelOnEscKey', async () => {
    const el = await fixture(html`<test-overlay no-cancel-on-esc-key></test-overlay>`);
    assert.isTrue(el._oldNoCancelOnEscKey);
  });

  // no-cancel-on-outside-click
  it('Sets legacy no-cancel-on-outside-click in the template from a variable', async () => {
    const el = await fixture(html`<test-overlay ?no-cancel-on-outside-click="${true}"></test-overlay>`);
    assert.isTrue(el.noCancelOnOutsideClick);
  });

  it('Sets legacy no-cancel-on-outside-click in the template from a literal', async () => {
    const el = await fixture(html`<test-overlay no-cancel-on-outside-click></test-overlay>`);
    assert.isTrue(el.noCancelOnOutsideClick);
  });

  it('Gets legacy _oldNoCancelOnOutsideClick', async () => {
    const el = await fixture(html`<test-overlay no-cancel-on-outside-click></test-overlay>`);
    assert.isTrue(el._oldNoCancelOnOutsideClick);
  });

  // restore-focus-on-close
  it('Sets legacy restore-focus-on-close in the template from a variable', async () => {
    const el = await fixture(html`<test-overlay ?restore-focus-on-close="${true}"></test-overlay>`);
    assert.isTrue(el.restoreFocusOnClose);
  });

  it('Sets legacy restore-focus-on-close in the template from a literal', async () => {
    const el = await fixture(html`<test-overlay restore-focus-on-close></test-overlay>`);
    assert.isTrue(el.restoreFocusOnClose);
  });

  it('Gets legacy _oldRestoreFocusOnClose', async () => {
    const el = await fixture(html`<test-overlay restore-focus-on-close></test-overlay>`);
    assert.isTrue(el._oldRestoreFocusOnClose);
  });

  // allow-click-through
  it('Sets legacy allow-click-through in the template from a variable', async () => {
    const el = await fixture(html`<test-overlay ?allow-click-through="${true}"></test-overlay>`);
    assert.isTrue(el.allowClickThrough);
  });

  it('Sets legacy allow-click-through in the template from a literal', async () => {
    const el = await fixture(html`<test-overlay allow-click-through></test-overlay>`);
    assert.isTrue(el.allowClickThrough);
  });

  it('Gets legacy _oldAllowClickThrough', async () => {
    const el = await fixture(html`<test-overlay allow-click-through></test-overlay>`);
    assert.isTrue(el._oldAllowClickThrough);
  });

  // always-on-top
  it('Sets legacy always-on-top in the template from a variable', async () => {
    const el = await fixture(html`<test-overlay ?always-on-top="${true}"></test-overlay>`);
    assert.isTrue(el.alwaysOnTop);
  });

  it('Sets legacy always-on-top in the template from a literal', async () => {
    const el = await fixture(html`<test-overlay always-on-top></test-overlay>`);
    assert.isTrue(el.alwaysOnTop);
  });

  it('Gets legacy _oldAlwaysOnTop', async () => {
    const el = await fixture(html`<test-overlay always-on-top></test-overlay>`);
    assert.isTrue(el._oldAlwaysOnTop);
  });

  // scroll-action
  it('Sets legacy scroll-action in the template from a variable', async () => {
    const value = 'lock';
    const el = await fixture(html`<test-overlay .scroll-action="${value}"></test-overlay>`);
    assert.equal(el.scrollAction, value);
  });

  it('Sets legacy scroll-action in the template from a literal', async () => {
    const el = await fixture(html`<test-overlay scroll-action="lock"></test-overlay>`);
    assert.equal(el.scrollAction, 'lock');
  });

  it('Gets legacy scroll-action', async () => {
    const el = await fixture(html`<test-overlay scroll-action="lock"></test-overlay>`);
    assert.equal(el['scroll-action'], 'lock');
  });

  it('Gets legacy _oldScrollAction', async () => {
    const el = await fixture(html`<test-overlay scroll-action="lock"></test-overlay>`);
    assert.equal(el._oldScrollAction, 'lock');
  });
});
