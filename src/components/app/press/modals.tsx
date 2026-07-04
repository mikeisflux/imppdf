'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Ic, type Unit } from './panels';
import { resolveName } from './steps';

// ── App settings ─────────────────────────────────────────────────────────────

export type PreviewQuality = 'auto' | 'ultralow' | 'low' | 'standard' | 'high';

export interface AppSettings {
  previewQuality: PreviewQuality;
  dpiProfile: 'offset' | 'digital' | 'large' | 'screen';
  unit: Unit;
  rulerOrigin: 'tl' | 'tr' | 'bl' | 'br';
  rulerSpacingIn: number;
  showCutBlocks: boolean;
  cutBlockColor: string;
  nameTemplate: string;
  customText: string;
  features: { advancedTools: boolean; watermark: boolean; bleedMaker: boolean; dpiPreflight: boolean; sessionRestore: boolean };
  hiddenTools: string[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  previewQuality: 'auto', dpiProfile: 'offset', unit: 'mm',
  rulerOrigin: 'tl', rulerSpacingIn: 0.25,
  showCutBlocks: false, cutBlockColor: '#FF00FF',
  nameTemplate: '{fileName}_{tool}_{date}', customText: '',
  features: { advancedTools: true, watermark: true, bleedMaker: true, dpiPreflight: true, sessionRestore: false },
  hiddenTools: [],
};

const SETTINGS_KEY = 'pp_editor_settings';
export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const p = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...p, features: { ...DEFAULT_SETTINGS.features, ...(p.features ?? {}) } };
  } catch { return DEFAULT_SETTINGS; }
}
export function persistSettings(s: AppSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* full */ }
}

// ── Shared modal chrome ──────────────────────────────────────────────────────
export function Modal({ title, sub, icon, onClose, children, wide, onReset }: {
  title: string; sub?: string; icon?: React.ReactNode; onClose: () => void;
  children: React.ReactNode; wide?: boolean; onReset?: () => void;
}) {
  return (
    <div className="pe-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`pe-modal ${wide ? 'pe-modal-wide' : ''}`}>
        <div className="pe-modal-head">
          {icon && <span className="pe-modal-ic">{icon}</span>}
          <div>
            <div className="pe-modal-title">{title}</div>
            {sub && <div className="pe-modal-sub">{sub}</div>}
          </div>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            {onReset && <button className="pe-chipbtn" onClick={onReset}><Ic name="undo" size={13} /> RESET</button>}
            <button className="pe-iconbtn" onClick={onClose}><Ic name="close" size={17} /></button>
          </span>
        </div>
        <div className="pe-modal-body">{children}</div>
      </div>
    </div>
  );
}

function Seg<T extends string>({ options, value, onChange }: { options: { v: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="pe-segrow">
      {options.map((o) => <button key={o.v} className={value === o.v ? 'pe-on' : ''} onClick={() => onChange(o.v)}>{o.label}</button>)}
    </div>
  );
}
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return <button className={`pe-toggle ${on ? 'pe-on' : ''}`} onClick={() => onChange(!on)}><i /></button>;
}
function ModalSection({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="pe-modal-section"><div className="pe-modal-seclabel">{label}</div>{children}</div>;
}

// ── Settings ─────────────────────────────────────────────────────────────────

const QUALITY_NOTES: Record<PreviewQuality, string> = {
  auto: 'Automatically chooses low or ultra-low quality for stable previews',
  ultralow: '0.5× resolution — safest for very large PDFs',
  low: '1× resolution — stable performance',
  standard: 'Native display resolution',
  high: '2× resolution — crisper text and sharper images',
};
const DPI_NOTES = { offset: '300+ DPI — commercial offset press', digital: '240+ DPI — digital press', large: '150+ DPI — large format viewed at distance', screen: '96+ DPI — screen/proof only' };
const TOKENS = ['{fileName}', '{date}', '{time}', '{tool}', '{pages}', '{paperSize}', '{custom}'];
const NAME_PRESETS = ['{fileName}_{tool}_{date}', '{fileName}_{date}_{time}', '{custom}_{tool}', '{fileName}_{paperSize}_{pages}p'];

export function SettingsModal({ settings, onChange, onClose, exampleCtx }: {
  settings: AppSettings; onChange: (s: AppSettings) => void; onClose: () => void;
  exampleCtx: { fileName: string; tool: string; pages: number; paperSize: string };
}) {
  const set = (patch: Partial<AppSettings>) => onChange({ ...settings, ...patch });
  const preview = resolveName(settings.nameTemplate, { ...exampleCtx, custom: settings.customText || 'Custom' });
  const setFeature = (k: keyof AppSettings['features'], v: boolean) => set({ features: { ...settings.features, [k]: v } });
  return (
    <Modal title="Settings" sub="Configure ruler display, output naming, and developer tools" onClose={onClose}
      onReset={() => onChange({ ...DEFAULT_SETTINGS, hiddenTools: settings.hiddenTools })}>
      <ModalSection label="PREVIEW QUALITY">
        <Seg value={settings.previewQuality} onChange={(v) => set({ previewQuality: v })}
          options={[{ v: 'auto', label: 'AUTO' }, { v: 'ultralow', label: 'ULTRA LOW' }, { v: 'low', label: 'LOW' }, { v: 'standard', label: 'STANDARD' }, { v: 'high', label: 'HIGH' }]} />
        <div className="pe-modal-note">{QUALITY_NOTES[settings.previewQuality]}</div>
      </ModalSection>
      <ModalSection label="DPI PREFLIGHT">
        <Seg value={settings.dpiProfile} onChange={(v) => set({ dpiProfile: v })}
          options={[{ v: 'offset', label: 'OFFSET' }, { v: 'digital', label: 'DIGITAL' }, { v: 'large', label: 'LARGE' }, { v: 'screen', label: 'SCREEN' }]} />
        <div className="pe-modal-note">{DPI_NOTES[settings.dpiProfile]}</div>
      </ModalSection>
      <ModalSection label="UNITS">
        <div className="pe-row">
          <Seg value={settings.unit} onChange={(v) => set({ unit: v })}
            options={[{ v: 'mm', label: 'MM' }, { v: 'in', label: 'IN' }, { v: 'pt', label: 'PT' }]} />
          <span className="pe-modal-note" style={{ margin: 0 }}>{settings.unit === 'mm' ? 'Millimetres' : settings.unit === 'in' ? 'Inches' : 'Points'}</span>
        </div>
      </ModalSection>
      <ModalSection label="RULER">
        <div className="pe-row" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="pe-label-sm" style={{ marginBottom: 6 }}>Origin</div>
            <div className="pe-origin-grid">
              {(['tl', 'tr', 'bl', 'br'] as const).map((o) => (
                <button key={o} className={`pe-origin ${settings.rulerOrigin === o ? 'pe-on' : ''}`} onClick={() => set({ rulerOrigin: o })}>
                  <i className={`pe-origin-${o}`} />
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="pe-label-sm" style={{ marginBottom: 6 }}>Spacing</div>
            <div className="pe-row" style={{ marginBottom: 4 }}>
              <input className="pe-input pe-num" inputMode="decimal" defaultValue={settings.rulerSpacingIn}
                onChange={(e) => { const v = parseFloat(e.target.value); if (!Number.isNaN(v) && v > 0.01) set({ rulerSpacingIn: v }); }} />
              <span className="pe-label-sm">IN</span>
            </div>
            <div className="pe-modal-note" style={{ margin: 0 }}>Distance between ruler gridlines</div>
          </div>
        </div>
      </ModalSection>
      <ModalSection label="JDF CUT BLOCKS">
        <div className="pe-row" style={{ marginBottom: 0 }}>
          <Toggle on={settings.showCutBlocks} onChange={(v) => set({ showCutBlocks: v })} />
          <span className="pe-label">Show cut blocks</span>
          <span style={{ flex: 1 }} />
          <input type="color" className="pe-colorwell" value={settings.cutBlockColor} onChange={(e) => set({ cutBlockColor: e.target.value })} />
          <span className="pe-label-sm" style={{ fontFamily: 'ui-monospace, monospace' }}>{settings.cutBlockColor.toUpperCase()}</span>
        </div>
      </ModalSection>
      <ModalSection label="OUTPUT NAMING">
        <div className="pe-label-sm" style={{ marginBottom: 5 }}>Template</div>
        <input className="pe-input" value={settings.nameTemplate} onChange={(e) => set({ nameTemplate: e.target.value })} />
        <div className="pe-label-sm" style={{ margin: '10px 0 5px' }}>Tokens</div>
        <div className="pe-chipwrap">
          {TOKENS.map((t) => <button key={t} className="pe-chipbtn pe-mono" onClick={() => set({ nameTemplate: settings.nameTemplate + (settings.nameTemplate ? '_' : '') + t })}>{t}</button>)}
        </div>
        <div className="pe-label-sm" style={{ margin: '10px 0 5px' }}>Custom text</div>
        <input className="pe-input" placeholder="Enter custom text..." value={settings.customText} onChange={(e) => set({ customText: e.target.value })} />
        <div className="pe-label-sm" style={{ margin: '10px 0 5px' }}>Presets</div>
        <div className="pe-chipwrap">
          {NAME_PRESETS.map((t) => <button key={t} className={`pe-chipbtn pe-mono ${settings.nameTemplate === t ? 'pe-chip-on' : ''}`} onClick={() => set({ nameTemplate: t })}>{t}</button>)}
        </div>
        <div className="pe-name-preview">
          <div className="pe-label-sm">PREVIEW</div>
          <div className="pe-mono" style={{ fontSize: 13 }}>{preview}</div>
        </div>
      </ModalSection>
      <ModalSection label="FEATURES">
        <div className="pe-modal-note" style={{ marginTop: 0 }}>Toggle new features on or off. Most features are enabled by default.</div>
        {([
          ['advancedTools', 'Advanced & prepress tools', 'Show specialist production marks (Distortion, Slugline, Folding/Registration/Collating/OMR/Gathering/Lay Marks) in the tool picker'],
          ['watermark', 'Watermark', 'Text watermark tool in tool picker'],
          ['bleedMaker', 'BleedMaker', 'Bleed generation tool in tool picker'],
          ['dpiPreflight', 'DPI Preflight', 'Resolution quality badge in navbar'],
          ['sessionRestore', 'Session Restore', 'Auto-save your tools and settings and restore them when you reopen the app'],
        ] as [keyof AppSettings['features'], string, string][]).map(([k, label, sub]) => (
          <div key={k} className="pe-feature-row">
            <div>
              <div className="pe-label" style={{ fontWeight: 600 }}>{label}</div>
              <div className="pe-label-sm">{sub}</div>
            </div>
            <Toggle on={settings.features[k]} onChange={(v) => setFeature(k, v)} />
          </div>
        ))}
      </ModalSection>
      <ModalSection label="BACKUP & RESTORE">
        <div className="pe-modal-note" style={{ marginTop: 0 }}>
          Export all settings as JSON or restore from a previous backup. Includes preferences, tool visibility, and workflows.
        </div>
        <div className="pe-row" style={{ marginBottom: 0 }}>
          <button className="pe-chipbtn" onClick={() => {
            const blob = new Blob([JSON.stringify({ settings, workflows: JSON.parse(localStorage.getItem('pp_workflows') || '[]') }, null, 2)], { type: 'application/json' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'impositionpdf-settings.json'; a.click();
          }}><Ic name="download" size={14} /> Export Settings</button>
          <button className="pe-chipbtn" onClick={() => {
            const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json';
            inp.onchange = async () => {
              try {
                const f = inp.files?.[0]; if (!f) return;
                const data = JSON.parse(await f.text());
                if (data.settings) onChange({ ...DEFAULT_SETTINGS, ...data.settings });
                if (Array.isArray(data.workflows)) localStorage.setItem('pp_workflows', JSON.stringify(data.workflows));
              } catch { /* invalid file */ }
            };
            inp.click();
          }}><Ic name="upload" size={14} /> Import Settings</button>
        </div>
      </ModalSection>
    </Modal>
  );
}

// ── Job Info ─────────────────────────────────────────────────────────────────

export interface JobInfo {
  jobName: string; jobNumber: string; client: string; salesperson: string;
  date: string; createdBy: string; description: string; tags: string;
}
export const EMPTY_JOB: JobInfo = { jobName: '', jobNumber: '', client: '', salesperson: '', date: '', createdBy: '', description: '', tags: '' };
const JOB_KEY = 'pp_job_default';

export function JobInfoModal({ job, onChange, onClose, sourceBytes, onFillSlugline }: {
  job: JobInfo; onChange: (j: JobInfo) => void; onClose: () => void;
  sourceBytes: Uint8Array | null; onFillSlugline?: (text: string) => void;
}) {
  const filled = Object.values(job).filter((v) => v.trim()).length;
  const F = (k: keyof JobInfo, label: string, ph: string, area?: boolean) => (
    <div style={{ marginBottom: 14 }}>
      <div className="pe-modal-seclabel" style={{ marginBottom: 6 }}>{label}</div>
      {area
        ? <textarea className="pe-input" rows={3} placeholder={ph} value={job[k]} onChange={(e) => onChange({ ...job, [k]: e.target.value })} />
        : <input className="pe-input" placeholder={ph} value={job[k]} onChange={(e) => onChange({ ...job, [k]: e.target.value })} />}
    </div>
  );
  return (
    <Modal title="Job Info" sub="Metadata embedded into the output PDF document properties" onClose={onClose}
      icon={<Ic name="file" size={18} />}>
      <div className="pe-chipwrap" style={{ marginBottom: 16 }}>
        <button className="pe-chipbtn" disabled={!sourceBytes} onClick={async () => {
          if (!sourceBytes) return;
          try {
            const { PDFDocument } = await import('pdf-lib');
            const doc = await PDFDocument.load(sourceBytes.slice(), { ignoreEncryption: true, updateMetadata: false });
            onChange({
              ...job,
              jobName: doc.getTitle() ?? job.jobName,
              createdBy: doc.getAuthor() ?? job.createdBy,
              description: doc.getSubject() ?? job.description,
              tags: doc.getKeywords() ?? job.tags,
            });
          } catch { /* unreadable metadata */ }
        }}><Ic name="file" size={13} /> Auto-fill from PDF</button>
        <button className="pe-chipbtn" disabled={!onFillSlugline || !filled} onClick={() => {
          const text = [job.jobName, job.jobNumber && `#${job.jobNumber}`, job.client, '[date]'].filter(Boolean).join(' · ');
          onFillSlugline?.(text);
        }}><Ic name="slugline" size={13} /> Fill Slugline</button>
        <button className="pe-chipbtn" onClick={() => { try { localStorage.setItem(JOB_KEY, JSON.stringify(job)); } catch { /* full */ } }}>
          <Ic name="save" size={13} /> Save Default
        </button>
        <button className="pe-chipbtn" onClick={() => onChange(EMPTY_JOB)}><Ic name="trash" size={13} /> Clear</button>
      </div>
      {F('jobName', 'JOB NAME', 'e.g. Spring Catalog 2026')}
      {F('jobNumber', 'JOB NUMBER', 'e.g. JOB-2026-0042')}
      {F('client', 'CLIENT', 'e.g. Acme Corp')}
      {F('salesperson', 'SALESPERSON', 'e.g. Jane Smith')}
      {F('date', 'DATE', new Date().toISOString().slice(0, 10))}
      {F('createdBy', 'CREATED BY', 'e.g. Prepress Operator')}
      {F('description', 'DESCRIPTION', 'Job notes, special instructions...', true)}
      {F('tags', 'TAGS', 'e.g. urgent, rush, 4-color')}
      <div className="pe-label-sm" style={{ marginTop: -8, marginBottom: 14 }}>Separate tags with commas</div>
      <div className="pe-job-foot">
        {filled ? `${filled} field${filled === 1 ? '' : 's'} will be embedded on export` : 'No metadata to embed — fill in fields above'}
      </div>
    </Modal>
  );
}
export function loadDefaultJob(): JobInfo {
  try { return { ...EMPTY_JOB, ...JSON.parse(localStorage.getItem(JOB_KEY) || '{}') }; } catch { return EMPTY_JOB; }
}

// ── Page Manager ─────────────────────────────────────────────────────────────

export function PageManagerModal({ thumbs, pageCount, onClose, onApply, onDownload }: {
  thumbs: string[]; pageCount: number; onClose: () => void;
  onApply: (order: number[]) => void;            // 0-based source page indices, in new order
  onDownload: (order: number[]) => void;
}) {
  const [order, setOrder] = useState<number[]>(() => Array.from({ length: pageCount }, (_, i) => i));
  const [sel, setSel] = useState<Set<number>>(new Set());   // positions in `order`
  const [anchor, setAnchor] = useState<number | null>(null);
  useEffect(() => { setOrder(Array.from({ length: pageCount }, (_, i) => i)); setSel(new Set()); }, [pageCount]);

  const click = (pos: number, e: React.MouseEvent) => {
    const next = new Set(e.ctrlKey || e.metaKey ? sel : []);
    if (e.shiftKey && anchor !== null) {
      const [a, b] = anchor < pos ? [anchor, pos] : [pos, anchor];
      for (let i = a; i <= b; i++) next.add(i);
    } else if ((e.ctrlKey || e.metaKey) && sel.has(pos)) next.delete(pos);
    else { next.add(pos); setAnchor(pos); }
    setSel(next);
  };
  const selectedPositions = () => [...sel].sort((a, b) => a - b);
  const mutate = (fn: (order: number[], sel: number[]) => { order: number[]; sel?: number[] }) => {
    const r = fn([...order], selectedPositions());
    setOrder(r.order);
    setSel(new Set(r.sel ?? []));
  };
  const actions = {
    selectAll: () => setSel(new Set(order.map((_, i) => i))),
    extract: () => mutate((o, s) => ({ order: s.map((p) => o[p]!), sel: s.map((_, i) => i) })),
    del: () => mutate((o, s) => ({ order: o.filter((_, i) => !s.includes(i)) })),
    dup: () => mutate((o, s) => {
      const out: number[] = []; const newSel: number[] = [];
      o.forEach((pg, i) => { out.push(pg); if (s.includes(i)) { newSel.push(out.length); out.push(pg); } });
      return { order: out, sel: newSel };
    }),
    toFront: () => mutate((o, s) => ({ order: [...s.map((p) => o[p]!), ...o.filter((_, i) => !s.includes(i))], sel: s.map((_, i) => i) })),
    toBack: () => mutate((o, s) => ({ order: [...o.filter((_, i) => !s.includes(i)), ...s.map((p) => o[p]!)], sel: s.map((_, i) => o.length - s.length + i) })),
    reverse: () => mutate((o) => ({ order: [...o].reverse() })),
  };
  const disabled = sel.size === 0;
  return (
    <Modal title="Page Manager" wide onClose={onClose}
      sub="Select, reorder, extract, delete, or duplicate pages before imposition. Click to select, Shift+click for range, Ctrl+click to toggle.">
      <div className="pe-pm-toolbar">
        <button className="pe-pm-act" onClick={actions.selectAll}><Ic name="fillbg" size={14} /> SELECT ALL</button>
        <button className="pe-pm-act" disabled={disabled} onClick={actions.extract}><Ic name="extract" size={14} /> EXTRACT</button>
        <button className="pe-pm-act" disabled={disabled} onClick={actions.del}><Ic name="trash" size={14} /> DELETE</button>
        <button className="pe-pm-act" disabled={disabled} onClick={actions.dup}><Ic name="duplicate" size={14} /> DUPLICATE</button>
        <span className="pe-tb-div" />
        <button className="pe-pm-act" disabled={disabled} onClick={actions.toFront}><Ic name="tofront" size={14} /> TO FRONT</button>
        <button className="pe-pm-act" disabled={disabled} onClick={actions.toBack}><Ic name="toback" size={14} /> TO BACK</button>
        <span className="pe-tb-div" />
        <button className="pe-pm-act" onClick={actions.reverse}><Ic name="reverse" size={14} /> REVERSE</button>
      </div>
      <div className="pe-label-sm pe-mono" style={{ marginBottom: 12 }}>
        {sel.size ? `${sel.size} OF ${order.length} PAGES SELECTED` : 'NO PAGES SELECTED'}
      </div>
      <div className="pe-pm-grid">
        {order.map((pg, pos) => (
          <button key={`${pg}-${pos}`} className={`pe-pm-page ${sel.has(pos) ? 'pe-on' : ''}`} onClick={(e) => click(pos, e)}>
            {sel.has(pos) && <span className="pe-pm-tick">✓</span>}
            <span className="pe-pm-thumb">{thumbs[pg] ? <img src={thumbs[pg]} alt="" /> : <span className="pe-pm-ph">{pg + 1}</span>}</span>
            <span className="pe-pm-num">{pg + 1}</span>
          </button>
        ))}
      </div>
      <div className="pe-pm-foot">
        <span className="pe-label-sm pe-mono">{order.length} PAGES</span>
        <span style={{ flex: 1 }} />
        <button className="pe-chipbtn" onClick={() => onDownload(order)}><Ic name="download" size={14} /> DOWNLOAD</button>
        <button className="pe-btn pe-btn-dl" onClick={() => { onApply(order); onClose(); }}>✓ APPLY TO PIPELINE</button>
      </div>
    </Modal>
  );
}

// ── Batch ────────────────────────────────────────────────────────────────────

export interface BatchFile { name: string; bytes: Uint8Array; }

export function BatchModal({ initial, isPro, onClose, onRun }: {
  initial: BatchFile[]; isPro: boolean; onClose: () => void;
  onRun: (files: BatchFile[], progress: (done: number, total: number) => void) => Promise<void>;
}) {
  const [files, setFiles] = useState<BatchFile[]>(initial);
  const [running, setRunning] = useState(false);
  const [prog, setProg] = useState<[number, number] | null>(null);
  return (
    <Modal title="Batch" sub="Run the same operations on many files at once. Your loaded files are added automatically — add or remove files, then start." onClose={onClose} icon={<Ic name="batch" size={18} />}>
      {files.map((f, i) => (
        <div key={i} className="pe-row" style={{ marginBottom: 8 }}>
          <Ic name="file" size={15} />
          <span className="pe-label" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
          <button className="pe-iconbtn" disabled={running} onClick={() => setFiles((s) => s.filter((_, j) => j !== i))}><Ic name="close" size={14} /></button>
        </div>
      ))}
      <button className="pe-chipbtn" disabled={running} onClick={() => {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'application/pdf'; inp.multiple = true;
        inp.onchange = async () => {
          const list = Array.from(inp.files ?? []);
          const loaded = await Promise.all(list.map(async (f) => ({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) })));
          setFiles((s) => [...s, ...loaded]);
        };
        inp.click();
      }}><Ic name="addstep" size={14} /> Add PDFs</button>
      <div style={{ marginTop: 18 }}>
        {!isPro ? (
          <div className="pe-note">Batch processing is a Pro feature. <a href="/pricing">Upgrade to Pro</a> to run workflows across many files at once.</div>
        ) : (
          <button className="pe-btn pe-btn-dl" disabled={running || !files.length} onClick={async () => {
            setRunning(true);
            try { await onRun(files, (d, t) => setProg([d, t])); } finally { setRunning(false); setProg(null); onClose(); }
          }}>
            {running && prog ? `Processing ${prog[0]}/${prog[1]}…` : `Start — ${files.length} file${files.length === 1 ? '' : 's'}`}
          </button>
        )}
      </div>
    </Modal>
  );
}

// ── Preview quality dropdown (the "Auto" chip) ───────────────────────────────

export function QualityMenu({ value, onChange, onClose }: { value: PreviewQuality; onChange: (q: PreviewQuality) => void; onClose: () => void }) {
  const DOT: Record<PreviewQuality, string> = { auto: '#9096a1', ultralow: '#f0883e', low: '#f5d90a', standard: '#3fb950', high: '#3fb950' };
  const items: { v: PreviewQuality; label: string }[] = [
    { v: 'auto', label: 'Auto' }, { v: 'ultralow', label: 'Ultra Low' }, { v: 'low', label: 'Low' },
    { v: 'standard', label: 'Standard' }, { v: 'high', label: 'High' },
  ];
  return (
    <div className="pe-menu" onMouseLeave={onClose}>
      <div className="pe-menu-label">PREVIEW QUALITY</div>
      {items.map((it) => (
        <button key={it.v} className="pe-menu-item" onClick={() => { onChange(it.v); onClose(); }}>
          <i className="pe-menu-dot" style={{ background: DOT[it.v] }} />
          <span>
            <div className="pe-menu-main">{it.label} {value === it.v && <span style={{ color: 'var(--pe-violet)' }}>✓</span>}</div>
            <div className="pe-menu-sub">{QUALITY_NOTES[it.v]}</div>
          </span>
        </button>
      ))}
      <div className="pe-menu-foot">Affects the on-screen preview only — your exported file is always full quality.</div>
    </div>
  );
}

// ── Preflight report ─────────────────────────────────────────────────────────
export function PreflightModal({ report, onClose }: {
  report: { pages: number; uniformSize: boolean; widthIn: number; heightIn: number; warnings: string[] } | null;
  onClose: () => void;
}) {
  return (
    <Modal title="PDF Preflight" sub="Non-destructive inspection of the loaded document" onClose={onClose} icon={<Ic name="preflight" size={18} />}>
      {!report ? <div className="pe-note">Load a PDF first.</div> : (
        <>
          <div className="pe-row"><span className="pe-label pe-w96">Pages</span><span className="pe-label">{report.pages}</span></div>
          <div className="pe-row"><span className="pe-label pe-w96">Page size</span><span className="pe-label">{report.widthIn}″ × {report.heightIn}″ {report.uniformSize ? '(uniform)' : '(mixed sizes)'}</span></div>
          <div className="pe-modal-seclabel" style={{ margin: '14px 0 8px' }}>WARNINGS</div>
          {report.warnings.length
            ? report.warnings.map((w, i) => <div key={i} className="pe-note" style={{ marginTop: 4 }}>⚠ {w}</div>)
            : <div className="pe-note">No warnings — looks press-ready.</div>}
        </>
      )}
    </Modal>
  );
}

export function useCountdown(until: number): string {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [until]);
  return useMemo(() => {
    const ms = until - Date.now();
    if (ms <= 0) return '';
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [until, Date.now()]);
}
