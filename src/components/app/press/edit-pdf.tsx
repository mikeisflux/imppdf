'use client';
// Edit PDF — a lightweight annotation editor over the source document.
// Supported ops map 1:1 onto the engine's editPdf(): text, box (outline),
// cover (white fill), redact (black fill), line. Objects can be selected,
// dragged, and deleted before applying to the source PDF.
import React, { useEffect, useRef, useState } from 'react';
import { editPdf, type EditOp } from '@/lib/imposition-toolkit/impose';
import { Ic } from './panels';
import { useFocusTrap } from './use-focus-trap';

type Tool = 'select' | 'text' | 'cover' | 'redact' | 'box' | 'line';

interface Obj {
  id: number; tool: Exclude<Tool, 'select'>; page: number;
  x: number; y: number; w: number; h: number;      // fractions of page (top-left origin)
  text?: string; sizePt?: number;
}

export function EditPdfModal({ thumbs, pageSizes, onClose, onApply }: {
  thumbs: string[];
  pageSizes: { wPt: number; hPt: number }[];
  onClose: () => void;
  onApply: (transform: (bytes: Uint8Array) => Promise<Uint8Array>) => void;
}) {
  const [page, setPage] = useState(0);
  const [tool, setTool] = useState<Tool>('select');
  const [objs, setObjs] = useState<Obj[]>([]);
  const [redo, setRedo] = useState<Obj[][]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ x: number; y: number; x2: number; y2: number } | null>(null);
  const [textDraft, setTextDraft] = useState<{ x: number; y: number; value: string } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trap = useFocusTrap<HTMLDivElement>(onClose);
  const drag = useRef<{ id: number; dx: number; dy: number } | null>(null);
  const idRef = useRef(1);

  const size = pageSizes[page] ?? { wPt: 612, hPt: 792 };
  const pageObjs = objs.map((o, i) => ({ o, i })).filter(({ o }) => o.page === page + 1);

  const pushState = (next: Obj[]) => { setObjs(next); setRedo([]); };

  const frac = (e: React.MouseEvent) => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };

  const onStageDown = (e: React.MouseEvent) => {
    if (textDraft) return;
    const p = frac(e);
    if (tool === 'select') { setSel(null); return; }
    if (tool === 'text') { setTextDraft({ x: p.x, y: p.y, value: '' }); return; }
    setDraft({ x: p.x, y: p.y, x2: p.x, y2: p.y });
  };
  const onStageMove = (e: React.MouseEvent) => {
    if (drag.current) {
      const p = frac(e);
      setObjs((s) => s.map((o) => (o.id === drag.current!.id ? { ...o, x: p.x - drag.current!.dx, y: p.y - drag.current!.dy } : o)));
      return;
    }
    if (draft) { const p = frac(e); setDraft({ ...draft, x2: p.x, y2: p.y }); }
  };
  const onStageUp = () => {
    drag.current = null;
    if (!draft) return;
    const d = draft; setDraft(null);
    const x = Math.min(d.x, d.x2), y = Math.min(d.y, d.y2);
    const w = Math.abs(d.x2 - d.x), h = Math.abs(d.y2 - d.y);
    if (tool === 'line') {
      pushState([...objs, { id: idRef.current++, tool: 'line', page: page + 1, x: d.x, y: d.y, w: d.x2 - d.x, h: d.y2 - d.y }]);
    } else if (w > 0.005 && h > 0.005 && tool !== 'select' && tool !== 'text') {
      pushState([...objs, { id: idRef.current++, tool, page: page + 1, x, y, w, h }]);
    }
  };
  const commitText = () => {
    if (textDraft?.value.trim()) {
      pushState([...objs, { id: idRef.current++, tool: 'text', page: page + 1, x: textDraft.x, y: textDraft.y, w: 0, h: 0, text: textDraft.value, sizePt: 14 }]);
    }
    setTextDraft(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel !== null && !textDraft) {
        pushState(objs.filter((o) => o.id !== sel)); setSel(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, objs, textDraft]);

  const toOps = (): EditOp[] => objs.map((o) => {
    const sz = pageSizes[o.page - 1] ?? size;
    const X = (f: number) => f * sz.wPt, Y = (f: number) => sz.hPt - f * sz.hPt;   // flip to PDF coords
    if (o.tool === 'text') return { type: 'text', page: o.page, xPt: X(o.x), yPt: Y(o.y) - (o.sizePt ?? 14), text: o.text ?? '', sizePt: o.sizePt ?? 14 } as EditOp;
    if (o.tool === 'line') return { type: 'line', page: o.page, x1: X(o.x), y1: Y(o.y), x2: X(o.x + o.w), y2: Y(o.y + o.h), thicknessPt: 1.5 } as EditOp;
    if (o.tool === 'redact') return { type: 'redact', page: o.page, xPt: X(o.x), yPt: Y(o.y + o.h), wPt: o.w * sz.wPt, hPt: o.h * sz.hPt } as EditOp;
    if (o.tool === 'cover') return { type: 'box', page: o.page, xPt: X(o.x), yPt: Y(o.y + o.h), wPt: o.w * sz.wPt, hPt: o.h * sz.hPt, fill: true, color: { r: 1, g: 1, b: 1 } } as EditOp;
    return { type: 'box', page: o.page, xPt: X(o.x), yPt: Y(o.y + o.h), wPt: o.w * sz.wPt, hPt: o.h * sz.hPt, fill: false } as EditOp;
  });

  const TOOLS: { id: Tool; label: string; icon: React.ReactNode }[] = [
    { id: 'select', label: 'SELECT', icon: <Ic name="fit" size={13} /> },
    { id: 'text', label: 'TEXT', icon: <b style={{ fontSize: 12 }}>T</b> },
    { id: 'cover', label: 'COVER', icon: <Ic name="fillbg" size={13} /> },
    { id: 'redact', label: 'REDACT', icon: <Ic name="eyeoff" size={13} /> },
    { id: 'box', label: 'BOX', icon: <Ic name="grid" size={13} /> },
    { id: 'line', label: 'LINE', icon: <span style={{ display: 'inline-block', width: 12, height: 2, background: 'currentColor' }} /> },
  ];

  return (
    <div className="pe-modal-backdrop">
      <div ref={trap} className="pe-modal pe-modal-wide pe-editpdf" role="dialog" aria-modal="true" aria-label="Edit PDF">
        <div className="pe-modal-head">
          <span className="pe-modal-ic"><Ic name="editpdf" size={18} /></span>
          <div>
            <div className="pe-modal-title">Edit PDF</div>
            <div className="pe-modal-sub">Text: click to place · Drag to draw boxes · Select: move · Delete removes selection. Applies to the source PDF.</div>
          </div>
          <button className="pe-iconbtn" aria-label="Close dialog" title="Close" style={{ marginLeft: 'auto' }} onClick={onClose}><Ic name="close" size={17} /></button>
        </div>
        <div className="pe-editpdf-body">
          <div className="pe-editpdf-side">
            <div className="pe-modal-seclabel">TOOLS</div>
            <div className="pe-editpdf-tools">
              {TOOLS.map((t) => (
                <button key={t.id} className={`pe-chipbtn ${tool === t.id ? 'pe-chip-on' : ''}`} onClick={() => setTool(t.id)}>{t.icon} {t.label}</button>
              ))}
            </div>
            <div className="pe-modal-seclabel" style={{ marginTop: 14 }}>EDIT</div>
            <div className="pe-chipwrap">
              <button className="pe-chipbtn" disabled={!objs.length} onClick={() => { setRedo((r) => [...r, objs]); setObjs(objs.slice(0, -1)); }}><Ic name="undo" size={12} /> UNDO</button>
              <button className="pe-chipbtn" disabled={!redo.length} onClick={() => { const last = redo[redo.length - 1]!; setRedo(redo.slice(0, -1)); setObjs(last); }}>REDO</button>
              <button className="pe-chipbtn" disabled={sel === null} onClick={() => { pushState(objs.filter((o) => o.id !== sel)); setSel(null); }}><Ic name="trash" size={12} /> DELETE SELECTED</button>
            </div>
            <div className="pe-label-sm" style={{ margin: '14px 0 6px' }}>{objs.length} annotation{objs.length === 1 ? '' : 's'} across the document</div>
            <button className="pe-btn pe-btn-dl" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={!objs.length}
              onClick={() => { onApply(async (bytes) => editPdf(bytes, toOps())); onClose(); }}>
              <Ic name="save" size={14} /> APPLY TO SOURCE PDF
            </button>
          </div>
          <div className="pe-editpdf-stage-wrap">
            <div className="pe-row" style={{ marginBottom: 8 }}>
              <button className="pe-chipbtn" disabled={page === 0} onClick={() => { setPage(page - 1); setSel(null); }}>‹ Prev</button>
              <span className="pe-label-sm">Page {page + 1} of {pageSizes.length}</span>
              <button className="pe-chipbtn" disabled={page >= pageSizes.length - 1} onClick={() => { setPage(page + 1); setSel(null); }}>Next ›</button>
            </div>
            <div ref={stageRef} className="pe-editpdf-stage" style={{ aspectRatio: `${size.wPt} / ${size.hPt}` }}
              onMouseDown={onStageDown} onMouseMove={onStageMove} onMouseUp={onStageUp} onMouseLeave={onStageUp}>
              {thumbs[page] && <img src={thumbs[page]} alt="" draggable={false} />}
              {pageObjs.map(({ o }) => (
                <div key={o.id}
                  className={`pe-edit-obj pe-edit-${o.tool} ${sel === o.id ? 'pe-on' : ''}`}
                  style={o.tool === 'line'
                    ? { left: `${Math.min(o.x, o.x + o.w) * 100}%`, top: `${Math.min(o.y, o.y + o.h) * 100}%`, width: `${Math.abs(o.w) * 100}%`, height: `${Math.max(0.4, Math.abs(o.h) * 100)}%` }
                    : { left: `${o.x * 100}%`, top: `${o.y * 100}%`, width: o.tool === 'text' ? 'auto' : `${o.w * 100}%`, height: o.tool === 'text' ? 'auto' : `${o.h * 100}%` }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSel(o.id);
                    if (tool === 'select') { const p = frac(e); drag.current = { id: o.id, dx: p.x - o.x, dy: p.y - o.y }; }
                  }}>
                  {o.tool === 'text' && <span className="pe-edit-text">{o.text}</span>}
                  {o.tool === 'line' && <span className="pe-edit-lineseg" />}
                </div>
              ))}
              {draft && tool !== 'line' && (
                <div className={`pe-edit-obj pe-edit-${tool}`} style={{
                  left: `${Math.min(draft.x, draft.x2) * 100}%`, top: `${Math.min(draft.y, draft.y2) * 100}%`,
                  width: `${Math.abs(draft.x2 - draft.x) * 100}%`, height: `${Math.abs(draft.y2 - draft.y) * 100}%`,
                }} />
              )}
              {textDraft && (
                <input autoFocus className="pe-edit-textinput" style={{ left: `${textDraft.x * 100}%`, top: `${textDraft.y * 100}%` }}
                  value={textDraft.value}
                  onChange={(e) => setTextDraft({ ...textDraft, value: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitText(); if (e.key === 'Escape') { e.stopPropagation(); setTextDraft(null); } }}
                  onBlur={commitText} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
