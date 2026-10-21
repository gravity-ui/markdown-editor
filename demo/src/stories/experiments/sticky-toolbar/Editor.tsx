import {memo, useRef} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {Text} from '@gravity-ui/uikit';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

const initialMarkup = `# Sticky toolbar in a scroll container

This example shows how the toolbar can stick to the top of a custom scroll container
instead of the browser window.

Try scrolling down inside the editor area — the toolbar will stay fixed at the top
of the scrollable box below, not at the top of the page.

## Why this matters

By default \`useSticky\` listens to \`scroll\` events on \`window\`. When the editor lives
inside a fixed-height scrollable div, the window never scrolls, so the sticky logic
never triggers. Passing \`scrollContainerRef\` routes the \`scroll\` listener onto the
right element.

## How to use it

\`\`\`tsx
const scrollRef = useRef<HTMLDivElement>(null);

<div ref={scrollRef} style={{overflowY: 'auto', height: 400}}>
  <MarkdownEditorView
    editor={editor}
    stickyToolbar
    scrollContainerRef={scrollRef}
  />
</div>
\`\`\`

## More content to make the area scrollable

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
incididunt ut labore et dolore magna aliqua.

- Item one
- Item two
- Item three

### Heading level 3

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
ex ea commodo consequat.

1. First ordered item
2. Second ordered item
3. Third ordered item

### Another section

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
fugiat nulla pariatur.

> Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
> deserunt mollit anim id est laborum.

### Yet another section

Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius,
turpis molestie pretium placerat, arcu purus aliquam erat.

- Nested list item 1
  - Child item A
  - Child item B
- Nested list item 2

### Final section

Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac
turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget.
`;

export type EditorWithStickyInContainerProps = {};

export const EditorWithStickyInContainer = memo<EditorWithStickyInContainerProps>(
    function EditorWithStickyInContainer() {
        const scrollContainerRef = useRef<HTMLDivElement>(null);

        const editor = useMarkdownEditor({
            initial: {markup: initialMarkup, mode: 'wysiwyg'},
        });

        return (
            <PlaygroundLayout
                title="Sticky toolbar inside a scroll container"
                editor={editor}
                view={() => (
                    <div
                        ref={scrollContainerRef}
                        style={{
                            height: 600,
                            overflowY: 'auto',
                            border: '1px solid var(--g-color-line-generic)',
                            borderRadius: 4,
                            padding: 16,
                        }}
                    >
                        <Text variant="display-4" style={{paddingBottom: 16, display: 'block'}}>
                            Scroll container
                        </Text>
                        <MarkdownEditorView
                            className="g-md-editor-mode"
                            autofocus
                            stickyToolbar
                            settingsVisible
                            editor={editor}
                            scrollContainerRef={scrollContainerRef}
                        />
                    </div>
                )}
            />
        );
    },
);
