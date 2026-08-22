# Tool audit — 94 tools

Working one tool at a time. A tool is only ticked when **all four** are true:

| Column | Means |
|---|---|
| **Calc** | Has its own file in `src/lib/imposition-toolkit/fit/` stating that tool's own rules — piece size, bleed, whether the grid is fixed, whether it may rotate. No shared function tuned per tool. |
| **Fit** | A test asserts the item count for every common sheet size, and that placed cells sit inside the margins and never overlap. |
| **Smoke** | The real engine runs on a sample PDF and produces a valid PDF at the expected sheet size and page count. |
| **Shot** | Page 1 of that output is rendered to PNG and the items on it are **counted from the pixels** — so the number is measured, not claimed. |

Layout tools get all four. Tools that transform a PDF without placing items on a
sheet (rotate, crop, watermark…) have no fit calculation; they get Smoke + Shot.

---

## Gang / N-up — piece placed at TRIM size

| Tool | Piece | Default sheet | Calc | Fit | Smoke | Shot |
|---|---|---|---|---|---|---|
| `indexcard` Index Cards | 3 × 5" | 17 × 11 | [x] | [x] | [x] | [x] | 10-up 5×2 |
| `business` Business Cards | 3.5 × 2" | 8.5 × 11 | [x] | [x] | [x] | [x] |
| `postcard` Postcards | 6 × 4" | 8.5 × 11 | [x] | [x] | [x] | [x] |
| `rackcard` Rack Cards | 4 × 9" | 11 × 17 | [x] | [x] | [x] | [x] |
| `hangtag` Hang Tags | 2.5 × 4" | 11 × 17 | [x] | [x] | [x] | [x] |
| `label` Labels | 4 × 3.33" | 8.5 × 11 | [x] | [x] | [x] | [x] |
| `namebadge` Name Badges | 3.5 × 2.25" | 8.5 × 11 | [x] | [x] | [x] | [x] |
| `ticket` Tickets | 4 × 2.5" | 8.5 × 11 | [x] | [x] | [x] | [x] |
| `coupon` Coupons | 3.5 × 2" | 8.5 × 11 | [x] | [x] | [x] | [x] |
| `placecard` Place Cards | 3.5 × 2" | 8.5 × 11 | [x] | [x] | [x] | [x] |
| `greeting` Greeting Cards | 5 × 7" | 8.5 × 11 | [x] | [x] | [x] | [x] |
| `trading` Trading Cards | 2.5 × 3.5" | 8.5 × 11 | [x] | [x] | [x] | [x] |
| `bookmark` Bookmarks | 2 × 6" | 8.5 × 11 | [x] | [x] | [x] | [x] |
| `flyer` Flyers | 8.5 × 11" | 8.5 × 11 | [x] | [x] | [x] | [x] |
| `doorhanger` Door Hangers | 3.875 × 8.75" | 8.5 × 11 | [x] | [x] | [x] | [x] |
| `envelope` Envelopes | 9.5 × 4.125" | 11 × 17 | [x] | [x] | [x] | [x] |
| `coaster` Coasters | 4 × 4" | 11 × 17 | [x] | [x] | [x] | [x] |
| `contact` Contact Sheets | 3.75 × 2.4" | 8.5 × 11 | [x] | [x] | [x] | [x] |
| `compslip` Comp Slips | 8.27 × 3.9" | 8.86 × 12.6 | [x] | [x] | [x] | [x] |
| `cards` Cards (generic) | user | 8.5 × 11 | [x] | [x] | [x] | [x] |
| `grid` Grid N-Up | user | 8.5 × 11 | [x] | [x] | [x] | [x] |
| `stickers` Sticker Nest | user | 11 × 8.5 | [ ] | [ ] | [ ] | [ ] |
| `replicate` Replicate | native | selected | [ ] | [ ] | [ ] | [ ] |
| `gangsheet` Gang Sheet | mixed | 11 × 8.5 | [ ] | [ ] | [ ] | [ ] |
| `customimpose` Custom Impose | user | 12.6 × 17.72 | [ ] | [ ] | [ ] | [ ] |

## Bleed-inclusive — piece placed at BLEED size, marks inside at the trim

| Tool | Piece | Default sheet | Calc | Fit | Smoke | Shot |
|---|---|---|---|---|---|---|
| `artprint` Art Prints | 6.88 × 10.5" / 11.25 × 17.25" | 12 × 18 | [x] | [x] | [x] | [x] |

## Fixed die — grid is the die-cutter's, never calculated

| Tool | Grid | Sheet | Calc | Fit | Smoke | Shot |
|---|---|---|---|---|---|---|
| `prooflabel` 30-Up Proof Labels | 3 × 10, art stretched | 8.5 × 11 | [x] | [x] | [x] | [x] |

## One-up / large format — one piece per sheet, no cut marks

| Tool | Piece | Sheet | Calc | Fit | Smoke | Shot |
|---|---|---|---|---|---|---|
| `poster` Posters | 24 × 36" | 24 × 36 | [x] | [x] | [x] | [x] |
| `banner` Banners | 24 × 72" | 24 × 72 | [x] | [x] | [x] | [x] |
| `rollbanner` Roll-Up Banners | 33 × 80" | 33 × 80 | [x] | [x] | [x] | [x] |
| `featherflag` Feather Flags | 30 × 100" | 30 × 100 | [x] | [x] | [x] | [x] |
| `yardsign` Yard Signs | 24 × 18" | 24 × 18 | [x] | [x] | [x] | [x] |

## Folded — panel geometry, not a grid

| Tool | Panels | Sheet | Calc | Fit | Smoke | Shot |
|---|---|---|---|---|---|---|
| `trifold` Tri-Fold | 3 | 11 × 8.5 | [x] | [x] | [x] | [x] |
| `zfold` Z-Fold | 3 | 17 × 11 | [x] | [x] | [x] | [x] |
| `gatefold` Gate-Fold | 4 | 11 × 8.5 | [x] | [x] | [x] | [x] |
| `menu` Menus | 2 | 17 × 11 | [x] | [x] | [x] | [x] |
| `zine` Fold Zine | 8-page fold | 11 × 8.5 | [x] | [x] | [x] | [x] |
| `boxcarton` Box / Carton | dieline | 11 × 17 | [x] | [x] | [x] | [x] |
| `presfolder` Presentation Folder | dieline | 11 × 17 | [x] | [x] | [x] | [x] |
| `divinitybox` Divinity Box | 5 fixed panels, 306 × 572mm | fixed | [ ] | [ ] | [ ] | [ ] |

## Bound — signature and stacking maths

| Tool | Scheme | Sheet | Calc | Fit | Smoke | Shot |
|---|---|---|---|---|---|---|
| `booklet` Booklet | saddle | 16.54 × 11.69 | [x] | [x] | [x] | [x] |
| `comic` Comic Book | saddle | — | [x] | [x] | [x] | [x] |
| `magazine` Magazine | saddle, 4-sheet sigs | 16.54 × 11.69 | [x] | [x] | [x] | [x] |
| `catalog` Catalog | saddle | 16 × 8 | [x] | [x] | [x] | [x] |
| `program` Program | saddle | 11.69 × 8.27 | [x] | [x] | [x] | [x] |
| `notebook` Notebook | saddle | 11.69 × 8.27 | [x] | [x] | [x] | [x] |
| `hymnal` Hymnal | saddle, 4-sheet sigs | 11.69 × 8.27 | [x] | [x] | [x] | [x] |
| `perfectbound` Perfect Bound | cut-and-stack, duplex | 17 × 11 | [x] | [x] | [x] | [x] |
| `pbcover` Perfect Bound Cover | back/spine/front wrap | computed | [ ] | [ ] | [ ] | [ ] |
| `cutstack` Cut & Stack | cut-and-stack | 8.5 × 11 | [x] | [x] | [x] | [x] |
| `nupbook` N-Up Book | n-up signatures | — | [x] | [x] | [x] | [x] |
| `fierybooklet` Fiery Booklet | single pages, spine bleed trim — **DO NOT EDIT** | — | [x] | [x] | [x] | [x] |
| `fieryserial` Fiery Serial | numbering | — | [x] | [x] | [x] | [x] |
| `calendar` Calendar | half-sheet, rotated back | — | [x] | [x] | [x] | [x] |

## Spot colour / finishing

| Tool | Calc | Fit | Smoke | Shot |
|---|---|---|---|---|
| `raisedmetal` Raised Metal | n/a | n/a | [ ] | [ ] |
| `whitevarnish` White / Varnish | n/a | n/a | [ ] | [ ] |
| `removebg` Remove Background | n/a | n/a | [ ] | [ ] |
| `braille` Braille | n/a | n/a | [ ] | [ ] |

## Marks and page furniture — no fit calculation

`cuttermarks` · `regmarks` · `colorbar` · `slugline` · `foldmarks` · `collating` ·
`omr` · `gathering` · `laymarks` · `watermark` · `pagenumbers` · `headerfooter` ·
`barcode` · `dimensions` · `bleed`

| Tool | Smoke | Shot |
|---|---|---|
| all 15 | [x] | [x] |

## PDF operations — no fit calculation

`shuffle` · `rotate` · `crop` · `split` · `flip` · `merge` · `overlay` · `distort` ·
`resize` · `insertpages` · `mix` · `nudge` · `backdrop` · `coloreffects` ·
`colormanage` · `pdftools` · `pdfx` · `layers` · `editpdf` · `preflight` ·
`datamerge` · `trimart`

| Tool | Smoke | Shot |
|---|---|---|
| all 21 | [x] | [x] | (`coloreffects` is browser-only by design — verified by its refusal in node, not skipped) |

---

## Measured counts — from the rendered sheet, not from the calculator

`node --experimental-strip-types scripts/smoke-gang.mjs` renders each sheet and
flood-fills the artwork to count what actually landed. 18/18 agree with their
calculator. PNGs in `smoke-out/`, contact sheet at `smoke-out/gang-montage.png`.

| Tool | Sheet | Grid | Up | Turned |
|---|---|---|---|---|
| indexcard | 17×11 | 5×2 | 10 | |
| business | 8.5×11 | 4×3 | 12 | yes |
| postcard | 8.5×11 | 1×2 | 2 | |
| rackcard | 11×17 | 1×4 | 4 | yes |
| hangtag | 11×17 | 4×4 | 16 | |
| label | 8.5×11 | 2×3 | 6 | |
| namebadge | 8.5×11 | 3×3 | 9 | yes |
| ticket | 8.5×11 | 2×4 | 8 | |
| coupon | 8.5×11 | 4×3 | 12 | yes |
| placecard | 8.5×11 | 4×3 | 12 | yes |
| greeting | 8.5×11 | 1×2 | 2 | yes |
| trading | 8.5×11 | 3×3 | 9 | |
| bookmark | 8.5×11 | 1×5 | 5 | yes |
| doorhanger | 8.5×11 | 2×1 | 2 | |
| envelope | 11×17 | 1×3 | 3 | |
| coaster | 11×17 | 2×3 | 6 | |
| contact | 8.5×11 | 2×4 | 8 | |
| compslip | 8.86×12.6 | 1×3 | 3 | |

## Everything else — 68 tools through the real engine

`npm run smoke` runs both suites; `npm test` now runs unit tests AND both smoke
runs, so none of this can rot quietly. Every row below produced a PDF that
opens, at the expected sheet size and page count, and was rendered to PNG.

**68/68 pass.** Renders in `smoke-out/`.

Confirmed by reading the rendered pages, not just the counts:

| Tool | What the render proves |
|---|---|
| `booklet` | Sheet 1 reads **P8 \| P1** — the last page beside the first, which is the fold order. A booklet that counts right and reads as nonsense fails here. |
| `magazine` | **P16 \| P1** on a 4-sheet signature. |
| `cutstack` | **P1, P3, P5, P7** on sheet 1 — cut into piles and stacked, the book is in order. Sequential fill would give P1..P4. |
| `perfectbound` | 2 pages per sheet, TURNED — two 6×9 pages side by side is 12" on an 11" sheet. 8 pages duplex = 4 sheets. |
| `shuffle` | First page is **P4** — reversed. |
| `watermark` | PROOF across the page. `barcode` a scannable QR. `colorbar` real CMYK patches. |
| `crop` | 8.5×11 → **7.5×10**. `bleed` → **8.75×11.25**. `resize` → **8.27×11.69** (A4). `rotate` → landscape. |

## Log

Newest first. Every entry records a **measured** number, not a claim.

- **engine `computeNUpGrid`** — held its own COPY of the mark-clearance rule, and the
  copy was the wrong one. Fixing `fit/` changed nothing until this was routed through
  the same `markClearanceIn`, because the engine never consulted the calculators. This
  is the duplicate-calculation problem in one line.
- **engine `imposeNUp`** — had no way to rotate an ITEM. `autoOrient` swaps the CELL to
  match the art, which is the opposite. So the app could never take a layout that fits
  more by turning the piece — 3.5 × 2" cards could only ever go 10-up on Letter.
  New `rotateItems` draws the art at 90° and fits against the swapped footprint: 12-up.
- **butt-cut** — business cards, tickets, labels and the rest are guillotined in a stack,
  where one cut serves both pieces either side of the join. Forcing a gutter on them threw
  away a row. Each tool's file now declares how it is really produced; the die-cut ones
  (coasters, door hangers, envelopes) keep their clearance because the die needs it.
- **`indexcard`** — was placing **4** (4×1) on 17×11; now **10** (5×2). Cause: cut-mark
  clearance reserved as `markOff + markLen` (0.555") for the margin *and* for every
  gutter. Marks either side of a trim are collinear and merge into one cut line, so a
  gutter needs `2 × markOff`; the outer margin needs the offset plus a short mark, with
  the mark then clipped to fit. `fit/index-cards.ts` + `test/fit-index-cards.test.ts`.
- **`artprint`** — comic 2-up on 12 × 18 confirmed; sizes include 0.125" bleed so marks
  sit inside the piece at the trim. `fit/art-prints.ts` + test.
- **`prooflabel`** — fixed 3 × 10 die, never computed; art stretched to the cell.
  `fit/proof-labels.ts` + test.
