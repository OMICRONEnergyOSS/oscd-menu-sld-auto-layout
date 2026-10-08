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

const shell = document.querySelector('oscd-shell');
shell.registry.define('oscd-menu-sld-auto-layout', OscdMenuSldAutoLayout);

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

shell.plugins = plugins;
```

The current shell uses a scoped registry. Register tagged plugins in
`shell.registry`, not the global `customElements` registry.

## Development

```sh
npm install
npm run build
npm test
npm run start
```

Source lives in `src/`, with layout logic in `src/foundation/` and the menu
integration spec beside the entry point. Build, lint, test, and
development-server commands use `@omicronenergy/oscd-tooling`; browser tests
use Playwright. `npm run compile` remains an alias for `npm run build`.

`npm install` installs shared Git hooks through the `prepare` script and sets
this repository's `core.hooksPath` to `.githooks`.

`npm run build` compiles modules into `dist/`. `npm run bundle` creates the
browser-deployable plugin and bundled demo; `npm run start:bundle` serves that
bundled demo.

The local demo preloads a sample SCL file and exposes this menu plugin together with the deployed `oscd-editor-sld` editor and the Source Editor so the generated layout can be inspected graphically and directly in XML.