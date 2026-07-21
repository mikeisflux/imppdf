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
   not anonymous alpha channels. W1 chip = white, V1 chip = yellow.
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
   **And the fill is SOLID/BINARY (`DBOX_SPOT_MIN_A`): 100% ink wherever
   art alpha ≥ threshold, none below.** Never scale spot ink by alpha —
   proportional ink starves the white at anti-aliased edges and soft art
   ("not putting down enough white").
7. **The box is borderless with zero bleed. No crop, cut, registration, or
   fold marks on the artwork.** Fold ticks default OFF.
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
