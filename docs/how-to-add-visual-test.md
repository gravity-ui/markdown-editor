##### Develop / Visual tests

# Visual Testing with Playwright

## Description
Visual testing is performed by comparing reference and generated screenshots. Screenshots are taken using `@playwright/test` and `@playwright/experimental-ct-react`.

## Running Tests

Available commands:

```shell
npm run playwright:install              # Install Playwright and browsers
npm run playwright                      # Run tests
npm run playwright:update               # Update reference screenshots
npm run playwright:clear-cache          # Clear test cache
npm run playwright:docker               # Run tests in Docker
npm run playwright:docker:update        # Update screenshots in Docker
npm run playwright:docker:clear-cache   # Clear cache in Docker
```
Tests use the configuration file `playwright.config.ts`. The build is handled by Vite, available in `@playwright/experimental-ct-react`. The Vite configuration is specified in `ctViteConfig` in `playwright.config.ts`. To stabilize tests, `mountFixture` and `expectScreenshotFixture` are also used.

To avoid environmental differences, it is recommended to run tests in Docker using `playwright-docker.sh`.

## Running Tests Locally

On the first run, install the required dependencies (Docker, Playwright).

```shell
npm run playwright:docker
```

## Writing Tests

1. In the `visual-tests` folder, create the following files for reliable execution in Playwright:
  *`[name].helpers.tsx` (prepares the component for testing);
  *`[name].visual.test.tsx` (the actual test).

2. In `[name].helpers.tsx`, prepare the tested component:

  ```tsx
  import { PlaygroundMini } from '../../demo/components/PlaygroundMini';
  import { markup } from '../../demo/stories/markdown/markup';

  export const Heading = () => <PlaygroundMini initial={markup.heading} />;
  ```

3. In `[name].visual.test.tsx`, create the test:

  ```tsx
  import { test } from 'playwright/core';
  import { Heading } from './YourTitle.helpers';

  test.describe('Extensions, Markdown', () => {
    test('Heading', async ({ mount, expectScreenshot }) => {
      await mount(<Heading />);
      await expectScreenshot();
    });
  });
  ```

4. To update reference screenshots in Docker, run:

  ```shell
  npm run playwright:docker:update
  ```

5. The generated screenshots will be saved in `__snapshots__`. After that, verify:
  * Consistency with Storybook;
  * Correct font rendering;
  * Image and icon loading;
  * Compliance with expected results.

6. In case of an error, you can view reports with the following command:

  ```shell
  npx playwright show-report playwright-report-docker
  ```

## Useful Links

- [Playwright Test Components](https://playwright.dev/docs/test-components)
- [Playwright API](https://playwright.dev/docs/api/class-test)
- [Writing Playwright Tests](https://playwright.dev/docs/writing-tests)
