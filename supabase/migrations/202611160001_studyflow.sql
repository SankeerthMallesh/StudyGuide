-- StudyFlow relational schema. Apply this migration in the Supabase SQL editor or with Supabase CLI.
create extension if not exists pgcrypto;

create table if not exists public.study_materials (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, subject text not null default '', source_type text not null default 'images' check (source_type in ('images','pdf','text')),
  page_count integer not null default 0 check (page_count >= 0), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.uploaded_files (
  id uuid primary key default gen_random_uuid(), material_id uuid not null references public.study_materials(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, storage_path text not null, file_type text not null,
  page_number integer not null check (page_number > 0), created_at timestamptz not null default now()
);
create table if not exists public.extracted_notes (
  id uuid primary key default gen_random_uuid(), material_id uuid not null references public.study_materials(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, extracted_content jsonb not null,
  confidence_data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.flashcard_decks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid references public.study_materials(id) on delete set null, title text not null, created_at timestamptz not null default now()
);
create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(), deck_id uuid not null references public.flashcard_decks(id) on delete cascade,
  front text not null, back text not null, difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  card_type text not null default 'recall', source_topic text not null default '', next_review_at timestamptz, last_reviewed_at timestamptz,
  review_count integer not null default 0 check (review_count >= 0), status text not null default 'new' check (status in ('new','known','review'))
);
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid references public.study_materials(id) on delete set null, title text not null,
  kind text not null default 'quiz' check (kind in ('quiz','test')), configuration jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(), quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question text not null, question_type text not null, options jsonb not null default '[]'::jsonb,
  correct_answer text not null, explanation text not null default '', topic text not null default ''
);
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(), quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, score integer not null default 0, total integer not null default 0,
  percentage numeric(5,2) not null default 0, duration_seconds integer not null default 0,
  topic_scores jsonb not null default '{}'::jsonb, completed_at timestamptz not null default now()
);
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid references public.study_materials(id) on delete set null, session_type text not null,
  duration_seconds integer not null default 0 check (duration_seconds >= 0), completed_at timestamptz not null default now()
);
create table if not exists public.studyflow_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade, data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now()
);

create index if not exists study_materials_user_created_idx on public.study_materials(user_id, created_at desc);
create index if not exists uploaded_files_material_idx on public.uploaded_files(material_id, page_number);
create index if not exists extracted_notes_material_idx on public.extracted_notes(material_id, created_at desc);
create index if not exists flashcard_decks_user_idx on public.flashcard_decks(user_id, created_at desc);
create index if not exists flashcards_due_idx on public.flashcards(next_review_at) where next_review_at is not null;
create index if not exists quizzes_user_idx on public.quizzes(user_id, created_at desc);
create index if not exists quiz_attempts_user_idx on public.quiz_attempts(user_id, completed_at desc);
create index if not exists study_sessions_user_idx on public.study_sessions(user_id, completed_at desc);

alter table public.study_materials enable row level security;
alter table public.uploaded_files enable row level security;
alter table public.extracted_notes enable row level security;
alter table public.flashcard_decks enable row level security;
alter table public.flashcards enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.study_sessions enable row level security;
alter table public.studyflow_workspaces enable row level security;

create policy "users manage own study materials" on public.study_materials for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own uploaded files" on public.uploaded_files for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own extracted notes" on public.extracted_notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own decks" on public.flashcard_decks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage cards in own decks" on public.flashcards for all
using (exists (select 1 from public.flashcard_decks d where d.id = deck_id and d.user_id = auth.uid()))
with check (exists (select 1 from public.flashcard_decks d where d.id = deck_id and d.user_id = auth.uid()));
create policy "users manage own quizzes" on public.quizzes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage questions in own quizzes" on public.quiz_questions for all
using (exists (select 1 from public.quizzes q where q.id = quiz_id and q.user_id = auth.uid()))
with check (exists (select 1 from public.quizzes q where q.id = quiz_id and q.user_id = auth.uid()));
create policy "users manage own quiz attempts" on public.quiz_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own study sessions" on public.study_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage own workspace snapshot" on public.studyflow_workspaces for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('studyflow-uploads', 'studyflow-uploads', false, 7340032, array['image/jpeg','image/png','image/webp']) on conflict (id) do nothing;
create policy "users access own studyflow uploads" on storage.objects for all to authenticated
using (bucket_id = 'studyflow-uploads' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'studyflow-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
