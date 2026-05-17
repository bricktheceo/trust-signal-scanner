import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreText, grade, render } from '../bin/trust-signal-scanner.js';

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
