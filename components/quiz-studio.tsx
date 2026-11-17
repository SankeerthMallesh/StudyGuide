'use client';

import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileCheck2, Play, Target, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Quiz, QuizAttempt } from '@/types/study';

export function QuizStudio({ quizzes, kind, onStart, onDelete }: {
  quizzes: Quiz[];
  kind: 'quiz' | 'test';
  onStart: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const list = quizzes.filter((quiz) => quiz.kind === kind).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return <div className="page-stack"><div className="page-heading-row"><div><div className="eyebrow">{kind === 'test' ? 'EXAM PRACTICE' : 'KNOWLEDGE CHECK'}</div><h1>{kind === 'test' ? 'Practice tests' : 'Quizzes'}</h1><p className="page-subtitle">{kind === 'test' ? 'Prepare with a focused, exam-style run-through.' : 'Check what you know and find what needs another look.'}</p></div><span className="metric-icon"><Target size={18} /></span></div>
    {list.length ? <div className="quiz-grid">{list.map((quiz) => <article className="surface quiz-card" key={quiz.id}><div className="quiz-card-top"><span className={kind === 'test' ? 'quiz-badge test' : 'quiz-badge'}>{kind === 'test' ? 'PRACTICE TEST' : 'QUIZ'}</span><button className="icon-button" aria-label="Delete item" onClick={() => onDelete(quiz.id)}><XCircle size={15} /></button></div><h2>{quiz.title}</h2><p>{quiz.questions.length} questions · Created {new Date(quiz.createdAt).toLocaleDateString()}</p><div className="quiz-card-foot"><span><Clock3 size={14} /> Self-paced</span><button className="button button-primary button-small" onClick={() => onStart(quiz.id)}>Start <Play size={13} /></button></div></article>)}</div> : <div className="surface empty-state"><div className="empty-state-icon"><FileCheck2 size={23} /></div><h2>No {kind === 'test' ? 'practice tests' : 'quizzes'} yet</h2><p>{kind === 'test' ? 'Generate a practice test from any saved note collection when you’re ready.' : 'Generate a quiz from your notes to check your understanding.'}</p></div>}
  </div>;
}

function normalize(value: string) { return value.trim().toLocaleLowerCase().replace(/[.?!]+$/g, '').replace(/\s+/g, ' '); }

export function QuizSession({ quiz, onFinish, onExit }: {
  quiz: Quiz;
  onFinish: (attempt: QuizAttempt) => void;
  onExit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [showConfirm, setShowConfirm] = useState(false);
  const question = quiz.questions[index];
  const answered = Object.keys(answers).length;
  const scoreData = useMemo(() => {
    const topicScores: Record<string, { correct: number; total: number }> = {};
    let score = 0;
    for (const item of quiz.questions) {
      const correct = normalize(answers[item.id] || '') === normalize(item.correctAnswer);
      if (!topicScores[item.topic]) topicScores[item.topic] = { correct: 0, total: 0 };
      topicScores[item.topic].total += 1;
      if (correct) { topicScores[item.topic].correct += 1; score += 1; }
    }
    return { score, topicScores, percentage: quiz.questions.length ? Math.round(score / quiz.questions.length * 100) : 0 };
  }, [answers, quiz.questions]);

  function submit() {
    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    onFinish({ id: crypto.randomUUID(), quizId: quiz.id, score: scoreData.score, total: quiz.questions.length, percentage: scoreData.percentage, durationSeconds, completedAt: new Date().toISOString(), topicScores: scoreData.topicScores });
    setSubmitted(true);
  }
  if (submitted) return <div className="page-stack results-page"><div className="page-heading-row"><div><div className="eyebrow">SESSION COMPLETE</div><h1>Your results</h1><p className="page-subtitle">Here’s what you got right and what’s worth reviewing.</p></div></div>
    <section className="surface result-hero"><div className="score-ring" style={{ background: `conic-gradient(var(--accent) ${scoreData.percentage * 3.6}deg, #282832 0deg)` }}><div><strong>{scoreData.percentage}%</strong><span>score</span></div></div><div><span className="result-kicker">{scoreData.percentage >= 80 ? 'SOLID WORK' : scoreData.percentage >= 60 ? 'GOOD PROGRESS' : 'KEEP PRACTICING'}</span><h2>{scoreData.score} out of {quiz.questions.length} correct</h2><p>You answered {answered} of {quiz.questions.length} questions. Use the review below to revisit missed ideas.</p><button className="button button-primary" onClick={onExit}>Back to {quiz.kind === 'test' ? 'tests' : 'quizzes'} <ArrowRight size={15} /></button></div></section>
    <section className="surface result-topics"><div className="section-heading"><div><h2>Topic breakdown</h2><p>Based on your answers</p></div></div>{Object.entries(scoreData.topicScores).map(([topic, stat]) => <div className="topic-score-row" key={topic}><span>{topic || 'Other'}</span><div className="topic-score-track"><i style={{ width: `${stat.total ? stat.correct / stat.total * 100 : 0}%` }} /></div><strong>{stat.correct}/{stat.total}</strong></div>)}</section>
    <section className="surface answer-review"><div className="section-heading"><div><h2>Answer review</h2><p>Correct answers and explanations</p></div></div>{quiz.questions.map((item, i) => { const correct = normalize(answers[item.id] || '') === normalize(item.correctAnswer); return <div className="answer-review-row" key={item.id}><div className="answer-review-status">{correct ? <CheckCircle2 className="correct" size={17} /> : <XCircle className="incorrect" size={17} />}</div><div><strong>{i + 1}. {item.question}</strong><p>Your answer: {answers[item.id] || 'Not answered'}</p><p className="correct-answer">Correct answer: {item.correctAnswer}</p>{item.explanation && <small>{item.explanation}</small>}</div></div>; })}</section>
  </div>;

  return <div className="quiz-session-wrap"><div className="session-top"><button className="back-link" onClick={onExit}><ArrowLeft size={15} /> Exit</button><div className="session-deck-label">{quiz.title}</div><span className="session-type-tag">{quiz.kind === 'test' ? 'PRACTICE TEST' : 'QUIZ'}</span></div>
    <div className="session-progress"><div><span>Question {index + 1} of {quiz.questions.length}</span><span>{Math.round((index + 1) / quiz.questions.length * 100)}% complete</span></div><div className="progress-rail"><i style={{ width: `${(index + 1) / quiz.questions.length * 100}%` }} /></div></div>
    <section className="surface question-panel"><div className="question-meta"><span>QUESTION {String(index + 1).padStart(2, '0')}</span><span>{question.topic || 'GENERAL'}</span></div><h1>{question.question}</h1><p className="question-type-label">{question.questionType.replaceAll('_', ' ')}</p>
      {question.options.length ? <div className="answer-options">{question.options.map((option, optionIndex) => <button key={optionIndex} className={`answer-option ${answers[question.id] === option ? 'selected' : ''}`} onClick={() => setAnswers((current) => ({ ...current, [question.id]: option }))}><span>{String.fromCharCode(65 + optionIndex)}</span>{option}{answers[question.id] === option && <CheckCircle2 size={16} />}</button>)}</div> : <textarea className="short-answer" rows={3} placeholder="Type your answer..." value={answers[question.id] || ''} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} />}
    </section>
    <div className="quiz-session-bottom"><span>{answered} of {quiz.questions.length} answered</span><div><button className="button button-secondary" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}><ArrowLeft size={15} /> Previous</button>{index < quiz.questions.length - 1 ? <button className="button button-primary" onClick={() => setIndex((value) => value + 1)}>Next question <ArrowRight size={15} /></button> : <button className="button button-primary" onClick={() => setShowConfirm(true)}>Submit {quiz.kind === 'test' ? 'test' : 'quiz'} <CheckCircle2 size={15} /></button>}</div></div>
    {showConfirm && <div className="modal-scrim"><div className="surface confirm-modal"><div className="empty-state-icon"><FileCheck2 size={22} /></div><h2>Ready to submit?</h2><p>You’ve answered {answered} of {quiz.questions.length} questions. Unanswered questions will be marked incorrect.</p><div><button className="button button-secondary" onClick={() => setShowConfirm(false)}>Keep reviewing</button><button className="button button-primary" onClick={submit}>Submit now</button></div></div></div>}
  </div>;
}
