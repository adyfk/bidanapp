# Changesets

Use Changesets for release-worthy changes in this repository.

## Rule

- For any `feat`, `fix`, `perf`, `revert`, or breaking change PR, add a changeset with `npm run changeset`.
- Always select `@marketplace/release` when the prompt asks which package should be versioned.
- `docs`, `test`, `chore`, `ci`, `build`, `ops`, and `refactor` changes do not need a changeset unless they are breaking.
