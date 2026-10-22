import { msg } from '@lit/localize';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdTextButton } from '@omicronenergy/oscd-ui/button/OscdTextButton.js';
import { OscdCheckbox } from '@omicronenergy/oscd-ui/checkbox/OscdCheckbox.js';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';
import { css, html, LitElement, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';

import { copySldV1Plan } from './foundation/coordinate-systems.js';

import type { CopyPlan } from './foundation/coordinate-systems.js';

export default class OscdMenuCopySldv1Sldpriv extends ScopedElementsMixin(LitElement) {
  static scopedElements = {
    'oscd-dialog': OscdDialog,
    'oscd-checkbox': OscdCheckbox,
    'oscd-text-button': OscdTextButton,
    'oscd-filled-button': OscdFilledButton,
  };

  @property({ attribute: false })
  doc?: XMLDocument;

  @property({ type: Number })
  docVersion = 0;

  @state()
  private plan?: CopyPlan;

  @state()
  private overwrite = false;

  @state()
  private result = '';

  @query('oscd-dialog')
  private dialog?: OscdDialog;

  private snapshot?: { doc: XMLDocument; version: number };

  async run(): Promise<void> {
    this.overwrite = false;
    this.result = '';
    this.snapshot = this.doc === undefined ? undefined : { doc: this.doc, version: this.docVersion };
    this.plan = this.doc === undefined ? undefined : copySldV1Plan(this.doc);
    await this.updateComplete;
    await this.dialog?.show();
  }

  private handleOverwrite(event: Event): void {
    if (event.target instanceof OscdCheckbox) {
      this.overwrite = event.target.checked;
    }
  }

  private handleCopy(): void {
    if (this.doc === undefined || this.isStale() || this.result !== '' ||
        this.plan === undefined || this.plan.issues.length > 0) {
      return;
    }
    const plan = copySldV1Plan(this.doc, this.overwrite);
    this.plan = plan;
    if (plan.issues.length > 0) {
      return;
    }
    if (plan.edits.length === 0) {
      this.result = msg('No changes needed. Existing destinations were left untouched.');
      return;
    }
    this.dispatchEvent(newEditEventV2(plan.edits, { title: msg('Copy SLDv1 to SLD Private') }));
    this.result = msg('Copy completed. All original SLDv1 data was retained.');
  }

  private isStale(): boolean {
    return this.snapshot !== undefined &&
      (this.snapshot.doc !== this.doc || this.snapshot.version !== this.docVersion);
  }

  render() {
    return html`<oscd-dialog>
      <div slot="headline">${msg('Copy SLDv1 to SLD Private')}</div>
      <div slot="content">
        <p>${msg('Copy old layout data without removing the source. Existing destinations are skipped unless you choose to overwrite all conflicts.')}</p>
        ${this.doc === undefined ? html`<p role="alert">${msg('Open a document first.')}</p>` : nothing}
        ${this.result !== '' ? html`<p role="status">${this.result}</p>` : nothing}
        ${this.result === '' && this.isStale() ? html`<p role="alert">${msg('The document changed. Close and reopen this plugin before copying.')}</p>` : nothing}
        ${this.plan === undefined ? nothing : html`
          <p>${msg('New layout records to copy:')} ${this.plan.copied}</p>
          ${this.plan.copied === 0 && this.plan.conflicts === 0 && this.plan.issues.length === 0
            ? html`<p>${msg('No supported SLDv1 coordinates found.')}</p>` : nothing}
          <p>${msg('Existing destination conflicts:')} ${this.plan.conflicts}</p>
          ${this.plan.issues.length > 0 ? html`
            <p role="alert">${msg('Nothing will be copied until these issues are resolved:')}</p>
            <ul>${this.plan.issues.map(issue => html`<li>${issue}</li>`)}</ul>
          ` : nothing}
          ${this.plan.conflicts > 0 && this.result === '' ? html`
            <label>
              <oscd-checkbox .checked=${this.overwrite} @change=${this.handleOverwrite}></oscd-checkbox>
              ${msg('Overwrite ALL conflicts (unchecked: skip ALL conflicts). Destination-only fields are retained.')}
            </label>
          ` : nothing}
        `}
      </div>
      <div slot="actions">
        <oscd-text-button @click=${() => this.dialog?.close()}>${this.result === '' ? msg('Cancel') : msg('Close')}</oscd-text-button>
        ${this.result !== '' ? nothing : html`
          <oscd-filled-button
            .disabled=${this.doc === undefined || this.isStale() || this.plan === undefined ||
              this.plan.issues.length > 0 || (this.plan.copied === 0 && !this.overwrite)}
            @click=${this.handleCopy}
          >${msg('Copy')}</oscd-filled-button>
        `}
      </div>
    </oscd-dialog>`;
  }

  static styles = css`
    :host { display: block; }
    label { display: flex; align-items: center; gap: 12px; }
  `;
}
