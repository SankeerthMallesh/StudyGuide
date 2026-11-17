'use client';

import { BookOpen, ChevronRight, FileText, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { StudyMaterial } from '@/types/study';
import { NoteSummaryCard } from '@/components/note-summary';

export function MaterialLibrary({ materials, onUpload, onDelete, onOpen }: {
  materials: StudyMaterial[];
  onUpload: () => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => materials.filter((item) => `${item.title} ${item.subject} ${item.notes.topics.join(' ')} ${item.notes.summary?.overview ?? ''}`.toLowerCase().includes(query.toLowerCase())), [materials, query]);
  return <div className="page-stack">
    <div className="page-heading-row"><div><div className="eyebrow">YOUR KNOWLEDGE BASE</div><h1>My notes</h1><p className="page-subtitle">Every lesson, organized and ready to study.</p></div><button className="button button-primary" onClick={onUpload}><Plus size={16} /> Add notes</button></div>
    <div className="library-toolbar"><div className="search-field"><Search size={16} /><input placeholder="Search notes, subjects, topics..." value={query} onChange={(event) => setQuery(event.target.value)} /></div><span>{filtered.length} {filtered.length === 1 ? 'collection' : 'collections'}</span></div>
    {filtered.length ? <div className="material-grid">{filtered.map((material) => <article className="surface material-card" key={material.id}><div className="material-card-top"><span className="material-symbol"><FileText size={19} /></span><button className="icon-button" aria-label="Delete material" onClick={() => onDelete(material.id)}><Trash2 size={15} /></button></div><button className="material-card-main" onClick={() => onOpen(material.id)}><strong>{material.title}</strong><span className="subject-tag">{material.subject || 'Uncategorized'}</span><p>{material.notes.summary?.overview || material.notes.topics.slice(0, 3).join(' · ') || 'No topics added'}</p><div className="material-card-foot"><span>{material.pageCount} {material.pageCount === 1 ? 'page' : 'pages'}</span><span>{material.notes.definitions.length + material.notes.keyTerms.length + material.notes.importantFacts.length} extracted items</span></div><div className="material-open"><span>Open material</span><ChevronRight size={15} /></div></button></article>)}</div> : <div className="surface empty-state"><div className="empty-state-icon"><BookOpen size={23} /></div><h2>{query ? 'No matching notes' : 'Your notes library is ready'}</h2><p>{query ? 'Try a different title, subject, or topic.' : 'Upload a photo of your class notes and StudyFlow will organize the important ideas for you.'}</p>{!query && <button className="button button-primary" onClick={onUpload}><Plus size={15} /> Upload your first notes</button>}</div>}
  </div>;
}

export function MaterialDetail({ material, onBack, onGenerate }: {
  material: StudyMaterial;
  onBack: () => void;
  onGenerate: (action: 'flashcards' | 'quiz' | 'test' | 'guide', materialId: string) => void;
}) {
  const notes = material.notes;
  return <div className="page-stack"><div className="page-heading-row"><div><button className="back-link" onClick={onBack}><ChevronRight className="back-chevron" size={14} /> My notes</button><div className="eyebrow">{material.subject || 'STUDY MATERIAL'}</div><h1>{material.title}</h1><p className="page-subtitle">{material.pageCount} pages · Added {new Date(material.createdAt).toLocaleDateString()}</p></div></div>
    <div className="detail-actions"><button className="button button-primary" onClick={() => onGenerate('flashcards', material.id)}>Create flashcards</button><button className="button button-secondary" onClick={() => onGenerate('quiz', material.id)}>Generate quiz</button><button className="button button-secondary" onClick={() => onGenerate('guide', material.id)}>Study guide</button></div>
    {notes.summary && <NoteSummaryCard summary={notes.summary} />}
    {notes.topics.length > 0 && <section className="surface detail-section"><div className="section-heading"><div><h2>Topics covered</h2><p>Key areas identified in your notes</p></div></div><div className="topic-chips">{notes.topics.map((topic) => <span key={topic}>{topic}</span>)}</div></section>}
    <section className="surface detail-section"><div className="section-heading"><div><h2>Definitions & vocabulary</h2><p>{notes.definitions.length + notes.keyTerms.length} entries</p></div></div>{notes.definitions.length || notes.keyTerms.length ? <div className="definition-list">{notes.definitions.map((item, index) => <div className="definition-row" key={`d-${index}`}><strong>{item.term}</strong><span>{item.explanation}</span></div>)}{notes.keyTerms.map((item, index) => <div className="definition-row" key={`k-${index}`}><strong>{item.term}</strong><span>{item.meaning}</span></div>)}</div> : <p className="muted-empty">No definitions were identified in these notes.</p>}</section>
    <section className="surface detail-section"><div className="section-heading"><div><h2>Important facts</h2><p>{notes.importantFacts.length} extracted facts</p></div></div>{notes.importantFacts.length ? <ul className="fact-list">{notes.importantFacts.map((fact, index) => <li key={index}>{fact}</li>)}</ul> : <p className="muted-empty">No standalone facts were identified.</p>}</section>
    {notes.formulas.length > 0 && <section className="surface detail-section"><div className="section-heading"><div><h2>Formulas</h2><p>Expressions captured from your source pages</p></div></div>{notes.formulas.map((formula, index) => <div className="formula-review" key={index}><strong>{formula.name}</strong><code>{formula.expression}</code><p>{formula.explanation}</p></div>)}</section>}
    {notes.examples.length > 0 && <section className="surface detail-section"><div className="section-heading"><div><h2>Examples</h2></div></div>{notes.examples.map((example, index) => <div className="example-row" key={index}><strong>{example.concept}</strong><span>{example.example}</span></div>)}</section>}
    {notes.relationships.length > 0 && <section className="surface detail-section"><div className="section-heading"><div><h2>Connections</h2></div></div>{notes.relationships.map((rel, index) => <div className="example-row" key={index}><strong>{rel.conceptA} ↔ {rel.conceptB}</strong><span>{rel.relationship}</span></div>)}</section>}
    {notes.uncertainSections.length > 0 && <section className="uncertain-box"><strong>Some parts may need another look</strong>{notes.uncertainSections.map((item, index) => <p key={index}>“{item.excerpt}” — {item.reason}</p>)}</section>}
  </div>;
}
