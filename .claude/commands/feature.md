# Feature

Implement this feature or change: $ARGUMENTS

1. Read the relevant `CLAUDE.md` files, package manifests, and nearby source first.
2. Check `git status --short` and do not overwrite unrelated user changes.
3. Identify the directly or indirectly affected app/package set before editing.
4. For frontend work, follow existing local structure; for new frontend areas use FSDD.
5. For backend work, use ports/contracts/constants and keep adapters behind boundaries.
6. Add or update focused backend tests when the change affects behavior and a harness exists or is
   reasonable to add.
7. Run only focused checks for affected apps/packages. Do not run repo-wide scripts unless the user
   explicitly approves.
8. Summarize changed files, checks run, and any assumptions or follow-ups.
