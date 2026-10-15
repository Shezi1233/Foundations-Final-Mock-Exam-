# Foundations Mock Exam MCQ Website

A clean, professional, exam-simulation website built with Next.js (App Router), TypeScript, and Tailwind CSS.

## Features

- **Exam Simulation**: Professional UI for taking multiple-choice exams.
- **Markdown-Driven Content**: All questions and exam settings are loaded from Markdown files in the `/content` directory.
- **Persistence**: Exam state (name, answers, timer) survives page refreshes using `localStorage`.
- **Timer**: 2-hour countdown with visual warnings when time is low.
- **Results & Review**: Detailed score breakdown, topic-wise performance, and a full review of all questions with explanations.
- **Printable Results**: Clean stylesheet for printing or saving results as PDF.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Work

### Adding or Editing Questions

To add or edit questions, simply modify the `.md` files in the `content/questions/` directory.

- Questions should follow the naming convention `qXX.md` (e.g., `q01.md`, `q02.md`).
- Each question file must have a frontmatter with `id`, `topic`, `type` (single or multi), and `answer`.
- The body should contain the scenario, the question stem (bolded), options (A-D), and an explanation section (`## Explanation`).

### Validating Content

Run the following command to ensure all question files follow the required format:
```bash
npm run validate
```

### Building for Production

To build the application for production:
```bash
npm run build
```

### Deployment

This project is a standard Next.js application and can be deployed to **Vercel** with zero configuration:

1. Push your code to a GitHub/GitLab/Bitbucket repository.
2. Connect your repository to Vercel.
3. Vercel will automatically detect Next.js and deploy the site.

## Scoring Rules

- Total marks: 1000
- Passing score: 720
- Each question is worth approximately 16.67 marks (1000 / 60).
- Multiple-answer questions require an exact match (both letters correct) to score points; partial credit is not awarded.
- Unanswered questions count as wrong.

## Development

- `src/lib/content.ts`: Handles loading and parsing of Markdown content.
- `src/lib/scoring.ts`: Contains logic for calculating scores and topic performance.
- `src/components/`: Contains all UI components (StartScreen, ExamScreen, ResultScreen, etc.).
- `scripts/validate-content.ts`: Script to validate the integrity of the exam content.
