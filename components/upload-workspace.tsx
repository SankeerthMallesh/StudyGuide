'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, FileImage, GripVertical, LoaderCircle, Plus, Sparkles, Trash2, UploadCloud, X, AlertCircle } from 'lucide-react';
import type { ExtractedNotes } from '@/types/study';
import { NoteSummaryCard } from '@/components/note-summary';

type UploadFile = { id: string; file: File; preview: string };

const accepted = ['image/jpeg', 'image/png', 'image/webp'];
const limitPerFile = 7 * 1024 * 1024;
const limitCount = 10;

function uid() { return crypto.randomUUID(); }

export function UploadWorkspace({ onCancel, onSave }: {
  onCancel: () => void;
  onSave: (notes: ExtractedNotes, files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState<'upload' | 'analyzing' | 'review'>('upload');
  const [notes, setNotes] = useState<ExtractedNotes | null>(null);
  const [error, setError] = useState('');
  const [regeneratingSummary, setRegeneratingSummary] = useState(false);

  function addFiles(incoming: FileList | File[]) {
    setError('');
    const items = Array.from(incoming);
    const valid: UploadFile[] = [];
    for (const file of items) {
      if (!accepted.includes(file.type)) { setError(`${file.name} is not supported. Use JPG, PNG, or WEBP images.`); continue; }
      if (file.size > limitPerFile) { setError(`${file.name} is larger than 7 MB. Choose a smaller image.`); continue; }
      if (files.length + valid.length >= limitCount) { setError('You can add up to 10 pages at a time.'); break; }
      valid.push({ id: uid(), file, preview: URL.createObjectURL(file) });
    }
    if (valid.length) setFiles((current) => [...current, ...valid].slice(0, limitCount));
  }

  function removeFile(id: string) {
    setFiles((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return current.filter((item) => item.id !== id);
    });
  }

  function moveFile(index: number, direction: -1 | 1) {
    setFiles((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function analyze() {
    if (!files.length) { setError('Add at least one image of your notes first.'); return; }
    setError(''); setStep('analyzing');
    try {
      const body = new FormData();
      files.forEach((item) => body.append('files', item.file));
      const response = await fetch('/api/analyze-notes', { method: 'POST', body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not analyze these pages.');
      setNotes(payload.notes as ExtractedNotes);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while reading your notes.');
      setStep('upload');
    }
  }

  function updateNotes(patch: Partial<ExtractedNotes>) {
    setNotes((current) => current ? { ...current, ...patch } : current);
  }

  async function regenerateSummary() {
    if (!notes || regeneratingSummary) return;
    setError('');
    setRegeneratingSummary(true);
    try {
      const response = await fetch('/api/summarize-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: notes.title, subject: notes.subject, notes: JSON.stringify(notes) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not regenerate the summary.');
      updateNotes({ summary: payload.summary });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while regenerating the summary.');
    } finally {
      setRegeneratingSummary(false);
    }
  }

  return (
    <div className="page-stack upload-page">
      <div className="page-heading-row">
        <div>
          <button className="back-link" onClick={onCancel}><ArrowLeft size={15} /> Back to workspace</button>
          <div className="eyebrow">NOTE SCANNER · {step === 'review' ? 'STEP 02 / 02' : 'STEP 01 / 02'}</div>
          <h1>{step === 'review' ? 'Review your notes' : 'Turn your notes into your next study session.'}</h1>
          <p className="page-subtitle">{step === 'review' ? 'Check the extracted content and fix anything before creating study materials.' : 'Add clear photos of your class notes. StudyFlow will organize the content before you build a study set.'}</p>
        </div>
        <div className="step-indicator"><span className={step !== 'upload' ? 'step-dot complete' : 'step-dot active'}>01</span><span className="step-line" /><span className={`step-dot ${step === 'review' ? 'active' : ''}`}>02</span></div>
      </div>

      {step === 'upload' && (
        <>
          <section className={`dropzone ${dragging ? 'dropzone-active' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}>
            <div className="upload-icon"><UploadCloud size={27} /></div>
            <h2>Drop your notes here</h2>
            <p>or browse files from your device</p>
            <button className="button button-primary" onClick={() => inputRef.current?.click()}><Plus size={16} /> Choose images</button>
            <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { if (event.target.files) addFiles(event.target.files); event.currentTarget.value = ''; }} />
            <div className="dropzone-footnote"><span>JPG</span><span>PNG</span><span>WEBP</span><i /> Up to 10 pages · 7 MB per image</div>
          </section>
          {files.length > 0 && <section className="surface upload-file-panel">
            <div className="section-heading"><div><h2>Pages to analyze</h2><p>{files.length} {files.length === 1 ? 'page' : 'pages'} · Arrange in reading order</p></div><button className="button button-quiet button-small" onClick={() => inputRef.current?.click()}><Plus size={14} /> Add pages</button></div>
            <div className="uploaded-grid">{files.map((item, index) => <div className="uploaded-item" key={item.id}>
              <div className="uploaded-thumb"><img src={item.preview} alt={`Page ${index + 1}`} /><span className="page-number">{String(index + 1).padStart(2, '0')}</span></div>
              <div className="uploaded-meta"><span className="uploaded-name" title={item.file.name}>{item.file.name}</span><span>{(item.file.size / 1024 / 1024).toFixed(1)} MB</span></div>
              <div className="uploaded-actions"><button aria-label="Move page up" disabled={index === 0} onClick={() => moveFile(index, -1)}><ArrowLeft size={13} /></button><button aria-label="Move page down" disabled={index === files.length - 1} onClick={() => moveFile(index, 1)}><ArrowRight size={13} /></button><button aria-label="Remove page" onClick={() => removeFile(item.id)}><X size={14} /></button></div>
            </div>)}</div>
          </section>}
          {error && <div className="inline-error"><AlertCircle size={16} />{error}</div>}
          <div className="upload-bottom-row"><div className="privacy-note"><span className="secure-dot" /> Your images are only sent to Gemini for analysis. Cloud file storage is optional.</div><button className="button button-primary button-large" disabled={!files.length} onClick={analyze}><Sparkles size={16} /> Analyze notes <ArrowRight size={16} /></button></div>
        </>
      )}

      {step === 'analyzing' && <section className="surface analyzing-panel">
        <div className="analyze-orbit"><div className="orbit-ring" /><div className="orbit-core"><Sparkles size={25} /></div></div>
        <h2>Making sense of your notes</h2><p>Gemini is reading {files.length} {files.length === 1 ? 'page' : 'pages'}, finding the important ideas, and writing a clear chapter summary.</p>
        <div className="analyze-progress"><span /></div><div className="analyze-checklist"><span><Check size={14} /> Image validation complete</span><span className="active"><LoaderCircle size={14} /> Extracting concepts and definitions</span><span><FileImage size={14} /> Writing the chapter summary and key takeaways</span></div>
      </section>}

      {step === 'review' && notes && <>
        <div className="review-banner"><Check size={16} /><span>Extraction complete. Review the summary and extracted details before saving.</span><span className="review-banner-count">{notes.definitions.length + notes.keyTerms.length + notes.importantFacts.length} items found</span></div>
        <NoteSummaryCard summary={notes.summary} onChange={(summary) => updateNotes({ summary })} onRegenerate={regenerateSummary} regenerating={regeneratingSummary} />
        <section className="surface review-editor">
          <div className="section-heading"><div><h2>Material details</h2><p>Give this note collection a useful name.</p></div><span className="ai-pill"><Sparkles size={12} /> Gemini extraction</span></div>
          <div className="form-grid"><label className="field-label">TITLE<input value={notes.title} onChange={(event) => updateNotes({ title: event.target.value })} maxLength={100} /></label><label className="field-label">SUBJECT<input value={notes.subject} onChange={(event) => updateNotes({ subject: event.target.value })} maxLength={80} placeholder="e.g. Biology" /></label></div>
          <div className="review-section"><div className="review-section-title"><h3>Topics</h3><span>{notes.topics.length}</span></div><input className="wide-field" value={notes.topics.join(', ')} onChange={(event) => updateNotes({ topics: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder="Separate topics with commas" /></div>
          <div className="review-section"><div className="review-section-title"><h3>Definitions</h3><span>{notes.definitions.length}</span></div>
            {notes.definitions.map((definition, index) => <div className="edit-pair" key={`${index}-${definition.term}`}><input aria-label="Term" value={definition.term} onChange={(event) => updateNotes({ definitions: notes.definitions.map((item, i) => i === index ? { ...item, term: event.target.value } : item) })} /><input aria-label="Definition" value={definition.explanation} onChange={(event) => updateNotes({ definitions: notes.definitions.map((item, i) => i === index ? { ...item, explanation: event.target.value } : item) })} /><button aria-label="Delete definition" onClick={() => updateNotes({ definitions: notes.definitions.filter((_, i) => i !== index) })}><Trash2 size={14} /></button></div>)}
            <button className="text-button" onClick={() => updateNotes({ definitions: [...notes.definitions, { term: '', explanation: '' }] })}><Plus size={14} /> Add definition</button>
          </div>
          <div className="review-section"><div className="review-section-title"><h3>Important facts</h3><span>{notes.importantFacts.length}</span></div>
            {notes.importantFacts.map((fact, index) => <div className="edit-fact" key={`${index}-${fact}`}><textarea rows={2} value={fact} onChange={(event) => updateNotes({ importantFacts: notes.importantFacts.map((item, i) => i === index ? event.target.value : item) })} /><button aria-label="Delete fact" onClick={() => updateNotes({ importantFacts: notes.importantFacts.filter((_, i) => i !== index) })}><Trash2 size={14} /></button></div>)}
            <button className="text-button" onClick={() => updateNotes({ importantFacts: [...notes.importantFacts, ''] })}><Plus size={14} /> Add fact</button>
          </div>
          {notes.formulas.length > 0 && <div className="review-section"><div className="review-section-title"><h3>Formulas</h3><span>{notes.formulas.length}</span></div>{notes.formulas.map((formula, index) => <div className="formula-review" key={index}><strong>{formula.name}</strong><code>{formula.expression}</code><p>{formula.explanation}</p></div>)}</div>}
          {notes.dates.length > 0 && <div className="review-section"><div className="review-section-title"><h3>Dates & events</h3><span>{notes.dates.length}</span></div>{notes.dates.map((item, index) => <div className="date-review" key={index}><strong>{item.date}</strong><span>{item.event}</span></div>)}</div>}
          {notes.uncertainSections.length > 0 && <div className="uncertain-box"><div><AlertCircle size={16} /><strong>Sections to double-check</strong></div>{notes.uncertainSections.map((item, index) => <p key={index}>“{item.excerpt}” — {item.reason}</p>)}</div>}
        </section>
        {error && <div className="inline-error"><AlertCircle size={16} />{error}</div>}
        <div className="upload-bottom-row"><button className="button button-secondary" onClick={() => setStep('upload')}><ArrowLeft size={15} /> Back to pages</button><button className="button button-primary button-large" disabled={!notes.title.trim()} onClick={() => onSave(notes, files.map((item) => item.file))}><Check size={16} /> Save material <ArrowRight size={16} /></button></div>
      </>}
    </div>
  );
}
