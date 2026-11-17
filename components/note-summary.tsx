'use client';

import { useMemo, useState } from 'react';
import {
  BookOpen, Check, ChevronDown, ChevronRight, Clipboard, Edit3, Plus,
  RefreshCw, Sparkles, Trash2, X,
} from 'lucide-react';
import type { NoteSummary } from '@/types/study';

const emptySummary: NoteSummary = {
  overview: '',
  sections: [],
  keyTakeaways: [],
  quickReview: '',
};

export function NoteSummaryCard({
  summary,
  onChange,
  onRegenerate,
  regenerating = false,
}: {
  summary?: NoteSummary;
  onChange?: (summary: NoteSummary) => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState<number[]>([0]);
  const [copied, setCopied] = useState(false);
  const value = summary ?? emptySummary;
  const editable = Boolean(onChange);

  const copyText = useMemo(() => {
    const sections = value.sections.map((section) => [
      section.heading,
      section.summary,
      ...section.keyPoints.map((point) => `• ${point}`),
    ].join('\n')).join('\n\n');
    return [value.overview, 'KEY TAKEAWAYS', ...value.keyTakeaways.map((item) => `• ${item}`), sections, 'QUICK REVIEW', value.quickReview]
      .filter(Boolean).join('\n\n');
  }, [value]);

  function patch(next: Partial<NoteSummary>) {
    onChange?.({ ...value, ...next });
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function toggleSection(index: number) {
    setExpanded((current) => current.includes(index)
      ? current.filter((item) => item !== index)
      : [...current, index]);
  }

  return (
    <section className="note-summary surface" aria-label="AI-generated note summary">
      <div className="note-summary-head">
        <div className="note-summary-title-wrap">
          <div className="note-summary-icon"><BookOpen size={18} /></div>
          <div>
            <div className="note-summary-kicker"><Sparkles size={11} /> YOUR NOTES, MADE CLEAR</div>
            <h2>Chapter summary</h2>
            <p>A structured overview based only on the pages you uploaded.</p>
          </div>
        </div>
        <div className="note-summary-actions">
          {onRegenerate && <button className="button button-quiet button-small" onClick={onRegenerate} disabled={regenerating}>
            <RefreshCw size={13} className={regenerating ? 'spin-icon' : ''} /> {regenerating ? 'Refreshing' : 'Regenerate'}
          </button>}
          <button className="button button-quiet button-small" onClick={copySummary} disabled={!copyText.trim()}>
            {copied ? <Check size={13} /> : <Clipboard size={13} />} {copied ? 'Copied' : 'Copy summary'}
          </button>
          {editable && <button className={`button button-small ${editing ? 'button-secondary' : 'button-primary'}`} onClick={() => setEditing((current) => !current)}>
            {editing ? <><X size={13} /> Done editing</> : <><Edit3 size={13} /> Edit summary</>}
          </button>}
        </div>
      </div>

      {!value.overview && !value.sections.length && !value.keyTakeaways.length && !value.quickReview && (
        <div className="summary-empty"><Sparkles size={16} /> A summary will appear here after your notes are analyzed.</div>
      )}

      {editing && editable ? (
        <div className="summary-edit-grid">
          <label className="summary-field summary-field-wide">
            <span>OVERVIEW</span>
            <textarea rows={5} value={value.overview} onChange={(event) => patch({ overview: event.target.value })} placeholder="Write a clear overview of the chapter…" />
          </label>
          <div className="summary-edit-block summary-field-wide">
            <div className="summary-edit-heading"><div><strong>Section breakdown</strong><small>Organize the chapter into its main ideas.</small></div><button className="text-button" onClick={() => patch({ sections: [...value.sections, { heading: 'New section', summary: '', keyPoints: [] }] })}><Plus size={13} /> Add section</button></div>
            {value.sections.map((section, index) => <div className="summary-section-editor" key={`${index}-${section.heading}`}>
              <div className="summary-section-editor-top">
                <input aria-label={`Section ${index + 1} heading`} value={section.heading} onChange={(event) => patch({ sections: value.sections.map((item, i) => i === index ? { ...item, heading: event.target.value } : item) })} placeholder="Section heading" />
                <button className="summary-icon-button danger" aria-label={`Remove section ${index + 1}`} onClick={() => patch({ sections: value.sections.filter((_, i) => i !== index) })}><Trash2 size={14} /></button>
              </div>
              <textarea rows={3} aria-label={`Section ${index + 1} summary`} value={section.summary} onChange={(event) => patch({ sections: value.sections.map((item, i) => i === index ? { ...item, summary: event.target.value } : item) })} placeholder="Explain this part in a few clear sentences…" />
              <label className="summary-subfield"><span>KEY POINTS · ONE PER LINE</span><textarea rows={3} value={section.keyPoints.join('\n')} onChange={(event) => patch({ sections: value.sections.map((item, i) => i === index ? { ...item, keyPoints: event.target.value.split('\n').filter((point) => point.trim()) } : item) })} placeholder="First important point&#10;Second important point" /></label>
            </div>)}
          </div>
          <label className="summary-field summary-field-wide"><span>KEY TAKEAWAYS · ONE PER LINE</span><textarea rows={4} value={value.keyTakeaways.join('\n')} onChange={(event) => patch({ keyTakeaways: event.target.value.split('\n').filter((item) => item.trim()) })} placeholder="The most important ideas to remember…" /></label>
          <label className="summary-field summary-field-wide"><span>QUICK REVIEW</span><textarea rows={3} value={value.quickReview} onChange={(event) => patch({ quickReview: event.target.value })} placeholder="A compact last-minute recap…" /></label>
        </div>
      ) : (
        <div className="summary-reading">
          <div className="summary-overview-label">AT A GLANCE</div>
          <p className="summary-overview-text">{value.overview || 'No overview has been written yet.'}</p>

          {value.keyTakeaways.length > 0 && <div className="summary-takeaways">
            <div className="summary-block-heading"><span className="summary-heading-mark" /> <h3>Key takeaways</h3><span className="summary-count">{value.keyTakeaways.length}</span></div>
            <ol>{value.keyTakeaways.map((item, index) => <li key={`${index}-${item}`}><span className="takeaway-number">{String(index + 1).padStart(2, '0')}</span><span>{item}</span></li>)}</ol>
          </div>}

          {value.sections.length > 0 && <div className="summary-breakdown">
            <div className="summary-block-heading"><span className="summary-heading-mark" /> <h3>Break it down</h3><span className="summary-count">{value.sections.length} sections</span></div>
            <div className="summary-accordion">{value.sections.map((section, index) => {
              const isOpen = expanded.includes(index);
              return <article className={`summary-accordion-item ${isOpen ? 'is-open' : ''}`} key={`${index}-${section.heading}`}>
                <button className="summary-accordion-trigger" onClick={() => toggleSection(index)} aria-expanded={isOpen}>
                  <span className="summary-accordion-number">{String(index + 1).padStart(2, '0')}</span>
                  <strong>{section.heading}</strong>
                  <span className="summary-accordion-chevron">{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
                </button>
                {isOpen && <div className="summary-accordion-content"><p>{section.summary}</p>{section.keyPoints.length > 0 && <ul>{section.keyPoints.map((point, pointIndex) => <li key={`${pointIndex}-${point}`}>{point}</li>)}</ul>}</div>}
              </article>;
            })}</div>
          </div>}

          {value.quickReview && <div className="summary-quick-review"><div><Sparkles size={14} /><strong>Quick review</strong></div><p>{value.quickReview}</p></div>}
        </div>
      )}
    </section>
  );
}
