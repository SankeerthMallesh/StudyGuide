'use client';

import { Activity, ArrowRight, BookOpen, BrainCircuit, CalendarDays, Clock3, Flame, Layers3, Plus, Sparkles, Target, Trophy, UploadCloud } from 'lucide-react';
import type { StudyState } from '@/types/study';

const fmt = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });

function calculateStreak(sessions: StudyState['sessions']) {
  const days = new Set(sessions.map((session) => new Date(session.completedAt).toDateString()));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toDateString())) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}

export function Dashboard({ state, onNavigate, onUpload, onGenerate }: {
  state: StudyState;
  onNavigate: (page: string) => void;
  onUpload: () => void;
  onGenerate: (action: 'flashcards' | 'quiz' | 'test' | 'guide') => void;
}) {
  const totalCards = state.decks.reduce((sum, deck) => sum + deck.cards.length, 0);
  const avg = state.attempts.length ? Math.round(state.attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / state.attempts.length) : null;
  const streak = calculateStreak(state.sessions);
  const dueCards = state.decks.flatMap((deck) => deck.cards).filter((card) => card.nextReviewAt && new Date(card.nextReviewAt) <= new Date()).length;
  const week = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(); day.setDate(day.getDate() - (6 - index));
    const key = day.toDateString();
    const seconds = state.sessions.filter((session) => new Date(session.completedAt).toDateString() === key).reduce((sum, session) => sum + session.durationSeconds, 0);
    return { date: day, minutes: Math.round(seconds / 60) };
  });
  const maxMinutes = Math.max(...week.map((item) => item.minutes), 30);
  const recentMaterials = [...state.materials].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);
  const recentDecks = [...state.decks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 2);
  const recentQuizzes = [...state.quizzes].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 2);
  const hours = Math.floor(state.sessions.reduce((sum, session) => sum + session.durationSeconds, 0) / 3600);
  const minutes = Math.floor((state.sessions.reduce((sum, session) => sum + session.durationSeconds, 0) % 3600) / 60);
  const empty = state.materials.length === 0 && state.sessions.length === 0;

  const metrics = [
    { label: 'Study materials', value: state.materials.length, icon: BookOpen, note: 'Saved note collections' },
    { label: 'Flashcards', value: totalCards, icon: Layers3, note: 'Across all decks' },
    { label: 'Quizzes completed', value: state.attempts.length, icon: Target, note: 'Completed attempts' },
    { label: 'Average score', value: avg === null ? '—' : `${avg}%`, icon: Trophy, note: 'Across completed quizzes' },
  ];

  return <div className="page-stack">
    <div className="page-heading-row dashboard-welcome"><div><div className="eyebrow">MONDAY, {new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric' }).format(new Date()).toUpperCase()}</div><h1>Your study space.</h1><p className="page-subtitle">A clear view of what you’re learning and what’s next.</p></div><button className="button button-primary" onClick={onUpload}><UploadCloud size={16} /> Upload notes</button></div>

    <div className="metric-grid">{metrics.map((metric) => <div className="surface metric-card" key={metric.label}><div className="metric-top"><span>{metric.label}</span><span className="metric-icon"><metric.icon size={17} /></span></div><strong>{metric.value}</strong><p>{metric.note}</p></div>)}</div>

    <div className="dashboard-two-col">
      <section className="surface activity-card"><div className="section-heading"><div><h2>Study activity</h2><p>Your sessions over the last 7 days</p></div><div className="chart-legend"><i /> Minutes</div></div>
        {state.sessions.length ? <><div className="activity-chart">{week.map((day, index) => <div className="activity-day" key={day.date.toISOString()}><div className="bar-track"><div className="bar-fill" style={{ height: `${day.minutes ? Math.max(8, day.minutes / maxMinutes * 100) : 0}%` }} title={`${day.minutes} minutes`} /></div><span className="chart-day">{day.date.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1)}</span></div>)}</div><div className="chart-footer"><span>{hours}h {minutes}m studied total</span><span>{state.sessions.length} sessions recorded</span></div></> : <div className="chart-empty"><div className="empty-chart-icon"><Activity size={19} /></div><strong>Your activity will show up here</strong><span>Complete a study session to start building your weekly view.</span></div>}
      </section>
      <section className="surface focus-card"><div className="section-heading"><div><h2>Your rhythm</h2><p>Small steps add up.</p></div><span className="metric-icon"><Flame size={17} /></span></div><div className="rhythm-stats"><div><strong>{streak}</strong><span>Day streak</span></div><div><strong>{state.sessions.length}</strong><span>Study sessions</span></div></div><div className="focus-divider" />
        <div className="review-nudge">{dueCards > 0 ? <><div className="nudge-icon"><BrainCircuit size={17} /></div><div><strong>{dueCards} cards ready to review</strong><span>A quick review can help keep ideas fresh.</span></div><button className="icon-arrow" onClick={() => onNavigate('flashcards')} aria-label="Review flashcards"><ArrowRight size={17} /></button></> : <><div className="nudge-icon"><Sparkles size={17} /></div><div><strong>Make your next study set</strong><span>Turn a recent lesson into active recall.</span></div><button className="icon-arrow" onClick={onUpload} aria-label="Upload notes"><ArrowRight size={17} /></button></>}</div>
      </section>
    </div>

    <div className="dashboard-two-col lower-dashboard">
      <section className="surface list-card"><div className="section-heading"><div><h2>Continue studying</h2><p>Pick up where you left off</p></div><button className="text-button" onClick={() => onNavigate('notes')}>View all <ArrowRight size={14} /></button></div>
        {recentMaterials.length || recentDecks.length || recentQuizzes.length ? <div className="continue-list">
          {recentMaterials.map((material) => <button className="continue-item" key={material.id} onClick={() => onNavigate('notes')}><span className="continue-icon material"><BookOpen size={16} /></span><span className="continue-copy"><strong>{material.title}</strong><small>{material.subject || 'General'} · {material.pageCount} pages</small></span><span className="continue-date">{fmt.format(new Date(material.updatedAt))}</span><ArrowRight size={15} /></button>)}
          {recentDecks.map((deck) => <button className="continue-item" key={deck.id} onClick={() => onNavigate('flashcards')}><span className="continue-icon flash"><Layers3 size={16} /></span><span className="continue-copy"><strong>{deck.title}</strong><small>{deck.cards.length} flashcards</small></span><span className="continue-date">Flashcards</span><ArrowRight size={15} /></button>)}
          {recentQuizzes.map((quiz) => <button className="continue-item" key={quiz.id} onClick={() => onNavigate(quiz.kind === 'test' ? 'tests' : 'quizzes')}><span className="continue-icon quiz"><Target size={16} /></span><span className="continue-copy"><strong>{quiz.title}</strong><small>{quiz.questions.length} questions</small></span><span className="continue-date">{quiz.kind === 'test' ? 'Practice test' : 'Quiz'}</span><ArrowRight size={15} /></button>)}
        </div> : <div className="compact-empty"><BookOpen size={20} /><strong>Nothing here just yet</strong><span>Your latest notes, decks, and quizzes will appear here.</span><button className="text-button" onClick={onUpload}><Plus size={14} /> Add your first notes</button></div>}
      </section>
      <section className="surface quick-card"><div className="section-heading"><div><h2>Quick actions</h2><p>Jump into a study session</p></div></div><div className="quick-grid">
        <button onClick={onUpload}><span className="quick-icon violet"><UploadCloud size={18} /></span><strong>Upload notes</strong><small>Scan a lesson</small></button>
        <button onClick={() => onGenerate('flashcards')} disabled={!state.materials.length}><span className="quick-icon blue"><Layers3 size={18} /></span><strong>Flashcards</strong><small>Practice recall</small></button>
        <button onClick={() => onGenerate('quiz')} disabled={!state.materials.length}><span className="quick-icon teal"><Target size={18} /></span><strong>Generate quiz</strong><small>Check learning</small></button>
        <button onClick={() => onGenerate('test')} disabled={!state.materials.length}><span className="quick-icon amber"><CalendarDays size={18} /></span><strong>Practice test</strong><small>Exam-style practice</small></button>
      </div>{!state.materials.length && <p className="quick-hint">Upload a note collection to unlock AI study tools.</p>}</section>
    </div>
    {empty && <div className="welcome-footnote"><Clock3 size={14} /> Your workspace starts empty on purpose. StudyFlow only shows activity you actually complete.</div>}
  </div>;
}
