'use client';
// Crop / approve dialog. When a source image doesn't match the cell's aspect,
// this lets the user preview the cover-crop, drag to reposition and zoom, then
// approve — writing imageZoom / imageOffsetX / imageOffsetY back to the step so
// the imposition engine crops exactly as previewed.
import { useEffect, useRef, useState } from 'react';
import { useFocusTrap } from './use-focus-trap';

export interface ImageFit { fit: 'cover' | 'contain' | 'stretch'; zoom: number; offsetX: number; offsetY: number; }

export function ImageFitModal({ thumb, cellWIn, cellHIn, value, onApply, onClose }: {
  thumb: string;
  cellWIn: number; cellHIn: number;
  value: ImageFit;
  onApply: (v: ImageFit) => void;
  onClose: () => void;
}) {
  const [fit, setFit] = useState<ImageFit['fit']>(value.fit || 'cover');
  const [zoom, setZoom] = useState(value.zoom || 1);
  const [ox, setOx] = useState(value.offsetX ?? 0.5);
  const [oy, setOy] = useState(value.offsetY ?? 0.5);
  const [img, setImg] = useState<{ w: number; h: number } | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const trap = useFocusTrap<HTMLDivElement>(onClose);

  // Frame sized to the cell's aspect ratio.
  const FRAME_W = 320;
  const frameH = Math.max(120, Math.min(460, (FRAME_W * cellHIn) / cellWIn));

  useEffect(() => {
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
    if (spanX > 0) setOx(Math.min(1, Math.max(0, drag.current.ox + dx / spanX)));
    if (spanY > 0) setOy(Math.min(1, Math.max(0, drag.current.oy + dy / spanY)));
  };
  const onUp = () => { drag.current = null; };

  return (
    <div className="pe-lib-backdrop" style={{ zIndex: 200 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={trap} className="pe-modal" role="dialog" aria-modal="true" aria-label="Adjust image fit" style={{ maxWidth: 420, padding: 20 }}>
        <div className="pe-row" style={{ marginBottom: 12 }}>
          <b style={{ flex: 1 }}>Adjust image fit</b>
          <div className="pe-segrow">
            {(['cover', 'contain', 'stretch'] as const).map((m) => (
              <button key={m} className={fit === m ? 'pe-on' : ''} onClick={() => setFit(m)} style={{ textTransform: 'capitalize' }}>{m}</button>
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
            onChange={(e) => setZoom(+e.target.value)} style={{ flex: 1 }} />
          <span className="pe-label-sm pe-mono" style={{ width: 40, textAlign: 'right' }}>{zoom.toFixed(2)}×</span>
        </div>
        <div className="pe-note" style={{ marginBottom: 12 }}>Drag the image to reposition the crop. Cell is {cellWIn}×{cellHIn}″.</div>
        <div className="pe-row" style={{ gap: 8, justifyContent: 'flex-end' }}>
          <button className="pe-btn" onClick={() => { setZoom(1); setOx(0.5); setOy(0.5); setFit('cover'); }}>Reset</button>
          <button className="pe-btn" onClick={onClose}>Cancel</button>
          <button className="pe-btn pe-btn-dl" onClick={() => onApply({ fit, zoom, offsetX: ox, offsetY: oy })}>Approve</button>
        </div>
      </div>
    </div>
  );
}
