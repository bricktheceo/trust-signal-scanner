import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  scoreText,
  grade,
  scanFile,
  summarize,
  render,
  renderMarkdown,
  renderChecklist,
  renderBatch,
  renderBatchMarkdown,
  parseArgs,
  main
} from '../bin/trust-signal-scanner.js';

const ROOT = path.resolve(import.meta.dirname, '..');

test('scores strong landing page copy highly', () => {
  const text = `Get a free local-only README audit for indie makers so they can fix trust gaps in 10 minutes. Includes example output, MIT license, no signup, npm install command, privacy FAQ, and a checklist.`;
  const result = scoreText(text);
  assert.equal(result.score, 100);
  assert.equal(result.grade, 'A');
  assert.equal(grade(result.score), 'A');
});

test('flags vague copy with useful hints', () => {
  const result = scoreText('We help you grow better with powerful solutions.');
  assert.ok(result.score < 40);
  assert.ok(result.results.some((check) => !check.pass && check.id === 'proof'));
});

test('scans a file and includes grade metadata', () => {
  const fixture = path.join(ROOT, 'examples', 'scan-file-fixture.txt');
  fs.writeFileSync(fixture, 'Get a free local-only README audit for indie makers so they can fix trust gaps in 10 minutes. Includes example output, npm install command, privacy FAQ, and a checklist.');
  try {
    const result = scanFile(fixture);
    assert.equal(result.max, 100);
    assert.equal(result.grade, 'A');
  } finally {
    fs.unlinkSync(fixture);
  }
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

test('renders checklist format with missing-signal prompt', () => {
  const result = { file: 'landing.txt', ...scoreText('vague copy') };
  const output = renderChecklist(result);
  assert.match(output, /^# Trust Signal Fix Checklist/);
  assert.match(output, /- \[ \] Clear offer or outcome/);
  assert.match(output, /Copy\/paste brief:/);
});

test('summarizes multiple scans', () => {
  const scans = [
    { file: 'strong.txt', ...scoreText('Get a free local-only README audit for indie makers so they can fix trust gaps in 10 minutes. Includes example output, npm install command, privacy FAQ, and a checklist.') },
    { file: 'weak.txt', ...scoreText('We help you grow with flexible solutions.') }
  ];
  const summary = summarize(scans);
  assert.equal(summary.files, 2);
  assert.ok(summary.averageScore > 0);
  assert.ok(summary.missingSignals.some((signal) => signal.id === 'proof' && signal.missingIn.includes('weak.txt')));
});

test('renders batch text and markdown output', () => {
  const scans = [
    { file: 'README.md', ...scoreText('Get a free local-only README audit for indie makers so they can fix trust gaps in 10 minutes. Includes example output, npm install command, privacy FAQ, and a checklist.') },
    { file: 'docs/index.html', ...scoreText('We help you grow with flexible solutions.') }
  ];
  assert.match(renderBatch(scans, 70), /Files: 2/);
  assert.match(renderBatch(scans, 70), /Most useful fixes:/);
  assert.match(renderBatchMarkdown(scans, 70), /^# Trust Signal Batch Scan/);
  assert.match(renderBatchMarkdown(scans, 70), /Shared gaps/);
});

test('parses ci threshold, markdown format flags, and multiple files', () => {
  assert.deepEqual(parseArgs(['README.md', 'docs/index.html', '--markdown', '--min-score', '70']), {
    fileArg: 'README.md',
    fileArgs: ['README.md', 'docs/index.html'],
    format: 'markdown',
    minScore: 70
  });
});

test('main returns nonzero when any file misses minimum score', () => {
  const weakFixture = path.join(ROOT, 'examples', 'weak-page.txt');
  const strongFixture = path.join(ROOT, 'examples', 'strong-page.txt');
  fs.writeFileSync(weakFixture, 'We help you grow with flexible solutions.');
  fs.writeFileSync(strongFixture, 'Get a free local-only README audit for indie makers so they can fix trust gaps in 10 minutes. Includes example output, npm install command, privacy FAQ, and a checklist.');
  const originalLog = console.log;
  console.log = () => {};
  try {
    assert.equal(main([String(strongFixture), String(weakFixture), '--min-score', '70']), 2);
  } finally {
    console.log = originalLog;
    fs.unlinkSync(weakFixture);
    fs.unlinkSync(strongFixture);
  }
});
