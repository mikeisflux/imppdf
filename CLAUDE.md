# ImpositionPDF — project rules

## Divinity Box — INVARIANTS, DO NOT CHANGE

These are production requirements from the shop's UV workflow (Epson X600).
Breaking any of them produces files the RIP rejects or prints wrong.

1. **Spot channel names are exactly `W1` (white) and `V1` (varnish).**
   Never rename, reorder, or drop them. The RIP reads channels by these names.
2. **Channel order is fixed: R, G, B, (transparency), W1, V1.**
   The RIP only reads RGB + W + V; the transparency slot must be NAMED
   (see `photoshopChannelNames`) or Photoshop shifts the spot names off by one
   (W1 becomes "V1", V1 becomes "Alpha 3").
3. **W1/V1 are SPOT channels** (Photoshop DisplayInfo resource 1007, kind=2),
   not anonymous alpha channels. **Both channel colors are BLACK
   100,100,100,100 — never white, yellow, or anything else.**
4. **TIFF format: 8-bit RGB (Photometric 2), uncompressed, interleaved.**
   NEVER Separated/CMYK (Photometric 5) — that is "unsupported color space"
   in Photoshop and the RIP.
5. **White (W1) and varnish (V1) print ONLY where the artwork has ink**
   (alpha > 0). No flooding. Empty panels, panel gaps, the non-printable
   flap ("panel E"), and transparent areas around logos get NO white, NO
   varnish, NO color — the black box shows through.
6. **Spot-channel polarity is INVERTED (Photoshop layer-mask style):
   0/black = 100% ink, 255/white = no ink.** The shop builds these by
   filling a layer mask with 100,100,100,100 black over the art and naming
   the channel W1/V1. Storing 255-at-art (uninverted) reads backwards and
   dumps white/varnish onto every empty space. Applies to BOTH W1 and V1.
   **And W1/V1 mirror the artwork's alpha EXACTLY — "treat it like any
   other image."** No thresholds, no contour tracing, no reprocessing:
   opaque art = solid 100% ink, edges keep the image's own anti-aliasing
   (identical to the RGB edges), transparent = nothing. Re-thresholding
   the alpha stair-steps soft/upscaled edges ("pixelated my logo").
   Ink AMOUNT on press is set in the RIP (density/Percent/layers), not by
   the file. ONE permitted exception: the seam guard snaps alpha ≥250→255
   and ≤5→0, and the pdf.js render translate is integer-rounded — browser
   canvas tile seams otherwise leave ~250-254 alpha rows inside solid art
   that print as horizontal lines in the white ("tons of lines"). Never
   widen that guard into a mid-range threshold. Owner-requested BLACK
   KNOCKOUT (`blackSwathKeepMask`, default ON) also scales alpha down so
   the substrate shows and no ink is wasted, but ONLY for **large swaths
   of black** (connected regions ≥2% of the panel by default). Blacks on
   the character, line art, shadows and bounded background elements are
   NEVER knocked out; MobileSAM (`subjectMask`) additionally shields the
   subject so a black costume can't be read as background. Within a
   qualifying swath it is a smooth luminance RAMP (full at ≤10, none at
   ≥34), never a hard threshold, so edges stay anti-aliased.
7. **Geometry (owner spec, 2026-07-21, supersedes the New_Box_Full template
   PDF and the press-compensation experiments): sheet 306 × 572 mm = trim
   300 × 572 + 3 mm bleed LEFT+RIGHT. Folds are 5 mm WIDE zones centered at
   47.5 / 260 / 310 / 525 mm (top = 0)** → zones 45–50, 257.5–262.5,
   307.5–312.5, 522.5–527.5. Sections: A 0–45, B 50–257.5, C 262.5–307.5,
   D 312.5–522.5, E 527.5–572 no-print. **Every section's art carries 3 mm
   bleed on TOP and BOTTOM too** (into the fold zones; adjacent bleeds
   overlap ~1 mm at fold centers — TIFF composite is a UNION of opaque
   pixels so one panel's transparent edge never erases a neighbor's
   bleed; A's top is the sheet edge, no bleed above 0). No crop, cut,
   registration, or fold marks on the artwork. Fold ticks default OFF.
8. **The white plate is choked 3 px** (`DBOX_WHITE_CHOKE_PX`) inside the art
   edges so misregistration never shows a white halo. Color/alpha keep full
   extent.
9. **Rasterize each panel with a SINGLE direct pdf.js render into the
   panel-sized canvas (centering transform).** Never render-then-drawImage-crop:
   that flattens alpha to opaque in some canvas engines and floods W1 white.
10. **File resolution default 300 dpi.** The X600's 720×1440 is the head/RIP
   screening resolution, not the file's.

## Fiery Booklet — DO NOT EDIT FUNCTIONALITY

`fieryBooklet` outputs SINGLE pages (never joined spreads); it only trims the
spine-side bleed per page (p1 right, p2 right, p3 left, alternating). This is
by explicit owner instruction — do not "fix" it to combine pages.

## General

- All N-up tools default to 1 column × 1 row unless the tool is specifically
  designed otherwise, and default image fit is CONTAIN (never crop/stretch).
  EXCEPTION (owner): **Divinity Trading Cards** is 2×4 and STRETCHES the art to
  the cell. The cell is the card's set size — 2.5 × 3.5" plus 2 mm on each
  dimension, so 90.9 × 65.5 laid sideways. **There is NO BLEED and nothing is
  drawn outside a cell**, so every gutter is real white paper you can measure
  and both chains close on the sheet exactly. To make the card bigger, GROW THE
  CELL AND TAKE THE DIFFERENCE BACK OUT OF THE GUTTERS (an outer margin pays
  once, an interior gutter twice) — that keeps the cards in the same positions.
  Never do it by overflowing the cells instead: this template's gutters are
  measured in tenths, and an earlier build that grew each cell 1.5 mm on all
  four sides put 3 mm of ink into a 0.5 mm row gap, overlapped the rows, and
  made the row settings do nothing visible on the sheet.
  EXCEPTION (owner): **30-Up Proof Labels** defaults to 1×1-overriding 3×10 AND
  to STRETCH — the die-cut label cell is the target size, so the art fills the
  cell instead of sitting proportionally inside it. It also defaults to
  `trimArt` (crop the upload to its artwork) because label art is exported from
  a template at full sheet size.
- **Nothing from Divinity Trading Cards comes out LANDSCAPE** (owner). The
  doubled stocks are reasoned about landscape — two blocks side by side with the
  guillotine cut between them — and the finished PAGE is then stood up a quarter
  turn, so 11×17 is 279.4×431.8 and A3 is 297×420. Do this by pushing ONE
  transformation matrix (`0 1 -1 0 pageW 0`) before anything is drawn, so the
  flood, the cards and the marks are all carried round together and no gutter or
  cell changes. Never re-lay the block to fit a portrait sheet, and never do it
  with a `/Rotate` on the page dictionary — that is metadata a RIP may ignore.
- **The shop's cutter is a SLITTER, not a camera plotter** — a 2102-F
  "multifunctional card cutting machine", straight full-width cuts only, with
  exactly two modes on the panel: **frontal** (index off the paper's leading
  edge, cut at programmed distances — no mark) and **mark**. Mark mode is ONE
  optical eye at the throat that sees paper, then black, and indexes every cut
  off that step, so what it reads is a single black BAR on the leading edge. Four
  corner marks are for a camera machine and this will not see them. (The corner
  shapes remain in the code for a future camera cutter; `bar` is the default on
  the mark stock.)
- The Divinity Cards **`letterreg`** stock is the mark-mode test sheet: same
  eight cards and the same cell, block centred ACROSS (A=C 12.8), but the head
  margin is NOT centred — D is `REG_HEAD_MM` (bar inset + bar depth + the gap to
  its pad) so the blade never lands on the mark. **That head is 7.5** — owner's
  figure off the machine, and exactly bar inset 3 + bar 3 + pad 1.5, so the pad's
  trailing edge and the first cut are flush. An earlier build derived 11 from the
  Akiles/Formax "first cut 5 mm past the mark" rule; that is not this machine and
  it both wasted paper and still crowded the art. It is a separate stock so
  the proven `letter` template (A 16.5 / C 9.1 / D 4.75 / H 11.25, measured off
  the machine) is never disturbed — do not add marks to `letter` by moving its
  block; its 4.75 head cannot clear a bar. Marks are drawn LAST on a white pad,
  so the eye still sees a clean paper-to-black step with the background flood on.
  Bar length, depth, inset and feed edge are all settable. The rule that matters
  for the FILE is that the bar plus its pad clears the first cut; anything beyond
  that is wasted paper, so do not build in a nominal gap from another maker's
  spec sheet.
- **The cutter steps ONE CONSTANT PITCH and the file must step the same.** It is
  a slitter: it advances card-length + gutter per row and repeats, so E, F and G
  have to be equal and equal to the machine's programmed gutter (3). Unequal row
  gutters cannot describe what it does and the disagreement COMPOUNDS — a file
  stepping 65.5 / 66.2 / 66.2 against a machine stepping 68.5 put the blade
  7.6 mm into the art by row 4. The panel warns when the three differ.
  **Never derive the gutters by measuring its output.** The 0 / 0.7 / 0.7 set
  came from measuring cut sheets, but what was being measured was the drift
  between file and machine, not any gutter the machine cut — feeding it back in
  chases a moving target and never settles. Build the file FROM the machine's
  program (leading margin, card length, gutter) instead.
- **The machine is locked to A4 and the shop only has Letter.** It is programmed
  with a 7.6 leading margin and 5 rows; on a Letter sheet four rows come out and
  it then tries a fifth that is not there. Five rows inside A4 with a 3 mm gutter
  forces its card length to about 54, which does NOT match the 65.5 cell here —
  unresolved, pending photographs of its menus.
- Never assume how many items fit a sheet: always run the fit calculation
  accounting for margins, gutters, crop marks, and bleed before placing.
- If rotating an item 90° lets more fit, rotate it.
- Replicate fills the SELECTED sheet size — never grow or swap the sheet.
