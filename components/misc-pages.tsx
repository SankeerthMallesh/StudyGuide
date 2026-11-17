'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Check, Circle, Clock3, Plus, Target, TrendingUp, Trophy, BookOpen, Settings2, Sun, Moon, Cloud, HardDrive, Trash2 } from 'lucide-react';
import type { PlannerTask, StudyState } from '@/types/study';

export function StudyPlanner({ tasks, onAdd, onToggle, onDelete }: {
  tasks: PlannerTask[];
  onAdd: (task: PlannerTask) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const groups = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const sorted = [...tasks].sort((a, b) => a.date.localeCompare(b.date));
    return [
      { label: 'Today', items: sorted.filter((task) => task.date === today) },
      { label: 'Upcoming', items: sorted.filter((task) => task.date > today) },
      { label: 'Earlier', items: sorted.filter((task) => task.date < today) },
    ].filter((group) => group.items.length);
  }, [tasks]);
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onAdd({ id: crypto.randomUUID(), title: title.trim(), subject: subject.trim(), date, done: false });
    setTitle(''); setSubject('');
  }
  const completed = tasks.filter((task) => task.done).length;
  return <div className="page-stack"><div className="page-heading-row"><div><div className="eyebrow">A PLAN THAT WORKS FOR YOU</div><h1>Study planner</h1><p className="page-subtitle">Keep your next study sessions clear and manageable.</p></div><span className="metric-icon"><CalendarDays size={18} /></span></div>
    <section className="surface planner-form"><div className="section-heading"><div><h2>Add a study task</h2><p>Plan a review session or a topic to work on.</p></div></div><form onSubmit={submit}><label className="field-label">TASK<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Review cell division" maxLength={100} required /></label><div className="planner-form-row"><label className="field-label">SUBJECT<input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Biology" maxLength={60} /></label><label className="field-label">DATE<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><button className="button button-primary" type="submit"><Plus size={15} /> Add task</button></div></form></section>
    <div className="planner-summary surface"><div><strong>{tasks.length}</strong><span>Planned tasks</span></div><div><strong>{completed}</strong><span>Completed</span></div><div className="planner-progress"><div className="progress-rail"><i style={{ width: `${tasks.length ? completed / tasks.length * 100 : 0}%` }} /></div><span>{tasks.length ? Math.round(completed / tasks.length * 100) : 0}% complete</span></div></div>
    {groups.length ? groups.map((group) => <section className="surface planner-group" key={group.label}><div className="section-heading"><div><h2>{group.label}</h2><p>{group.items.length} {group.items.length === 1 ? 'task' : 'tasks'}</p></div></div>{group.items.map((task) => <div className={`planner-task ${task.done ? 'is-done' : ''}`} key={task.id}><button className="task-check" onClick={() => onToggle(task.id)} aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}>{task.done ? <Check size={15} /> : <Circle size={16} />}</button><div><strong>{task.title}</strong><span>{task.subject || 'General'} · {new Date(`${task.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span></div><button className="icon-button" onClick={() => onDelete(task.id)} aria-label="Delete task"><Trash2 size={15} /></button></div>)}</section>) : <div className="surface empty-state"><div className="empty-state-icon"><CalendarDays size={23} /></div><h2>Your plan is open</h2><p>Add one small task above to start organizing your next study session.</p></div>}
  </div>;
}

export function ProgressPage({ state }: { state: StudyState }) {
  const totalSeconds = state.sessions.reduce((sum, session) => sum + session.durationSeconds, 0);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor(totalSeconds % 3600 / 60);
  const avg = state.attempts.length ? Math.round(state.attempts.reduce((sum, item) => sum + item.percentage, 0) / state.attempts.length) : null;
  const week = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - (13 - index));
    const total = state.sessions.filter((session) => new Date(session.completedAt).toDateString() === date.toDateString()).reduce((sum, session) => sum + session.durationSeconds, 0);
    return { date, minutes: Math.round(total / 60) };
  });
  const max = Math.max(...week.map((item) => item.minutes), 20);
  const subjectScores = Object.entries(state.attempts.reduce<Record<string, { score: number; total: number }>>((acc, attempt) => {
    for (const [topic, result] of Object.entries(attempt.topicScores)) {
      acc[topic] ||= { score: 0, total: 0 }; acc[topic].score += result.correct; acc[topic].total += result.total;
    }
    return acc;
  }, {})).sort((a, b) => a[0].localeCompare(b[0]));
  const mastered = state.decks.flatMap((deck) => deck.cards).filter((card) => card.status === 'known').length;
  const cards = state.decks.reduce((sum, deck) => sum + deck.cards.length, 0);
  return <div className="page-stack"><div className="page-heading-row"><div><div className="eyebrow">YOUR LEARNING HISTORY</div><h1>Progress</h1><p className="page-subtitle">Real activity from your saved study sessions and completed quizzes.</p></div><span className="metric-icon"><TrendingUp size={18} /></span></div>
    <div className="metric-grid progress-metrics"><div className="surface metric-card"><div className="metric-top">Study time <span className="metric-icon"><Clock3 size={16} /></span></div><strong>{hours}h {mins}m</strong><p>Total recorded session time</p></div><div className="surface metric-card"><div className="metric-top">Quiz average <span className="metric-icon"><Trophy size={16} /></span></div><strong>{avg === null ? '—' : `${avg}%`}</strong><p>{state.attempts.length} completed attempts</p></div><div className="surface metric-card"><div className="metric-top">Cards marked known <span className="metric-icon"><BookOpen size={16} /></span></div><strong>{mastered}</strong><p>Out of {cards} total cards</p></div><div className="surface metric-card"><div className="metric-top">Study sessions <span className="metric-icon"><Target size={16} /></span></div><strong>{state.sessions.length}</strong><p>Completed sessions</p></div></div>
    <section className="surface activity-card progress-activity"><div className="section-heading"><div><h2>Study time</h2><p>Last 14 days · minutes per day</p></div></div>{state.sessions.length ? <div className="activity-chart fourteen-days">{week.map((day) => <div className="activity-day" key={day.date.toISOString()}><div className="bar-track"><div className="bar-fill" style={{ height: `${day.minutes ? Math.max(7, day.minutes / max * 100) : 0}%` }} title={`${day.minutes} minutes`} /></div><span className="chart-day">{day.date.getDate()}</span></div>)}</div> : <div className="chart-empty"><div className="empty-chart-icon"><Clock3 size={19} /></div><strong>No study time recorded yet</strong><span>Finish a study session to start seeing your progress.</span></div>}</section>
    <section className="surface result-topics"><div className="section-heading"><div><h2>Topic performance</h2><p>From completed quiz and test attempts</p></div></div>{subjectScores.length ? subjectScores.map(([topic, stat]) => <div className="topic-score-row" key={topic}><span>{topic}</span><div className="topic-score-track"><i style={{ width: `${stat.total ? stat.score / stat.total * 100 : 0}%` }} /></div><strong>{stat.score}/{stat.total}</strong></div>) : <p className="muted-empty">Topic performance appears after your first completed quiz or practice test.</p>}</section>
  </div>;
}

export function SettingsPage({ dark, onToggleTheme, syncStatus, isCloud }: { dark: boolean; onToggleTheme: () => void; syncStatus: string; isCloud: boolean }) {
  return <div className="page-stack"><div className="page-heading-row"><div><div className="eyebrow">PREFERENCES</div><h1>Settings</h1><p className="page-subtitle">Make StudyFlow feel right for your routine.</p></div><span className="metric-icon"><Settings2 size={18} /></span></div>
    <section className="surface settings-section"><div className="section-heading"><div><h2>Appearance</h2><p>Choose the workspace theme.</p></div></div><button className="setting-row" onClick={onToggleTheme}><span className="setting-icon">{dark ? <Moon size={17} /> : <Sun size={17} />}</span><span><strong>{dark ? 'Dark theme' : 'Light theme'}</strong><small>{dark ? 'A low-glare dark workspace' : 'A bright, minimal workspace'}</small></span><span className="setting-action">{dark ? 'Switch to light' : 'Switch to dark'}</span></button></section>
    <section className="surface settings-section"><div className="section-heading"><div><h2>Data & sync</h2><p>Where your workspace is stored.</p></div></div><div className="setting-row static"><span className="setting-icon">{isCloud ? <Cloud size={17} /> : <HardDrive size={17} />}</span><span><strong>{isCloud ? 'Supabase cloud sync' : 'Local browser storage'}</strong><small>{isCloud ? 'Your workspace snapshot syncs to your authenticated Supabase account.' : 'Your study data stays in this browser on this device.'}</small></span><span className={`sync-label ${syncStatus}`}>{syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing' : syncStatus === 'offline' ? 'Offline' : 'Local'}</span></div></section>
    <div className="settings-note"><span>Privacy note</span><p>Gemini receives the images or note text needed for the AI feature you request. Your Gemini API key is kept on the server and is never sent to the browser. Do not upload private or sensitive personal information.</p></div>
  </div>;
}
