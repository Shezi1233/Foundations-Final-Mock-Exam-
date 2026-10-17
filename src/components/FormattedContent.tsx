import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export default function FormattedContent({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Check if the content has a table (look for | ... |)
  const hasTable = content.includes('|') && content.includes('\n|');

  if (!hasTable) {
    return <p className="text-slate-700 leading-relaxed text-base whitespace-pre-line">{content}</p>;
  }

  // Split text into parts: before table, the table itself, and after table
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let textBuffer: string[] = [];
  let tableBuffer: string[] = [];
  let inTable = false;

  const renderTable = (rows: string[], key: number) => {
    // Process table rows
    const parsedRows = rows.map(r =>
      r.split('|')
        .slice(1, -1) // remove empty first and last element from splitting | ... |
        .map(cell => cell.trim())
    ).filter(row => row.length > 0);

    if (parsedRows.length === 0) return null;

    // Separate header and body (skip alignment row like | :--- | :--- |)
    const headerRow = parsedRows[0];
    const bodyRows = parsedRows.slice(1).filter(row => !row.every(cell => cell.match(/^:?-+:?$/)));

    return (
      <div key={`table-${key}`} className="my-6 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left text-sm text-slate-700 border-collapse">
          <thead className="bg-slate-100 text-slate-900 border-b border-slate-200 uppercase text-xs tracking-wider">
            <tr>
              {headerRow.map((col, idx) => (
                <th key={idx} className="px-4 py-3 font-bold border-r border-slate-200 last:border-r-0">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-4 py-3 font-normal leading-relaxed border-r border-slate-200 last:border-r-0">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  lines.forEach((line, idx) => {
    const isTableLine = line.trim().startsWith('|') && line.trim().endsWith('|');

    if (isTableLine) {
      if (!inTable) {
        // Flush previous text buffer
        if (textBuffer.length > 0) {
          elements.push(
            <p key={`text-${idx}`} className="text-slate-700 leading-relaxed text-base mb-4 whitespace-pre-line">
              {textBuffer.join('\n').trim()}
            </p>
          );
          textBuffer = [];
        }
        inTable = true;
      }
      tableBuffer.push(line);
    } else {
      if (inTable) {
        // Flush table buffer
        elements.push(renderTable(tableBuffer, idx));
        tableBuffer = [];
        inTable = false;
      }
      textBuffer.push(line);
    }
  });

  // Flush remaining buffers
  if (inTable && tableBuffer.length > 0) {
    elements.push(renderTable(tableBuffer, lines.length));
  } else if (textBuffer.length > 0) {
    elements.push(
      <p key="text-last" className="text-slate-700 leading-relaxed text-base whitespace-pre-line">
        {textBuffer.join('\n').trim()}
      </p>
    );
  }

  return <div>{elements}</div>;
}