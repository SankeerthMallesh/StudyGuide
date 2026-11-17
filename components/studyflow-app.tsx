'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, ArrowRight, BookOpen, BrainCircuit, CalendarDays, ChevronDown, CircleHelp,
  FileText, GraduationCap, Layers3, LogOut, Menu, MessageCircle, Moon, Plus, Search,
  Settings2, Sparkles, Sun, Target, X, Zap,
} from 'lucide-react';
import { Dashboard } from '@/components/dashboard';
import { UploadWorkspace } from '@/components/upload-workspace';
import { MaterialDetail, MaterialLibrary } from '@/components/material-library';
import { FlashcardSession, FlashcardStudio } from '@/components/flashcard-studio';
import { QuizSession, QuizStudio } from '@/components/quiz-studio';
import { StudyGuideReader, StudyGuideStudio } from '@/components/study-guide-studio';
import { ProgressPage, SettingsPage, StudyPlanner } from '@/components/misc-pages';
import { useStudyState } from '@/lib/data/use-study-state';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { uid, type ExtractedNotes, type Flashcard, type FlashcardDeck, type Quiz, type QuizAttempt, type QuizQuestion, type StudyGuide, type StudyMaterial, type StudySession } from '@/types/study';

type Page = 'overview' | 'notes' | 'flashcards' | 'quizzes' | 'tests' | 'guides' | 'planner' | 'progress' | 'settings' | 'upload' | 'material' | 'flash-session' | 'quiz-session' | 'test-session' | 'guide-reader' | 'assistant';
type GenerateAction = 'flashcards' | 'quiz' | 'test' | 'guide';
type Toast = { message: string; type: 'success' | 'error' | 'info' };

const navGroups = [
  { label: 'WORKSPACE', items: [
    { id: 'overview', label: 'Home', icon: Activity },
    { id: 'notes', label: 'All notes', icon: FileText },
  ] },
  { label: 'STUDY TOOLS', items: [
    { id: 'flashcards', label: 'Flashcards', icon: Layers3 },
    { id: 'quizzes', label: 'Quizzes', icon: Target },
    { id: 'tests', label: 'Practice tests', icon: GraduationCap },
    { id: 'guides', label: 'Study guides', icon: BookOpen },
  ] },
  { label: 'YOUR SPACE', items: [
    { id: 'planner', label: 'Study planner', icon: CalendarDays },
    { id: 'progress', label: 'Progress', icon: BrainCircuit },
  ] },
];

function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const supabase = getSupabaseBrowserClient();
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage('');
    const result = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (result.error) setMessage(result.error.message);
    else if (mode === 'signup' && !result.data.session) setMessage('Account created. Check your email to confirm the account, then sign in.');
    else setMessage('Signed in successfully.');
  }
  return <main className="auth-shell"><div className="auth-glow" /><div className="auth-card surface"><div className="brand-lockup auth-brand"><span className="brand-mark"><Sparkles size={17} /></span><span>studyflow</span></div><div className="eyebrow">YOUR PERSONAL STUDY WORKSPACE</div><h1>{mode === 'signin' ? 'Welcome back.' : 'Create your account.'}</h1><p>Sign in to securely sync your study materials across devices.</p><form onSubmit={submit} className="auth-form"><label className="field-label">EMAIL<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><label className="field-label">PASSWORD<input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label><button className="button button-primary button-large" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight size={15} /></button></form>{message && <div className={message.includes('successfully') || message.includes('Check your email') ? 'auth-message success' : 'auth-message'}>{message}</div>}<div className="auth-switch">{mode === 'signin' ? 'New to StudyFlow?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(''); }}>{mode === 'signin' ? 'Create an account' : 'Sign in'}</button></div><div className="auth-footnote">Your workspace is protected by Supabase authentication and row-level security.</div></div></main>;
}

function AssistantPage({ materials }: { materials: StudyMaterial[] }) {
  const [materialId, setMaterialId] = useState(materials[0]?.id ?? '');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<{ text: string; source: string; topics: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const active = materials.find((item) => item.id === materialId);
  async function ask(event: React.FormEvent) {
    event.preventDefault();
    if (!active || !question.trim()) return;
    setBusy(true); setError(''); setAnswer(null);
    try {
      const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'assistant', title: active.title, notes: JSON.stringify(active.notes), question: question.trim() }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'The study assistant could not answer that.');
      setAnswer({ text: payload.answer, source: payload.sourceNote, topics: payload.relatedTopics });
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
    finally { setBusy(false); }
  }
  return <div className="page-stack"><div className="page-heading-row"><div><div className="eyebrow">ASK YOUR NOTES</div><h1>Study assistant</h1><p className="page-subtitle">Get explanations grounded in the material you uploaded.</p></div><span className="metric-icon"><MessageCircle size={18} /></span></div>
    {materials.length ? <section className="surface assistant-panel"><label className="field-label">ASK ABOUT<select value={materialId} onChange={(event) => { setMaterialId(event.target.value); setAnswer(null); }} className="wide-field">{materials.map((material) => <option key={material.id} value={material.id}>{material.title}</option>)}</select></label><div className="assistant-suggestions"><span>Try asking</span>{['Explain this topic more simply', 'Give me an example from my notes', 'What is the difference between two key terms?'].map((suggestion) => <button key={suggestion} onClick={() => setQuestion(suggestion)}>{suggestion}</button>)}</div><form onSubmit={ask} className="assistant-form"><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question about this chapter…" rows={3} maxLength={1000} /><button className="button button-primary" disabled={busy || !question.trim()}>{busy ? 'Thinking…' : 'Ask StudyFlow'} <ArrowRight size={15} /></button></form>{error && <div className="inline-error">{error}</div>}{answer && <div className="assistant-answer"><div className="assistant-answer-top"><span className="ai-pill"><Sparkles size={12} /> STUDYFLOW ANSWER</span><span className="source-label">{answer.source === 'supported_by_notes' ? 'Supported by your notes' : answer.source === 'general_context' ? 'Includes general context' : 'Not found in your notes'}</span></div><p>{answer.text}</p>{answer.topics.length > 0 && <div className="topic-chips">{answer.topics.map((topic) => <span key={topic}>{topic}</span>)}</div>}</div>}</section> : <div className="surface empty-state"><div className="empty-state-icon"><MessageCircle size={23} /></div><h2>Add notes to start asking questions</h2><p>The assistant uses your saved note collections as its source.</p></div>}
  </div>;
}

export function StudyFlowApp() {
  const [page, setPage] = useState<Page>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [activeDeckId, setActiveDeckId] = useState('');
  const [activeQuizId, setActiveQuizId] = useState('');
  const [dark, setDark] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [generating, setGenerating] = useState(false);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [aiStatus, setAiStatus] = useState<{ ready: boolean; model: string } | null>(null);
  const { state, update, hydrated, syncStatus } = useStudyState(user?.id);
  const selectedMaterial = state.materials.find((item) => item.id === selectedId);
  const activeDeck = state.decks.find((item) => item.id === activeDeckId);
  const activeQuiz = state.quizzes.find((item) => item.id === activeQuizId);

  useEffect(() => {
    try { const saved = window.localStorage.getItem('studyflow.theme'); if (saved) setDark(saved === 'dark'); } catch { /* Ignore unavailable local storage. */ }
    fetch('/api/health').then((res) => res.json()).then((data) => setAiStatus({ ready: Boolean(data.geminiConfigured), model: data.model })).catch(() => setAiStatus({ ready: false, model: 'not available' }));
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    try { window.localStorage.setItem('studyflow.theme', dark ? 'dark' : 'light'); } catch { /* Ignore unavailable local storage. */ }
  }, [dark]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setSearchOpen(true);
      }
      if (event.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setAuthLoading(false); return; }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) { setUser(data.session?.user ? { id: data.session.user.id, email: data.session.user.email } : null); setAuthLoading(false); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ? { id: session.user.id, email: session.user.email } : null));
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  const notify = useCallback((message: string, type: Toast['type'] = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast((current) => current?.message === message ? null : current), 4200);
  }, []);
  const navigate = (next: string) => { setPage(next as Page); setMobileOpen(false); };
  const searchResults = useMemo((): Array<{ type: 'material' | 'deck' | 'quiz' | 'guide'; id: string; title: string; subtitle: string }> => {
    const query = searchQuery.trim().toLowerCase();
    const results = [
      ...state.materials.map((item) => ({ type: 'material' as const, id: item.id, title: item.title, subtitle: `${item.subject || 'Notes'} · ${item.pageCount} pages` })),
      ...state.decks.map((item) => ({ type: 'deck' as const, id: item.id, title: item.title, subtitle: `${item.cards.length} flashcards · Deck` })),
      ...state.quizzes.map((item) => ({ type: 'quiz' as const, id: item.id, title: item.title, subtitle: `${item.questions.length} questions · ${item.kind === 'test' ? 'Practice test' : 'Quiz'}` })),
      ...state.guides.map((item) => ({ type: 'guide' as const, id: item.id, title: item.title, subtitle: `${item.sections.length} sections · Study guide` })),
    ];
    return (query ? results.filter((item) => `${item.title} ${item.subtitle}`.toLowerCase().includes(query)) : results).slice(0, 9);
  }, [state.materials, state.decks, state.quizzes, state.guides, searchQuery]);
  const openSearchResult = (result: (typeof searchResults)[number]) => {
    if (result.type === 'material') { setSelectedId(result.id); navigate('material'); }
    else if (result.type === 'deck') { setActiveDeckId(result.id); navigate('flash-session'); }
    else if (result.type === 'quiz') { setActiveQuizId(result.id); navigate(result.subtitle.includes('Practice test') ? 'test-session' : 'quiz-session'); }
    else { setSelectedId(result.id); navigate('guide-reader'); }
    setSearchOpen(false); setSearchQuery('');
  };
  const saveMaterial = async (notes: ExtractedNotes, files: File[]) => {
    const now = new Date().toISOString();
    const material: StudyMaterial = { id: uid(), title: notes.title.trim(), subject: notes.subject.trim(), notes, pageCount: files.length, createdAt: now, updatedAt: now };
    update((current) => ({ ...current, materials: [material, ...current.materials] }));
    setSelectedId(material.id); setPage('material'); notify('Your notes were saved to the workspace.');

    const supabase = getSupabaseBrowserClient();
    if (supabase && user?.id) {
      try {
        const materialInsert = await supabase.from('study_materials').insert({ id: material.id, user_id: user.id, title: material.title, subject: material.subject, source_type: 'images', page_count: files.length, created_at: now, updated_at: now });
        if (materialInsert.error) throw materialInsert.error;
        const noteInsert = await supabase.from('extracted_notes').insert({ material_id: material.id, user_id: user.id, extracted_content: notes, confidence_data: { uncertainSections: notes.uncertainSections } });
        if (noteInsert.error) throw noteInsert.error;
        const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'studyflow-uploads';
        for (let index = 0; index < files.length; index++) {
          const file = files[index];
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
          const path = `${user.id}/${material.id}/${String(index + 1).padStart(2, '0')}-${safeName}`;
          const uploaded = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: true });
          if (uploaded.error) throw uploaded.error;
          const fileRow = await supabase.from('uploaded_files').insert({ material_id: material.id, user_id: user.id, storage_path: path, file_type: file.type, page_number: index + 1 });
          if (fileRow.error) throw fileRow.error;
        }
      } catch (error) {
        notify(`Saved locally, but Supabase upload had an issue: ${error instanceof Error ? error.message : 'unknown error'}`, 'error');
      }
    }
  };

  const generate = async (action: GenerateAction, materialId?: string) => {
    const material = state.materials.find((item) => item.id === (materialId || selectedId)) || state.materials[0];
    if (!material) { notify('Upload and save a note collection before generating study materials.', 'info'); setPage('notes'); return; }
    if (!aiStatus?.ready) { notify('Add GEMINI_API_KEY to .env.local and restart the app to enable real AI generation.', 'error'); setPage('settings'); return; }
    setGenerating(true);
    try {
      const requestBody = { action, title: material.title, notes: JSON.stringify(material.notes), count: action === 'flashcards' ? 20 : action === 'test' ? 25 : 10, difficulty: 'mixed' };
      const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Generation failed.');
      const now = new Date().toISOString();
      if (action === 'flashcards') {
        const deck: FlashcardDeck = { id: uid(), materialId: material.id, title: payload.title || `${material.title} · Flashcards`, createdAt: now, cards: payload.cards.map((card: Omit<Flashcard, 'id' | 'reviewCount' | 'nextReviewAt' | 'lastReviewedAt' | 'status'>) => ({ ...card, id: uid(), reviewCount: 0, nextReviewAt: null, lastReviewedAt: null, status: 'new' })) };
        update((current) => ({ ...current, decks: [deck, ...current.decks] }));
        const supabase = getSupabaseBrowserClient();
        if (supabase && user?.id) {
          const inserted = await supabase.from('flashcard_decks').insert({ id: deck.id, user_id: user.id, material_id: material.id, title: deck.title, created_at: now });
          if (!inserted.error) await supabase.from('flashcards').insert(deck.cards.map((card) => ({ id: card.id, deck_id: deck.id, front: card.front, back: card.back, difficulty: card.difficulty, card_type: card.cardType, source_topic: card.sourceTopic, review_count: 0, status: 'new' })));
        }
        setPage('flashcards'); notify(`${deck.cards.length} flashcards created.`);
      } else if (action === 'quiz' || action === 'test') {
        const quiz: Quiz = { id: uid(), materialId: material.id, title: payload.title || `${material.title} · ${action === 'test' ? 'Practice Test' : 'Quiz'}`, kind: action, createdAt: now, questions: payload.questions.map((item: Omit<QuizQuestion, 'id'>) => ({ ...item, id: uid() })) };
        update((current) => ({ ...current, quizzes: [quiz, ...current.quizzes] }));
        const supabase = getSupabaseBrowserClient();
        if (supabase && user?.id) {
          const inserted = await supabase.from('quizzes').insert({ id: quiz.id, user_id: user.id, material_id: material.id, title: quiz.title, kind: action, configuration: { difficulty: 'mixed', count: quiz.questions.length }, created_at: now });
          if (!inserted.error) await supabase.from('quiz_questions').insert(quiz.questions.map((item) => ({ id: item.id, quiz_id: quiz.id, question: item.question, question_type: item.questionType, options: item.options, correct_answer: item.correctAnswer, explanation: item.explanation, topic: item.topic })));
        }
        setPage(action === 'test' ? 'tests' : 'quizzes'); notify(`${quiz.questions.length} ${action === 'test' ? 'practice test questions' : 'quiz questions'} created.`);
      } else {
        const guide: StudyGuide = { id: uid(), materialId: material.id, title: payload.title || `${material.title} · Study Guide`, sections: payload.sections, createdAt: now };
        update((current) => ({ ...current, guides: [guide, ...current.guides] })); setPage('guides'); notify('Your study guide is ready.');
      }
    } catch (error) { notify(error instanceof Error ? error.message : 'Something went wrong during generation.', 'error'); }
    finally { setGenerating(false); }
  };

  const deleteMaterial = (id: string) => {
    update((current) => ({ ...current, materials: current.materials.filter((item) => item.id !== id), decks: current.decks.filter((item) => item.materialId !== id), quizzes: current.quizzes.filter((item) => item.materialId !== id), guides: current.guides.filter((item) => item.materialId !== id) }));
    if (selectedId === id) setSelectedId(''); notify('Material and its generated study sets were removed.', 'info');
  };

  const finishFlashcards = (summary: { studied: number; known: number; review: number; durationSeconds: number }) => {
    const session: StudySession = { id: uid(), materialId: activeDeck?.materialId || null, sessionType: 'flashcards', durationSeconds: summary.durationSeconds, completedAt: new Date().toISOString() };
    update((current) => ({ ...current, sessions: [session, ...current.sessions] }));
    const supabase = getSupabaseBrowserClient();
    if (supabase && user?.id) void supabase.from('study_sessions').insert({ id: session.id, user_id: user.id, material_id: session.materialId, session_type: 'flashcards', duration_seconds: session.durationSeconds, completed_at: session.completedAt });
    setPage('flashcards'); setActiveDeckId(''); notify(`Session complete · ${summary.studied} cards studied.`, 'success');
  };

  const finishQuiz = (attempt: QuizAttempt) => {
    const quiz = state.quizzes.find((item) => item.id === attempt.quizId);
    const session: StudySession = { id: uid(), materialId: quiz?.materialId || null, sessionType: quiz?.kind || 'quiz', durationSeconds: attempt.durationSeconds, completedAt: attempt.completedAt };
    update((current) => ({ ...current, attempts: [attempt, ...current.attempts], sessions: [session, ...current.sessions] }));
    const supabase = getSupabaseBrowserClient();
    if (supabase && user?.id) {
      void supabase.from('quiz_attempts').insert({ id: attempt.id, quiz_id: attempt.quizId, user_id: user.id, score: attempt.score, total: attempt.total, percentage: attempt.percentage, duration_seconds: attempt.durationSeconds, topic_scores: attempt.topicScores, completed_at: attempt.completedAt });
      void supabase.from('study_sessions').insert({ id: session.id, user_id: user.id, material_id: session.materialId, session_type: session.sessionType, duration_seconds: session.durationSeconds, completed_at: session.completedAt });
    }
  };

  const updateDeck = (deckId: string, cards: Flashcard[]) => {
    update((current) => ({ ...current, decks: current.decks.map((deck) => deck.id === deckId ? { ...deck, cards } : deck) }));
    const supabase = getSupabaseBrowserClient();
    if (supabase && user?.id) void supabase.from('flashcards').upsert(cards.map((card) => ({ id: card.id, deck_id: deckId, front: card.front, back: card.back, difficulty: card.difficulty, card_type: card.cardType, source_topic: card.sourceTopic, review_count: card.reviewCount, status: card.status, next_review_at: card.nextReviewAt, last_reviewed_at: card.lastReviewedAt })));
  };

  const totalPages = useMemo(() => state.materials.reduce((sum, item) => sum + item.pageCount, 0), [state.materials]);

  if (!hydrated || (isSupabaseConfigured && authLoading)) return <div className="loading-screen"><div className="brand-mark"><Sparkles size={17} /></div><span>Loading your workspace…</span></div>;
  if (isSupabaseConfigured && !user) return <AuthScreen />;

  const pageTitles: Record<Page, string> = { overview: 'Overview', notes: 'My notes', flashcards: 'Flashcards', quizzes: 'Quizzes', tests: 'Practice tests', guides: 'Study guides', planner: 'Study planner', progress: 'Progress', settings: 'Settings', upload: 'Upload notes', material: 'Material details', 'flash-session': 'Study session', 'quiz-session': 'Quiz session', 'test-session': 'Test session', 'guide-reader': 'Study guide', assistant: 'Study assistant' };

  return <div className={`app-root ${dark ? 'theme-dark' : 'theme-light'}`}>
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-top">
        <div className="brand-lockup"><span className="brand-mark"><Sparkles size={16} /></span><span>studyflow</span><span className="brand-edition">STUDY SPACE</span></div>
        <button className="sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button>
      </div>
      <button className="workspace-switch" onClick={() => navigate('overview')}><span className="workspace-avatar">S</span><span><strong>My workspace</strong><small>{user?.email || 'Personal study space'}</small></span><ChevronDown size={14} /></button>
      <div className="sidebar-quick-actions">
        <button className="sidebar-search" onClick={() => setSearchOpen(true)}><Search size={15} /><span>Quick find</span><kbd>⌘ K</kbd></button>
        <button className="sidebar-new-page" onClick={() => navigate('upload')}><Plus size={15} /><span>New study page</span><span className="new-page-shortcut">↵</span></button>
      </div>
      <nav className="side-nav">
        {navGroups.map((group) => <div className="nav-group" key={group.label}><div className="nav-group-label">{group.label}</div>{group.items.map((item) => <button key={item.id} className={`nav-item ${page === item.id || (page === 'material' && item.id === 'notes') || (page === 'flash-session' && item.id === 'flashcards') || (page === 'quiz-session' && item.id === 'quizzes') || (page === 'test-session' && item.id === 'tests') || (page === 'guide-reader' && item.id === 'guides') ? 'active' : ''}`} onClick={() => navigate(item.id)}><item.icon size={16} strokeWidth={1.8} /><span>{item.label}</span>{item.id === 'flashcards' && state.decks.length > 0 && <small className="nav-count">{state.decks.length}</small>}</button>)}</div>)}
        <div className="nav-group recent-pages-group"><div className="nav-group-label"><span>RECENT PAGES</span><span>{state.materials.length ? state.materials.length : ''}</span></div>
          {state.materials.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4).map((material) => <button key={material.id} className={`nav-item recent-nav-item ${page === 'material' && selectedId === material.id ? 'active' : ''}`} onClick={() => { setSelectedId(material.id); navigate('material'); }}><FileText size={15} /><span>{material.title}</span></button>)}
          {!state.materials.length && <div className="sidebar-empty-hint">Your saved notes will appear here.</div>}
        </div>
        <div className="nav-group nav-group-bottom"><div className="nav-group-label">TOOLS & SETTINGS</div><button className={`nav-item ${page === 'assistant' ? 'active' : ''}`} onClick={() => navigate('assistant')}><MessageCircle size={16} /><span>Study assistant</span></button><button className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => navigate('settings')}><Settings2 size={16} /><span>Settings</span></button></div>
      </nav>
      <div className="sidebar-footer"><div className={`sidebar-ai-status ${aiStatus?.ready ? 'connected' : 'needs-setup'}`}><span className="status-pulse" /><span>{aiStatus?.ready ? `Gemini · ${aiStatus.model}` : 'Connect Gemini to study with AI'}</span></div><div className="sidebar-profile"><span className="profile-avatar">{(user?.email || 'S').slice(0, 1).toUpperCase()}</span><span><strong>{user?.email?.split('@')[0] || 'Student'}</strong><small>{user?.email || 'Local workspace'}</small></span>{user && <button aria-label="Sign out" onClick={async () => { await getSupabaseBrowserClient()?.auth.signOut(); setUser(null); }}><LogOut size={15} /></button>}</div></div>
    </aside>
    {mobileOpen && <button className="mobile-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <div className="main-shell"><header className="topbar"><div className="topbar-left"><button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumb"><span>My workspace</span><ChevronDown size={12} /><span className="breadcrumb-current">{pageTitles[page]}</span>{page === 'material' && selectedMaterial && <><ChevronDown size={12} /><strong>{selectedMaterial.title}</strong></>}</div></div><div className="topbar-right"><button className="topbar-search" onClick={() => setSearchOpen(true)}><Search size={14} /><span>Search</span><kbd>⌘ K</kbd></button><div className="sync-indicator"><span className={`sync-dot ${syncStatus}`} />{syncStatus === 'syncing' ? 'Saving' : syncStatus === 'synced' ? 'Saved' : syncStatus === 'offline' ? 'Offline' : 'Local'}</div><button className="topbar-icon" onClick={() => setDark((value) => !value)} aria-label="Toggle theme">{dark ? <Sun size={17} /> : <Moon size={17} />}</button><button className="topbar-help" onClick={() => navigate('assistant')}><MessageCircle size={15} /><span>Ask StudyFlow</span></button></div></header>
      <main className="main-content" key={page}>
        <AnimatePresence mode="wait"><motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }}>
          {page === 'overview' && <Dashboard state={state} onNavigate={navigate} onUpload={() => navigate('upload')} onGenerate={generate} />}
          {page === 'upload' && <UploadWorkspace onCancel={() => navigate('overview')} onSave={saveMaterial} />}
          {page === 'notes' && <MaterialLibrary materials={state.materials} onUpload={() => navigate('upload')} onDelete={deleteMaterial} onOpen={(id) => { setSelectedId(id); navigate('material'); }} />}
          {page === 'material' && (selectedMaterial ? <MaterialDetail material={selectedMaterial} onBack={() => navigate('notes')} onGenerate={generate} /> : <div className="surface empty-state"><h2>Material not found</h2><button className="button button-secondary" onClick={() => navigate('notes')}>Back to notes</button></div>)}
          {page === 'flashcards' && <FlashcardStudio decks={state.decks} onStudy={(id) => { setActiveDeckId(id); navigate('flash-session'); }} onDelete={(id) => update((current) => ({ ...current, decks: current.decks.filter((deck) => deck.id !== id) }))} />}
          {page === 'flash-session' && (activeDeck ? <FlashcardSession key={activeDeck.id} deck={activeDeck} onUpdate={(cards) => updateDeck(activeDeck.id, cards)} onFinish={finishFlashcards} onExit={() => navigate('flashcards')} /> : <div className="surface empty-state"><h2>Deck not found</h2><button className="button button-secondary" onClick={() => navigate('flashcards')}>Back to flashcards</button></div>)}
          {page === 'quizzes' && <QuizStudio quizzes={state.quizzes} kind="quiz" onStart={(id) => { setActiveQuizId(id); navigate('quiz-session'); }} onDelete={(id) => update((current) => ({ ...current, quizzes: current.quizzes.filter((quiz) => quiz.id !== id) }))} />}
          {page === 'tests' && <QuizStudio quizzes={state.quizzes} kind="test" onStart={(id) => { setActiveQuizId(id); navigate('test-session'); }} onDelete={(id) => update((current) => ({ ...current, quizzes: current.quizzes.filter((quiz) => quiz.id !== id) }))} />}
          {(page === 'quiz-session' || page === 'test-session') && (activeQuiz ? <QuizSession key={activeQuiz.id} quiz={activeQuiz} onFinish={finishQuiz} onExit={() => navigate(activeQuiz.kind === 'test' ? 'tests' : 'quizzes')} /> : <div className="surface empty-state"><h2>Quiz not found</h2><button className="button button-secondary" onClick={() => navigate('quizzes')}>Back to quizzes</button></div>)}
          {page === 'guides' && <StudyGuideStudio guides={state.guides} onOpen={(id) => { setSelectedId(id); navigate('guide-reader'); }} />}
          {page === 'guide-reader' && (() => { const guide = state.guides.find((item) => item.id === selectedId); return guide ? <StudyGuideReader guide={guide} onBack={() => navigate('guides')} /> : <div className="surface empty-state"><h2>Guide not found</h2><button className="button button-secondary" onClick={() => navigate('guides')}>Back to guides</button></div>; })()}
          {page === 'planner' && <StudyPlanner tasks={state.plannerTasks} onAdd={(task) => update((current) => ({ ...current, plannerTasks: [...current.plannerTasks, task] }))} onToggle={(id) => update((current) => ({ ...current, plannerTasks: current.plannerTasks.map((task) => task.id === id ? { ...task, done: !task.done } : task) }))} onDelete={(id) => update((current) => ({ ...current, plannerTasks: current.plannerTasks.filter((task) => task.id !== id) }))} />}
          {page === 'progress' && <ProgressPage state={state} />}
          {page === 'settings' && <SettingsPage dark={dark} onToggleTheme={() => setDark((value) => !value)} syncStatus={syncStatus} isCloud={Boolean(user)} />}
          {page === 'assistant' && <AssistantPage materials={state.materials} />}
        </motion.div></AnimatePresence>
      </main>
      <footer className="app-footer"><span>StudyFlow <span className="footer-dot">·</span> Built for better learning</span><span>{state.materials.length} materials <span className="footer-dot">·</span> {totalPages} pages</span></footer>
    </div>
    {searchOpen && <div className="command-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSearchOpen(false); setSearchQuery(''); } }}>
      <section className="command-palette surface" role="dialog" aria-modal="true" aria-label="Search your study workspace">
        <div className="command-input-row"><Search size={19} /><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search notes, flashcards, quizzes, guides…" onKeyDown={(event) => { if (event.key === 'Enter' && searchResults[0]) openSearchResult(searchResults[0]); }} /><kbd>ESC</kbd></div>
        <div className="command-results-label">{searchQuery.trim() ? 'SEARCH RESULTS' : 'RECENT PAGES'}</div>
        <div className="command-results">{searchResults.length ? searchResults.map((result) => <button className="command-result" key={`${result.type}-${result.id}`} onClick={() => openSearchResult(result)}><span className={`command-result-icon ${result.type}`}>{result.type === 'material' ? <FileText size={16} /> : result.type === 'deck' ? <Layers3 size={16} /> : result.type === 'quiz' ? <Target size={16} /> : <BookOpen size={16} />}</span><span><strong>{result.title}</strong><small>{result.subtitle}</small></span><ArrowRight size={15} /></button>) : <div className="command-no-results"><Search size={18} /><strong>No matching pages</strong><span>Try a different title or keyword.</span></div>}</div>
        <div className="command-footer"><span><kbd>↵</kbd> Open page</span><span><kbd>⌘ K</kbd> Toggle search</span><span>Searches your saved workspace</span></div>
      </section>
    </div>}
    {generating && <div className="generation-scrim"><div className="surface generation-modal"><div className="analyze-orbit small"><div className="orbit-ring" /><div className="orbit-core"><Sparkles size={19} /></div></div><strong>Creating your study materials</strong><span>Gemini is building from your saved notes. This can take a moment.</span></div></div>}
    {toast && <div className={`toast-message ${toast.type}`}><span>{toast.type === 'success' ? <Zap size={15} /> : toast.type === 'error' ? <X size={15} /> : <Sparkles size={15} />}</span>{toast.message}<button onClick={() => setToast(null)} aria-label="Dismiss notification"><X size={14} /></button></div>}
  </div>;
}
