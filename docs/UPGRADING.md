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

1. **Replace the plugin folder.** Overwrite `impose.ts`, `Impose.tsx`, `impose.css`,
   `catalog.ts` and `pdfjs-worker-url.d.ts` in `src/lib/imposition-toolkit/` with the
   new version (copy every `src/*` file the plugin ships).
   - Re-add `'use client';` as the first line of `Impose.tsx` (Next.js App Router needs
     it because the component uses `useState`, `Blob`, `document`).
   - Keep the named export `AdminImpose` (or update the import in `AppWorkspace.tsx`).
   - **Re-apply the `initialTool` patch** so tool tiles can deep-link into a specific
     tool's workspace. Change the `AdminImpose` signature and its first `useState`:
     ```diff
     -export function AdminImpose() {
     -  const [activeTool, setActiveTool] = useState<string | null>(null);
     +export function AdminImpose({ initialTool }: { initialTool?: string | null } = {}) {
     +  const [activeTool, setActiveTool] = useState<string | null>(initialTool ?? null);
     ```
     If the new plugin already accepts an initial-tool prop, use that instead and update
     `AppWorkspace.tsx`. If plugin tool ids change, update `SLUG_TO_PLUGIN_ID` in `tools.ts`.
   - **Re-apply the real-artwork preview patch** so the imposition canvas shows the actual
     PDF pages (not numbered colour blocks). `src/lib/imposition-toolkit/page-thumbs.ts` is
     ours and survives upgrades; re-wire these three hooks in the new `Impose.tsx`:
     1. `import { rasterizePdfThumbs } from './page-thumbs';` near the other imports.
     2. In `ToolWorkspace`, add `const [pageThumbs, setPageThumbs] = useState<string[]>([]);`
        plus a `useEffect` on `[file]` that calls `rasterizePdfThumbs(file.bytes)` and stores
        the result, and pass `pageThumbs={pageThumbs}` into `<ImpositionCanvas/>`.
     3. In `ImpositionCanvas`, accept `pageThumbs?: string[]` and render each cell with
        `img={c.blank ? undefined : pageThumbs?.[c.n - 1]}`. In `Cell`, when `img` is set,
        draw an `<image preserveAspectRatio="xMidYMid slice" clipPath=…>` with a small page
        badge; otherwise keep the numbered-block fallback.
     If a future plugin renders real thumbnails itself, drop this patch.
   - **Dependencies:** the plugin uses `pdf-lib` (required), `qrcode-generator` and
     `pdfjs-dist` (optional — rasterization/preview). `pdfjs-dist` is already installed,
     listed in `serverExternalPackages`, and `next.config.mjs` has a webpack rule so the
     plugin's Vite-style `?url` pdf.js worker import resolves. If a future version adds
     another optional peer dep, `npm install` it and add it to `serverExternalPackages`
     if it is server-touching.

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
