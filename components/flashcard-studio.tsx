'use client';

import { ArrowLeft, ArrowRight, BrainCircuit, Check, Layers3, RotateCcw, Shuffle, Star, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Flashcard, FlashcardDeck } from '@/types/study';

export function FlashcardStudio({ decks, onStudy, onDelete }: {
  decks: FlashcardDeck[];
  onStudy: (deckId: string) => void;
  onDelete: (deckId: string) => void;
}) {
  const cards = decks.reduce((sum, deck) => sum + deck.cards.length, 0);
  const due = decks.reduce((sum, deck) => sum + deck.cards.filter((card) => card.nextReviewAt && new Date(card.nextReviewAt) <= new Date()).length, 0);
  return <div className="page-stack"><div className="page-heading-row"><div><div className="eyebrow">ACTIVE RECALL</div><h1>Flashcards</h1><p className="page-subtitle">Practice retrieval, one idea at a time.</p></div><span className="metric-icon"><Layers3 size={18} /></span></div>
    <div className="metric-strip"><div><strong>{decks.length}</strong><span>Decks</span></div><div><strong>{cards}</strong><span>Total cards</span></div><div><strong>{due}</strong><span>Due for review</span></div></div>
    {decks.length ? <div className="deck-list">{[...decks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((deck) => {
      const review = deck.cards.filter((card) => card.status === 'review').length;
      const known = deck.cards.filter((card) => card.status === 'known').length;
      return <article className="surface deck-card" key={deck.id}><div className="deck-art"><Layers3 size={23} /><span>{deck.cards.length}</span></div><div className="deck-copy"><strong>{deck.title}</strong><span>{deck.cards.length} cards · {new Date(deck.createdAt).toLocaleDateString()}</span><div className="deck-progress"><i style={{ width: `${deck.cards.length ? known / deck.cards.length * 100 : 0}%` }} /></div><small>{known} known · {review} marked for review</small></div><button className="button button-primary button-small" onClick={() => onStudy(deck.id)}>Study deck <ArrowRight size={14} /></button><button className="icon-button" aria-label="Delete deck" onClick={() => onDelete(deck.id)}><X size={15} /></button></article>;
    })}</div> : <div className="surface empty-state"><div className="empty-state-icon"><BrainCircuit size={23} /></div><h2>No flashcard decks yet</h2><p>Open a note collection and generate your first set. Cards will be written from the material you uploaded.</p></div>}
  </div>;
}

export function FlashcardSession({ deck, onUpdate, onFinish, onExit }: {
  deck: FlashcardDeck;
  onUpdate: (cards: Flashcard[]) => void;
  onFinish: (summary: { studied: number; known: number; review: number; durationSeconds: number }) => void;
  onExit: () => void;
}) {
  const [order, setOrder] = useState(() => deck.cards.map((card) => card.id));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState<string[]>([]);
  const [reviewIds, setReviewIds] = useState<string[]>([]);
  const [startedAt] = useState(() => Date.now());
  const active = deck.cards.find((card) => card.id === order[index]);
  const progress = order.length ? (index + 1) / order.length * 100 : 0;

  const shuffled = () => { setOrder((current) => [...current].sort(() => Math.random() - 0.5)); setIndex(0); setFlipped(false); };
  const mark = (status: 'known' | 'review') => {
    if (!active) return;
    const now = new Date();
    const next = new Date(now);
    next.setDate(next.getDate() + (status === 'known' ? Math.min(30, Math.max(3, Math.pow(2, active.reviewCount))) : 1));
    onUpdate(deck.cards.map((card) => card.id === active.id ? { ...card, status, reviewCount: card.reviewCount + 1, lastReviewedAt: now.toISOString(), nextReviewAt: next.toISOString() } : card));
    if (status === 'known') setKnownIds((current) => current.includes(active.id) ? current : [...current, active.id]);
    else setReviewIds((current) => current.includes(active.id) ? current : [...current, active.id]);
    nextCard(status);
  };
  const nextCard = (lastStatus: 'known' | 'review') => { if (index >= order.length - 1) { const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000)); onFinish({ studied: Math.min(order.length, knownIds.length + reviewIds.length + 1), known: knownIds.length + (lastStatus === 'known' ? 1 : 0), review: reviewIds.length + (lastStatus === 'review' ? 1 : 0), durationSeconds }); } else { setIndex((current) => current + 1); setFlipped(false); } };

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
      if (event.code === 'Space') { event.preventDefault(); setFlipped((value) => !value); }
      if (event.key === 'ArrowLeft' && index > 0) { setIndex((value) => value - 1); setFlipped(false); }
      if (event.key === 'ArrowRight' && flipped && index < order.length - 1) { setIndex((value) => value + 1); setFlipped(false); }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flipped, index, order.length]);
  if (!active) return <div className="surface empty-state"><h2>This deck has no cards</h2><button className="button button-secondary" onClick={onExit}>Back to decks</button></div>;

  return <div className="flash-session-wrap"><div className="session-top"><button className="back-link" onClick={onExit}><ArrowLeft size={15} /> Exit session</button><div className="session-deck-label">{deck.title}</div><button className="icon-button" aria-label="Shuffle cards" onClick={shuffled}><Shuffle size={16} /></button></div>
    <div className="session-progress"><div><span>Card {index + 1} of {order.length}</span><span>{Math.round(progress)}% complete</span></div><div className="progress-rail"><i style={{ width: `${progress}%` }} /></div></div>
    <button className={`flashcard-face ${flipped ? 'is-flipped' : ''}`} onClick={() => setFlipped((value) => !value)} aria-label={flipped ? 'Show question' : 'Reveal answer'}>
      <div className="flashcard-face-top"><span>{flipped ? 'ANSWER' : 'QUESTION'}</span><span className={`difficulty-tag ${active.difficulty}`}>{active.difficulty}</span></div>
      <div className="flashcard-face-content">{flipped ? active.back : active.front}</div>
      <div className="flashcard-face-bottom">{flipped ? 'Tap to see question' : 'Tap to reveal answer'} <span>↗</span></div>
    </button>
    <div className="session-controls"><button className="button button-secondary" disabled={index === 0} onClick={() => { setIndex((v) => v - 1); setFlipped(false); }}><ArrowLeft size={15} /> Previous</button><button className="button button-quiet" onClick={() => setFlipped((v) => !v)}><RotateCcw size={15} /> Flip card</button><button className="button button-primary" onClick={() => setFlipped(true)}>Show answer <ArrowRight size={15} /></button></div>
    {flipped && <div className="recall-actions"><span>How well did you remember this?</span><button onClick={() => mark('review')}><X size={15} /> Need to review</button><button onClick={() => mark('known')}><Check size={15} /> I knew it</button></div>}
    <div className="session-counts"><span><Check size={14} /> {knownIds.length} known</span><span><Star size={14} /> {reviewIds.length} to review</span></div>
  </div>;
}
