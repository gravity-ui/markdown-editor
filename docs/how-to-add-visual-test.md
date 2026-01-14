##### Develop / Visual Tests

# Visual Testing with Playwright

## Description
Visual testing is performed by comparing reference and generated screenshots. Screenshots are taken using `@playwright/test` and `@playwright/experimental-ct-react`.

## Running Tests

Available commands:

```shell
pnpm run playwright:install              # Install Playwright and browsers
pnpm run playwright                      # Run tests
pnpm run playwright:update               # Update reference screenshots
pnpm run playwright:clear                # Clear test cache
pnpm run playwright:report               # Display test results report
pnpm run playwright:docker               # Run tests in Docker
pnpm run playwright:docker:update        # Update screenshots in Docker
pnpm run playwright:docker:clear         # Clear cache in Docker
pnpm run playwright:docker:report        # Display test results report in Docker
```
Tests use the configuration file `playwright.config.ts`. The build is handled by Vite, available in `@playwright/experimental-ct-react`. The Vite configuration is specified in `ctViteConfig` in `playwright.config.ts`. To stabilize tests, `mountFixture` and `expectScreenshotFixture` are also used.

See more: [Playwright Test Components](https://playwright.dev/docs/test-components)


## Running Tests Locally

On the first run, install the required dependencies (Docker or alternatives, Playwright). Run the script `npm run playwright:install`, and during the installation, follow all the instructions provided in the shell.

### Podman example

```shell
brew install podman
podman machine init
podman machine set --cpus 2 --memory 8192
podman machine start
```

```shell
pnpm run playwright:docker
```

## Writing Tests

Creating tests occurs on a local machine, but using commands with the `:docker` postfix to avoid environmental differences.

1. In the `visual-tests` folder, create the following files for reliable execution in Playwright:
  *`[name].helpers.tsx` (prepares the component for testing);
  *`[name].visual.test.tsx` (the actual test).

2. In `[name].helpers.tsx`, prepare the tested component:

  ```tsx
  import {composeStories} from '@storybook/react';

  import * as DefaultMarkdownStories from '../../demo/stories/markdown/Markdown.stories';

  export const MarkdownStories = composeStories(DefaultMarkdownStories);
  ```

3. In `[name].visual.test.tsx`, create the test:

  ```tsx
  import {test} from 'playwright/core';

  import {MarkdownStories} from './MarkdownExtensions.helpers';

  test.describe('Extensions, Markdown', () => {
    test('Heading', async ({mount, expectScreenshot}) => {
      await mount(<MarkdownStories.Heading />);
      await expectScreenshot();
    });
  });
  ```

4. To update reference screenshots in Docker, run:

  ```shell
  pnpm run playwright:docker:update -g "test name"
  ```

See more: [Command line](https://playwright.dev/docs/test-cli)

5. The generated screenshots will be saved in `__snapshots__`. After that, verify:
  * Consistency with Storybook;
  * Correct font rendering;
  * Image and icon loading;
  * Compliance with expected results.

6. Test reports (in Docker) can be viewed using the following command:

  ```shell
  pnpm run playwright:docker:report
  ```

## Writing Complex Tests

### Editor helpers
The core also includes helper functions designed to simplify UI interactions, testing, and debugging. These allow you to quickly switch editor modes, paste and clear text, visually highlight elements, and inspect their HTML markup during development.

See:
  ```
  tests/playwright/core/editor.ts
  tests/playwright/core/helpers.ts
  ```

### Locator Best Practices
When writing tests targeting the editor’s view layer and plugins in the WYSIWYG mode, follow these guidelines for reliable locator usage:

1. Use `editor.fill`, `editor.press`, or `editor.pressSequentially` to emulate user input within the `contenteditable` region.
2. Prefer locating elements via `data-qa` attributes when working with React-based components (e.g., plugins that define node views via React).
3. When targeting elements rendered without React (e.g., via `toDOM` in a ProseMirror node spec), use class names or specific attributes instead.

## Clipboard specifics

Playwright clipboard support varies across browsers. Keep this in mind when writing copy-paste tests.

## Click testing

Playwright provides three main ways to perform clicks:

- `locator.click()`
- `element.dispatchEvent('click', params)`
- `page.mouse.click(x, y)`

Choose the method based on your code specifics. For events involving bubbling, consider using `dispatchEvent` with `{ bubbles: true }`.

## Useful Links

- [Playwright API](https://playwright.dev/docs/api/class-test)
- [Writing Playwright Tests](https://playwright.dev/docs/writing-tests)
