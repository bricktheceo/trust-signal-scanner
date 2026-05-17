#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const VERSION = '0.2.0';

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
  return { score, max: checks.reduce((sum, check) => sum + check.points, 0), results };
}

function grade(score) {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
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

function parseArgs(argv) {
  const options = { format: 'text', minScore: null, fileArg: null };
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
    } else if (!arg.startsWith('-') && !options.fileArg) {
      options.fileArg = arg;
    }
  }
  return options;
}

function usage() {
  return `Usage:\n  trust-signal-scanner <file> [--json|--markdown|--format text|json|markdown] [--min-score N]\n\nExamples:\n  npx trust-signal-scanner README.md\n  trust-signal-scanner landing-page.txt --markdown\n  trust-signal-scanner README.md --min-score 70`;
}

function main(argv = process.argv.slice(2)) {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(usage());
    return 0;
  }
  const { fileArg, format, minScore } = parseArgs(argv);
  if (!fileArg) {
    console.error(usage());
    return 1;
  }
  if (!['text', 'json', 'markdown'].includes(format)) {
    console.error(`Unsupported format: ${format}`);
    return 1;
  }
  if (minScore !== null && (!Number.isFinite(minScore) || minScore < 0 || minScore > 100)) {
    console.error('--min-score must be a number from 0 to 100');
    return 1;
  }
  const file = path.resolve(fileArg);
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${fileArg}`);
    return 1;
  }
  const text = fs.readFileSync(file, 'utf8');
  const result = { file: fileArg, ...scoreText(text) };
  const output = format === 'json'
    ? JSON.stringify(result, null, 2)
    : format === 'markdown'
      ? renderMarkdown(result)
      : render(result);
  console.log(output);
  return minScore !== null && result.score < minScore ? 2 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = main();
}

export { scoreText, grade, render, renderMarkdown, parseArgs, main, checks };
