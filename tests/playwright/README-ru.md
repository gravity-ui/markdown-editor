# Визуальное тестирование с помощью Playwright

## Описание
Визуальное тестирование осуществляется путем сравнения эталонных и сгенерированных скриншотов. Для снятия скриншотов используются `@playwright/test` и `@playwright/experimental-ct-react`.

## Запуск тестов

Используемые команды:

```shell
npm run playwright:install              # Установка Playwright и браузеров
npm run playwright                      # Запуск тестов
npm run playwright:update               # Обновление эталонных скриншотов
npm run playwright:clear-cache          # Очистка кэша тестов
npm run playwright:docker               # Запуск тестов в Docker
npm run playwright:docker:update        # Обновление скриншотов в Docker
npm run playwright:docker:clear-cache   # Очистка кэша в Docker
```

Тесты используют конфигурационный файл `playwright.config.ts`. Сборка выполняется с помощью Vite, доступного в `@playwright/experimental-ct-react`. Конфигурация Vite описана в `ctViteConfig` в `playwright.config.ts`. Для стабилизации тестов дополнительно используются `mountFixture` и `expectScreenshotFixture`.

Во избежание различий в окружениях рекомендуется запускать тесты в Docker с помощью `playwright-docker.sh`.

## Локальный запуск тестов

При первом запуске необходимо установить недостающие зависимости (Docker, Playwright).

```shell
npm run playwright:docker
```

## Написание тестов

1. В папке `visual-tests` необходимо создать файлы (для надежной работы в Playwright):
- `[имя].helpers.tsx` (подготовка компонента к тестированию);
- `[имя].visual.test.tsx` (сам тест).

2. В файле `[имя].helpers.tsx` подготовить тестируемый компонент:

   ```tsx
   import { PlaygroundMini } from '../../demo/components/PlaygroundMini';
   import { markup } from '../../demo/stories/markdown/markup';

   export const Heading = () => <PlaygroundMini initial={markup.heading} />;
   ```

3. В файле `[имя].visual.test.tsx` создать тест:

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

4. Для обновления эталонных скриншотов в Docker требуется выполнить:

   ```shell
   npm run playwright:docker:update
   ```

5. Созданные скриншоты будут сохранены в `__snapshots__`. После этого необходимо проверить:
- соответствие сторибуку;
- корректность отображения шрифтов;
- загрузку изображений и иконок;
- соответствие ожидаемому результату.

6. В случае ошибки можно посмотреть отчеты командой
  ```shell
  npx playwright show-report playwright-report-docker
  ```

## Полезные ссылки

- [Playwright Test Components](https://playwright.dev/docs/test-components)
- [Playwright API](https://playwright.dev/docs/api/class-test)
- [Writing Playwright Tests](https://playwright.dev/docs/writing-tests)
