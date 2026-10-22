import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdTextButton } from '@omicronenergy/oscd-ui/button/OscdTextButton.js';
import { OscdCheckbox } from '@omicronenergy/oscd-ui/checkbox/OscdCheckbox.js';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { LitElement } from 'lit';
declare const OscdMenuCopySldv1Sldpriv_base: typeof LitElement & import("@open-wc/dedupe-mixin").Constructor<import("@open-wc/scoped-elements/types.js").ScopedElementsHost> & import("@open-wc/scoped-elements/types.js").ScopedElementsHostConstructor;
export default class OscdMenuCopySldv1Sldpriv extends OscdMenuCopySldv1Sldpriv_base {
    static scopedElements: {
        'oscd-dialog': typeof OscdDialog;
        'oscd-checkbox': typeof OscdCheckbox;
        'oscd-text-button': typeof OscdTextButton;
        'oscd-filled-button': typeof OscdFilledButton;
    };
    doc?: XMLDocument;
    docVersion: number;
    private plan?;
    private overwrite;
    private result;
    private dialog?;
    private snapshot?;
    run(): Promise<void>;
    private handleOverwrite;
    private handleCopy;
    private isStale;
    render(): import("lit-html").TemplateResult<1>;
    static styles: import("lit").CSSResult;
}
export {};
