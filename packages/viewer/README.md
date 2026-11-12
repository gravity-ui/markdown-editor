# @gravity-ui/markdown-viewer &middot; [![npm package](https://img.shields.io/npm/v/@gravity-ui/markdown-viewer)](https://www.npmjs.com/package/@gravity-ui/markdown-viewer)

Render prepared HTML with React 18 or 19. Supports server rendering and hydration. Prepare HTML, styles, and runtimes in your application.

## Installation

```bash
npm install @gravity-ui/markdown-viewer @gravity-ui/components @gravity-ui/uikit react react-dom
```

## Usage

```tsx
import {MarkdownViewer} from '@gravity-ui/markdown-viewer';

export function Document({html}: {html: string}) {
  return <MarkdownViewer html={html} />;
}
```

> [!NOTE]
> The viewer does not sanitize HTML. Sanitize untrusted content before passing it to `html`.

### YFM styles

For YFM content, install `@diplodoc/transform` and import its CSS. `cnYFM()` adds the `yfm` class:

```tsx
import {MarkdownViewer, cnYFM} from '@gravity-ui/markdown-viewer';

import '@diplodoc/transform/dist/css/yfm.css';

export function Document({html}: {html: string}) {
  return <MarkdownViewer html={html} className={cnYFM()} />;
}
```

<details>
<summary>YFM options</summary>

`cnYFM(mods?, mix?)` returns the `yfm` class, modifier classes, and extra classes from `mix`. The package also exports the `YFMMods` type.

| Modifier          | Effect                               |
| ----------------- | ------------------------------------ |
| `no-list-reset`   | Keep list counters from being reset. |
| `no-stripe-table` | Turn off striped table rows.         |

</details>

<details>
<summary>Viewer props and HTML updates</summary>

`ref`, `className`, `style`, `qa`, and other HTML attributes apply to the `div` with the HTML. The outer wrapper is not part of the public API.

The package exports the `MarkdownViewerProps` type.

| Prop       | Type                             | Description                                              |
| ---------- | -------------------------------- | -------------------------------------------------------- |
| `html`     | `string`                         | Required. Prepared HTML.                                 |
| `children` | `ReactNode`                      | React content outside the HTML that the viewer replaces. |
| `ref`      | `Ref<HTMLDivElement>`            | Ref to the `div` with the HTML.                          |
| `qa`       | `string`                         | Sets `data-qa` on this `div`.                            |
| `...props` | `HTMLAttributes<HTMLDivElement>` | HTML attributes, except `dangerouslySetInnerHTML`.       |

#### HTML updates

- A new `html` value replaces the HTML content. React children keep their state.
- The same `html` string keeps the current DOM, including changes made by extensions.
- Use `key={documentId}` to reset the viewer and its children. Keep the key stable to keep child state across HTML updates.

</details>

### YFM code block actions

Add `YfmCodeBlockActions` to show UIKit copy and text wrapping buttons in Diplodoc code blocks. Copy keeps code whitespace and skips line numbers. The extension replaces the built-in YFM controls and does not load a Diplodoc runtime.

The extension imports its styles. Import your content styles and use the application's UIKit `ThemeProvider` to set the language (`en` or `ru`).

For server rendering with this extension, configure your bundler to handle CSS imports.

```tsx
import {MarkdownViewer, cnYFM} from '@gravity-ui/markdown-viewer';
import {YfmCodeBlockActions} from '@gravity-ui/markdown-viewer/extensions';

import '@gravity-ui/uikit/styles/styles.css';
import '@diplodoc/transform/dist/css/yfm.css';

export function Document({html}: {html: string}) {
  return (
    <MarkdownViewer html={html} className={cnYFM()}>
      <YfmCodeBlockActions />
    </MarkdownViewer>
  );
}
```

<details>
<summary>Code block props and cleanup</summary>

The `@gravity-ui/markdown-viewer/extensions` entry point also exports the `YfmCodeBlockActionsProps` type.

| Prop                 | Default                                          | Description                                        |
| -------------------- | ------------------------------------------------ | -------------------------------------------------- |
| `copyButton`         | `true`                                           | Show the copy button.                              |
| `lineWrappingButton` | `true`                                           | Show the text wrapping button.                     |
| `codeBlockSelector`  | `'.yfm-clipboard, .yfm-code-floating-container'` | Select code block containers inside this viewer.   |
| `getCodeBlockText`   | Text from `pre code` without line numbers        | Read the text to copy from the selected container. |

Use a stable selector for containers with `pre code`. The wrapping button toggles the `wrap` class on `pre code`.

Disabling the button or removing the extension leaves the `wrap` class as it is. Removing the extension restores the built-in controls. After removal, text wrapping depends on the styles for the code block.

</details>

<details>
<summary>Next.js App Router</summary>

To use the viewer from a Server Component, import it through a Client Component.

```tsx
'use client';

import {MarkdownViewer} from '@gravity-ui/markdown-viewer';

export function ViewerClient({html}: {html: string}) {
  return <MarkdownViewer html={html} />;
}
```

Render `<ViewerClient html={html} />` from your Server Component. Define extensions that use `useViewerEffect` on the client side of the boundary.

</details>

### Files gallery

Add `FilesGallery` to open images, video links, and YFM file links. Wrap the viewer in `GalleryProvider`:

```tsx
import {GalleryProvider} from '@gravity-ui/components';
import {MarkdownViewer} from '@gravity-ui/markdown-viewer';
import {FilesGallery} from '@gravity-ui/markdown-viewer/extensions';

import '@gravity-ui/uikit/styles/styles.css';

export function Document({html}: {html: string}) {
  return (
    <GalleryProvider>
      <MarkdownViewer html={html}>
        <FilesGallery getCopyUrl={({url}) => url} getDownloadUrl={({url}) => url} />
      </MarkdownViewer>
    </GalleryProvider>
  );
}
```

Images support `picture` and `srcset`. Ctrl/Meta/Shift/Alt-click and images inside links keep their normal behavior.

On desktop, the copy button shows feedback in a tooltip. On mobile, the menu closes after a tap. Use `onLinkCopied` to show a message after a successful copy.

<details>
<summary>Gallery props and HTML updates</summary>

The entry point exports `FilesGalleryProps`, `FilesGallerySource`, and `FilesGalleryItemType` (`'image' | 'video' | 'file'`).

Callbacks receive `source` with `url`, `type`, `element`, and optional `name` and `mimeType`. Callback inputs, including the item passed to `transformItem`, are shallow readonly in TypeScript.

Image URLs use `currentSrc` (absolute), then the HTML `src` value. Links use the HTML `href` value. MIME values are lowercase without parameters. A supported MIME type takes priority. For HTTP(S) links, the gallery can also use the path extension, ignoring the query and fragment. An `img` always has type `image`.

| Prop | Description |
| ---- | ----------- |
| `additionalItems` | Readonly list of ready items placed before HTML items. Callbacks do not change them. |
| `getCopyUrl(source)` | Return a URL for the copy action, or `undefined` to skip it. |
| `getDownloadUrl(source)` | Return a URL for the download action, or `undefined` to skip it. |
| `resolveCustomItem(source)` | Create an item for a source with type `file`, or return `undefined` to skip it. |
| `transformItem(item, source)` | Replace the final item, or return `null` to exclude it. |
| `onLinkCopied(url)` | Called only after a successful copy, with the copied URL. |

For each HTML item, a standard item or `resolveCustomItem` result gets copy/download actions, then passes through `transformItem`. Resolver actions are kept. The transform result replaces the whole item.

The clicked item is built first; if skipped, collection stops. Callbacks run once per discovered item on opening. Do not change the HTML from callbacks or keep DOM elements in returned items or actions.

An open gallery keeps its items when HTML changes or `FilesGallery` unmounts. The next opening reads the current HTML. Items with the same URL stay separate; the clicked element sets the initial item.

To cancel gallery opening, call `preventDefault()` in `onClickCapture`. A regular React `onClick` runs after the gallery's native listener. This also cancels native link navigation:

```tsx
<MarkdownViewer
  html={html}
  onClickCapture={(event) => {
    if (event.target instanceof Element && event.target.closest('[data-no-gallery]')) {
      event.preventDefault();
    }
  }}
>
  <FilesGallery />
</MarkdownViewer>
```

</details>

### Heading anchors

Add `HeadingAnchors` to show a `#` copy button for headings with unique IDs. The application provides links and handles navigation.

```tsx
import {MarkdownViewer} from '@gravity-ui/markdown-viewer';
import {HeadingAnchors} from '@gravity-ui/markdown-viewer/extensions';

import '@gravity-ui/uikit/styles/styles.css';

export function Document({html}: {html: string}) {
  return (
    <MarkdownViewer html={html}>
      <HeadingAnchors
        getHref={({id}) => `https://example.com/page#${encodeURIComponent(id)}`}
        onClick={(_event, {id}) => {
          window.history.pushState(window.history.state, '', `#${encodeURIComponent(id)}`);
        }}
      />
    </MarkdownViewer>
  );
}
```

<details>
<summary>Heading props and cleanup</summary>

The extensions entry point exports `HeadingAnchorsProps` and `HeadingAnchorTarget`.

Both callbacks receive `{id, element}` with the current ID and heading element.

Keep focus on the button in `onClick` to show copy feedback.

For folding headings, the copy button stops the click from bubbling so it does not toggle the section. Use `HeadingAnchors.onClick` to handle navigation.

| Prop                      | Description                                                 |
| ------------------------- | ----------------------------------------------------------- |
| `getHref(heading)`        | Required. Return the link to copy. Called on click.         |
| `onClick(event, heading)` | Optional. Handle navigation. Copy runs after this callback. |
| `selector`                | Default: `h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]`.  |

The extension hides the built-in Diplodoc heading controls while mounted. Heading IDs and content stay unchanged.

The button sits 24 px before the heading. If the container clips overflow, leave at least 24 px of space before the heading.

The button uses the page background. Set `--g-md-v-heading-anchor-background-color` on a colored container to use another opaque color.

</details>

### Heading edit buttons

Add `HeadingEditButtons` to show a pencil on headings that carry a zero-based source line in `data-line`. The application handles opening the editor or moving the cursor.

```tsx
import {MarkdownViewer} from '@gravity-ui/markdown-viewer';
import {HeadingEditButtons} from '@gravity-ui/markdown-viewer/extensions';

<MarkdownViewer html={html}>
  <HeadingEditButtons onClick={(_event, {line}) => editAtLine(line)} />
</MarkdownViewer>;
```

The extensions entry point also exports `HeadingEditButtonsProps` and `HeadingEditTarget`.

| Prop                      | Description                                                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `onClick(event, heading)` | Required. Receives the button click and `{line, element}` with the zero-based source line and heading element. |
| `label`                   | Accessible button label. Defaults to localized “Edit”.                                                         |
| `selector`                | CSS selector for target headings. Defaults to `h1`–`h6` with `data-line`.                                      |

### Reveal a YFM element

Add `RevealYfmElement` to open native `details`, YFM tabs, and folding heading sections around a target:

```tsx
import {MarkdownViewer} from '@gravity-ui/markdown-viewer';
import {RevealYfmElement} from '@gravity-ui/markdown-viewer/extensions';

<MarkdownViewer html={html}>
  <RevealYfmElement
    key={navigationKey}
    id={anchorId}
    onReveal={(element) => element.scrollIntoView({block: 'start'})}
  />
</MarkdownViewer>;
```

Pass exactly one of `id` (literal ID), `selector` (CSS selector), or `element` (DOM element). `null` cancels the request. Searches are scoped to this viewer.

- `onReveal(element)` runs synchronously once per processed request, including already visible targets.
- HTML updates retry missing targets but do not repeat completed requests. Callback changes do not trigger processing.
- Change the target or React `key` to start a new request. Use `id` or `selector` to resolve targets in replacement HTML.

Tabs require the application's Diplodoc tabs runtime, which may switch linked groups outside the viewer. Scrolling and focus remain under application and runtime control. Editable WYSIWYG content is unsupported.

<details>
<summary>Reveal without a viewer</summary>

```ts
import {revealYfmElement} from '@gravity-ui/markdown-viewer';

const target = revealYfmElement({id: 'installation'}, {root: pageContainer});
target?.scrollIntoView({block: 'start'});
```

`revealYfmElement` accepts an `Element`, `{id: string}`, `{selector: string}`, or `null`. Optional `root` bounds lookup and ancestor traversal, including itself. Without it, lookup uses `document`; a supplied element uses its own ancestors.

Returns the processed element or `null` for missing or excluded targets. Both APIs select the first ID or selector match outside viewer slots. Slots, their descendants, and targets outside the root are excluded. Processing does not wait for runtimes or animations and does not guarantee visibility.

</details>

### Add an extension

Add a child component with `useViewerEffect` to work with the HTML root. This example tracks clicks and removes its listener during cleanup:

```tsx
import {MarkdownViewer, useViewerEffect} from '@gravity-ui/markdown-viewer';

export function Document({html, onClick}: {html: string; onClick: () => void}) {
  return (
    <MarkdownViewer html={html}>
      <DocumentClicks onClick={onClick} />
    </MarkdownViewer>
  );
}

function DocumentClicks({onClick}: {onClick: () => void}) {
  useViewerEffect(
    ({root}) => {
      root.addEventListener('click', onClick);
      return () => root.removeEventListener('click', onClick);
    },
    [onClick],
  );

  return null;
}
```

Setup runs after the HTML is in the DOM. It runs again when HTML or dependencies change. Cleanup runs before each restart and on unmount. Use `root` for DOM searches so each viewer stays independent.

<details>
<summary>Effect lifecycle and types</summary>

Pass both `setup` and `dependencies`. Setup must return a cleanup function or nothing, not a Promise.

| Event                        | Behavior                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| Mount                        | Run setup after the HTML is in the DOM.                                                    |
| HTML changes                 | Abort all old signals, run cleanup before replacing HTML, then run setup for the new HTML. |
| Dependencies change          | Abort and clean up the affected effect, then run its new setup. Keep the HTML DOM.         |
| Extension or viewer unmounts | Abort its active signals and run cleanup.                                                  |

If HTML and dependencies change together, setup runs once. A new setup function alone does not restart the effect; list its reactive values in `dependencies`.

Effects only run on the client. Each run gets a new signal.

Separate extensions have no fixed execution order. Put steps that need a fixed order in one extension. The hook throws an error outside a viewer.

- On first mount or when HTML changes, a setup error stops the remaining setups. Place an error boundary above `MarkdownViewer` to catch it.
- If an extension mounts after the viewer is ready, a boundary around that extension can catch its setup error.
- If a cleanup throws, the viewer runs the other cleanups in the same stop before passing the error to React.

Handle expected errors in the extension. If setup fails, the viewer aborts its signal. Release any resources that the signal does not manage.

The package exports these types:

```ts
interface ViewerEffectContext {
  readonly root: HTMLDivElement;
  readonly signal: AbortSignal;
}

type ViewerEffectCleanup = () => void;
type ViewerEffect = (context: ViewerEffectContext) => void | ViewerEffectCleanup;
```

Configure React Hooks dependency linting to check `useViewerEffect`.

</details>

<details>
<summary>Async work and cancellation</summary>

Keep setup synchronous and start async work inside it. Check `signal.aborted` after each async wait and before changing the DOM. Use the library's cancellation API when it has one: an aborted signal alone does not stop third-party code.

Here, `load` creates a resource without changing the DOM. `attach` adds it to the current root. A resource that arrives after cancellation is disposed without being attached.

```tsx
import {useViewerEffect} from '@gravity-ui/markdown-viewer';

type Resource = {
  attach(root: HTMLDivElement): void;
  dispose(): void;
};

type AsyncExtensionProps = {
  load(signal: AbortSignal): Promise<Resource>;
  onError(error: unknown): void;
};

export function AsyncExtension({load, onError}: AsyncExtensionProps) {
  useViewerEffect(
    ({root, signal}) => {
      let resource: Resource | undefined;

      void load(signal)
        .then((loaded) => {
          if (signal.aborted) {
            loaded.dispose();
            return;
          }
          resource = loaded;
          resource.attach(root);
        })
        .catch((error: unknown) => {
          resource?.dispose();
          resource = undefined;
          if (!signal.aborted) {
            onError(error);
          }
        });

      return () => resource?.dispose();
    },
    [load, onError],
  );

  return null;
}
```

</details>

### Add React content to HTML

Use `ViewerTargets` to add React components inside the HTML. It finds matching HTML elements in the current viewer and adds a slot to each one. The original content stays in place. Each slot uses a React portal, so its components can read your application's React context.

```tsx
import {useState} from 'react';
import {MarkdownViewer, ViewerTargets} from '@gravity-ui/markdown-viewer';

export function Document({html, label}: {html: string; label: string}) {
  return (
    <MarkdownViewer html={html}>
      <ViewerTargets selector="h2[id]">
        {(heading) => <HeadingAction heading={heading} label={label} />}
      </ViewerTargets>
    </MarkdownViewer>
  );
}

function HeadingAction({heading, label}: {heading: HTMLElement; label: string}) {
  const [count, setCount] = useState(0);
  return (
    <button aria-label={`${label} ${heading.id}`} onClick={() => setCount(count + 1)}>
      {label} {count}
    </button>
  );
}
```

Put hooks in a component such as `HeadingAction`. The callback only returns React content. Changing `label` updates the button and keeps its count. With the same HTML, selector, and `as`, a new callback does not repeat the search or replace slots.

<details>
<summary>Target props and selectors</summary>

Use `ViewerTargets` inside `MarkdownViewer`. The package exports the `ViewerTargetsProps` type.

| Prop        | Type                                 | Description                                                              |
| ----------- | ------------------------------------ | ------------------------------------------------------------------------ |
| `selector`  | `string`                             | CSS selector for HTML elements inside this viewer.                       |
| `as`        | `'span' \| 'div'`                    | Slot tag. Default: `span`. Choose a tag that is valid inside the target. |
| `className` | `string`                             | CSS class for each slot.                                                 |
| `style`     | `CSSProperties`                      | Inline styles for each slot.                                             |
| `children`  | `(target: HTMLElement) => ReactNode` | Returns React content for each target.                                   |

Use a stable selector, such as `h2[id]` or `[data-grid-id]`. Adding a slot must not change whether the target matches. Avoid selectors such as `h2:empty`.

Searches skip slots and their content. Elements added later by an external runtime are not detected automatically.

Several extensions can add separate slots to the same target. Each extension must keep the other slots and the original content. Their order in the React tree must not affect how they work. Put DOM steps that need a fixed order in one extension.

</details>

<details>
<summary>Slot state and cleanup</summary>

- A target keeps its slot and React state during ordinary rerenders.
- After a selector change, targets that still match keep their slots. Other slots are added or removed as needed.
- Changing `as` may replace the slot and reset its state.
- Replacing HTML creates new DOM elements, even if their IDs stay the same. To keep state across HTML updates, store it above `ViewerTargets` and use a stable, unique ID for each target.
- Removing an extension removes its slots and portal content. Other extensions' slots and the original HTML stay in place.

When `html` changes, `useViewerEffect` cleanup runs before the viewer replaces the old HTML. Portal children follow React's cleanup timing. Their target may already be detached from the document. If cleanup needs the old HTML in place, use `useViewerEffect` in the extension that renders `ViewerTargets`. Cleanup order between extensions is unspecified.

On the server, the viewer renders the prepared HTML and its regular React children. `ViewerTargets` adds no slots or portal content. It adds them on the client after hydration.

</details>

<details>
<summary>React blocks and fallback content</summary>

For a React block, prepare an empty target element (the host). Put fallback content beside it:

```html
<section>
  <p data-grid-fallback>Grid is unavailable.</p>
  <div data-grid-id="grid-42"></div>
</section>
```

Use `as="div"` to add a block slot:

```tsx
<ViewerTargets selector="[data-grid-id]" as="div">
  {(host) => <GridAdapter host={host} />}
</ViewerTargets>
```

`GridAdapter` is your component. It reads the grid ID, renders the grid, and hides or shows the fallback. `ViewerTargets` does not manage the fallback.

The result inside the host is:

```html
<div data-grid-id="grid-42">
  <div data-markdown-viewer-slot>
    <div class="grid">...</div>
  </div>
</div>
```

</details>

<details>
<summary>Use slots with DOM extensions</summary>

The viewer marks each slot with `data-markdown-viewer-slot`. Import `VIEWER_SLOT_ATTRIBUTE` to use this attribute name. Its value is not part of the API. Do not add the attribute to prepared HTML or change it in an extension.

React owns each slot and its content. Keep the targets that `ViewerTargets` uses inside the viewer. Use `inspectViewerNode(root, node)` to check whether a node belongs to the viewer's HTML content. Pass the `root` from `useViewerEffect`. The helper accepts any `Node`, including text nodes. The package also exports the `ViewerNodeInfo` type.

| Result                               | Meaning                                                       |
| ------------------------------------ | ------------------------------------------------------------- |
| `{kind: 'outside'}`                  | The node is outside this root.                                |
| `{kind: 'slot'}`                     | The node is a slot or is inside a slot.                       |
| `{kind: 'content', hasSlots: false}` | The node belongs to the HTML content and has no slots inside. |
| `{kind: 'content', hasSlots: true}`  | The node belongs to the HTML content and contains slots.      |

To change only the element itself, check `kind`:

```ts
import {inspectViewerNode} from '@gravity-ui/markdown-viewer';

function markContent(root: Element, element: Element) {
  if (inspectViewerNode(root, element).kind === 'content') {
    element.classList.add('processed');
  }
}
```

For a nested viewer, use its own root. Slot markers above that root are ignored.

Before replacing an element's content, check both `kind` and `hasSlots`. Check immediately before each replacement. After async work, check again: another extension may have added a slot while you waited. Also check the effect's signal:

```ts
const result = await prepareContent();
if (signal.aborted) return;
const info = inspectViewerNode(root, element);
if (info.kind !== 'content' || info.hasSlots) return;
element.replaceChildren(result);
```

During effect setup, `hasSlots` only sees slots already in the DOM. A target can receive a slot later in the same update.

During cleanup, repeat the slot check and undo only your own changes. Do not restore saved `innerHTML` over another extension's slots.

Inspect the element you will change, including elements found with `closest()`.

This check does not make it safe for two extensions to replace the same content. If a runtime needs full control of a subtree, put other extensions' controls in a separate host outside it.

</details>

## Development

Run from the repository root:

```bash
pnpm --filter @gravity-ui/markdown-viewer test
pnpm --filter @gravity-ui/markdown-viewer typecheck
pnpm --filter @gravity-ui/markdown-viewer lint
```

- Tests and public API type checks run on React 18 and 19.

## License

MIT
