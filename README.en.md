# TIBO Sliding Intensity Calibrator

[中文主版本](README.md)

A 31-level TIBO portrait slider deployed on Vercel. GitHub Actions calculates the rating every hour from public community signals provided by codex-reset.com, then writes the latest snapshot and Tibo's three most recent updates to `public/data/tibo-score.json`. The website reads the data directly from the GitHub file.

## Data flow

```text
GitHub Actions (at 10 minutes past every hour)
  → codex-reset.com/api/feed: Tibo public reset signals and events
  → commit public/data/tibo-score.json and public/data/tibo-timeline.json
  → Vercel page reads the raw GitHub JSON directly
```

The final level is calculated as:

```text
round(30 × signal strength)
```

- An active full reset has a signal strength of `1.0`. Completed resets and banked resets decay one level at a time after 24 hours, 3 days, and 7 days; candidates, related activity, and calm status receive progressively lower levels.
- The score reflects the strength of public community signals. It is not sentiment analysis of X replies and is not an official OpenAI status.
- History is retained for 90 days. Dragging the slider only changes the preview in the current browser and does not write back to the repository. **Auto calibrate** returns to the level corresponding to the current reset probability.

## GitHub setup

No X or OpenAI keys are required. Confirm that **Settings → Actions → General → Workflow permissions** allows workflows to read and write repository contents. Then run **Actions → Calculate TIBO score → Run workflow** once manually; the workflow will run automatically every hour afterward.

Data files:

- Latest score: `public/data/tibo-score.json`
- 90-day history: `public/data/tibo-timeline.json`

## Vercel deployment

Import this GitHub repository into Vercel. Choose **Vite** as the Framework Preset, use `npm run build` as the build command, and use `dist` as the output directory. These settings are already declared in `vercel.json`.

The default data source is the raw GitHub URL for this repository. If you move the repository or want to use your own data mirror, set the following Environment Variables in Vercel:

| Name | Purpose |
| --- | --- |
| `VITE_SCORE_URL` | HTTPS URL for the latest score JSON |
| `VITE_TIMELINE_URL` | HTTPS URL for the historical timeline JSON |

Neither Vercel nor GitHub Actions needs to store X or OpenAI keys. If the community data source is unavailable or marked stale, the workflow fails without overwriting the last valid snapshot.

The default raw GitHub data source requires the repository to remain public. If the repository is private, provide browser-readable public HTTPS data URLs through both `VITE_*_URL` variables.

## Run locally

```bash
npm install
npm run dev
npm test
npm run build
```

## Six anchor levels

| Level | Chinese nickname | English state name |
| --- | --- | --- |
| 0 | 牢TIBO | TIBO: CONTAINED |
| 6 | 小TIBO | TIBO: STANDBY |
| 12 | 笑TIBO | TIBO: ONLINE |
| 18 | 硬TIBO | TIBO: IN COMMAND |
| 24 | 神TIBO | TIBO: ASCENDANT |
| 30 | 圣TIBO | SAINT TIBO |

## Assets and license

The source code is released under the [MIT](LICENSE) license. The portraits in `media/source-frames` and `public/frames` are used only for this playful demo and are not licensed under MIT. Obtain permission from the subject and the relevant rights holders before redistributing them.
