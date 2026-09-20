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
  EXCEPTION (owner): **Divinity Trading Cards** is 2×4 and STRETCHES the art.
  **The cell is the CUTTER'S programmed card, 89 × 63**, read off the 2102-F's
  own panel — near enough a 2.5 × 3.5" card (88.9 × 63.5) that the difference is
  the panel rounding to whole millimetres, but the machine's figure governs
  because the machine is what cuts. **The art is stretched to the manufacturer's
  LAYOUT SIZE, 92 × 66 (`LAYOUT_*`), and to NOTHING ELSE, EVER.** Their template
  says so in as many words: *"card size 89×63, layout size 92×66"* — 1.5 past
  the cut on every side, the same on every card and every edge, so every card is
  cropped identically. Stretching the art to any other box is a crop the owner
  did not ask for: a lopsided box (wide outside, narrow inside) pulled the
  picture a different way in each column and ran the cut into the heading on
  one side; a symmetric 8 mm box took 8 mm off every edge of every card ("that's
  not going to work"). It is drawn OUTSIDE the cells and moves NO cut line — the
  gutters still place the cuts and both chains still close on the sheet.
  **OUTSIDE the block the art's EDGE is carried across the margin to
  `OUTER_BLEED_MM` (8), clamped to the paper there** — a separate draw of the
  outermost `STREAK_MM` sliver, so a card border just comes out wider if an
  blade lands a little out. It does not move or rescale the art. Between two
  cards the same carry runs to the MIDDLE of the gap from each side (4 mm each
  into the Letter Test's 11 mm column gap), so a lateral shift up to half the
  gap shows no white on any card; where the gap is only the 3 mm groove the
  layout boxes already meet and there is nothing to carry.
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
- The Divinity Cards **`letterreg`** stock ("Letter Test" on the panel) is **the
  manufacturer's A4 template converted for Letter stock centred in a cutter that
  is hard-wired for A4.** Their drawing: layout boxes 92 × 66 at 8 mm from the A4
  edge with **10 mm between the two columns' boxes**, cut lines 89 × 63 inside
  them, **6 mm between the row cut lines**. Across, that drawing IS the blades —
  fixed hardware at **±6.5 and ±95.5 from the machine's centre line**
  (`BLADE_INNER_MM` / `BLADE_OUTER_MM`) — so a Letter sheet centred on the same
  line would meet them at 12.45 / 101.45 / 114.45 / 203.45: **B is 13, not the
  panel's 3-mm groove.** Reading the groove as the column gap is what put the
  outer blades 5 mm outside the art and the inner ones 5 mm into it — 10 mm of
  missing gap, halved. **The blade set then sits 3 mm RIGHT of centre**
  (`BLADE_OFFSET_MM`, measured off the first test cut of this template: 1.5 mm
  of white on the left column's inner edge, the right column's inner cut 3 mm
  into its art, nothing on either outer edge — only a whole-set shift does
  that). **And the inner pair are 11 apart as cut, not the 13 drawn**
  (`MACHINE_COL_GAP_MM`; blades `BLADE_INNER_MM` ±5.5 / `BLADE_OUTER_MM`
  ±94.5, the drawing's ±6.5 / ±95.5 kept as `TEMPLATE_BLADE_*`): the red
  lines on a sheet cut to 13 showed the full band on BOTH columns' inner edges
  and only the thin on-the-line half on both outer edges — inner blades a
  millimetre outside the lines, outer pair a millimetre inside, symmetric,
  i.e. the pairs 2 mm closer at the centre. The 1 mm red lines then took 1 mm
  back off the offset (red down every LEFT edge, none down the right — the
  set a millimetre left of the file; `BLADE_OFFSET_MM` is **2**). So
  **A = 15.45, B = 11, C = 11.45** (`LETTER_TEST_MARGIN_X_MM`). Lateral
  registration and blade spacing are hardware, and a test cut with the red
  lines on is exactly how they are measured; a pitch is not. **The sheet is
  held by lock rails on both sides — placement is NOT a variable** (owner), so
  every red edge is the machine and goes straight into the file.
  Down, the leading edge is the reference: **D is 6.9** — the panel's Front len
  7.6 plus `FRONT_OFFSET_MM` −0.7, the red lines showing ~0.7 along the TOP of
  all eight cards and none along the bottoms (every row early by the same
  amount: reference, not pitch) — and **E = F = G = the panel's Groove 3, pitch
  66** — NOT the template's 6. A sheet cut at 69 came back with the white
  growing row by row (none / 1.5 / 3 / 3 plus a sliver of the card above),
  which is 3 mm of pitch error compounding; the old "68.5" measurement that
  seemed to back the 6 was drift, exactly as the rule below says. H falls out
  at 11.5.
  **No mark** (owner: "not needed") — the machine runs frontal and the bar is
  OFF on every stock; it stays on the switch. **Every cut line is painted as a
  1 mm RED band (`CUT_LINE_MM`, `showCuts`) over the art, full width/height
  like the blade, hard-coded on this stock (owner). The band lies entirely
  OUTSIDE the cell with its inner edge ON the cut line** — so a blade on the
  line leaves NO red on the card, red left on a card is the blade landing
  outside the line by exactly that width (past 1 mm the carried art edge shows
  beyond it), and art missing off an edge is it landing inside. (Centred on
  the line it left 1.5 on every edge of a perfect cut, which had to be
  subtracted by eye; 3 wide it only said "some" once the error was under a
  millimetre — owner: "shrink the red down to 1mm and let's hone it in".)
  **Honing rule: read the red, put it in.** With the lock rails the sheet
  cannot move, so a red edge is the machine: red down a LEFT edge on every
  card = take that off A (and D for a TOP edge); red down a RIGHT edge = add
  it; red on BOTH sides of a card = the card is cut wider than the cell. Each stock carries its OWN
  template (`sheetDefaults`), the step stores no gutters, and switching stocks
  clears anything typed — storing one stock's numbers in the step is what made
  the Letter Test open on Letter's 17.45. The `letter` template (A 17.45 / B 3 /
  D 7.6 / E F G 3) is never disturbed by any of this.
  If the bar IS turned on: it is drawn LAST, its white pad appears ONLY when the
  black background is on (on plain paper the pad paints over the bleed and shows
  as a white band on the cut cards), bar + pad + inset is `REG_HEAD_MM` 7.5 and
  the head must clear that. Bar length, depth, inset and feed edge are settable.
- **The cutter steps ONE CONSTANT PITCH and the file must step the same.** It is
  a slitter: it advances card-length + gutter per row and repeats, so E, F and G
  have to be equal and equal to the panel's Groove (3) — on BOTH stocks; the
  manufacturer's template draws 6 and this machine does not cut 6. Unequal row
  gutters cannot describe what it does and the disagreement COMPOUNDS — a file
  stepping 65.5 / 66.2 / 66.2 against a machine stepping 68.5 put the blade
  7.6 mm into the art by row 4. The panel warns when the three differ.
  **Never derive the gutters by measuring its output.** The 0 / 0.7 / 0.7 set
  came from measuring cut sheets, but what was being measured was the drift
  between file and machine, not any gutter the machine cut — feeding it back in
  chases a moving target and never settles. Build the file FROM the machine's
  program (leading margin, card length, gutter) instead.
- **THE CUTTER'S PROGRAM IS THE SOURCE OF TRUTH**, read off its panel and mirrored
  in `MACHINE_*` in fit/divinity-cards.ts. Change these only when the machine is
  changed:
      Norm sel     Frontal  indexes off the leading edge   -> no mark
      Front len    7.6 mm   leading edge to the first cut  -> D
      Card len      63 mm   the feed direction             -> cell height
      Card       89 x 63 mm                                -> the cell
      Groove len   3.0 mm                                  -> `letter`'s B and E F G
      all four "comp" offsets +0.000; Cut pieces 0010
  **The panel does not know where its own slitting blades are** — that is
  hardware, and the manufacturer's template is the drawing of it (see the
  Letter Test above): 13 mm between the inner pair as drawn, 11 as cut, never
  the groove. Do NOT
  measure its output and feed that back in — that measures the drift between
  file and machine, not the machine.
- **`Cut pieces` on the panel is 10 and cannot be changed.** At a 63 mm card five
  rows need 334.6 mm, over Letter (279.4) AND over A4 (297), so after the eight
  that fit the machine hunts for a fifth row that cannot exist on any sheet it
  takes. It does not harm the eight — do not try to "fix" it in the file.
- Never assume how many items fit a sheet: always run the fit calculation
  accounting for margins, gutters, crop marks, and bleed before placing.
- If rotating an item 90° lets more fit, rotate it.
- Replicate fills the SELECTED sheet size — never grow or swap the sheet.
