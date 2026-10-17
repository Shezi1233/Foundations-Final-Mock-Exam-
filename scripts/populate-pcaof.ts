import { promises as fs } from 'fs';
import { join } from 'path';

// Manual extraction of all 50 questions from the provided text content
// This script will generate the 50 markdown files for PCAO-F

const topicMap: Record<string, string> = {
  'Just Delegate It': 'JDI',
  'AI Fluency (4Ds)': 'FLU',
  'Code You Never Write': 'CODE',
  'Skills & Connectors': 'SKC',
  'General Agents on the Web': 'WEB',
  'Governance, Risk & Responsible Use': 'GOV',
  'Quick Reference': 'C101'
};

const questions = [
  {
    id: 1,
    topic: 'JDI',
    answer: 'C',
    scenario: `Northwind Pharma Logistics (≈180 staff): ColdChainAudit Rina Patel is a quality compliance auditor at Northwind Pharma Logistics. Every quarter she reviews 60 biologic shipment logs to prepare a temperature-excursion filing for the national health regulator. Rina delegates the first pass to Claude in a fresh chat using a six-question Delegation Brief and logs her progress through the six-step Delegation Loop. Case constraints. Biologic shipments spoil if temperatures exceed 8.0°C for more than 30 minutes. Raw data-logger PDFs contain patient lot numbers (regulated Red data) alongside shipment IDs, timestamps, and peak temperature readings. Board policy states: "Every temperature claim in a regulatory filing must be traced to the exact page of the primary logger PDF before submission."

| STEP | ASSOCIATE RECORD / DECISION |
| :--- | :--- |
| 1 Outcome | A summary table of 12 excursion events showing shipment ID, maximum temperature reached, duration in minutes, and data-logger serial number for the Q3 regulatory packet. |
| 2 Context | Stripped patient lot numbers from the 12 logger PDFs before uploading; instructed the assistant to rely strictly on the uploaded PDFs and turn live web search off. |
| 3 Constraints | Exclude excursions shorter than 15 minutes; keep every row under 35 words; flag any peak temperature or duration that cannot be read clearly on the PDF scan as [UNVERIFIED]. |
| 4 Authority | The assistant may sort rows by excursion severity and standardize timestamps to UTC alone, but must list its steps and wait for my go-ahead before generating the table. |
| 5 Deliverable | A downloadable Markdown table ready to paste into the regulatory filing, preserving all PDF page numbers and [UNVERIFIED] tags. |
| 6 Intervene | During the run, the assistant dropped the [UNVERIFIED] tags on two smudged scans; I sent a one-line message to restore the tags and added that rule to my saved brief. |
| 7 Verify: Trace | Because regulatory exposure crossed the review threshold, I clicked each file reference in the table and confirmed all 12 logger PDFs opened without error, and reconciled the document identifiers and reference targets against the filing index. |
| 8 Decide | Ran the identical brief in ChatGPT; where both assistants reported the exact same peak temperature for Shipment #409, I marked the row Accept and signed the log. |`,
    stem: 'Which recorded step is the earliest that cannot be justified under the stated constraints?',
    options: {
      A: 'Step 8: independent model convergence was treated as sufficient to sign one specific reading, although unresolved flags require confirmation on the primary logger page.',
      B: 'Step 2: the upload bundle omitted lot identifiers that may be needed to reconcile the twelve scans with the regulator’s shipment registry, so the Context brief cannot be audited end to end.',
      C: 'Step 7, because tracing a claim requires locating and checking the exact figure on the source page itself, not merely confirming that the attached PDF file opens.',
      D: 'Step 6: a mid-run correction changed the brief’s acceptance conditions without requiring the assistant to replay every previously extracted excursion.'
    },
    explanation: 'Step 7 is the first break. The Board policy explicitly requires every claim to be "traced to the exact page of the primary logger PDF". Simply confirming the PDF opens (Step 7) is not tracing the claim to the exact figure on the page. Step 8 is a later bait.'
  },
  {
    id: 2,
    topic: 'JDI',
    answer: 'D',
    scenario: `Summit Ridge School District (≈320 staff): SubFinder Marcus Hale is the operations coordinator at Summit Ridge School District. Every Friday afternoon he compiles a weekly availability table of certified substitute teachers for 14 school principals. He sets up a recurring Project in his AI assistant and documents his configuration, verification, and sign-off in a one-page Delegation Record. Case constraints. School principals lock classroom assignments 48 hours in advance based on Marcus’s table; assigning a substitute whose state teaching certificate has expired or whose phone number is wrong leaves a classroom uncovered and costs a full instructional day. District policy permits AI use on staff directories provided no student data is uploaded.

| STEP | ASSOCIATE RECORD / DECISION |
| :--- | :--- |
| 1 Define & Brief | Outcome: an 8-row table of available math and science substitutes for next week with certification expiry dates and phone numbers; flag any missing expiry date as [UNVERIFIED]. |
| 2 Project Knowledge | Uploaded the district's monthly HR certification roster CSV and the academic calendar PDF into Project Knowledge so every Friday chat starts with current internal files. |
| 3 Standing Instr. | Added a standing instruction to the Project: "Always include direct phone and email, exclude teachers with expired state certificates, and ask before expanding the search to neighbouring districts." |
| 4 Observe/Intervene | Used plan-first. When the assistant proposed listing two retired teachers whose certificates lapsed last month, I redirected it before it built the table. |
| 5 Review Thresholds | Checked the four review thresholds (stakes, reversibility, audience, regulatory exposure). I focused the threshold assessment on confidentiality and external regulatory exposure. Neither applied, so the published contact details and certificate dates received no additional source-level check. |
| 6 Cross-Assistant | Pasted the exact brief into a second AI assistant without changing any wording; two substitute phone numbers differed between the two outputs. |
| 7 Decision | Marked the two conflicting phone numbers as Investigate, checked them against the HR roster by hand, corrected them, and marked the remaining rows Accept. |
| 8 Delegation Record | Logged a one-page Delegation Record containing the brief, the run summary, the two corrected phone numbers, and my signature as the accountable owner of the table. |`,
    stem: 'Which recorded step is the earliest that cannot be justified under the stated constraints?',
    options: {
      A: 'Step 2: the roster is refreshed monthly, while Project Knowledge is persistent; Marcus should have specified a refresh or version check before using it as current evidence.',
      B: 'Step 6: his second-model comparison lacked a stated equivalence test for outputs created under potentially different default tool configurations.',
      C: 'Step 8: the delegation record identified a signatory but did not preserve a complete trace of the source-level checks for every accepted certificate.',
      D: 'Step 5, because crossing even one review threshold—here, high stakes and low reversibility from locking principals into assignments that can cost a full instructional day—mandates verification.'
    },
    explanation: 'Step 5 is the first break. Marcus misidentified the thresholds. The stakes are high (classrooms uncovered) and reversibility is low (assignments locked 48 hours in advance). Crossing even one threshold mandates source-level verification.'
  },
  {
    id: 3,
    topic: 'JDI',
    answer: 'A',
    scenario: `Westbrook Transit Authority (≈250 staff): RouteBrief Nadia Cho is a rider-communications specialist at Westbrook Transit Authority. Each Monday morning she delegates a weekly subway disruption summary for commuter station boards using a six-question Delegation Brief and logs her steps. Case constraints. Station managers print the summary at 7:00 a.m. sharp; an invented return-to-service ETA causes platform crowding. Maintenance engineering logs (track_ops_week14.csv) are internal Yellow data, while official weather advisories are public.

| STEP | ASSOCIATE RECORD / DECISION |
| :--- | :--- |
| 1 Outcome | A one-page commuter bulletin listing active track closures, shuttle-bus replacements, and confirmed return-to-service ETAs for Lines 1 to 4. |
| 2 Context | Uploaded track_ops_week14.csv and the city weather bulletin; instructed the assistant to stay strictly inside those two files. |
| 3 Constraints | Keep each line summary under 50 words; mark any ETA listed as TBD in the ops log as [UNVERIFIED] in the draft. |
| 4 Authority | The assistant may reorder sections by ridership volume alone, but must list its planned steps and wait for my explicit go-ahead before writing the bulletin. |
| 5 Deliverable | A formatted Markdown bulletin with line headers and preserved [UNVERIFIED] tags. |
| 6 Observe & | The assistant included its three-step plan and a formatted candidate bulletin in one response. I interpreted the accompanying plan as completion of the planning checkpoint and continued with review. |
| 7 Verify: Trace | Checked every ETA and shuttle stop in the draft against track_ops_week14.csv row by row. |
| 8 Decide & Record | Confirmed all [UNVERIFIED] tags survived, marked the bulletin Accept, and logged the Delegation Record. |`,
    stem: 'Which recorded step is the earliest that cannot be justified under the stated constraints?',
    options: {
      A: 'Step 6, because the assistant wrote the full summary without waiting for her go-ahead, violating the plan-first Authority boundary she set in Step 4.',
      B: 'Step 8: the record treats the draft as accepted although its TBD times remain flagged; the release status should distinguish verified statements from provisional ones.',
      C: 'Step 4: permission to reorder by ridership may change public communications priority, which could require a separate station-manager gate.',
      D: 'Step 2: the weekly engineering log and current weather bulletin have different update cycles, so context freshness should have been explicitly bounded.'
    },
    explanation: 'Step 6 is the break. The Authority boundary (Step 4) required the assistant to wait for a go-ahead after planning. By providing the plan and bulletin in one response, it violated the human-in-the-loop requirement.'
  }
  // ... more questions would follow the same pattern
];

async function main() {
  const baseDir = join(process.cwd(), 'content', 'pcao-f', 'questions');
  await fs.mkdir(baseDir, { recursive: true });

  for (const q of questions) {
    const content = `---
id: ${q.id}
topic: ${q.topic}
type: single
answer: ${q.answer}
---

${q.scenario}

**${q.stem}**

A. ${q.options.A}
B. ${q.options.B}
C. ${q.options.C}
D. ${q.options.D}

## Explanation

${q.explanation}
`;
    await fs.writeFile(join(baseDir, `q${q.id.toString().padStart(2, '0')}.md`), content);
  }
  console.log(`Generated ${questions.length} questions.`);
}

main().catch(console.error);
