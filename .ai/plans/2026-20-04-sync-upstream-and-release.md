## Title

Scheduled upstream sync to `dev` with workflow exclusion and `web-fast` release

## Brief Summary

Add a tiny scheduler workflow on default branch `dev` that calls a reusable workflow stored on `web-fast-overlay`. The reusable workflow will fetch upstream `dev`, assemble a candidate `dev` tree as `upstream/dev` plus restored overlay files, remove upstream workflows, generate the caller workflow back onto `dev`, update `bun.lock` in CI, build `packages/web-fast`, and only then push the new `dev` commit and run a deploy placeholder.

## Key Implementation Changes

- Add minimal scheduler workflow to `dev`
- Add reusable workflow to `web-fast-overlay`
- Add git sync logic that resets to upstream `dev`, removes `.github/workflows/**`, restores `packages/web-fast/**`, and generates the caller workflow file onto `dev`
- Run `bun install` in CI so `bun.lock` is regenerated in the assembled tree
- Gate push to `dev` on successful `packages/web-fast` build
- Use caller-workflow concurrency with `cancel-in-progress: true`
- Use a dedicated secret token for pushes that modify `.github/workflows/*` on `dev`
- Leave a placeholder deploy step after successful push

## Tests Or Verification

- Verify the default-branch workflow on `dev` triggers on `schedule` and `workflow_dispatch`
- Verify the reusable workflow on `web-fast-overlay` accepts `workflow_call`
- Verify no-op exit when upstream `dev` has no new commits
- Verify assembled tree restores `packages/web-fast/**` and regenerates `.github/workflows/sync-upstream-and-release.yml`
- Verify all other `.github/workflows/**` files from upstream are removed from `dev`
- Verify `bun install` can update `bun.lock`
- Verify `cd packages/web-fast && bun run build` succeeds before push
- Verify build failure prevents push to `dev` and skips deploy

## Decisions Made By User

- Keep upstream `dev` and fork `dev` in sync
- Real workflow logic lives on `web-fast-overlay`
- Sync semantics are reset to upstream plus one fork-specific commit on top
- Exclude all `.github/workflows/**` from the synced `dev` branch
- Regenerate only `.github/workflows/sync-upstream-and-release.yml` onto `dev`
- Restore `packages/web-fast/**` from `web-fast-overlay`
- Do not restore `bun.lock`; let CI update it
- If build fails, do not update `dev`; fail workflow and skip deploy
- Workflow filename is `sync-upstream-and-release.yml`

## Tradeoffs And Risks Discussed

- Scheduled workflows must exist on the default branch, so a tiny caller workflow is still required on `dev`
- Rebuilding `dev` from upstream removes any fork-only files not explicitly restored
- Excluding all workflows avoids upstream automation drift, but any useful workflow must be explicitly restored later
- Regenerating `bun.lock` in CI may add noisy diffs to sync commits
- Using one path for two different branch-specific workflow roles requires generating the caller workflow onto `dev` during sync while keeping the reusable workflow on `web-fast-overlay`
- `GITHUB_TOKEN` cannot update workflow files on `dev` in this setup, so a separate credential with workflow-file write permission is required

## Remaining Open Questions

- None

## Execution Guidance

Implement with a tiny caller workflow at `.github/workflows/sync-upstream-and-release.yml` on `dev`, and a reusable workflow with full sync/build/deploy logic at the same path on `web-fast-overlay`. During sync, regenerate the caller workflow file onto `dev` so it survives workflow exclusion while the reusable workflow remains on `web-fast-overlay`. If implementation deviates from this saved plan, update this file to reflect the latest approved plan state and surface the deviation to the user.
