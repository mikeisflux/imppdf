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
   not anonymous alpha channels. **Both channel colours are BLACK
   100,100,100,100 — never white, yellow, or anything else.**
4. **TIFF format: 8-bit RGB (Photometric 2), uncompressed, interleaved.**
   NEVER Separated/CMYK (Photometric 5) — that is "unsupported color space"
   in Photoshop and the RIP.
5. **White (W1) and varnish (V1) print ONLY where the artwork has ink**
   (alpha > 0). No flooding. Empty panels, panel gaps, the non-printable
   flap ("panel E"), and transparent areas around logos get NO white, NO
   varnish, NO colour — the black box shows through.
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
   widen that guard into a mid-range threshold.
7. **Geometry (owner spec, 2026-07-21, supersedes the New_Box_Full template
   PDF and the press-compensation experiments): sheet 306 × 572 mm = trim
   300 × 572 + 3 mm bleed LEFT+RIGHT. Folds are 5 mm WIDE zones centred at
   47.5 / 260 / 310 / 525 mm (top = 0)** → zones 45–50, 257.5–262.5,
   307.5–312.5, 522.5–527.5. Sections: A 0–45, B 50–257.5, C 262.5–307.5,
   D 312.5–522.5, E 527.5–572 no-print. **Every section's art carries 3 mm
   bleed on TOP and BOTTOM too** (into the fold zones; adjacent bleeds
   overlap ~1 mm at fold centres — TIFF composite is a UNION of opaque
   pixels so one panel's transparent edge never erases a neighbour's
   bleed; A's top is the sheet edge, no bleed above 0). No crop, cut,
   registration, or fold marks on the artwork. Fold ticks default OFF.
8. **The white plate is choked 3 px** (`DBOX_WHITE_CHOKE_PX`) inside the art
   edges so misregistration never shows a white halo. Colour/alpha keep full
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
- Never assume how many items fit a sheet: always run the fit calculation
  accounting for margins, gutters, crop marks, and bleed before placing.
- If rotating an item 90° lets more fit, rotate it.
- Replicate fills the SELECTED sheet size — never grow or swap the sheet.
