# Upgrading the Imposition Toolkit plugin

The site is designed so the plugin can be swapped for a newer, more complete build
with minimal changes. Everything the plugin touches is isolated behind three files.

## The boundary

| File | Role |
|---|---|
| `src/lib/imposition-toolkit/` | The plugin itself (engine `impose.ts`, UI `Impose.tsx`, `impose.css`). **Drop-in replaceable.** |
| `src/components/app/AppWorkspace.tsx` | Mounts `<AdminImpose/>` and wraps it with the free-tier download gate. Framework glue — rarely needs edits. |
| `src/lib/impose-server.ts` | Maps HTTP API "steps" → engine functions for `POST /api/v1/impose`. Extend when new engine ops appear. |
| `src/lib/tools.ts` | Marketing catalog (homepage gallery, footer, `/tools/<slug>`). Drives which tools are advertised. |

## Steps to upgrade

1. **Replace the plugin folder.** Overwrite `impose.ts`, `Impose.tsx`, `impose.css`
   in `src/lib/imposition-toolkit/` with the new version.
   - Re-add `'use client';` as the first line of `Impose.tsx` (Next.js App Router needs
     it because the component uses `useState`, `Blob`, `document`).
   - Keep the named export `AdminImpose` (or update the import in `AppWorkspace.tsx`).

2. **Wire up new engine operations for the API.** If the new engine exports new
   functions, add them to `OPERATIONS` and the `applyStep` switch in
   `src/lib/impose-server.ts`. Each new `kind` becomes available to
   `POST /api/v1/impose` and is discoverable via `GET /api/v1/operations`.

3. **Turn on newly-shipped tools in the catalog.** In `src/lib/tools.ts`, flip
   `inPlugin: false → true` for any tool the new plugin now implements. That removes the
   "Coming soon" badge on the gallery/tool pages. Add brand-new tools as new entries.

4. **Rebuild & verify.**
   ```bash
   npm run build
   npm start
   # visit /app and export a file; call POST /api/v1/impose with a new step kind
   ```

## Download gating

Free-tier limits are enforced in `AppWorkspace.tsx` by intercepting the plugin's
download anchors (`<a download>`), so no change to the plugin's download code is needed.
If a future plugin downloads via a different mechanism (e.g. the File System Access API),
update the interceptor there. Server-side accounting lives in `src/lib/usage.ts` and
`/api/usage`.
