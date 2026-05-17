# Trust Signal Scanner

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
Trust Signal Scanner v0.1.0
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

## JSON mode

```bash
node bin/trust-signal-scanner.js README.md --json
```

This prints machine-readable results for CI, scripts, or dashboards.

## Why this exists

Most early projects fail the same quiet test: a stranger lands on the page and cannot quickly tell:

1. what it does,
2. who it is for,
3. why it is credible,
4. what to do next,
5. whether trying it is safe.

This tool catches those misses in under a second. It is free, open-source, local-only, and requires no signup or network calls.

## Limitations

This is a heuristic scanner, not a judge of product quality. It can be fooled by keyword stuffing and it cannot understand design, screenshots, or actual customer fit. Use it as a preflight checklist, then ask a real buyer.

## License

MIT
