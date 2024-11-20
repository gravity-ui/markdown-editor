export const markup = `
&nbsp;

Welcome to the editor! Start typing the character \`/\`

![nature](https://github.com/user-attachments/assets/e2cdda03-fa1d-48fd-91e7-88d935f8bb9b =700x)

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
