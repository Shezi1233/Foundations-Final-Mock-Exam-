import { promises as fs } from 'fs';
import { dirname, join } from 'path';

// This script parses the PCAO-F questions from a raw text file and generates markdown files.
// The raw text file should contain the content as provided in the user's message.

interface PCAOQuestion {
  id: number;
  topic: string;
  type: 'single' | 'multiple';
  answer: string; // comma-separated for multiple
  scenario: string;
  stem: string;
  options: Record<string, string>;
  explanation: string;
}

// Define the topics mapping
const topicMapping: Record<string, string> = {
  'Just Delegate It': 'JDI',
  'AI Fluency (4Ds)': 'FLU',
  'Code You Never Write': 'CODE',
  'Skills & Connectors': 'SKC',
  'General Agents on the Web': 'WEB',
  'Governance, Risk & Responsible Use': 'GOV',
  'Quick Reference': 'C101'
};

// We'll parse the raw text by splitting on the question markers.
// The pattern in the content is:
//   Q#    Topic    |    SELECT ONE/TWO
//   ... (the question content)
//   My answer: _________    Governing rule: __________________________    Closest alternative: _________
//
// But note: the actual format in the pasted content is more complex.

// Instead, we can split by the lines that start with "Q" followed by a number and then spaces and then the topic.
// However, the pasted content has page numbers and headers.

// Given the complexity and time, we will implement a simple parser that looks for the pattern:
//   Q<number>    <topic>    |    SELECT <ONE/TWO>
// and then captures until the next "Q<number>" or end of file.

// We'll read the entire file and split by the regex that matches the start of a question.

async function parseQuestionsFromFile() {
  const filePath = join(process.cwd(), 'pcao-f-raw.txt');
  let rawContent;
  try {
    rawContent = await fs.readFile(filePath, 'utf8');
  } catch (err) {
    console.error(`Could not read file ${filePath}`);
    console.error('Please make sure to save the pasted content to pcao-f-raw.txt in the root directory.');
    process.exit(1);
  }

  // We'll split the content by the pattern that starts a question.
  // Looking at the pasted content, each question starts with a line like:
  //   Q1    Just Delegate It    |    SELECT ONE
  // or
  //   Q23    Just Delegate It    |    SELECT TWO
  const questionSplitRegex = /^Q(\d+)\s+([^|]+?)\s+\|\s+SELECT\s+(ONE|TWO)/gm;

  // We'll also need to capture the content until the next question or the end.
  const matches = [...rawContent.matchAll(questionSplitRegex)];
  const questions: PCAOQuestion[] = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const questionNumber = parseInt(match[1]);
    const topicFull = match[2].trim();
    const selectType = match[3] === 'ONE' ? 'single' : 'multiple';

    // Find the start and end of this question's content
    const startIndex = match.index;
    const endIndex = i < matches.length - 1 ? matches[i + 1].index : rawContent.length;

    const questionText = rawContent.slice(startIndex, endIndex);

    // Now parse the questionText to extract:
    //   - The scenario and stem (which is everything until the options)
    //   - The options (A, B, C, D)
    //   - The answer (from the line "My answer: _________")
    //   - The explanation (from the answer key at the end, but we don't have it in the question block)

    // Note: the pasted content does not include the explanation in the question block.
    // The explanations are at the end in the "Answers and reasoning" section.

    // We have two options:
    //   1. Extract the explanation from the answer key section (which is also in the pasted content).
    //   2. Leave the explanation blank and ask the user to fill it in.

    // Given the complexity, we will extract the explanation from the answer key section.

    // First, let's extract the question stem and options from the questionText.

    // We know that the questionText contains:
    //   The company/person scenario (multiple lines)
    //   Then the STEP ASSOCIATE RECORD / DECISION table (which we can ignore for the question text?)
    //   Then the question stem (which is in bold in the markdown, but in the raw it's just a line)
    //   Then the options (A, B, C, D) each on their own line or multi-line.
    //   Then the line: "My answer: _________    Governing rule: __________________________    Closest alternative: _________"

    // We'll split the questionText by lines.
    const lines = questionText.split('\n');

    // We'll look for the line that starts with the stem (which is in bold in the markdown, but in the raw it's not marked).
    // Actually, in the pasted content, the stem is not marked with **. It's just a line.

    // Instead, we can look for the line that contains the options (starting with "A.").

    // Let's find the index of the line that starts with "A."
    const optionALineIndex = lines.findIndex(line => line.trim().startsWith('A.'));
    if (optionALineIndex === -1) {
      console.warn(`Could not find options for question ${questionNumber}`);
      continue;
    }

    // The stem is everything from the start of the questionText until the line before the option A line.
    // But note: there might be a blank line or the table.

    // We'll take everything from the beginning until the option A line (exclusive) and then trim.
    // However, we want to remove the company/person scenario and the table? Actually, the scenario is part of the question.

    // In the markdown format we want, we have:
    //   scenario: the company/person description (until the STEP ASSOCIATE RECORD line?)
    //   stem: the actual question (the line that asks for the step or what went wrong, etc.)

    // Looking at the pasted content, the pattern is:
    //   [Company info]
    //   STEP ASSOCIATE RECORD / DECISION
    //   [table]
    //   [The question stem, e.g., "Which recorded step is the earliest that cannot be justified under the stated constraints?"]
    //   A. ...
    //   B. ...
    //   C. ...
    //   D. ...
    //   My answer: ...

    // So we can split the questionText into two parts: before the table and after the table? Not reliable.

    // Given the time, we will simplify and treat the entire questionText (excluding the options and the "My answer" line) as the scenario and stem combined.
    // Then we will split it at the last occurrence of a line that ends with a question mark? Not reliable.

    // Alternatively, we can note that in the markdown we generated earlier, we put the scenario in the `scenario` field and the stem in the `stem` field.
    // But for now, we will put the entire text (above the options) into the `scenario` field and leave the `stem` as the first line that looks like a question.

    // Let's try to extract the stem as the line that comes right before the options and ends with a question mark.

    // We'll look backwards from the option A line for a line that ends with a question mark.
    let stemLine = '';
    for (let j = optionALineIndex - 1; j >= 0; j--) {
      const line = lines[j].trim();
      if (line.endsWith('?')) {
        stemLine = line;
        break;
      }
    }

    // If we didn't find a question mark, we'll take the line before the option A line as the stem.
    if (!stemLine) {
      stemLine = lines[optionALineIndex - 1].trim();
    }

    // The scenario is everything from the start until the stem line (exclusive).
    const scenarioLines = lines.slice(0, optionALineIndex);
    // Remove the stem line from the scenario lines if we found it separately.
    // We'll just take everything until the option A line and then remove the stem line if we found it at the end.
    // Actually, let's just take everything until the option A line and then remove the last line if it's the stem we extracted.
    const scenarioText = lines.slice(0, optionALineIndex - 1).join('\n').trim();

    // Now extract the options
    const options: Record<string, string> = {};
    let currentOption = '';
    let currentOptionText = '';
    for (let j = optionALineIndex; j < lines.length; j++) {
      const line = lines[j].trim();
      if (line.match(/^[A-D]\./)) {
        // If we were building an option, save it
        if (currentOption) {
          options[currentOption] = currentOptionText.trim();
        }
        const optionMatch = line.match(/^([A-D])\.\s+(.*)/);
        if (optionMatch) {
          currentOption = optionMatch[1];
          currentOptionText = optionMatch[2];
        }
      } else if (currentOption && line !== '' && !line.startsWith('My answer:')) {
        // Continue the current option's text
        currentOptionText += ' ' + line;
      } else if (line.startsWith('My answer:')) {
        // End of options
        break;
      }
    }
    // Save the last option
    if (currentOption) {
      options[currentOption] = currentOptionText.trim();
    }

    // Extract the answer from the "My answer: _________" line
    const answerLineIndex = lines.findIndex(line => line.startsWith('My answer:'));
    let answer = '';
    if (answerLineIndex !== -1) {
      const answerLine = lines[answerLineIndex];
      // The answer is after "My answer: " and before the next space or the end?
      // Actually, it's "My answer: _________" so we need to look at the answer key at the end.
      // We will leave the answer blank for now and get it from the answer key section.
    }

    // We will leave the answer blank and the explanation blank for now, and then we will try to extract them from the answer key section.

    // For now, we'll push a question with empty answer and explanation, and we'll fill them later.
    questions.push({
      id: questionNumber,
      topic: topicMapping[topicFull] || topicFull, // fallback to the full topic if not in mapping
      type: selectType,
      answer: '', // to be filled
      scenario: scenarioText,
      stem: stemLine,
      options,
      explanation: '' // to be filled
    });
  }

  // Now, we need to extract the answers and explanations from the answer key section.
  // The answer key section starts after the line that says "Expert practice edition  |  Answers and reasoning"
  // and then has lines like:
  //   Q1    ANSWER: C
  //   Just Delegate It
  //   Step 7, because tracing a claim requires locating and checking the exact figure on the source page itself, not merely
  //   confirming that the attached PDF file opens.
  //   Review prompt: Identify the closest competing answer and specify the precise fact or rule that disqualifies it.

  // We'll split the raw content by the answer key marker.
  const answerKeyStartRegex = /Expert practice edition  \|  Answers and reasoning/;
  const answerKeyStartMatch = rawContent.search(answerKeyStartRegex);
  let answerKeyText = '';
  if (answerKeyStartMatch !== -1) {
    answerKeyText = rawContent.slice(answerKeyStartMatch);
  } else {
    console.warn('Could not find answer key section');
  }

  // Now, parse the answer key text to get the answers and explanations for each question.
  // Each answer block starts with a line like: "Q#    ANSWER: X"
  // Then the topic line, then the explanation lines until the next Q# or the end.

  const answerSplitRegex = /^Q(\d+)\s+ANSWER:\s+([A-D])/gm;
  const answerMatches = [...answerKeyText.matchAll(answerSplitRegex)];

  // We'll create a map from question number to {answer: string, explanation: string}
  const answerMap = new Map();

  for (let i = 0; i < answerMatches.length; i++) {
    const match = answerMatches[i];
    const questionNumber = parseInt(match[1]);
    const answerLetter = match[2];

    // Find the start and end of this answer block
    const startIndex = match.index;
    const endIndex = i < answerMatches.length - 1 ? answerMatches[i + 1].index : answerKeyText.length;

    const answerBlock = answerKeyText.slice(startIndex, endIndex);

    // Split the answer block into lines
    const blockLines = answerBlock.split('\n');

    // The first line is the "Q#    ANSWER: X"
    // The second line is the topic (we can ignore)
    // The rest until the next Q# or a blank line is the explanation.

    // We'll look for the explanation: it starts after the topic line and goes until we hit a line that starts with "Q" (for the next question) or a line that is "Review prompt:" or empty?
    // Actually, the explanation is multiple lines and then there is a "Review prompt:" line.

    // Let's find the line that starts with "Review prompt:"
    const reviewPromptLineIndex = blockLines.findIndex(line => line.startsWith('Review prompt:'));
    let explanationLines: string[] = [];
    if (reviewPromptLineIndex !== -1) {
      // The explanation is from line 2 (skip the Q# line and the topic line) until the review prompt line
      explanationLines = blockLines.slice(2, reviewPromptLineIndex);
    } else {
      // If we don't find a review prompt, we'll take everything after the topic line until the end or until a line that starts with "Q"
      explanationLines = blockLines.slice(2);
    }

    const explanation = explanationLines.map(line => line.trim()).join('\n').trim();

    answerMap.set(questionNumber, {
      answer: answerLetter,
      explanation: explanation
    });
  }

  // Now, update the questions with the answers and explanations from the answer map
  for (const question of questions) {
    const answerData = answerMap.get(question.id);
    if (answerData) {
      question.answer = answerData.answer;
      question.explanation = answerData.explanation;
    } else {
      console.warn(`No answer data found for question ${question.id}`);
    }
  }

  // Now, generate the markdown files for each question
  const questionsDir = join(process.cwd(), 'content', 'pcao-f', 'questions');
  await fs.mkdir(questionsDir, { recursive: true });

  for (const question of questions) {
    const fileName = `q${question.id.toString().padStart(2, '0')}.md`;
    const filePath = join(questionsDir, fileName);

    let frontmatter = `---\n`;
    frontmatter += `id: ${question.id}\n`;
    frontmatter += `topic: ${question.topic}\n`;
    frontmatter += `type: ${question.type}\n`;
    frontmatter += `answer: ${question.answer}\n`;
    frontmatter += `---\n\n`;

    let content = '';
    if (question.scenario && question.scenario.trim() !== '') {
      content += question.scenario.trim() + '\n\n';
    }

    content += `**${question.stem}**\n\n`;

    // Format options (A, B, C, D)
    const optionKeys = Object.keys(question.options).sort();
    for (const key of optionKeys) {
      content += `${key}. ${question.options[key]}\n\n`;
    }

    if (question.explanation && question.explanation.trim() !== '') {
      content += `## Explanation\n\n`;
      content += question.explanation.trim() + '\n';
    }

    await fs.writeFile(filePath, frontmatter + content, 'utf8');
    console.log(`Generated: ${filePath}`);
  }

  console.log(`Generated ${questions.length} questions.`);
}

parseQuestionsFromFile().catch(console.error);