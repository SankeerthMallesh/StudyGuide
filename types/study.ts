export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank' | 'matching';

export interface Definition { term: string; explanation: string; }
export interface KeyTerm { term: string; meaning: string; }
export interface Formula { name: string; expression: string; explanation: string; }
export interface DateEvent { date: string; event: string; }
export interface Example { concept: string; example: string; }
export interface Relationship { conceptA: string; conceptB: string; relationship: string; }
export interface UncertainSection { excerpt: string; reason: string; page?: number; }
export interface SourceReference { page: number; label: string; }
export interface NoteSummarySection { heading: string; summary: string; keyPoints: string[]; }
export interface NoteSummary { overview: string; sections: NoteSummarySection[]; keyTakeaways: string[]; quickReview: string; }

export interface ExtractedNotes {
  title: string;
  subject: string;
  topics: string[];
  definitions: Definition[];
  keyTerms: KeyTerm[];
  importantFacts: string[];
  formulas: Formula[];
  dates: DateEvent[];
  examples: Example[];
  relationships: Relationship[];
  uncertainSections: UncertainSection[];
  sourceReferences: SourceReference[];
  summary: NoteSummary;
}

export interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  notes: ExtractedNotes;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: Difficulty;
  cardType: string;
  sourceTopic: string;
  reviewCount: number;
  nextReviewAt: string | null;
  lastReviewedAt: string | null;
  status: 'new' | 'known' | 'review';
}

export interface FlashcardDeck {
  id: string;
  materialId: string;
  title: string;
  cards: Flashcard[];
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  questionType: QuestionType;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
}

export interface Quiz {
  id: string;
  materialId: string;
  title: string;
  questions: QuizQuestion[];
  kind: 'quiz' | 'test';
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  score: number;
  total: number;
  percentage: number;
  durationSeconds: number;
  completedAt: string;
  topicScores: Record<string, { correct: number; total: number }>;
}

export interface StudySession {
  id: string;
  materialId: string | null;
  sessionType: 'flashcards' | 'quiz' | 'test' | 'guide';
  durationSeconds: number;
  completedAt: string;
}

export interface StudyGuide {
  id: string;
  materialId: string;
  title: string;
  sections: { heading: string; content: string[] }[];
  createdAt: string;
}

export interface PlannerTask { id: string; title: string; subject: string; date: string; done: boolean; }

export interface StudyState {
  plannerTasks: PlannerTask[];
  materials: StudyMaterial[];
  decks: FlashcardDeck[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  sessions: StudySession[];
  guides: StudyGuide[];
}

export const emptyStudyState = (): StudyState => ({
  plannerTasks: [],
  materials: [], decks: [], quizzes: [], attempts: [], sessions: [], guides: [],
});

export const uid = () => typeof crypto !== 'undefined' && 'randomUUID' in crypto
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
