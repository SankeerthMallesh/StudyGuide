'use client';

import { ArrowLeft, BookOpen, ChevronDown, ChevronRight, Printer, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { StudyGuide } from '@/types/study';

export function StudyGuideStudio({ guides, onOpen }: { guides: StudyGuide[]; onOpen: (id: string) => void }) {
  return <div className="page-stack"><div className="page-heading-row"><div><div className="eyebrow">STRUCTURED REVISION</div><h1>Study guides</h1><p className="page-subtitle">Clean, organized summaries built from your source notes.</p></div><span className="metric-icon"><BookOpen size={18} /></span></div>
    {guides.length ? <div className="guide-grid">{[...guides].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map((guide) => <button className="surface guide-card" onClick={() => onOpen(guide.id)} key={guide.id}><span className="guide-card-icon"><BookOpen size={19} /></span><strong>{guide.title}</strong><span>{guide.sections.length} sections · {new Date(guide.createdAt).toLocaleDateString()}</span><span className="guide-open">Open guide <ChevronRight size={15} /></span></button>)}</div> : <div className="surface empty-state"><div className="empty-state-icon"><BookOpen size={23} /></div><h2>No study guides yet</h2><p>Generate a guide from a saved note collection to create a clean revision outline.</p></div>}
  </div>;
}

export function StudyGuideReader({ guide, onBack }: { guide: StudyGuide; onBack: () => void }) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<number[]>(guide.sections.map((_, index) => index));
  const sections = useMemo(() => guide.sections.map((section, index) => ({ ...section, originalIndex: index })).filter((section) => `${section.heading} ${section.content.join(' ')}`.toLowerCase().includes(query.toLowerCase())), [guide.sections, query]);
  const toggle = (index: number) => setExpanded((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  return <div className="page-stack guide-reader"><div className="page-heading-row"><div><button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Study guides</button><div className="eyebrow">YOUR REVISION GUIDE</div><h1>{guide.title}</h1><p className="page-subtitle">{guide.sections.length} sections · Created {new Date(guide.createdAt).toLocaleDateString()}</p></div><button className="button button-secondary" onClick={() => window.print()}><Printer size={15} /> Print</button></div>
    <div className="search-field guide-search"><Search size={16} /><input placeholder="Search within this guide..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
    <div className="guide-content">{sections.map((section) => <section className="surface guide-section" key={section.originalIndex}><button className="guide-section-head" onClick={() => toggle(section.originalIndex)}><span className="guide-section-number">{String(section.originalIndex + 1).padStart(2, '0')}</span><strong>{section.heading}</strong>{expanded.includes(section.originalIndex) ? <ChevronDown size={17} /> : <ChevronRight size={17} />}</button>{expanded.includes(section.originalIndex) && <ul>{section.content.map((item, index) => <li key={index}>{item}</li>)}</ul>}</section>)}{!sections.length && <div className="surface empty-state"><h2>No matching text</h2><p>Try another search phrase.</p></div>}</div>
  </div>;
}
