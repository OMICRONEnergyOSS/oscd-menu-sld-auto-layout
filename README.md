# oscd-menu-sld-auto-layout

Menu plugin for OpenSCD and `oscd-shell` that generates a first-pass zero-line single line diagram layout for existing `Substation` sections.

The plugin is intended as a starting point for documents that already contain primary plant data but do not yet contain SLD coordinates.

## Behavior

- Substations are laid out as vertical stacks of voltage levels.
- Each voltage level contains a single row of bays.
- Each bay uses three conceptual columns: one IED column and two conducting-equipment columns.
- IED scope allocation follows the old OpenSCD zeroline `attachedIeds` logic.
- Direct non-bay primary equipment under `VoltageLevel` or `Substation` is also placed in a second pass so transformer-heavy models still get a usable starting layout.

## Install

```sh
npm install @omicronenergy/oscd-menu-sld-auto-layout
```

## Register in oscd-shell

```js
import OscdMenuSldAutoLayout from '@omicronenergy/oscd-menu-sld-auto-layout';

customElements.define('oscd-menu-sld-auto-layout', OscdMenuSldAutoLayout);

export const plugins = {
  menu: [
    {
      name: 'Auto layout SLD',
      translations: { de: 'SLD automatisch layouten' },
      icon: 'account_tree',
      requireDoc: true,
      tagName: 'oscd-menu-sld-auto-layout',
    },
  ],
  editor: [],
  background: [],
};
```

## Development

```sh
npm run compile
npm test
npm run start
```

The local demo preloads a sample SCL file and exposes this menu plugin together with the Source Editor so the generated layout data can be inspected directly.