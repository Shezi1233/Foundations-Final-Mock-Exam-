# BUILD PROMPT: "Foundations Mock Exam" MCQ Website

Paste this whole file into Claude Code, run from inside this folder (`mcq-exam-kit/`). The question content already exists in `/content`. Do not rewrite or reword it.

---

## 1. Goal

Build a clean, professional, exam-simulation website with **Next.js (App Router) + TypeScript + Tailwind CSS**. All exam text (instructions, questions, options, answers, explanations) lives in **Markdown files** under `/content` and is parsed at build/request time. No database, no backend, no login.

## 2. Tech stack and rules

- Next.js (latest stable, App Router), TypeScript, Tailwind CSS.
- `gray-matter` for frontmatter, plain string parsing for the body. No heavy UI libraries.
- Create the project in the **current folder**. Keep `/content` exactly as it is.
- Content is read on the server (`fs`) in a Server Component and passed to a client `<ExamApp />` component.
- Must work with `npm run dev` and `npm run build`, and be deployable to Vercel with no configuration.

## 3. Content format (already provided)

`/content/exam.md` has frontmatter: `title`, `durationMinutes` (120), `totalQuestions` (60), `totalMarks` (1000), `passMarks` (720), `shuffleQuestions` (false), and `topics` (map of code to topic name). The body has an `## Instructions` bullet list to show on the start screen.

`/content/questions/q01.md` ... `q60.md`. Each file looks like:

```
---
id: 5
topic: SKC
type: multi            # "single" or "multi" (multi = Select TWO)
answer: A,B            # one letter, or two letters separated by a comma
---

Scenario paragraph(s).

**The question stem?**

A. option text
B. option text
C. option text
D. option text

## Explanation

Explanation text.
```

Parsing rules:
- Everything before the line starting with `**` (the bold stem line) is the scenario.
- The bold line is the stem.
- Lines matching `^([A-D])\.\s+(.+)$` are the options.
- Everything after `## Explanation` is the explanation.
- Sort questions by `id`.

## 4. User flow (3 screens)

### Screen 1: Start
- Clean centered card with the exam title and the instructions from `exam.md`.
- Show quick facts: 60 questions, 2 hours, 1000 marks, pass mark 720.
- A **Name** input (required, at least 2 characters, trimmed).
- A **Begin Exam** button, disabled until the name is valid.
- Pressing it starts the exam and the 2-hour countdown.

### Screen 2: Exam
- **Top bar:** exam title, candidate name, and a countdown timer (HH:MM:SS). Under 10 minutes the timer turns red. At 00:00:00 the exam **auto-submits**.
- **Main area:** "Question X of 60", the scenario text, the bold stem, and the four options.
  - `single`: radio-style options (one selection).
  - `multi`: checkbox-style options, a visible **SELECT TWO** badge, and a hard limit of two selections (extra clicks are ignored with a small hint).
  - Do **not** show the topic or the correct answer during the exam.
- **Buttons at the bottom:**
  - **Save & Next** is the main button. It is **enabled only when the answer is complete** (single: 1 option chosen; multi: exactly 2 chosen). It saves the answer and moves to the next question.
  - **Previous** moves back (answers stay saved and editable).
  - **Clear** removes the current selection.
  - On the **last question** the main button reads **Save & Submit** and opens a confirm dialog showing answered / unanswered counts, with Cancel and Submit buttons.
- **Question palette** (sidebar on desktop, collapsible drawer on mobile): a grid of 60 numbered buttons. States: current, answered, unanswered. Click to jump. Include a **Submit Exam** button with the same confirm dialog.
- **Keyboard shortcuts:** `A`-`D` toggle options, `Enter` = Save & Next (only when allowed), left/right arrows = Previous / Next.

### Screen 3: Result
- Candidate name, date, and time taken.
- **Score out of 1000** shown large. A **PASS** (green) or **FAIL** (red) badge. Passing score = 720.
- Correct / wrong / unanswered counts and percentage.
- **Topic-wise performance:** a table or bars for the 10 topics (correct / total and percent), with topics under 70% marked **Weak**. Use the `topics` map from `exam.md` for names.
- **Full review:** every question with the user's answer, the correct answer, correct/wrong/unanswered marker, and the explanation. Filter tabs: All / Wrong / Unanswered / Correct.
- Buttons: **Retake Exam** (clears saved state, returns to Start) and **Print / Save as PDF** (`window.print()` with a clean print stylesheet).

## 5. Scoring rules

- Each question is worth `totalMarks / totalQuestions` (1000 / 60 = 16.67).
- A question is correct **only if the selected set exactly equals the answer set** (for multi, both letters must be right; partial credit = 0).
- `score = Math.round(correctCount * 1000 / 60)`.
- `PASS` if `score >= 720`. (Note: 43 correct = 717 = FAIL; 44 correct = 733 = PASS. Add a unit test for this.)
- Unanswered counts as wrong.

## 6. State and persistence

- Keep exam state in a small reducer/store: `name`, `startedAt` (timestamp), `answers` (`Record<id, string[]>`), `currentIndex`, `status` (`start | exam | result`), `submittedAt`.
- Persist to `localStorage` so a **page refresh does not reset the exam or the timer**. The timer must be computed from `startedAt + duration`, not from a counter, so it stays accurate across refreshes and tab sleeps.
- On load, if an exam is in progress, resume it. If time has already expired, go straight to Result.
- **Retake** clears the stored state.

## 7. Design

- Clean, modern, distraction-free. Light background, one accent colour (indigo), good whitespace, rounded cards, subtle shadows.
- Readable typography: 17-18px body text, generous line height; scenario in a softly shaded block; options as large clickable cards with a clear selected state.
- Fully responsive (mobile first). Accessible: proper labels, focus rings, `aria-live` for the timer warnings, sufficient contrast.
- Smooth but minimal transitions. No clutter.

## 8. Suggested structure

```
content/                    (provided, do not change)
src/app/layout.tsx
src/app/page.tsx            (server: loads content, renders <ExamApp />)
src/components/ExamApp.tsx
src/components/StartScreen.tsx
src/components/ExamScreen.tsx
src/components/QuestionPalette.tsx
src/components/ResultScreen.tsx
src/components/ConfirmDialog.tsx
src/lib/content.ts          (markdown loading + parsing)
src/lib/scoring.ts          (pure scoring + topic stats)
src/lib/types.ts
scripts/validate-content.ts (see below)
```

## 9. Validation script (required)

Create `npm run validate` that fails loudly if any of these are wrong:
- Exactly 60 question files with ids 1..60 and no duplicates.
- Every question has the 4 options A-D, a non-empty stem, and an explanation.
- `type: single` has exactly 1 answer letter and `type: multi` has exactly 2, and every answer letter exists among the options.
- Every `topic` code exists in `exam.md`.
- A stem containing "(Select TWO)" must have `type: multi`.

Print a summary: 60 questions, number of single and multi, and the count per topic.

## 10. How to work

1. First read `/content/exam.md` and 3 sample question files, then give me a short plan (file list and approach). Do not wait for approval, continue after the plan.
2. Scaffold the project, build the lib layer and the validator first, and run `npm run validate`.
3. Build the UI screens.
4. Run `npm run lint`, `npm run build`, and fix every error.
5. Add a unit test for the scoring (including the 43 vs 44 correct edge case and multi-select exact matching).
6. Finish with a short README: how to run, how to add or edit questions (just edit the `.md` files), and how to deploy to Vercel.

## 11. Acceptance checklist

- [ ] Start screen asks for a name; Begin Exam is disabled until valid.
- [ ] Timer counts down from 2:00:00, survives refresh, turns red under 10 minutes, auto-submits at zero.
- [ ] Save & Next is disabled until the answer is complete (1 for single, exactly 2 for multi).
- [ ] Last question shows Save & Submit with a confirm dialog.
- [ ] Palette shows answered / unanswered / current and allows jumping.
- [ ] Result shows score /1000, PASS or FAIL against 720, topic-wise performance, and a full review with explanations.
- [ ] No topic, answer, or explanation is visible during the exam.
- [ ] `npm run validate`, `npm run lint`, `npm run build` and the scoring tests all pass.
- [ ] Editing a `.md` question file changes the site with no code changes.
