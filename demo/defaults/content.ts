export const markup = `
&nbsp;

Welcome to the editor! Start typing the character \`/\`

![editor](https://private-user-images.githubusercontent.com/1963954/370404678-0b4e5f65-54cf-475f-9c68-557a4e9edb46.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MzIyNzEwMjQsIm5iZiI6MTczMjI3MDcyNCwicGF0aCI6Ii8xOTYzOTU0LzM3MDQwNDY3OC0wYjRlNWY2NS01NGNmLTQ3NWYtOWM2OC01NTdhNGU5ZWRiNDYucG5nP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI0MTEyMiUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNDExMjJUMTAxODQ0WiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9MGJiYjJhM2MwNGE0OTA2NmY0YjY5ZTBmOTdmMWJmZmNlNjRkN2E0OGVlMDhlNzYxNDY3YmE1ODVhYTc0MGFhMyZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QifQ.xVIrNXmeqpcpJNs8gC1iO0nJOksdiadR6WjRPRJoBog =700x)

## Markdown WYSIWYG and markup editor

MarkdownEditor is a powerful tool for working with Markdown, which combines WYSIWYG and Markup modes. This means that you can create and edit content in a convenient visual mode, as well as have full control over the markup.

The editor supports following formats:

* WYSIWYG

* markup

Click on the gear in the upper right corner to change the mode and see the \`md\` markup.

### Various blocks included

{% cut "Combine different blocks" %}

{% note info "Block for notes, tips, warnings, and alerts" %}

Depending on the content, notes with different titles and formats are used:

* Note: provides additional information.
* Tip: offers a recommendation.
* Warning: issues a warning.
* Alert: indicates a restriction.

{% endnote %}

> [Improve](https://github.com/gravity-ui/markdown-editor/blob/main/docs/how-to-add-preview.md) the editor interface
>
> *improved by you*

{% endcut %}

Or write your extension using a [convenient api](https://github.com/gravity-ui/markdown-editor/blob/main/docs/how-to-create-extension.md)

### A user-friendly API is provided

Easily connect to your React app with a hook:

\`\`\`plaintext
import React from 'react';
import { useMarkdownEditor, MarkdownEditorView } from '@gravity-ui/markdown-editor';
import { toaster } from '@gravity-ui/uikit/toaster-singleton-react-18';

function Editor({ onSubmit }) {
  const editor = useMarkdownEditor({ allowHTML: false });

  React.useEffect(() => {
    function submitHandler() {
      // Serialize current content to markdown markup
      const value = editor.getValue();
      onSubmit(value);
    }

    editor.on('submit', submitHandler);
    return () => {
      editor.off('submit', submitHandler);
    };
  }, [onSubmit]);

  return <MarkdownEditorView stickyToolbar autofocus toaster={toaster} editor={editor} />;
}
\`\`\`

### Convenient UX control is equipped

#### Hot keys

{% list tabs %}

- WYSIWYG mode



  |Formatting|Windows Shortcut|Mac OS Shortcut|
  |:---|:---|:---|
  |Bold text|Ctrl \\+ B|⌘ \\+ B|
  |Italic|Ctrl \\+ I|⌘ \\+ I|
  |Underlined text|Ctrl \\+ U|⌘ \\+ U|
  |Strikethrough text|Ctrl \\+ Shift \\+ S|⌘ \\+ Shift \\+ S|

- Markup mode



  |Formatting|Markup|Result|
  |:---|:---|:---|
  |Bold text|\`**Bold**\`|**Bold**|
  |Italic|\`*Italic*\`|*Italic*|
  |Underlined text|\`++Underlined++\`|++Underlined++|
  |Strikethrough text|\`~~Strikethrough~~\`|~~Strikethrough~~|

{% endlist %}

#### Context menu

Select this text and you will see **a context menu**.

#### Auto-conversion

Quickly create blocks by entering characters that will be replaced by blocks. For example, the automatic conversion of \`-\` and space creates a list, \`>\` and space creates a quote. Try it out.

---

### Current and future features

[X] Some already finished things

[ ] VS Code plugin

[ ] Mobile version

### And a multitude of other functionalities :sweat_smile: :fire:

See <https://github.com/gravity-ui/markdown-editor>

# More examples  {#anchor}

{% cut "Headings" %}

# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

{% endcut %}

{% cut "This is a cut heading" %}

**A** *here* ~~it~~ ++is awesome++ ^c^~o~^n^~t~^e^~n~^t^

> Done deal - deal done \`(quote)\`

{% endcut %}

{% cut "Formulas" %}

This is an inline formula: $\\sqrt{3x-1}+(1+x)^2$

And here is a block formula:

$$f(\\relax{x}) = \\int_{-\\infty}^\\infty
    \\hat f(\\xi)\\,e^{2 \\pi i \\xi x}
    \\,d\\xi
$$

*Click on the formula to edit it*

{% endcut %}

---

#|
||

Category

|

Subcategory

|

Description

||
||

**Technology**

|

==Programming==

|

***Innovative coding techniques and tools***

||
||

**Science**

|

==Physics==

|

Understanding the laws of the universe and fundamental forces

||
||

**Literature**

|

==Fiction==

|

Exploring imaginary worlds and character-driven stories

||
||

**Education**

|

==E-learning==

|

!!!!!!!!!!!!!!!!!!!!!!!!

New approaches to learning in the digital age

||
||

**Health**

|

==Nutrition==

|

~~++Balanced diets++~~ for a healthy lifestyle

||
|#

---

{% note info "Attention, please!" %}

* Thank

  1. you

  2. for

     1. your

  3. attention

* (nested lists)

> > > Quotes
> >
> > Nested
>
> As well

And ##monospace## can be **##com##**##bined\\*##

{% endnote %}

---

`.trim();
