# Trust Signal Scanner

Landing page: https://bricktheceo.github.io/trust-signal-scanner/

Tiny dependency-free CLI that checks landing pages and README files for buyer trust signals.

It is built for indie hackers, small business operators, and developers who ship useful tools but forget to make the page trustworthy enough for strangers to try.

## What it checks

The scanner scores seven practical conversion signals:

- clear offer or outcome
- named target buyer
- proof / credibility
- risk reversal
- obvious next step
- concrete details
- objection handling

It is intentionally blunt. The goal is not perfect marketing theory; the goal is a fast checklist you can run before publishing a repo, README, sales page, or free lead magnet.

## Install / run

```bash
npx trust-signal-scanner README.md
```

Or clone this repo and run locally:

```bash
git clone https://github.com/bricktheceo/trust-signal-scanner.git
cd trust-signal-scanner
npm test
node bin/trust-signal-scanner.js examples/landing-page.txt
```

## Example output

```text
Trust Signal Scanner v0.3.0
File: examples/landing-page.txt
Score: 100/100 (A)

Passed:
  ✓ Clear offer or outcome (+18)
  ✓ Named target buyer (+14)
  ✓ Proof / credibility (+16)
  ✓ Risk reversal (+12)
  ✓ Obvious next step (+18)
  ✓ Specific details (+12)
  ✓ Handles objections (+10)
```

## Output formats

```bash
node bin/trust-signal-scanner.js README.md --json
node bin/trust-signal-scanner.js README.md --markdown
node bin/trust-signal-scanner.js README.md --format markdown
node bin/trust-signal-scanner.js README.md --format checklist
```

JSON is useful for scripts and dashboards. Markdown is useful for pull request comments, launch checklists, and saved audits.

## CI / preflight threshold

Fail a build or launch checklist when the copy is below a minimum score:

```bash
node bin/trust-signal-scanner.js README.md --min-score 70
```

Exit codes:

- `0` — scan completed and met the threshold, or no threshold was set
- `1` — usage, missing file, or invalid option
- `2` — scan completed but score was below `--min-score`

## Why this exists

Most early projects fail the same quiet test: a stranger lands on the page and cannot quickly tell:

1. what it does,
2. who it is for,
3. why it is credible,
4. what to do next,
5. whether trying it is safe.

This tool catches those misses in under a second. It is free, open-source, local-only, and requires no signup or network calls.

## New in v0.2.0

- Markdown output with `--markdown` or `--format markdown`
- `--min-score N` threshold mode for CI and launch preflights
- Extra tests for CLI parsing, Markdown rendering, and threshold exit codes

## Limitations

This is a heuristic scanner, not a judge of product quality. It can be fooled by keyword stuffing and it cannot understand design, screenshots, or actual customer fit. Use it as a preflight checklist, then ask a real buyer.

## License

MIT

## Fix checklist mode

When a page fails the scan, generate a copy/paste editing checklist for the missing trust signals:

```bash
node bin/trust-signal-scanner.js landing.txt --format checklist
```

This is handy for GitHub issues, pull request comments, or handing a page draft back to a founder with the exact gaps to fix.
