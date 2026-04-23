import OscdEditorSource from '@omicronenergy/oscd-editor-source';
import OscdMenuSldAutoLayout from '../dist/oscd-menu-sld-auto-layout.js';

customElements.define('oscd-editor-source', OscdEditorSource);
customElements.define('oscd-menu-sld-auto-layout', OscdMenuSldAutoLayout);

export const plugins = {
  menu: [
    {
      name: 'Auto layout SLD',
      translations: {
        de: 'SLD automatisch layouten',
      },
      icon: 'account_tree',
      requireDoc: true,
      tagName: 'oscd-menu-sld-auto-layout',
    },
  ],
  editor: [
    {
      name: 'Source Editor',
      translations: { de: 'Source Editor' },
      icon: 'code',
      requireDoc: true,
      tagName: 'oscd-editor-source',
    },
  ],
  background: [],
};