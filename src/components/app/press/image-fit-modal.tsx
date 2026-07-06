'use client';
// Crop / approve dialog. Steps through every source image so each one can be
// framed independently: pick Cover / Contain / Stretch, zoom, and drag to
// reposition the crop, then Next → the next image, or Approve to commit all.
// The chosen fit / zoom / offset are written per source-page index and applied
// by the imposition engine exactly as previewed.
import { useEffect, useRef, useState } from 'react';
import { useFocusTrap } from './use-focus-trap';

export interface ImageFit { fit: 'cover' | 'contain' | 'stretch'; zoom: number; offsetX: number; offsetY: number; }
export type FitMap = Record<number, ImageFit>;

export function ImageFitModal({ thumbs, index = 0, cellWIn, cellHIn, values, fallback, onApply, onClose }: {
  thumbs: string[];
  index?: number;
  cellWIn: number; cellHIn: number;
  values: FitMap;
  fallback: ImageFit;
  onApply: (values: FitMap) => void;
  onClose: () => void;
}) {
  const trap = useFocusTrap<HTMLDivElement>(onClose);
  const [idx, setIdx] = useState(Math.min(index, Math.max(0, thumbs.length - 1)));
  const [map, setMap] = useState<FitMap>(values);
  const [img, setImg] = useState<{ w: number; h: number } | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const thumb = thumbs[idx] || '';
  const cur = map[idx] ?? fallback;
  const { fit, zoom, offsetX: ox, offsetY: oy } = cur;

  // Merge a patch into the CURRENT image's fit only.
  const patch = (p: Partial<ImageFit>) =>
    setMap((m) => ({ ...m, [idx]: { ...(m[idx] ?? fallback), ...p } }));

  // Switching mode applies it live. Contain/Stretch reset zoom & centre so the
  // mode visibly does its job; you can zoom again afterwards.
  const chooseFit = (f: ImageFit['fit']) =>
    patch(f === 'cover' ? { fit: f } : { fit: f, zoom: 1, offsetX: 0.5, offsetY: 0.5 });

  // Frame sized to the cell's aspect ratio.
  const FRAME_W = 320;
  const frameH = Math.max(120, Math.min(460, (FRAME_W * cellHIn) / cellWIn));

  useEffect(() => {
    setImg(null);
    if (!thumb) return;
    const im = new Image();
    im.onload = () => setImg({ w: im.naturalWidth, h: im.naturalHeight });
    im.src = thumb;
  }, [thumb]);

  // Cover/contain scale of the image inside the frame.
  let iw = FRAME_W, ih = frameH;
  if (img) {
    const base = fit === 'contain' ? Math.min(FRAME_W / img.w, frameH / img.h)
      : fit === 'stretch' ? 1 : Math.max(FRAME_W / img.w, frameH / img.h);
    if (fit === 'stretch') { iw = FRAME_W; ih = frameH; }
    else { const s = base * zoom; iw = img.w * s; ih = img.h * s; }
  }
  const left = fit === 'stretch' ? 0 : (FRAME_W - iw) * ox;
  const top = fit === 'stretch' ? 0 : (frameH - ih) * oy;

  const onDown = (e: React.PointerEvent) => {
    if (fit === 'stretch') return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox, oy };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    const spanX = iw - FRAME_W, spanY = ih - frameH;
    const nx = spanX > 0 ? Math.min(1, Math.max(0, drag.current.ox + dx / spanX)) : ox;
    const ny = spanY > 0 ? Math.min(1, Math.max(0, drag.current.oy + dy / spanY)) : oy;
    if (nx !== ox || ny !== oy) patch({ offsetX: nx, offsetY: ny });
  };
  const onUp = () => { drag.current = null; };

  const last = idx >= thumbs.length - 1;
  const multi = thumbs.length > 1;

  return (
    <div className="pe-lib-backdrop" style={{ zIndex: 200 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={trap} className="pe-modal" role="dialog" aria-modal="true" aria-label="Adjust image fit" style={{ maxWidth: 420, padding: 20 }}>
        <div className="pe-row" style={{ marginBottom: 12 }}>
          <b style={{ flex: 1 }}>Adjust image fit{multi ? ` · ${idx + 1} of ${thumbs.length}` : ''}</b>
          <div className="pe-segrow">
            {(['cover', 'contain', 'stretch'] as const).map((m) => (
              <button key={m} className={fit === m ? 'pe-on' : ''} onClick={() => chooseFit(m)} style={{ textTransform: 'capitalize' }}>{m}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div style={{ width: FRAME_W, height: frameH, position: 'relative', overflow: 'hidden', background: '#fff',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, cursor: fit === 'stretch' ? 'default' : 'grab', touchAction: 'none' }}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb} alt="" draggable={false}
              style={{ position: 'absolute', left, top, width: iw, height: ih, userSelect: 'none' }} />
            {/* trim frame overlay */}
            <div style={{ position: 'absolute', inset: 0, boxShadow: '0 0 0 1px rgba(124,108,246,0.9) inset', pointerEvents: 'none' }} />
          </div>
        </div>
        <div className="pe-row" style={{ gap: 8, marginBottom: 8 }}>
          <span className="pe-label-sm" style={{ width: 44 }}>Zoom</span>
          <input type="range" className="pe-slider" min={1} max={4} step={0.01} value={zoom} disabled={fit === 'stretch'}
            onChange={(e) => patch({ zoom: +e.target.value })} style={{ flex: 1 }} />
          <span className="pe-label-sm pe-mono" style={{ width: 40, textAlign: 'right' }}>{zoom.toFixed(2)}×</span>
        </div>
        <div className="pe-note" style={{ marginBottom: 12 }}>
          {fit === 'stretch' ? 'Stretch distorts the image to fill the cell.' : 'Drag the image to reposition the crop.'} Cell is {cellWIn}×{cellHIn}″.
        </div>
        <div className="pe-row" style={{ gap: 8, alignItems: 'center' }}>
          {multi && (
            <>
              <button className="pe-btn" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))} aria-label="Previous image">‹ Prev</button>
              <button className="pe-btn" disabled={last} onClick={() => setIdx((i) => Math.min(thumbs.length - 1, i + 1))} aria-label="Next image">Next ›</button>
            </>
          )}
          <span style={{ flex: 1 }} />
          <button className="pe-btn" onClick={() => patch({ fit: 'cover', zoom: 1, offsetX: 0.5, offsetY: 0.5 })}>Reset</button>
          <button className="pe-btn" onClick={onClose}>Cancel</button>
          <button className="pe-btn pe-btn-dl" onClick={() => onApply(map)}>Approve</button>
        </div>
      </div>
    </div>
  );
}
