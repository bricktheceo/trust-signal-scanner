import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { scoreText, grade, render, renderMarkdown, parseArgs, main } from '../bin/trust-signal-scanner.js';

const ROOT = path.resolve(import.meta.dirname, '..');

test('scores strong landing page copy highly', () => {
  const text = `Get a free local-only README audit for indie makers so they can fix trust gaps in 10 minutes. Includes example output, MIT license, no signup, npm install command, privacy FAQ, and a checklist.`;
  const result = scoreText(text);
  assert.equal(result.score, 100);
  assert.equal(grade(result.score), 'A');
});

test('flags vague copy with useful hints', () => {
  const result = scoreText('We help you grow better with powerful solutions.');
  assert.ok(result.score < 40);
  assert.ok(result.results.some((check) => !check.pass && check.id === 'proof'));
});

test('renders concise human output', () => {
  const result = { file: 'README.md', ...scoreText('npx tool README.md free open-source for developers with example results and privacy FAQ to fix pages in 5 minutes') };
  const output = render(result);
  assert.match(output, /Trust Signal Scanner/);
  assert.match(output, /Score:/);
});

test('renders markdown report for pull request comments or docs', () => {
  const result = { file: 'README.md', ...scoreText('vague copy') };
  const output = renderMarkdown(result);
  assert.match(output, /^# Trust Signal Scan/);
  assert.match(output, /## Fix next/);
  assert.match(output, /Clear offer or outcome/);
});

test('parses ci threshold and markdown format flags', () => {
  assert.deepEqual(parseArgs(['README.md', '--markdown', '--min-score', '70']), {
    fileArg: 'README.md',
    format: 'markdown',
    minScore: 70
  });
});

test('main returns nonzero when minimum score is not met', () => {
  const fixture = path.join(ROOT, 'examples', 'weak-page.txt');
  fs.writeFileSync(fixture, 'We help you grow with flexible solutions.');
  const originalLog = console.log;
  console.log = () => {};
  try {
    assert.equal(main([String(fixture), '--min-score', '70']), 2);
  } finally {
    console.log = originalLog;
    fs.unlinkSync(fixture);
  }
});
