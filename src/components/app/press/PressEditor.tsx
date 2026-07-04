'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPdfInfo, getPageSizes, shufflePages, downloadPdf, downloadFile, makeZip, setPdfJobInfo } from '@/lib/imposition-toolkit/impose';
import type { PdfPageInfo } from '@/lib/imposition-toolkit/impose';
import { rasterizePdfThumbs, rasterizePdfSheets, type RenderedSheet } from '@/lib/imposition-toolkit/page-thumbs';
import { findOp } from './operations';
import {
  makeStep, runPipeline, splitStep, runSplit, buildJdf, resolveName,
  listWorkflows, saveWorkflow, deleteWorkflow, workflowToSteps,
  type StepType, type WorkflowStep,
} from './steps';
import { Ic, ChooseOperation, StepCard, paperName, fmtIn, type Unit } from './panels';
import {
  loadSettings, persistSettings, DEFAULT_SETTINGS, SettingsModal, JobInfoModal, PageManagerModal,
  BatchModal, QualityMenu, loadDefaultJob, EMPTY_JOB, useCountdown,
  type AppSettings, type JobInfo, type PreviewQuality, type BatchFile,
} from './modals';
import { PreflightInspector, runPreflightChecks, VdpWizard, AskAIPanel, type PfReport } from './inspector-wizards';
import { EditPdfModal } from './edit-pdf';
import { TemplatesModal } from './catalog-bridge';
import './press.css';

interface LoadedFile { name: string; bytes: Uint8Array; info: PdfPageInfo; }

export interface PressUsage { authenticated: boolean; isPro: boolean; remaining: number; limit: number; cooldownUntil?: number; }

// Sheets rendered per quality tier (preview only — exports are always complete).
const QUALITY_PX: Record<PreviewQuality, number> = { auto: 0, ultralow: 520, low: 820, standard: 1240, high: 1900 };
const MAX_SHEETS = 32;

const HIDE_BY_FEATURE: Record<string, string[]> = {
  advancedTools: ['distort', 'slugline', 'foldmarks', 'regmarks', 'collating', 'omr', 'gathering', 'laymarks', 'dimensions', 'whitevarnish', 'braille'],
  watermark: ['watermark'],
  bleedMaker: ['bleed'],
};

export function PressEditor({ initialOp, usage, onUpgrade, onSignIn, gateExport }: {
  initialOp?: string | null;
  usage?: PressUsage;
  onUpgrade?: React.ReactNode;
  onSignIn?: React.ReactNode;
  // Returns true when an export (Download / Print / Batch item) may proceed;
  // records the consumption. When it returns false the host shows its paywall.
  gateExport?: () => boolean;
}) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [steps, setSteps] = useState<WorkflowStep[]>(() => {
    const op = findOp(initialOp ?? null);
    return op ? [makeStep(op.id)] : [];
  });
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [srcThumbs, setSrcThumbs] = useState<string[]>([]);
  const [pageSizes, setPageSizes] = useState<{ wPt: number; hPt: number }[]>([]);
  const [sheets, setSheets] = useState<RenderedSheet[]>([]);
  const [totalSheets, setTotalSheets] = useState(0);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');
  const [jobInfo, setJobInfo] = useState<JobInfo>(EMPTY_JOB);
  const [inspector, setInspector] = useState<{ open: boolean; running: boolean; report: PfReport | null }>({ open: false, running: false, report: null });

  // Viewer state
  const [zoom, setZoom] = useState(1);
  const [paused, setPaused] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [fillBg, setFillBg] = useState(true);
  const [drag, setDrag] = useState(false);
  const [currentSheet, setCurrentSheet] = useState(1);
  const [modal, setModal] = useState<null | 'settings' | 'jobinfo' | 'pagemanager' | 'batch' | 'templates' | 'vdp' | 'editpdf'>(null);
  const [menu, setMenu] = useState<null | 'quality' | 'file' | 'load' | 'askai'>(null);
  const [adding, setAdding] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const outBytesRef = useRef<Uint8Array | null>(null);
  const renderSeq = useRef(0);

  // ── Settings persistence + session restore ─────────────────────────────────
  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setJobInfo(loadDefaultJob());
    if (s.features.sessionRestore) {
      try {
        const sess = JSON.parse(localStorage.getItem('pp_session') || 'null');
        if (sess?.steps?.length) setSteps(workflowToSteps({ name: '', savedAt: 0, steps: sess.steps }));
      } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const updateSettings = useCallback((s: AppSettings) => { setSettings(s); persistSettings(s); }, []);
  useEffect(() => {
    if (!settings.features.sessionRestore) return;
    try { localStorage.setItem('pp_session', JSON.stringify({ steps: steps.map((st) => ({ type: st.type, s: { ...st.s, files: [], stamp: null } })) })); } catch { /* full */ }
  }, [steps, settings.features.sessionRestore]);

  const unit = settings.unit;
  const setUnit = (u: Unit) => updateSettings({ ...settings, unit: u });

  // ── File loading ────────────────────────────────────────────────────────────
  const loadFile = useCallback(async (f: File) => {
    setError('');
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      const info = await getPdfInfo(bytes);
      setFile({ name: f.name, bytes, info });
    } catch { setError('Could not read that PDF.'); }
  }, []);
  const onPick = (files: FileList | null) => { const f = files?.[0]; if (f) void loadFile(f); };

  useEffect(() => {
    let cancelled = false;
    if (!file) { setSrcThumbs([]); setPageSizes([]); return; }
    rasterizePdfThumbs(file.bytes).then((t) => { if (!cancelled) setSrcThumbs(t); }).catch(() => {});
    getPageSizes(file.bytes).then((s) => { if (!cancelled) setPageSizes(s); }).catch(() => {});
    return () => { cancelled = true; };
  }, [file]);

  const openPreflight = useCallback((bytes: Uint8Array | null) => {
    if (!bytes) { setInspector({ open: true, running: false, report: null }); return; }
    setInspector({ open: true, running: true, report: null });
    runPreflightChecks(bytes)
      .then((report) => setInspector({ open: true, running: false, report }))
      .catch(() => setInspector({ open: true, running: false, report: null }));
  }, []);

  // ── Steps helpers ───────────────────────────────────────────────────────────
  const visibleHidden = useMemo(() => {
    const hidden = new Set(settings.hiddenTools);
    for (const [feat, ids] of Object.entries(HIDE_BY_FEATURE)) {
      if (!settings.features[feat as keyof AppSettings['features']]) ids.forEach((i) => hidden.add(i));
    }
    return [...hidden];
  }, [settings]);

  const addStep = (type: StepType) => {
    setAdding(false);
    if (type === 'preflight') { openPreflight(file?.bytes ?? null); return; }
    if (type === 'datamerge') { setModal('vdp'); return; }
    if (type === 'editpdf') { if (file) setModal('editpdf'); return; }
    setSteps((s) => [...s.map((st) => ({ ...st, collapsed: true })), makeStep(type)]);
  };
  const layerEntries = useMemo(() => steps
    .filter((st) => typeof st.s.layer === 'string' && st.s.layer.trim())
    .map((st) => ({ name: st.s.layer as string, stepLabel: findOp(st.type)?.label ?? st.type, stepId: st.id, enabled: st.enabled })), [steps]);
  const toggleLayer = (stepId: string) => setSteps((s) => s.map((st) => (st.id === stepId ? { ...st, enabled: !st.enabled } : st)));
  const changeStep = (i: number, next: WorkflowStep) => setSteps((s) => s.map((st, j) => (j === i ? next : st)));
  const removeStep = (i: number) => setSteps((s) => s.filter((_, j) => j !== i));
  const moveStep = (i: number, dir: -1 | 1) => setSteps((s) => {
    const j = i + dir;
    if (j < 0 || j >= s.length) return s;
    const c = [...s]; const t = c[i]!; c[i] = c[j]!; c[j] = t;
    return c;
  });

  // Steps as actually run (inject the file name for slug tokens).
  const pipelineSteps = useMemo(() => steps.map((st) =>
    st.type === 'slugline' ? { ...st, s: { ...st.s, fileName: file?.name ?? '' } } : st,
  ), [steps, file]);

  // ── Live preview ────────────────────────────────────────────────────────────
  const stepsSig = useMemo(() => JSON.stringify(steps.map((st) => [st.type, st.enabled, st.s])), [steps]);
  useEffect(() => {
    if (!file || paused) return;
    const seq = ++renderSeq.current;
    const t = setTimeout(async () => {
      setRendering(true); setError('');
      try {
        const out = await runPipeline(file.bytes, pipelineSteps);
        if (seq !== renderSeq.current) return;
        outBytesRef.current = out;
        const px = settings.previewQuality === 'auto'
          ? (file.info.count > 16 ? 700 : 1000)
          : QUALITY_PX[settings.previewQuality];
        const r = await rasterizePdfSheets(out, { maxPx: px, maxPages: MAX_SHEETS, fillWhite: fillBg });
        if (seq !== renderSeq.current) return;
        setSheets(r.sheets); setTotalSheets(r.total);
      } catch (e) {
        if (seq === renderSeq.current) setError(e instanceof Error ? e.message : 'Processing failed');
      } finally {
        if (seq === renderSeq.current) setRendering(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [file, stepsSig, pipelineSteps, paused, fillBg, settings.previewQuality]);

  // Track the sheet nearest the top of the viewport for the page pill.
  const onCanvasScroll = () => {
    const el = canvasRef.current; if (!el) return;
    const kids = el.querySelectorAll('[data-sheet]');
    let best = 1, bestD = Infinity;
    kids.forEach((k) => {
      const r = (k as HTMLElement).getBoundingClientRect();
      const d = Math.abs(r.top - el.getBoundingClientRect().top - 20);
      if (d < bestD) { bestD = d; best = +(k as HTMLElement).dataset.sheet!; }
    });
    setCurrentSheet(best);
  };

  const fitToWindow = () => {
    const el = canvasRef.current;
    if (!el || !sheets.length) return;
    const sh = sheets[0]!;
    const availH = el.clientHeight - 90, availW = el.clientWidth - 70;
    const baseH = 260, baseW = 260 * (sh.wPt / sh.hPt);
    setZoom(Math.max(0.2, Math.min(availH / baseH, availW / baseW, 4)));
  };

  // ── Export ──────────────────────────────────────────────────────────────────
  const toolLabel = useMemo(() => {
    const first = steps.find((st) => findOp(st.type));
    return first ? findOp(first.type)!.label.replace(/\s+/g, '') : 'Pipeline';
  }, [steps]);

  const outPaper = sheets.length ? paperName(sheets[0]!.wPt / 72, sheets[0]!.hPt / 72) : file ? paperName(file.info.widthIn, file.info.heightIn) : '';

  async function buildFinal(bytes?: Uint8Array): Promise<Uint8Array> {
    let out = bytes ?? (outBytesRef.current && !paused ? outBytesRef.current : await runPipeline(file!.bytes, pipelineSteps));
    if (Object.values(jobInfo).some((v) => v.trim())) out = await setPdfJobInfo(out, jobInfo);
    return out;
  }
  const namedOutput = () => resolveName(settings.nameTemplate, {
    fileName: file?.name ?? 'output', tool: toolLabel, pages: totalSheets || file?.info.count || 0,
    paperSize: outPaper, custom: settings.customText,
  });

  async function doDownload() {
    if (!file || rendering) return;
    if (gateExport && !gateExport()) return;
    try {
      setRendering(true);
      const out = await buildFinal();
      const sp = splitStep(steps);
      if (sp) {
        const parts = await runSplit(out, sp);
        parts.forEach((p, i) => downloadPdf(p, namedOutput().replace(/\.pdf$/, `-part${i + 1}.pdf`)));
      } else {
        downloadPdf(out, namedOutput());
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Export failed'); }
    finally { setRendering(false); }
  }

  async function doPrint() {
    if (!file) return;
    if (gateExport && !gateExport()) return;
    try {
      const out = await buildFinal();
      const url = URL.createObjectURL(new Blob([out as BlobPart], { type: 'application/pdf' }));
      const frame = document.createElement('iframe');
      frame.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden';
      frame.src = url;
      frame.onload = () => {
        try { frame.contentWindow?.focus(); frame.contentWindow?.print(); } catch { window.open(url, '_blank'); }
        setTimeout(() => { document.body.removeChild(frame); URL.revokeObjectURL(url); }, 60000);
      };
      document.body.appendChild(frame);
    } catch (e) { setError(e instanceof Error ? e.message : 'Print failed'); }
  }

  function downloadJdf() {
    if (!file || !sheets.length) return;
    const cutter = steps.find((st) => st.enabled && (st.type === 'cuttermarks' || st.type === 'regmarks'));
    const dims = sheets.map((sh) => ({ wPt: sh.wPt, hPt: sh.hPt }));
    // Preview may be capped — extend by repeating the last sheet size.
    while (dims.length < totalSheets) dims.push(dims[dims.length - 1]!);
    const xml = buildJdf({
      fileName: `${file.name.replace(/\.pdf$/i, '')}-${steps.map((st) => findOp(st.type)?.label.replace(/\s+/g, '')).filter(Boolean).join('-')}.pdf`,
      sheets: dims,
      cutMarginPt: (cutter?.s.marginIn ?? 0.2) * 72,
    });
    downloadFile(new TextEncoder().encode(xml), namedOutput().replace(/\.pdf$/, '.jdf'), 'application/vnd.cip4-jdf+xml');
  }

  async function runBatch(files: BatchFile[], progress: (d: number, t: number) => void) {
    const outs: { name: string; data: Uint8Array }[] = [];
    for (let i = 0; i < files.length; i++) {
      progress(i, files.length);
      const out = await runPipeline(files[i]!.bytes, pipelineSteps);
      outs.push({ name: resolveName(settings.nameTemplate, { fileName: files[i]!.name, tool: toolLabel, pages: 0, paperSize: outPaper, custom: settings.customText }), data: out });
    }
    progress(files.length, files.length);
    if (outs.length === 1) downloadPdf(outs[0]!.data, outs[0]!.name);
    else downloadFile(makeZip(outs), 'batch-output.zip', 'application/zip');
  }

  // Page-manager apply: reorder/delete/duplicate the SOURCE document.
  async function applyPageOrder(order: number[]) {
    if (!file) return;
    try {
      const next = await shufflePages(file.bytes, order.map((i) => i + 1).join(','));
      const info = await getPdfInfo(next);
      setFile({ ...file, bytes: next, info });
    } catch (e) { setError(e instanceof Error ? e.message : 'Reorder failed'); }
  }
  async function downloadPageOrder(order: number[]) {
    if (!file) return;
    if (gateExport && !gateExport()) return;
    try {
      const next = await shufflePages(file.bytes, order.map((i) => i + 1).join(','));
      downloadPdf(next, file.name.replace(/\.pdf$/i, '') + '-pages.pdf');
    } catch { /* surfaced via preview */ }
  }

  const cooldownLeft = useCountdown(usage?.cooldownUntil ?? 0);
  void cooldownLeft;

  const sheet1 = sheets[0];
  const pillW = sheet1 ? sheet1.wPt / 72 : file?.info.widthIn ?? 0;
  const pillH = sheet1 ? sheet1.hPt / 72 : file?.info.heightIn ?? 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={`pe ${theme === 'dark' ? 'pe-dark' : ''}`}>
      {/* App bar */}
      <div className="pe-appbar">
        <div className="pe-brand"><span className="pe-brand-mark"><Ic name="gridview" size={15} /></span>ImpositionPDF</div>
        <div style={{ position: 'relative' }}>
          <button className="pe-filemenu" onClick={() => setMenu(menu === 'file' ? null : 'file')}>File <Ic name="chevron" size={14} /></button>
          {menu === 'file' && (
            <div className="pe-menu pe-menu-left" onMouseLeave={() => setMenu(null)}>
              <button className="pe-menu-item" onClick={() => { inputRef.current?.click(); setMenu(null); }}><span className="pe-menu-main">Open PDF…</span></button>
              <button className="pe-menu-item" disabled={!steps.length} onClick={() => {
                const name = window.prompt('Workflow name', 'My workflow');
                if (name) saveWorkflow(name, steps);
                setMenu(null);
              }}><span className="pe-menu-main">Save Workflow</span></button>
              <button className="pe-menu-item" onClick={() => setMenu('load')}><span className="pe-menu-main">Load Workflow ▸</span></button>
              <button className="pe-menu-item" disabled={!steps.length} onClick={() => {
                const blob = new Blob([JSON.stringify(steps.map((st) => ({ type: st.type, s: st.s })), null, 2)], { type: 'application/json' });
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'workflow.json'; a.click();
                setMenu(null);
              }}><span className="pe-menu-main">Export Workflow JSON</span></button>
              <button className="pe-menu-item" onClick={() => {
                const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json';
                inp.onchange = async () => {
                  try {
                    const f = inp.files?.[0]; if (!f) return;
                    const data = JSON.parse(await f.text());
                    if (Array.isArray(data)) setSteps(workflowToSteps({ name: '', savedAt: 0, steps: data }));
                  } catch { /* invalid */ }
                };
                inp.click(); setMenu(null);
              }}><span className="pe-menu-main">Import Workflow JSON</span></button>
              <button className="pe-menu-item" disabled={!file} onClick={() => { setFile(null); setSheets([]); setTotalSheets(0); setMenu(null); }}>
                <span className="pe-menu-main">Close File</span>
              </button>
            </div>
          )}
          {menu === 'load' && (
            <div className="pe-menu pe-menu-left" onMouseLeave={() => setMenu(null)}>
              <div className="pe-menu-label">SAVED WORKFLOWS</div>
              {listWorkflows().length === 0 && <div className="pe-menu-foot">Nothing saved yet.</div>}
              {listWorkflows().map((w) => (
                <div key={w.name} className="pe-menu-item" style={{ display: 'flex', alignItems: 'center' }}>
                  <button style={{ all: 'unset', cursor: 'pointer', flex: 1 }} onClick={() => { setSteps(workflowToSteps(w)); setMenu(null); }}>
                    <span className="pe-menu-main">{w.name}</span>
                    <span className="pe-menu-sub">{w.steps.map((s2) => findOp(s2.type)?.label).filter(Boolean).join(' → ')}</span>
                  </button>
                  <button className="pe-iconbtn" onClick={() => { deleteWorkflow(w.name); setMenu(null); }}><Ic name="trash" size={13} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="pe-appbar-right">
          {settings.features.dpiPreflight && <span className="pe-usage" title={`DPI preflight target: ${settings.dpiProfile}`}>{settings.dpiProfile.toUpperCase()}</span>}
          {usage && (usage.isPro ? <span className="pe-usage pe-pro">✦ Pro · unlimited</span> : <span className="pe-usage">{usage.remaining} free download{usage.remaining === 1 ? '' : 's'} left</span>)}
          {onUpgrade}
          {onSignIn ?? <span className="pe-signin"><Ic name="user" size={16} /> Sign In</span>}
          {file && <span className="pe-filepill"><Ic name="file" size={15} /><span className="pe-filename">{file.name}</span><Ic name="chevron" size={14} /></span>}
          <button className="pe-iconbtn" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} title="Toggle theme">{theme === 'dark' ? '☀' : '☾'}</button>
          <span className="pe-lang"><Ic name="globe" size={16} /> EN</span>
        </div>
      </div>

      {/* Preview toolbar */}
      <div className="pe-toolbar">
        <button className="pe-iconbtn" title="Fit to window" onClick={fitToWindow}><Ic name="fit" size={18} /></button>
        <button className="pe-iconbtn" title="Zoom in" onClick={() => setZoom((z) => Math.min(4, z + 0.15))}><Ic name="zoomin" size={18} /></button>
        <button className="pe-iconbtn" title="Zoom out" onClick={() => setZoom((z) => Math.max(0.2, z - 0.15))}><Ic name="zoomout" size={18} /></button>
        <span className="pe-tb-div" />
        <button className={`pe-iconbtn ${paused ? 'pe-active' : ''}`} title={paused ? 'Resume live preview' : 'Pause live preview'} onClick={() => setPaused((p) => !p)}><Ic name={paused ? 'play' : 'pause'} size={18} /></button>
        <span className="pe-tb-div" />
        <button className={`pe-iconbtn ${showNumbers ? 'pe-active' : ''}`} title="Overlay page numbers" onClick={() => setShowNumbers((v) => !v)}><Ic name="hash" size={18} /></button>
        <button className={`pe-iconbtn ${settings.showCutBlocks ? 'pe-active' : ''}`} title="Show JDF cut blocks" onClick={() => updateSettings({ ...settings, showCutBlocks: !settings.showCutBlocks })}><Ic name="layers" size={18} /></button>
        <button className={`pe-iconbtn ${showRules ? 'pe-active' : ''}`} title="Draw rules" onClick={() => setShowRules((v) => !v)}><Ic name="rules" size={18} /></button>
        <button className={`pe-iconbtn ${fillBg ? 'pe-active' : ''}`} title="Fill background" onClick={() => setFillBg((v) => !v)}><Ic name="fillbg" size={18} /></button>
        <button className="pe-iconbtn" title="Settings" onClick={() => setModal('settings')}><Ic name="settings" size={18} /></button>
        <button className="pe-iconbtn" title="Job info" onClick={() => setModal('jobinfo')}><Ic name="info" size={18} /></button>
        <button className="pe-iconbtn" title="Page manager" disabled={!file} onClick={() => setModal('pagemanager')}><Ic name="columns" size={18} /></button>
        <button className="pe-tb-chip pe-tb-chip-btn" title="Download JDF" disabled={!file || !sheets.length} onClick={downloadJdf}><Ic name="jdf" size={16} /> JDF</button>
        <div className="pe-tb-right">
          <div style={{ position: 'relative' }}>
            <button className="pe-tb-chip pe-tb-chip-btn" onClick={() => setMenu(menu === 'quality' ? null : 'quality')}>
              <i className="pe-menu-dot" style={{ background: 'var(--pe-violet)' }} />
              {settings.previewQuality === 'auto' ? 'Auto' : settings.previewQuality === 'ultralow' ? 'Ultra Low' : settings.previewQuality[0]!.toUpperCase() + settings.previewQuality.slice(1)}
              <Ic name="chevron" size={13} />
            </button>
            {menu === 'quality' && <QualityMenu value={settings.previewQuality} onChange={(q) => updateSettings({ ...settings, previewQuality: q })} onClose={() => setMenu(null)} />}
          </div>
          <button className="pe-tb-chip pe-tb-chip-btn" disabled={!file || !steps.length} onClick={() => setModal('batch')}>
            <Ic name="batch" size={15} /> Batch {!usage?.isPro && <span className="pe-crown"><Ic name="crown" size={13} /></span>}
          </button>
          <div style={{ position: 'relative' }}>
            <button className="pe-tb-chip pe-tb-chip-btn" title="Ask AI — describe the job, get a workflow" onClick={() => setMenu(menu === 'askai' ? null : 'askai')}>
              <Ic name="sparkle" size={15} /> Ask AI
            </button>
            {menu === 'askai' && <AskAIPanel onApply={(next) => setSteps(next)} onClose={() => setMenu(null)} />}
          </div>
          <button className="pe-btn pe-btn-print" disabled={!file} onClick={doPrint}><Ic name="print" size={16} /> Print</button>
          <button className="pe-btn pe-btn-dl" disabled={!file || rendering} onClick={doDownload}>
            <Ic name="download" size={16} /> {rendering ? '…' : 'Download'}
          </button>
          <button className="pe-iconbtn" title="Clear operations" disabled={!steps.length} onClick={() => setSteps([])}><Ic name="eraser" size={17} /></button>
        </div>
      </div>

      {/* Body */}
      <div className="pe-body">
        <aside className="pe-side">
          {steps.length === 0 || adding ? (
            <>
              {adding && (
                <button className="pe-back" style={{ marginBottom: 10 }} onClick={() => setAdding(false)}><Ic name="back" size={14} /> Back to workflow</button>
              )}
              <button className="pe-templates-cta" onClick={() => setModal('templates')}>
                <Ic name="save" size={16} /> Templates &amp; Recipes
                <span className="pe-label-sm" style={{ marginLeft: 'auto' }}>225 presets</span>
              </button>
              <ChooseOperation
                showTips={adding}
                title={adding ? 'Choose Next Step' : 'Choose Operation'}
                onSelect={addStep}
                hidden={visibleHidden}
                onToggleHidden={(id, hide) => updateSettings({
                  ...settings,
                  hiddenTools: hide ? [...settings.hiddenTools, id] : settings.hiddenTools.filter((t) => t !== id),
                })}
              />
            </>
          ) : (
            <>
              {steps.map((st, i) => (
                <React.Fragment key={st.id}>
                  {i > 0 && <div className="pe-step-connector"><i /></div>}
                  <StepCard
                    step={st} index={i} unit={unit} onUnit={setUnit} pageCount={file?.info.count}
                    thumbs={srcThumbs} pageSizes={pageSizes} layerEntries={layerEntries} onToggleLayer={toggleLayer} sourceBytes={file?.bytes ?? null}
                    onChange={(next) => changeStep(i, next)}
                    onRemove={() => removeStep(i)}
                    onMove={(dir) => moveStep(i, dir)}
                    canUp={i > 0} canDown={i < steps.length - 1}
                  />
                </React.Fragment>
              ))}
              <div className="pe-panel-foot">
                <button className="pe-foot-btn pe-foot-add" onClick={() => setAdding(true)}><Ic name="addstep" size={15} /> ADD STEP</button>
                <button className="pe-foot-btn pe-foot-save" onClick={() => {
                  const name = window.prompt('Workflow name', 'My workflow');
                  if (name) saveWorkflow(name, steps);
                }}><Ic name="save" size={15} /> SAVE WORKFLOW</button>
              </div>
            </>
          )}
        </aside>

        <main ref={canvasRef} className={`pe-canvas-wrap ${fillBg ? '' : 'pe-nofill'}`} onScroll={onCanvasScroll}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); onPick(e.dataTransfer.files); }}>
          {!file ? (
            <div className={`pe-drop ${drag ? 'pe-dragging' : ''}`}>
              <Ic name="download" size={40} />
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--pe-ink)' }}>Drop a PDF to start</div>
              <div style={{ fontSize: 13 }}>Processed locally — nothing is uploaded.</div>
              <button className="pe-drop-btn" onClick={() => inputRef.current?.click()}>Choose PDF</button>
            </div>
          ) : (
            <>
              <div className="pe-sheets">
                {sheets.map((sh, si) => {
                  const baseH = 260 * zoom;
                  const w = baseH * (sh.wPt / sh.hPt), h = baseH;
                  const pxPerIn = w / (sh.wPt / 72);
                  const spacingPx = Math.max(4, settings.rulerSpacingIn * pxPerIn);
                  const cutM = (steps.find((st) => st.enabled && (st.type === 'cuttermarks' || st.type === 'regmarks'))?.s.marginIn ?? 0.2) * pxPerIn;
                  return (
                    <div key={si} data-sheet={si + 1} className={`pe-sheet ${fillBg ? '' : 'pe-sheet-clear'}`} style={{ width: w, height: h }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sh.url} alt={`Sheet ${si + 1}`} draggable={false} />
                      {showRules && (
                        <span className="pe-rules" style={{
                          backgroundSize: `${spacingPx}px ${spacingPx}px`,
                          backgroundPosition: settings.rulerOrigin === 'tl' ? '0 0' : settings.rulerOrigin === 'tr' ? '100% 0' : settings.rulerOrigin === 'bl' ? '0 100%' : '100% 100%',
                        }} />
                      )}
                      {settings.showCutBlocks && (
                        <span className="pe-cutblock" style={{ inset: cutM, borderColor: settings.cutBlockColor }} />
                      )}
                      {showNumbers && <span className="pe-sheetnum">{si + 1}{totalSheets > 1 ? ` · ${si % 2 === 0 ? 'A' : 'B'}` : ''}</span>}
                    </div>
                  );
                })}
              </div>
              {totalSheets > sheets.length && (
                <div className="pe-more-note">Preview shows the first {sheets.length} of {totalSheets} sheets — exports always include every sheet.</div>
              )}
              {rendering && <div className="pe-rendering"><span className="pe-spin" /> Imposing…</div>}
              {paused && <div className="pe-paused-note"><Ic name="pause" size={13} /> Live preview paused</div>}
              {error && <div className="pe-error">{error}</div>}
            </>
          )}

          {file && sheets.length > 0 && (
            <div className="pe-pill">
              <Ic name="file" size={14} /> <b>PAGE {currentSheet}</b>
              <span className="pe-pill-badge">{outPaper.toUpperCase()}</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span className="pe-violet-dot">⤢</span>
              <b>{fmtIn(pillH, unit)} × {fmtIn(pillW, unit)}</b> <span style={{ opacity: 0.6 }}>{unit}</span>
              <Ic name="info" size={13} />
            </div>
          )}
        </main>
        {inspector.open && (
          <PreflightInspector report={inspector.report} running={inspector.running}
            onClose={() => setInspector((s) => ({ ...s, open: false }))} />
        )}
      </div>

      <input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => onPick(e.target.files)} />

      {/* Modals */}
      {modal === 'settings' && (
        <SettingsModal settings={settings} onChange={updateSettings} onClose={() => setModal(null)}
          exampleCtx={{ fileName: file?.name ?? 'MyDocument.pdf', tool: toolLabel, pages: totalSheets || 8, paperSize: outPaper || 'A3' }} />
      )}
      {modal === 'jobinfo' && (
        <JobInfoModal job={jobInfo} onChange={setJobInfo} onClose={() => setModal(null)} sourceBytes={file?.bytes ?? null}
          onFillSlugline={(text) => {
            setSteps((s) => {
              const i = s.findIndex((st) => st.type === 'slugline');
              if (i >= 0) return s.map((st, j) => (j === i ? { ...st, s: { ...st.s, text } } : st));
              const st = makeStep('slugline'); st.s.text = text;
              return [...s, st];
            });
          }} />
      )}
      {modal === 'pagemanager' && file && (
        <PageManagerModal thumbs={srcThumbs} pageCount={file.info.count} onClose={() => setModal(null)}
          onApply={applyPageOrder} onDownload={downloadPageOrder} />
      )}
      {modal === 'batch' && (
        <BatchModal initial={file ? [{ name: file.name, bytes: file.bytes }] : []} isPro={!!usage?.isPro}
          onClose={() => setModal(null)} onRun={runBatch} />
      )}
      {modal === 'templates' && (
        <TemplatesModal onClose={() => setModal(null)} onApply={(next) => setSteps(next)} />
      )}
      {modal === 'vdp' && (
        <VdpWizard onClose={() => setModal(null)} onDone={async (pdf, records) => {
          try {
            const info = await getPdfInfo(pdf);
            setFile({ name: `data-merge-${records}-records.pdf`, bytes: pdf, info });
          } catch { setError('Generated merge could not be loaded.'); }
        }} />
      )}
      {modal === 'editpdf' && file && (
        <EditPdfModal thumbs={srcThumbs} pageSizes={pageSizes} onClose={() => setModal(null)}
          onApply={async (transform) => {
            try {
              const next = await transform(file.bytes);
              const info = await getPdfInfo(next);
              setFile({ ...file, bytes: next, info });
            } catch (e) { setError(e instanceof Error ? e.message : 'Edit failed'); }
          }} />
      )}
    </div>
  );
}
