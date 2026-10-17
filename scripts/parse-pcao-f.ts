// Script to parse PCAO-F questions from the pasted content and generate markdown files

import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Question type mapping based on the content
const questionTopics: Record<string, { id: string; name: string }> = {
  'Just Delegate It': { id: 'JDI', name: 'Just Delegate It' },
  'AI Fluency (4Ds)': { id: 'FLU', name: 'AI Fluency' },
  'Code You Never Write': { id: 'CODE', name: 'Code You Never Write' },
  'Skills & Connectors': { id: 'SKC', name: 'Skills & Connectors' },
  'General Agents on the Web': { id: 'WEB', name: 'General Agents on the Web' },
  'Governance, Risk & Responsible Use': { id: 'GOV', name: 'Governance, Risk & Responsible Use' },
  'Quick Reference': { id: 'C101', name: 'Claude 101 (ChatGPT & Claude Quick Reference)' }
};

// Parse the questions from the content
async function parseQuestions() {
  // Read the pasted content (in a real scenario, this would come from a file or clipboard)
  // For now, we'll work with the content that was provided in the conversation

  // Since we can't directly access the pasted content in this environment,
  // I'll create a function that demonstrates the parsing logic
  // and we can adapt it based on how we want to proceed

  console.log('PCAO-F Question Parser');
  console.log('======================');
  console.log('This script would parse the questions from the pasted content');
  console.log('and generate markdown files in the content/pcao-f/questions/ directory.');
  console.log('');
  console.log('Next steps:');
  console.log('1. Provide the full pasted content to the script');
  console.log('2. Run the script to generate question files');
  console.log('3. Update exam.md to include the new PCAO-F exam');
  console.log('4. Modify the UI to show two MCQS sections side by side');
}

// Example of how a single question would be parsed and formatted
function formatQuestion(questionData: any): string {
  const { id, topic, type, answer, scenario, stem, options, explanation } = questionData;

  let frontmatter = `---\n`;
  frontmatter += `id: ${id}\n`;
  frontmatter += `topic: ${topic}\n`;
  frontmatter += `type: ${type}\n`;
  frontmatter += `answer: ${answer}\n`;
  frontmatter += `---\n\n`;

  let content = '';
  if (scenario && scenario.trim() !== '') {
    content += scenario.trim() + '\n\n';
  }

  content += `**${stem}**\n\n`;

  // Format options (A, B, C, D)
  const optionKeys = Object.keys(options).sort();
  for (const key of optionKeys) {
    content += `${key}. ${options[key]}\n\n`;
  }

  if (explanation && explanation.trim() !== '') {
    content += `## Explanation\n\n`;
    content += explanation.trim() + '\n';
  }

  return frontmatter + content;
}

// Example question data (based on Q1 from the content)
function getExampleQuestion(): any {
  return {
    id: 1,
    topic: 'JDI',
    type: 'single',
    answer: 'C',
    scenario: 'Northwind Pharma Logistics (≈180 staff): ColdChainAudit Rina Patel is a quality compliance auditor at Northwind Pharma Logistics.\nEvery quarter she reviews 60 biologic shipment logs to prepare a temperature-excursion filing for the national health regulator. Rina\ndelegates the first pass to Claude in a fresh chat using a six-question Delegation Brief and logs her progress through the six-step\nDelegation Loop. Case constraints. Biologic shipments spoil if temperatures exceed 8.0°C for more than 30 minutes. Raw data-logger\nPDFs contain patient lot numbers (regulated Red data) alongside shipment IDs, timestamps, and peak temperature readings. Board\npolicy states: "Every temperature claim in a regulatory filing must be traced to the exact page of the primary logger PDF before\nsubmission."',
    stem: 'Which recorded step is the earliest that cannot be justified under the stated constraints?',
    options: {
      A: 'Step 8: independent model convergence was treated as sufficient to sign one specific reading, although unresolved flags require\nconfirmation on the primary logger page.',
      B: 'Step 2: the upload bundle omitted lot identifiers that may be needed to reconcile the twelve scans with the regulator\'s shipment\nregistry, so the Context brief cannot be audited end to end.',
      C: 'Step 7, because tracing a claim requires locating and checking the exact figure on the source page itself, not merely confirming that\nthe attached PDF file opens.',
      D: 'Step 6: a mid-run correction changed the brief\'s acceptance conditions without requiring the assistant to replay every previously\nextracted excursion.'
    },
    explanation: 'Step 7 is correct because the Board policy requires tracing claims to the exact page of the primary logger PDF, not just confirming the file opens. The other options are incorrect because: A confuses model convergence with source verification, B misunderstands what needs to be audited, and D describes a permissible mid-run correction.'
  };
}

// Main function to run the parser
async function main() {
  await parseQuestions();

  // Show example of formatted question
  console.log('Example formatted question (Q1):');
  console.log('==============================');
  console.log(formatQuestion(getExampleQuestion()));
}

main().catch(console.error);