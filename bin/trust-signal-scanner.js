#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const VERSION = '0.4.0';

const checks = [
  {
    id: 'clear-offer',
    points: 18,
    label: 'Clear offer or outcome',
    hint: 'Say what the visitor gets and why it matters in one plain sentence.',
    test: (text) => /\b(get|build|ship|save|fix|audit|report|template|kit|tool|check|score|generate|turn)\b.{0,90}\b(for|so|without|that|in)\b/i.test(text)
  },
  {
    id: 'target-buyer',
    points: 14,
    label: 'Named target buyer',
    hint: 'Name a specific customer segment: “for dentists”, “for indie hackers”, “for local service businesses”.',
    test: (text) => /\b(for|built for|made for|designed for)\s+[^.!?]{0,90}\b(teams|founders|makers|hackers|agencies|businesses|creators|developers|contractors|clinics|shops|restaurants|consultants|operators|owners)\b/i.test(text)
  },
  {
    id: 'proof',
    points: 16,
    label: 'Proof / credibility',
    hint: 'Add evidence: example output, screenshots, numbers, testimonials, case study, demo, or changelog.',
    test: (text) => /\b(example|demo|screenshot|case study|testimonial|results?|before|after|sample|proof|changelog|benchmarks?|\d+\s?(users|customers|minutes|hours|days|%))\b/i.test(text)
  },
  {
    id: 'risk-reversal',
    points: 12,
    label: 'Risk reversal',
    hint: 'Explain why trying this is low-risk: free, open-source, local-only, no signup, refund, or reversible.',
    test: (text) => /\b(free|open[- ]source|no signup|local[- ]only|private|refund|cancel|reversible|no credit card|MIT|Apache|GPL)\b/i.test(text)
  },
  {
    id: 'next-step',
    points: 18,
    label: 'Obvious next step',
    hint: 'Include a concrete CTA: install, run this command, book, download, email, open an issue, or try the demo.',
    test: (text) => /\b(npm|npx|pip|brew|docker|git clone|download|install|run|try|book|email|contact|open an issue|start|copy)\b/i.test(text)
  },
  {
    id: 'specificity',
    points: 12,
    label: 'Specific details',
    hint: 'Replace vague claims with numbers, timeframes, file names, examples, limits, or concrete deliverables.',
    test: (text) => /\b\d+\b|\b(CSV|JSON|Markdown|PDF|README|CLI|API|URL|minutes?|hours?|days?|step-by-step|checklist)\b/i.test(text)
  },
  {
    id: 'objection-handling',
    points: 10,
    label: 'Handles objections',
    hint: 'Answer at least one buyer worry: setup time, privacy, accuracy, maintenance, cost, or who it is not for.',
    test: (text) => /\b(privacy|private|secure|setup|takes|cost|price|accuracy|limitations?|not for|works with|requires|maintenance|support|FAQ)\b/i.test(text)
  }
];

function maxScore() {
  return checks.reduce((sum, check) => sum + check.points, 0);
}

function scoreText(text) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const results = checks.map((check) => ({
    id: check.id,
    label: check.label,
    points: check.points,
    pass: check.test(normalized),
    hint: check.hint
  }));
  const score = results.reduce((sum, result) => sum + (result.pass ? result.points : 0), 0);
  return { score, max: maxScore(), grade: grade(score), results };
}

function grade(score) {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function scanFile(fileArg) {
  const file = path.resolve(fileArg);
  if (!fs.existsSync(file)) throw new Error(`File not found: ${fileArg}`);
  const text = fs.readFileSync(file, 'utf8');
  return { file: fileArg, ...scoreText(text) };
}

function summarize(scans) {
  const scores = scans.map((scan) => scan.score);
  const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  return {
    files: scans.length,
    averageScore: average,
    lowestScore: scores.length ? Math.min(...scores) : 0,
    highestScore: scores.length ? Math.max(...scores) : 0,
    passingFiles: scans.filter((scan) => scan.score >= 70).length,
    missingSignals: checks.map((check) => ({
      id: check.id,
      label: check.label,
      missingIn: scans.filter((scan) => scan.results.some((result) => result.id === check.id && !result.pass)).map((scan) => scan.file)
    })).filter((item) => item.missingIn.length > 0)
  };
}

function render({ file, score, max, results }) {
  const missing = results.filter((result) => !result.pass);
  const passed = results.filter((result) => result.pass);
  const lines = [];
  lines.push(`Trust Signal Scanner v${VERSION}`);
  lines.push(`File: ${file}`);
  lines.push(`Score: ${score}/${max} (${grade(score)})`);
  lines.push('');
  lines.push('Passed:');
  for (const result of passed) lines.push(`  ✓ ${result.label} (+${result.points})`);
  if (missing.length) {
    lines.push('');
    lines.push('Fix next:');
    for (const result of missing) lines.push(`  • ${result.label}: ${result.hint}`);
  }
  return lines.join('\n');
}

function renderMarkdown({ file, score, max, results }) {
  const missing = results.filter((result) => !result.pass);
  const passed = results.filter((result) => result.pass);
  const lines = [];
  lines.push('# Trust Signal Scan');
  lines.push('');
  lines.push(`- **File:** \`${file}\``);
  lines.push(`- **Score:** ${score}/${max} (${grade(score)})`);
  lines.push('');
  lines.push('## Passed');
  lines.push('');
  if (passed.length) {
    for (const result of passed) lines.push(`- ✅ **${result.label}** (+${result.points})`);
  } else {
    lines.push('- None yet.');
  }
  lines.push('');
  lines.push('## Fix next');
  lines.push('');
  if (missing.length) {
    for (const result of missing) lines.push(`- **${result.label}:** ${result.hint}`);
  } else {
    lines.push('- No missing trust signals detected. Ship it.');
  }
  return lines.join('\n');
}

function renderChecklist({ file, score, max, results }) {
  const missing = results.filter((result) => !result.pass);
  const lines = [];
  lines.push(`# Trust Signal Fix Checklist: ${file}`);
  lines.push('');
  lines.push(`Current score: ${score}/${max} (${grade(score)})`);
  lines.push('');
  if (!missing.length) {
    lines.push('- [x] No missing trust signals detected. Ship it.');
    return lines.join('\n');
  }
  for (const result of missing) {
    lines.push(`- [ ] ${result.label} (${result.points} pts): ${result.hint}`);
  }
  lines.push('');
  lines.push('Copy/paste brief:');
  lines.push(`Improve ${file} by adding: ${missing.map((result) => result.label.toLowerCase()).join(', ')}. Keep it specific, truthful, and concise.`);
  return lines.join('\n');
}

function renderBatch(scans, minScore = null) {
  const summary = summarize(scans);
  const lines = [];
  lines.push(`Trust Signal Scanner v${VERSION}`);
  lines.push(`Files: ${summary.files}`);
  lines.push(`Average score: ${summary.averageScore}/100 (${grade(summary.averageScore)})`);
  if (minScore !== null) lines.push(`Minimum required: ${minScore}/100`);
  lines.push('');
  for (const scan of scans) {
    const mark = minScore !== null && scan.score < minScore ? '✗' : '✓';
    lines.push(`${mark} ${scan.file}: ${scan.score}/${scan.max} (${grade(scan.score)})`);
  }
  if (summary.missingSignals.length) {
    lines.push('');
    lines.push('Most useful fixes:');
    for (const signal of summary.missingSignals.slice(0, 5)) {
      lines.push(`  • ${signal.label}: missing in ${signal.missingIn.length} file${signal.missingIn.length === 1 ? '' : 's'}`);
    }
  }
  return lines.join('\n');
}

function renderBatchMarkdown(scans, minScore = null) {
  const summary = summarize(scans);
  const lines = [];
  lines.push('# Trust Signal Batch Scan');
  lines.push('');
  lines.push(`- **Files:** ${summary.files}`);
  lines.push(`- **Average score:** ${summary.averageScore}/100 (${grade(summary.averageScore)})`);
  if (minScore !== null) lines.push(`- **Minimum required:** ${minScore}/100`);
  lines.push('');
  lines.push('## Files');
  lines.push('');
  for (const scan of scans) {
    const mark = minScore !== null && scan.score < minScore ? '❌' : '✅';
    lines.push(`- ${mark} \`${scan.file}\` — ${scan.score}/${scan.max} (${grade(scan.score)})`);
  }
  lines.push('');
  lines.push('## Shared gaps');
  lines.push('');
  if (summary.missingSignals.length) {
    for (const signal of summary.missingSignals) lines.push(`- **${signal.label}:** missing in ${signal.missingIn.join(', ')}`);
  } else {
    lines.push('- No missing trust signals detected. Ship it.');
  }
  return lines.join('\n');
}

function parseArgs(argv) {
  const options = { format: 'text', minScore: null, fileArgs: [], fileArg: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') {
      options.format = 'json';
    } else if (arg === '--markdown') {
      options.format = 'markdown';
    } else if (arg === '--format') {
      options.format = argv[++index];
    } else if (arg.startsWith('--format=')) {
      options.format = arg.slice('--format='.length);
    } else if (arg === '--min-score') {
      options.minScore = Number(argv[++index]);
    } else if (arg.startsWith('--min-score=')) {
      options.minScore = Number(arg.slice('--min-score='.length));
    } else if (!arg.startsWith('-')) {
      options.fileArgs.push(arg);
    }
  }
  options.fileArg = options.fileArgs[0] ?? null;
  return options;
}

function usage() {
  return `Usage:\n  trust-signal-scanner <file...> [--json|--markdown|--format text|json|markdown|checklist] [--min-score N]\n\nExamples:\n  npx trust-signal-scanner README.md\n  trust-signal-scanner README.md landing-page.txt --markdown\n  trust-signal-scanner README.md docs/index.html --min-score 70\n  trust-signal-scanner landing-page.txt --format checklist`;
}

function main(argv = process.argv.slice(2)) {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(usage());
    return 0;
  }
  const { fileArgs, format, minScore } = parseArgs(argv);
  if (!fileArgs.length) {
    console.error(usage());
    return 1;
  }
  if (!['text', 'json', 'markdown', 'checklist'].includes(format)) {
    console.error(`Unsupported format: ${format}`);
    return 1;
  }
  if (minScore !== null && (!Number.isFinite(minScore) || minScore < 0 || minScore > 100)) {
    console.error('--min-score must be a number from 0 to 100');
    return 1;
  }

  let scans;
  try {
    scans = fileArgs.map(scanFile);
  } catch (error) {
    console.error(error.message);
    return 1;
  }

  const output = format === 'json'
    ? JSON.stringify({ scans, summary: summarize(scans) }, null, 2)
    : scans.length > 1
      ? format === 'markdown'
        ? renderBatchMarkdown(scans, minScore)
        : format === 'checklist'
          ? scans.map(renderChecklist).join('\n\n---\n\n')
          : renderBatch(scans, minScore)
      : format === 'markdown'
        ? renderMarkdown(scans[0])
        : format === 'checklist'
          ? renderChecklist(scans[0])
          : render(scans[0]);
  console.log(output);
  return minScore !== null && scans.some((scan) => scan.score < minScore) ? 2 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = main();
}

export { scoreText, grade, scanFile, summarize, render, renderMarkdown, renderChecklist, renderBatch, renderBatchMarkdown, parseArgs, main, checks };
