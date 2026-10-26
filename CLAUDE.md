# Git workflow

Push finished work straight to `master` — that branch deploys the live site.
Do not create or push to feature branches (including `claude/*` branches) and
do not open pull requests unless the owner asks for one.

Before pushing, run lint, tests and a build from `pptrantours/`:
`npx eslint . && npm test && npx next build`.
