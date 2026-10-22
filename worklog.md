# Worklog

## Goal and agreed scope

Bring this beta OpenSCD menu plugin into line with the shared project
conventions, current libraries, and `@omicronenergy/oscd-tooling`, then review
the plugin implementation in a separate iteration.

The work is split into two categories:

1. **Project structure:** modernize the existing project and make its current
   behavior buildable, testable, publishable, and deployable.
2. **Plugin coding issues:** review and harden the layout implementation after
   the modernized project baseline is established.

Iteration 1 preserves existing plugin behavior. Only source changes required
for compatibility with the updated libraries, tooling, or shared lint rules
belong in that iteration. Behavioral fixes, algorithm changes, and
performance optimization belong in iteration 2.

Git staging, commits, and remote writes remain owner-controlled.

## Initial assessment - 2026-10-07

The repository already uses strict TypeScript, explicit `.js` relative
imports, `@openscd/scl-lib`, and EditV2 events from `@openscd/oscd-api`.
The nonvisual menu entry point extends `HTMLElement`; adding Lit or scoped
UI components to it is not required.

There was no existing root worklog or `.github` workflow setup.

### Observed baseline

- Restored the existing lockfile with
  `npm ci --ignore-scripts --no-audit --no-fund --loglevel=error`.
- `npm run build` succeeds.
- `npm test` passes the two existing browser integration tests.
- The ESLint portion of the current lint script reports three errors:
  `no-useless-constructor` and `no-empty-function` in `autolayout.ts`,
  and demo dependency classification for the scoped registry polyfill.
- The current Web Test Runner default Chrome launcher pulls in
  `puppeteer-core`. The target browser-test setup is shared Playwright tooling,
  not Puppeteer.
- An npm pack dry run includes compiled specs and their declarations/maps
  because the package publishes all of `dist`.
- No tracked files were changed during the initial assessment.

Build success and the two passing tests do not establish deployed-demo
compatibility, full SCL schema validity, or safe handling of existing layouts.

## Iteration 1 - Project structure

**Status:** repository-side modernization complete. Live deployment and npm
publication await owner-side setup and execution; plugin coding review remains
deferred.

## Step Status

- Step 1 - Source/configuration and dependencies/shared tooling: done.
- Step 2 - Demo, packaging, release, and deployment configuration: done locally;
  live publishing/deployment not executed.
- Step 3 - Plugin coding review (iteration 2): deferred.
- Step 4 - Independent SLDv1 copier and coordinate cleaner: done locally.
- Step 5 - Label-aware auto-layout spacing: done locally.
- Step 6 - Coordinate-tools package and positioner rename: done locally.

## Step 6 Completion Summary

### Files created / transformed

- `package.json` and `package-lock.json` — package identity changed to
  `@omicronenergy/oscd-menu-coord-tools`; the default and named exports now
  point to the SLD positioner.
- `src/oscd-menu-sld-positioner.ts` and
  `src/oscd-menu-sld-positioner.spec.ts` — renamed the former auto-layout
  entry point and spec; custom element registration and menu action title now
  use the positioner name.
- `rollup.config.js`, `demo/index.html`, and `demo/plugins.js` — bundle input,
  demo title/import/registration, and menu entry use the new plugin filename,
  tag, and “Auto-position SLD elements” label.
- `README.md` — package installation/import examples, plugin registry example,
  repository and deployment references, and project description now use the
  coordinate-tools and positioner names.
- `worklog.md` — recorded the owner’s naming decision and this implementation
  summary. The current checkout directory is
  `/home/steren00/code/stee-re/oscd-menu-sld-coord-tools`.

### Verification

- `npm install --ignore-scripts --no-audit --no-fund --loglevel=error` —
  passed; lockfile metadata refreshed.
- `npx tsc --noEmit` — passed.
- `npm run build` — passed.
- `npm test` — passed; 8 test files, 61 tests.
- `git diff --check` — passed.

### Decision points applied

- The package/repository identity is `oscd-menu-coord-tools`; the layout
  plugin entry point and custom element tag are `oscd-menu-sld-positioner`.
  Configured GitHub and Pages URLs assume the corresponding GitHub repository
  rename; no Git remote or GitHub repository setting was changed here.

## Step 5 Completion Summary

### Files created / transformed

- `src/foundation/sld-editor-foundations.ts` isolates the editor 1.0.0 default
  typography and stored-label-to-rendered-text offsets. Its sibling spec checks
  those conventions. Replace this compatibility boundary when public editor
  geometry exports become available; do not embed an interactive editor.
- `src/foundation/layout-geometry.ts` measures native SVG text after loading the
  font, caches each name/font-size result per invocation, and reserves rounded
  footprints for symbols, labels and clearance. Temporary measurement SVGs are
  removed immediately, including on errors. Its sibling spec covers proportional
  names, caching, rendered bounds, zoom independence and conservative envelopes.
- `src/foundation/autolayout.ts` uses variable IED pitches, IED/equipment column
  widths and row heights, and grows container bounds. IED labels are underneath;
  transformer labels move slightly farther above their windings. Classification,
  reference handling and EditBuilder remain unchanged.
- `src/foundation/autolayout.spec.ts` covers deterministic reservations, source
  preservation and undo, and renders the public SLD viewer to check actual
  symbol/text nonintersection at two zoom levels with mixed, conducting-only
  and IED-only layouts across all supported scopes.
- `src/oscd-menu-sld-auto-layout.ts` awaits font preparation before planning and
  rejects a document switch. Its sibling spec retains scope checks and adds
  label-placement, single-transaction, undo/redo and document-switch coverage.
- `README.md` documents adaptive spacing, the extension schema, centralized
  assumptions and first-pass-layout limitations.

### Issues found during rendered verification (all fixed)

1. **Scaled canvas metrics underestimated text:** measuring at 100px then
   scaling down missed native SVG glyph rounding. Native-size canvas bounds
   still missed SVG descender overhang. Measurement now uses SVG text with the
   same explicit font and central baseline as the renderer, and conservatively
   reserves vertical overhang on both sides of that baseline.
2. **Transformer label overlapped its own windings:** the previous label
   position was too close to the symbol. The label is moved up half a grid unit
   and the footprint includes the extra space.

### Decision points applied

- The SLD format authority is
  https://github.com/openscd/oscd-extensions, specifically
  `SSD/SLD/v0/ssd-sld-v0.xsd` (reviewed at file SHA
  `19566bdd2de09962aa00c3eec706c326bfcbbee4`). Namespace, qualified attributes,
  Private layout contents and grid-unit storage were checked against it.
  The editor supplies rendering conventions, not a competing storage format.
- No `docVersion` guard: planning reads the current document after the font
  await, so same-document edits cannot stale an earlier plan. The identity
  guard prevents unexpectedly laying out a different file.
- No public typography settings, generic occupancy manager, hidden editor
  instance, new dependencies, formatting commands or Git writes.

### Known legacy bugs preserved (flagged for review)

- This is row/column placement, not general obstacle avoidance. Existing wires,
  free Text, manual obstacles, custom fonts and unusual transformer decorations
  are not guaranteed collision-free.
- The previously deferred classifier/XML issues remain deferred; this change
  does not claim complete SCL XSD validity or repair existing layouts' wiring.
- The public viewer does not draw direct Substation ConductingEquipment
  symbols; their planned reservations and labels are covered, but no viewer
  behavior was changed.

### Verification

- `npx tsc --noEmit`, `npm run build`, `npm test`, `npm run lint`,
  `npm run bundle`: passed. Shared Playwright suite: 57 tests across seven
  spec files. Bundle retains existing upstream circular-dependency warnings.
- `npm pack --dry-run --ignore-scripts --json`: passed; 19 intended files,
  all three exports and new foundation JS/types present, no specs, demo,
  source maps or worksheet.
- Shared browser tests cover actual SVG bounds, not browser-pixel placement
  estimates. No full SCL XSD validation or large-document benchmark was run.
- Existing coordinate-tool changes were preserved. This worksheet remains
  owner-local and must not be staged or committed.

## Step 4 Completion Summary

### Files created / transformed

- `src/foundation/coordinate-systems.ts` detects SLDv1, SLD Private and SXY,
  plans non-destructive forward copies, and plans selective coordinate removal.
  Plans do not mutate the live document. Its sibling spec covers namespace
  decoys, zero/negative values, prefixed SCL, prefix collisions, both IED
  representations, connectivity sections, conflicts, duplicates, vendor
  preservation, QName references, idempotence, and undo/redo.
- `src/oscd-menu-copy-sldv1-sldpriv.ts` and its sibling spec implement a scoped
  Lit/oscd-ui confirmation dialog with one overwrite-all/skip-all checkbox,
  diagnostic reporting, and document/version invalidation.
- `src/oscd-menu-sld-coords-cleaner.ts` and its sibling spec implement three
  detected-system checkboxes, initially unchecked; removing all detected
  systems requires a separately unchecked acknowledgment. Selection changes
  reset acknowledgment. Successful removal closes the dialog. Checkboxes
  cannot shrink when long warning text wraps.
- `package.json` / `package-lock.json` add direct runtime UI, scoped-elements,
  localization and Lit dependencies, and typed exports for both new plugins.
- `rollup.config.js` extends the shared configuration with two additional
  independent single-file browser entry points; shared tool plugins and demo
  configuration remain in use.
- `demo/index.html` / `demo/plugins.js` register and expose both new menus.
- `README.md` documents conflict/removal semantics, registration and package
  exports; its deploy description now matches the owner's bundle-first script.

### Decision points applied

- No automatic synchronization. The copier retains all SLDv1 source data.
- One global conflict choice, including already-identical destination records:
  unchecked skips every existing record, checked overwrites every matching
  record. Destination-only attributes remain; connectivity paths are copied
  or replaced as a complete set.
- Direct root IED coordinates require exactly one Substation. Missing/duplicate
  IED targets, competing legacy placements, duplicate destination sections and
  unsupported source data block the entire copy with diagnostics.
- Cleaner detection uses URI, not prefix. SXY URI is
  `http://www.iec.ch/61850/2003/SCLcoordinates`; ABB vendor SLD data is separate.
  Removal preserves unselected systems and vendor data. Unrelated content mixed
  inside a selected layout section blocks removal rather than being discarded.
- Unused selected namespace declarations are removed; QName-valued metadata
  keeps required declarations. This avoids leaving an unused legacy namespace
  that alone can trigger the editor's old-format detection.
- Each invocation dispatches one EditV2 transaction. A changed document or
  version invalidates pending confirmation.
- Reverse copying, SXY conversion, changes to the editor's migration gate, and
  the deferred auto-layout algorithm review remain out of scope.
- The owner committed modernization separately as `0d99b85`. Coordinate-tool
  changes remain unstaged. This worksheet is intentionally not for committing.

### Issues found during verification

1. **Duplicate test polyfill loading:** explicit scoped-registry imports in the
   new specs reloaded the polyfill already injected by shared tooling, leaving
   child tags unupgraded. Removing those imports fixed it. No Lit support import
   or custom test-runner configuration was added.
2. **XML attribute order after undo:** removal/undo can reorder attributes
   without changing XML meaning; undo assertions compare DOM structure.
3. **Prefixed SCL helpers:** scl-lib ordering and identity dispatch on tagName.
   Detached prefix-free views preserve helper use without modifying live XML.
4. **Checkbox compression:** flex layout shrank the long all-removal warning's
   checkbox. `flex: none` fixes it; a narrow-label browser test checks its width
   matches the other checkboxes.

### Verification

- `npm install --ignore-scripts --no-audit --no-fund`: passed after manifest
  changes; regenerated the lockfile without changing Git hook configuration.
- `npx tsc --noEmit`, `npm test`, `npm run lint`, `npm run bundle`: passed.
  Final shared Playwright suite: 45 tests across four spec files, including
  the two original auto-layout tests. No formatting command was run.
- `npm run start:bundle`: used the standard harness at its reported port 8002.
  Playwright clicks exercised overwrite, source retention, all-system cleanup
  acknowledgment, shell transaction history, docVersion propagation and undo.
  The harness and browser were stopped afterward.
- The bundled demo check also exposed an unrelated Source Editor Ace XML worker
  error: `/demo/ace/worker-xml.js` failed to load. Coordinate action assertions
  passed, but the final blanket no-runtime-errors assertion failed because of
  this worker. No Source Editor fix or error-suppression workaround was added.
  The owner also manually tested the new tools and confirmed their behavior.
- `npm run build` and `npm pack --dry-run --ignore-scripts --json`: passed;
  15 intended files, all three JS/type exports present, no tests, demo, maps,
  stale shared chunks, or worksheet. Earlier experimental shared chunks were
  removed by their explicit generated filenames because of tooling's known
  cleanup bug.
- Full SCL XSD validation and large-document performance benchmarks were not
  run. Structural tests cover Private insertion ordering and namespace-safe
  XML round-tripping; they are not a claim of complete schema validation.
- No deployment, publication, staging or commit was performed for Step 4.

## Step 2 Completion Summary

### Files created / transformed

- `package.json` adds typed exports, targeted JS/declaration publication rules,
  public publishing configuration, canonical repository metadata, and
  `deploy: oscd deploy`. No `prepublishOnly` hook was added.
- `package-lock.json` was regenerated after the owner removed it and
  `node_modules`; a subsequent clean install succeeds.
- `.github/workflows/test.yml` calls the shared unit workflow on pushes,
  PRs, and manual dispatch, with read-only repository permissions.
- `.github/workflows/continuous-deployment.yml` calls the shared bundle/deploy
  workflow on `main` and manual dispatch, with repository write permission.
- `.github/workflows/release-please.yml` calls the shared release workflow,
  granting repository/PR/issue writes and OIDC publishing permission.
- `release-please-config.json` configures node releases, pre-1.0 version
  increments, and changelog sections; `.release-please-manifest.json` begins
  at package version `0.0.0`.
- `README.md` documents actual demo startup, coordinate compatibility,
  development versus bundled serving, intended Pages URLs, manual publication,
  workflow behavior, and owner-side configuration.

### Decision points applied

- Canonical identity is `OMICRONEnergyOSS/oscd-menu-sld-auto-layout`, explicitly
  confirmed by the owner. The personal-fork Git remote is unchanged.
- The old-coordinate SLD deployment remains
  `https://stee-re.github.io/oscd-editor-sld-temp/oscd-editor-sld.js`.
  Resolving the reproducibility task means documenting this compatibility
  exception, not claiming the live URL is immutable or lockfile-pinned.
- The npm SLD dependency and commented import/registration remain intentionally
  available for a future migration, as requested. The active demo does not
  import both editor versions.
- No `prepublishOnly` script: the shared release workflow builds before
  publishing; manual publishers must build explicitly.
- Shared workflow requirements were checked against current upstream sources:
  `build`, `lint`, `test`, and `bundle` scripts exist; tooling supplies the
  gh-pages binaries; Playwright 1.59.1 matches the test container. The common
  setup uses Node 24.

### Verification

- `npm install --no-audit --no-fund --loglevel=error`: passed after the owner's
  dependency/lockfile deletion; shared hook installation succeeds.
- `npm ci --no-audit --no-fund --loglevel=error`: passed with the regenerated
  lockfile.
- `npm run lint`, `npx --no-install tsc --noEmit`, `npm test`,
  `npm run build`, and `npm run bundle`: passed; both original tests remain
  green under Playwright.
- `npm pack --dry-run --ignore-scripts --json`: nine intended files, comprising
  metadata/license/README and the entry/foundation JS and declarations.
  Assertions confirm exported paths exist and no tests, maps, demo files,
  assets, or snapshots enter the package.
- Inline Node assertions parse all workflow YAML, check reusable workflow
  references and required scripts, and match the release manifest version
  to `package.json`. These are local configuration checks, not a GitHub
  Actions execution.
- Static HTTP serving of the bundled demo, without WDS/npm resolution, passes
  Playwright smoke checks: the temporary remote SLD editor loads, all four
  file-menu classes upgrade, source editor is registered, the standalone
  plugin imports, and running auto layout creates 17 layout elements.
  Startup without a document also passes.
- The source demo served with WDS/npm resolution also creates 17 layout
  elements without runtime errors.
- All temporary servers and Playwright browsers used for these checks were
  stopped. No publishing, deploy, staging, commit, or remote-write command
  was run.

### Known limitations and owner-side setup

- Published tooling 0.0.6 remains affected by the quoted cleanup glob on Linux.
  Known generated artifacts were removed explicitly before inspecting clean
  npm and bundle output; no local tooling workaround was installed.
- The remote SLD deployment remains a network-dependent compatibility
  exception; graphical/coordinate correctness is not asserted by the smoke
  checks. Plugin coding concerns remain in iteration 2.
- GitHub Pages, Actions permissions, and npm organization/trusted-publisher
  setup are documented, not changed or verified remotely. The first live
  deployment/release remains an owner action.
- Branch-based Pages builds may not trigger from `GITHUB_TOKEN` pushes.
  Follow the documented approved-token or shared Pages-artifact alternative.
- npm trusted publishing uses the calling `release-please.yml` identity;
  configure it in the canonical repo and check the first real publication.
  Initial package publication may require an authorized maintainer bootstrap.

## Step 1 Completion Summary

### Compatibility issues found during validation (all fixed)

1. **Stale ESLint peer resolution:** updating the original dependency tree left
   ESLint 7 resolving beneath a current lint plugin. `npm dedupe` corrected
   the dependency tree; a subsequent clean install and shared lint run pass.
2. **Unupgraded demo plugins:** shell 0.0.17 uses a scoped plugin registry.
   Global registration left the menu element without its `run()` method.
   The demo now registers the menu and source-editor classes in
   `editor.registry` before assigning plugins. The README registration example
   uses the same current host contract.

### Files transformed

- `src/oscd-menu-sld-auto-layout.ts` and its sibling spec replace the root
  entry point/spec; relative foundation imports follow the new layout.
- `src/foundation/autolayout.ts` and `layout-util.ts` replace the root
  utility modules. Layout algorithms and existing test assertions are preserved.
- `tsconfig.json` extends the shared base, with project-relative `outDir`,
  `rootDir`, and `include`, matching the reference plugins.
- `package.json` and `package-lock.json` use published tooling 0.0.6 and
  current retained dependencies. Local toolchain dependencies and embedded
  ESLint/Prettier configuration were removed.
- Root Rollup, Web Test Runner, and dev-server configs were deleted; shared
  defaults provide compilation, bundling, Playwright tests, and servers.
- `demo/index.html`, `demo/plugins.js`, and `README.md` reflect scoped host
  registration and shared development commands.
- `.githooks/pre-commit` and `.githooks/commit-msg` were generated by the
  approved shared installer. Local `core.hooksPath` is `.githooks`.

### Library replacements and conventions

- Test `XMLEditor` now comes from `@openscd/oscd-editor` 1.8.0.
- `@open-wc/testing` 5.0.0 is the current published version and passes the
  existing tests, despite the reference plugin/tooling still declaring 4.x.
- Shell/source editor and the registry polyfill are runtime dependencies,
  following the reference plugin's demo dependency convention; `lit` and
  test helpers are direct dev dependencies. `tslib` is explicit for shared
  TypeScript helper emission.
- Shared lint required explicit control-flow braces and parentheses around
  arrow parameters with block bodies. These were changed manually without
  algorithm changes or formatting-tool execution; the obsolete test lint
  suppression was removed.
- `compile` remains a compatibility alias for the shared build command.
  No Custom Elements Manifest generation was introduced.

### Verification

- `npm install --ignore-scripts --no-audit --no-fund --loglevel=error` and
  `npm dedupe --ignore-scripts --no-audit --no-fund --loglevel=error`: passed.
- `npm ci --no-audit --no-fund --loglevel=error`: passed, including the
  approved `prepare` hook installer.
- `git config --get core.hooksPath`: returned `.githooks`.
- `npx --no-install tsc --noEmit`, `npm run lint`, `npm run build`,
  and `npm run bundle`: passed.
- `npm test`: both original tests pass using shared Playwright Chromium.
- `npm run start` and `npm run start:bundle`: both servers became responsive
  on their reported port, 8004; both were stopped after checks.
- Playwright smoke checks of both demos loaded `sample.scd`, upgraded the
  menu plugin, registered the source editor, loaded the selected remote SLD
  editor, and executed the menu action, producing 17 layout attribute elements
  without runtime errors. These are loading/action checks, not graphical
  correctness assertions.
- Initial smoke checks used an occupied default port, then exposed the scoped
  registration issue on the correct port. The final checks use the server's
  reported port and pass.
- `npm ls --depth=0`: all retained direct dependencies resolve successfully.
- Puppeteer still exists transitively through WTR's bundled Chrome launcher;
  it is not used by this project's configured tests or smoke checks.

### Known issues preserved and remaining scope

- All iteration 2 layout concerns remain intentionally unchanged.
- The SLD editor still loads from its existing live remote URL; reproducibility
  remains a later demo task.
- Package file exclusions, typed exports, release metadata, shared workflows,
  and remote publishing/deployment remain pending.
- Staging and commits remain owner-controlled; no staging or history commands
  were run. Git configuration was changed only through the approved installer.

## Step 1 Checklist

### Source and configuration

- [x] Move the plugin entry point and TypeScript source into `src/`.
- [x] Organize layout logic/helpers under `src/foundation/`, keeping tests
      colocated and preserving behavior.
- [x] Update imports, test paths, demo references, and configuration together.
- [x] Extend the shared tooling TypeScript configuration, retaining local
      `rootDir`, `outDir`, and `include`.
- [x] Remove duplicated local Rollup, Web Test Runner, and dev-server configs
      unless a demonstrated project-specific requirement needs an override.

### Dependencies and shared tooling

- [x] Update all retained dependencies to current published versions by
      default, using recently modernized plugins such as `oscd-menu-commons`
      as the reference baseline. Retain an older version only for a
      demonstrated incompatibility, recorded here.
- [x] Adopt a published `@omicronenergy/oscd-tooling` dependency, not a local
      filesystem reference.
- [x] Replace local tool scripts with shared `oscd` commands, including
      separate `build` and `bundle` scripts.
- [x] Remove development tool dependencies owned by `oscd-tooling`, along with
      obsolete embedded ESLint/Prettier configuration.
- [x] Classify runtime, test, and demo dependencies by their actual consumers
      and shared conventions; keep every direct import explicitly declared.
- [x] Remove unused runtime dependencies; `lit` is currently only directly
      imported by tests.
- [x] Align test transaction handling with the current XML editor package
      namespace, `@openscd/oscd-editor`.
- [x] Use the shared Playwright test configuration rather than the old default
      Chrome launcher.
- [x] Regenerate the lockfile and resolve compatibility/lint issues introduced
      or exposed by the modern stack without changing plugin semantics.
- [x] Set up shared Git hooks only with approval for any Git configuration
      writes. Do not run formatting-only tools without an explicit request.

Published versions observed on 2026-10-07, for reference rather than permanent
pins: `@omicronenergy/oscd-tooling` 0.0.6, `@openscd/oscd-api` 0.1.6,
`@openscd/scl-lib` 2.0.1, `@openscd/oscd-editor` 1.8.0,
`@omicronenergy/oscd-shell` 0.0.17, and
`@omicronenergy/oscd-editor-source` 0.0.5.

The upstream `oscd-menu-commons` manifest checked on 2026-10-07 uses tooling
`^0.0.6`, shell `^0.0.17`, and `@open-wc/testing` `^4.0.0`. Use its shared
tooling setup as prior art, not as a wholesale dependency list: it still
declares both the old and current API namespaces, and includes packages this
plugin does not need.

### Demo, packaging, and deployment

- [x] Update the demo host and source editor to the aligned dependency stack.
- [x] Resolve the demo SLD dependency policy: retain the temporary old-coordinate
      deployment as an explicitly documented compatibility exception; keep
      the npm editor available for a future migration.
- [x] Verify development and bundled demo loading and execution of the menu
      action with the SLD and source editors.
- [x] Add typed package exports and targeted publication file rules that
      exclude compiled tests and other non-package artifacts.
- [x] Add repository/package metadata and public publishing configuration.
- [x] Add callers for shared `OMICRONEnergyOSS/oscd-gh-workflows` unit-test,
      continuous-deployment, and release workflows.
- [x] Add the release-please configuration and manifest required by the shared
      release workflow.
- [x] Check the shared workflows' actual command/dependency requirements
      against the published tooling package.
- [x] Identify and document owner-side setup: canonical repository identity,
      workflow permissions, Pages deployment branch, npm publishing access,
      and trusted-publisher configuration.
- [x] Update README commands, installation instructions, deployment URL, and
      handoff guidance to match the finished setup.

### Acceptance checks

- [x] A clean dependency install works with the updated lockfile (not yet committed).
- [x] Shared lint, TypeScript build, bundle, and Playwright tests pass.
- [x] Existing placement assertions retain their expected results.
- [x] Both development and bundled demos load and execute the menu action.
- [x] An npm pack dry run contains the intended modules and declarations,
      without test artifacts.
- [x] The browser-deployable entry resolves without bare package imports.
- [x] Workflow callers and release files satisfy the checked shared workflow
      contract locally.
- [ ] Verify live publishing/deployment after owner-side setup and approval.
- [x] Record completed work, exact checks, and any remaining limitations here.

## Iteration 2 - Plugin coding issues

**Status:** deferred until iteration 1 is complete and separately agreed.

These are source-review concerns, not confirmed browser reproductions.
Review each with focused regression tests before deciding on a fix.

| Concern | Evidence from the initial source | Review objective |
| --- | --- | --- |
| Existing-layout cleanup | `autolayout.ts:413-426` removes an old layout `Private` based on its original child count, although the edit batch may also insert layout attributes into it. | Check planned edit ordering and prevent loss of newly scheduled layout data. |
| Namespace prefix collisions | `autolayout.ts:320-332,627-634` falls back to `eosld` without checking whether it already belongs to another namespace. | Preserve unrelated namespace declarations and choose a safe prefix. |
| Namespace-aware element matching | `autolayout.ts:48-78` and other checks use unqualified `tagName` comparisons or only `localName`. | Support prefixed SCL and avoid selecting foreign-namespace lookalikes. |
| Rerun and overwrite semantics | Layout setters overwrite coordinates, label positions, and rotation and emit edits even when values are unchanged. | Agree whether the action fills missing layout, replaces layout, or offers a choice; assess no-op history behavior. |
| Existing IED reference reconciliation | `classifyIeds`, `createReferencePool`, and `claimReference` retain/reuse references without an explicit duplicate or unresolved-reference policy. | Establish intended preservation and reconciliation behavior. |
| Large-document performance | `autolayout.ts:198-245` repeatedly traverses document LNodes; `layout-util.ts:21-33` repeatedly scans root IEDs. | Measure representative documents and consider per-invocation indexes where warranted. |
| Coverage and domain validity | Only two initial-placement/scope-allocation tests exist. | Cover reruns, reference moves, namespace variants, undo/redo, input preservation, and applicable SCL schema constraints. |

Line references describe the pre-restructure baseline. Update them to the
new locations when iteration 2 begins.

## Decisions and progress

### 2026-10-08 - Restore coordinate-compatible demo editor

The temporary deployment reads direct Transpower-namespaced attributes, not
the OpenSCD `Private > SLDAttributes` format emitted by auto-layout. Host edit
counters were updating correctly; the editor ignored the incompatible data.
Earlier smoke checks established XML edits and editor loading, not rendered
placement, so their compatibility conclusion was insufficient.

The owner chose to restore an editor compatible with existing auto-layout
output. The demo now imports/registers the installed npm SLD editor and uses
its tagged plugin entry. README describes this active setup, superseding the
temporary-deployment decisions recorded in Step 2. No layout algorithm or
output format changed.

The owner confirmed the restored demo works. The proposed graphical browser
verification was declined after that confirmation and was not run.
The later Step 4 decision supersedes the initial migration deferral: two
independent coordinate tools were agreed and implemented without changing
auto-layout output or the editor's migration gate.

### 2026-10-07 - Separate modernization from code hardening

Agreed to tackle project structure, current dependencies, shared tooling,
and deployability first. The beta implementation's potential code smells and
behavioral defects are a separate follow-up iteration, not justification for
expanding the modernization scope.

Created this worklog as the repository's shared record. No implementation
changes have been made.

### 2026-10-07 - Default to current dependencies

Agreed to update retained dependencies directly rather than conservatively
preserving old versions without evidence. Recently modernized plugins,
particularly `oscd-menu-commons`, provide the reference stack. Validate the
result with the shared build, lint, bundle, and Playwright checks; document
any actual incompatibility instead of treating hypothetical ones as blockers.

### 2026-10-22 - Rename coordinate tools and positioner

The owner chose `oscd-menu-coord-tools` for the package/repository identity and
`oscd-menu-sld-positioner` for the layout plugin tag. Updated package metadata,
exports, entry-point filename, demo registration, documentation, and deployment
references accordingly. The GitHub repository itself was not renamed; the
configured URLs now assume that owner-side rename will be completed.
