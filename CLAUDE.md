# Git workflow

Push finished work straight to `master` — that branch deploys the live site
(https://www.ppptrantoursja.com). Never create or push to any other branch,
`claude/*` branches included, and do not open pull requests unless the owner
asks for one. No need to mention in replies that the push went to `master`.

`pptrantours/vercel.json` skips Vercel builds for every branch except
`master`/`main`; keep it that way.

Before pushing, run lint, tests and a build from `pptrantours/`:
`npx eslint . && npm test && npx next build`.
