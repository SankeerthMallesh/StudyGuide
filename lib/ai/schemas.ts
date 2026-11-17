import { z } from 'zod';

export const noteSummarySchema = z.object({
  overview: z.string(),
  sections: z.array(z.object({ heading: z.string(), summary: z.string(), keyPoints: z.array(z.string()) })),
  keyTakeaways: z.array(z.string()),
  quickReview: z.string(),
});

export const extractedNotesSchema = z.object({
  title: z.string().min(1),
  subject: z.string(),
  topics: z.array(z.string()),
  definitions: z.array(z.object({ term: z.string(), explanation: z.string() })),
  keyTerms: z.array(z.object({ term: z.string(), meaning: z.string() })),
  importantFacts: z.array(z.string()),
  formulas: z.array(z.object({ name: z.string(), expression: z.string(), explanation: z.string() })),
  dates: z.array(z.object({ date: z.string(), event: z.string() })),
  examples: z.array(z.object({ concept: z.string(), example: z.string() })),
  relationships: z.array(z.object({ conceptA: z.string(), conceptB: z.string(), relationship: z.string() })),
  uncertainSections: z.array(z.object({ excerpt: z.string(), reason: z.string(), page: z.number().optional() })),
  sourceReferences: z.array(z.object({ page: z.number(), label: z.string() })),
  summary: noteSummarySchema,
});

export const flashcardResultSchema = z.object({
  title: z.string(),
  cards: z.array(z.object({
    front: z.string().min(1),
    back: z.string().min(1),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    cardType: z.string(),
    sourceTopic: z.string(),
  })).min(1),
});

export const quizResultSchema = z.object({
  title: z.string(),
  questions: z.array(z.object({
    question: z.string().min(1),
    questionType: z.enum(['multiple_choice', 'true_false', 'short_answer', 'fill_blank', 'matching']),
    options: z.array(z.string()),
    correctAnswer: z.string().min(1),
    explanation: z.string(),
    topic: z.string(),
  })).min(1),
});

export const guideResultSchema = z.object({
  title: z.string(),
  sections: z.array(z.object({ heading: z.string(), content: z.array(z.string()) })).min(1),
});

export const assistantResultSchema = z.object({
  answer: z.string(),
  sourceNote: z.enum(['supported_by_notes', 'general_context', 'not_in_notes']),
  relatedTopics: z.array(z.string()),
});

export const notesJsonSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' }, subject: { type: 'string' }, topics: { type: 'array', items: { type: 'string' } },
    definitions: { type: 'array', items: { type: 'object', properties: { term: { type: 'string' }, explanation: { type: 'string' } }, required: ['term', 'explanation'] } },
    keyTerms: { type: 'array', items: { type: 'object', properties: { term: { type: 'string' }, meaning: { type: 'string' } }, required: ['term', 'meaning'] } },
    importantFacts: { type: 'array', items: { type: 'string' } },
    formulas: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, expression: { type: 'string' }, explanation: { type: 'string' } }, required: ['name', 'expression', 'explanation'] } },
    dates: { type: 'array', items: { type: 'object', properties: { date: { type: 'string' }, event: { type: 'string' } }, required: ['date', 'event'] } },
    examples: { type: 'array', items: { type: 'object', properties: { concept: { type: 'string' }, example: { type: 'string' } }, required: ['concept', 'example'] } },
    relationships: { type: 'array', items: { type: 'object', properties: { conceptA: { type: 'string' }, conceptB: { type: 'string' }, relationship: { type: 'string' } }, required: ['conceptA', 'conceptB', 'relationship'] } },
    uncertainSections: { type: 'array', items: { type: 'object', properties: { excerpt: { type: 'string' }, reason: { type: 'string' }, page: { type: 'integer' } }, required: ['excerpt', 'reason'] } },
    sourceReferences: { type: 'array', items: { type: 'object', properties: { page: { type: 'integer' }, label: { type: 'string' } }, required: ['page', 'label'] } },
    summary: { type: 'object', properties: {
      overview: { type: 'string' },
      sections: { type: 'array', items: { type: 'object', properties: { heading: { type: 'string' }, summary: { type: 'string' }, keyPoints: { type: 'array', items: { type: 'string' } } }, required: ['heading', 'summary', 'keyPoints'] } },
      keyTakeaways: { type: 'array', items: { type: 'string' } },
      quickReview: { type: 'string' },
    }, required: ['overview', 'sections', 'keyTakeaways', 'quickReview'] },
  },
  required: ['title', 'subject', 'topics', 'definitions', 'keyTerms', 'importantFacts', 'formulas', 'dates', 'examples', 'relationships', 'uncertainSections', 'sourceReferences', 'summary'],
} as const;

export const flashcardsJsonSchema = {
  type: 'object', properties: { title: { type: 'string' }, cards: { type: 'array', items: { type: 'object', properties: {
    front: { type: 'string' }, back: { type: 'string' }, difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] }, cardType: { type: 'string' }, sourceTopic: { type: 'string' },
  }, required: ['front', 'back', 'difficulty', 'cardType', 'sourceTopic'] } } }, required: ['title', 'cards'],
} as const;

export const quizJsonSchema = {
  type: 'object', properties: { title: { type: 'string' }, questions: { type: 'array', items: { type: 'object', properties: {
    question: { type: 'string' }, questionType: { type: 'string', enum: ['multiple_choice', 'true_false', 'short_answer', 'fill_blank', 'matching'] },
    options: { type: 'array', items: { type: 'string' } }, correctAnswer: { type: 'string' }, explanation: { type: 'string' }, topic: { type: 'string' },
  }, required: ['question', 'questionType', 'options', 'correctAnswer', 'explanation', 'topic'] } } }, required: ['title', 'questions'],
} as const;

export const guideJsonSchema = {
  type: 'object', properties: { title: { type: 'string' }, sections: { type: 'array', items: { type: 'object', properties: { heading: { type: 'string' }, content: { type: 'array', items: { type: 'string' } } }, required: ['heading', 'content'] } } }, required: ['title', 'sections'],
} as const;

export const assistantJsonSchema = {
  type: 'object', properties: { answer: { type: 'string' }, sourceNote: { type: 'string', enum: ['supported_by_notes', 'general_context', 'not_in_notes'] }, relatedTopics: { type: 'array', items: { type: 'string' } } }, required: ['answer', 'sourceNote', 'relatedTopics'],
} as const;
