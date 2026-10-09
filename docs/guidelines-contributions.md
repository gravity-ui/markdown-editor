##### Contributing

## Important Information for Contributors

### Thank You for Your Contribution! 🙌
Your work helps make Markdown Editor better. To keep everything organized, reviews simple, and collaboration efficient, please follow these guidelines.

### Core Contributors
- [@d3m1d0v](https://github.com/d3m1d0v)
- [@makhnatkin](https://github.com/makhnatkin)

### Commit and PR Standards
We follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for consistency. The available commit types are:

- **`feat`**: New features (triggers a **minor release**).
- **`fix`**: Bug fixes (triggers a **patch release**).
- **`refactor`**: Code structure changes without affecting functionality.
- **`perf`**: Performance improvements.
- **`build`**: Changes to the build system or dependencies.
- **`chore`**: Miscellaneous tasks that don’t modify source code or tests.
- **`ci`**: Updates to CI configuration.
- **`docs`**: Documentation updates.
- **`test`**: Adding or updating tests.

#### Key Notes:
1. Only `feat`, `fix`, `refactor`, and `perf` are included in the changelog.
2. Other types (e.g., `docs`, `chore`) are excluded from the changelog but still improve clarity.
3. **Avoid using `feat!`**, as it signals breaking changes. For such changes, create or comment on an issue tagged with `breaking change` in [Planned Breaking Changes](https://github.com/gravity-ui/markdown-editor/issues?q=is%3Aissue+is%3Aopen+label%3A%22breaking+change%22).

### PR Titles, Descriptions, Linking to Issues
- **Titles**: Titles will be used in the changelog. Keep them concise, clear, and meaningful.
- **Commit messages**: These will be squashed during the merge, but clear messages help during code reviews.
- **Descriptions**:
  - Include a reference to the related issue using `#` (e.g., `#123`).
  - Use **[keywords](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword)** (e.g., `Fixes #123`) to link the issue in the "Development" section of GitHub.
  - If no issue exists, briefly describe the task and why it’s needed.
  - Add a "before and after" demo if it helps clarify the changes. See an example [here](https://github.com/gravity-ui/markdown-editor/pull/476).

### Organizing PRs for Reviews
- Split changes into **logically complete commits**.
- Don’t mix refactoring with feature/bug fixes in the same PR. Use separate PRs or commits.
- Keep PRs small and focused. Clear and manageable PRs are reviewed faster.

### Tests, Stories, Documentation
It’s highly recommended that PRs include:
- **Tests**: Cover any new features or changes.
- **Stories**: Add Storybook stories for UI updates.
- **Documentation**: Update relevant docs for API or functional changes.

### Language Requirements
- **Use English for all comments, PR descriptions, and commits**:
  This ensures contributors from different countries can easily understand the context and changes.

### Ask for Help
If you have questions, reach out to the core contributors. We’re here to assist you.

By following these guidelines, we can ensure high-quality contributions, smooth reviews, and efficient development. Thank you for making Markdown Editor better! 🚀
