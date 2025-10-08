export const markup = `
&nbsp;

Welcome to the editor! Start typing the character \`/\`

![Markdown Editor](https://github.com/user-attachments/assets/0b4e5f65-54cf-475f-9c68-557a4e9edb46 =700x)

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
import { toaster } from '@gravity-ui/uikit/toaster-singleton';

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

  return <MarkdownEditorView stickyToolbar autofocus editor={editor} />;
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

export const loremIpsum = `

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse enim nisl, tincidunt sit amet auctor vitae, ullamcorper non urna. In feugiat sagittis risus, sit amet accumsan nisi consequat sit amet. Aenean a molestie tellus, vitae volutpat ante. Integer sagittis, turpis a blandit consequat, risus sem consequat ex, at elementum odio diam id nibh. Nam nec neque enim. Integer a risus mattis, lacinia ante nec, commodo eros. Cras erat erat, finibus vitae blandit ut, pulvinar sed quam. Vivamus porta, ipsum non pharetra porttitor, enim felis vestibulum nunc, eget tincidunt erat turpis nec risus. Fusce mollis neque ac porttitor mattis. Aliquam ultrices sagittis bibendum. Praesent a nisi eleifend metus congue fermentum.

Sed egestas enim ac massa varius mattis. Donec scelerisque maximus ultricies. Sed a laoreet dui, at porta enim. Maecenas accumsan a neque et luctus. Nullam venenatis nunc velit, sit amet egestas nisl elementum eu. Sed lobortis volutpat est eu facilisis. Aenean vitae tortor ac massa sagittis tristique at et leo. Nullam faucibus nulla eu vehicula pharetra. Nullam molestie interdum ligula eu malesuada. Pellentesque mauris nunc, volutpat sit amet pretium in, malesuada eu turpis.

Vivamus quis eros aliquet, aliquet odio eget, sollicitudin ligula. Interdum et malesuada fames ac ante ipsum primis in faucibus. Sed vitae justo felis. Proin quis enim leo. Aenean mattis placerat sem, eu suscipit leo venenatis vitae. Proin finibus augue gravida, rhoncus velit sed, ornare ipsum. Mauris pharetra justo quis risus cursus malesuada. In sed ante eget odio elementum viverra et ac libero. Nullam ultrices massa sit amet turpis convallis vehicula. Aenean lobortis magna quis metus aliquet iaculis. Nullam congue, odio vitae blandit placerat, purus velit condimentum nulla, ut placerat metus risus non turpis. Quisque justo neque, posuere id accumsan efficitur, fringilla non ex. Sed metus mauris, blandit eu imperdiet vitae, volutpat sit amet lectus. Proin molestie elit justo, nec fermentum arcu interdum et.

Nam euismod semper diam at efficitur. Maecenas porta velit posuere dui interdum, nec consequat ligula varius. Ut at ultricies ante, sit amet sollicitudin lectus. Praesent iaculis quam sed augue faucibus dapibus. Vestibulum non ipsum eu nibh suscipit pulvinar quis sed augue. Duis rhoncus, mi nec ullamcorper consectetur, urna magna hendrerit quam, id interdum purus arcu in risus. Interdum et malesuada fames ac ante ipsum primis in faucibus. Maecenas gravida magna eget vulputate faucibus. Quisque posuere, velit a maximus fermentum, ex sapien semper erat, sed tincidunt arcu enim ut felis. Vestibulum tempor, ante sit amet laoreet vehicula, nunc eros congue dui, quis imperdiet est leo in leo. Curabitur condimentum sapien nisi, sed volutpat odio euismod condimentum. Etiam velit sapien, finibus bibendum erat nec, feugiat pellentesque quam. Suspendisse cursus nulla ut leo sagittis viverra.

Quisque blandit rutrum nibh sit amet vehicula. Mauris nec interdum leo. Donec suscipit turpis semper pellentesque faucibus. Vestibulum vitae rhoncus tortor. Suspendisse vehicula nisi ac diam mollis, nec pellentesque risus auctor. Suspendisse sit amet turpis ut elit gravida hendrerit nec ornare erat. Nullam eu risus eget est tincidunt luctus sit amet in nisi. Curabitur tellus dolor, accumsan sed maximus nec, lacinia eu neque. Curabitur facilisis a augue semper laoreet. Pellentesque ac faucibus ipsum, a sagittis turpis. Sed eleifend libero ac urna porttitor, vitae finibus velit laoreet. In viverra eros quis iaculis porta.

Praesent viverra velit eu felis facilisis, eu commodo justo volutpat. Nullam eget hendrerit nibh. Vestibulum dui purus, hendrerit sit amet eros in, lacinia laoreet quam. Cras dui mauris, dictum ac ultricies eu, dignissim sit amet metus. Curabitur molestie ante lectus, eget volutpat urna efficitur non. Vivamus lacinia, ligula vitae ornare maximus, dolor odio volutpat velit, sit amet finibus nunc nunc nec augue. Morbi scelerisque tortor at metus ultricies vehicula.

Fusce elementum finibus quam, at tincidunt ipsum egestas eget. Aenean nec ipsum orci. Maecenas quis vehicula purus. Proin tellus magna, euismod eu neque quis, elementum elementum risus. Aenean nibh arcu, bibendum non lacus ac, dapibus pharetra urna. Nunc ut posuere dolor, ac ornare lorem. Nullam varius fringilla sapien ut dapibus. Praesent feugiat dolor nulla, sed commodo orci sagittis eget. Maecenas elementum eros sed magna cursus, quis scelerisque est posuere.

Aliquam aliquam, justo quis ultrices venenatis, eros mi posuere mauris, quis venenatis justo urna sed nisl. Quisque aliquam tincidunt ligula. Proin at tortor eget velit consequat dignissim. Suspendisse metus augue, ultricies sed varius ac, interdum at diam. Mauris laoreet interdum sapien a sagittis. Vivamus dignissim felis a ante porttitor consectetur. Fusce sodales magna et velit cursus dictum. Praesent sodales elit nec lectus porta lobortis. Sed eget metus ut mi ultrices mollis quis eget ante. Vestibulum viverra, magna non euismod mollis, magna lacus egestas ante, posuere faucibus risus diam eu dui. Maecenas maximus lorem orci, sit amet dignissim sem feugiat ac. Morbi tempus purus eu pellentesque bibendum.

Suspendisse dui lorem, fringilla sed arcu quis, aliquet finibus dolor. Sed fringilla aliquet enim nec tempor. Vivamus lectus leo, elementum et risus quis, porta cursus enim. Vivamus ac maximus justo, ac vestibulum risus. Donec ut nunc neque. Mauris in felis vulputate, tincidunt erat in, ullamcorper lorem. Aliquam eu lectus lectus. Nullam eget consectetur leo. Proin venenatis dolor sed magna scelerisque, vulputate imperdiet ante dictum. Etiam ac rhoncus arcu, a dignissim tellus. Donec viverra odio eget lacinia sodales.

Vivamus sed tellus at metus cursus imperdiet. Duis quis turpis elit. Quisque turpis magna, scelerisque in leo id, eleifend porttitor erat. Pellentesque fringilla vel felis eget congue. Pellentesque blandit sem nunc, eu vulputate sem pharetra ac. Ut sed dignissim lectus. Quisque nec nisi ut leo feugiat posuere. Mauris elit sapien, bibendum nec dolor id, pharetra ullamcorper augue. Vivamus et lacus efficitur, fermentum magna id, fermentum neque. Donec aliquet vehicula dapibus. Aenean efficitur nunc eu libero accumsan, sed dignissim neque convallis. Donec eleifend, nisl vel elementum bibendum, eros metus ultricies elit, sodales pharetra magna mauris in est. Donec imperdiet sapien in nibh placerat ultrices id eget quam. Fusce dapibus arcu fringilla dui bibendum, ut rutrum lectus dictum. Pellentesque at elit quam. In id neque in lectus dapibus congue et a tellus.

Donec vitae turpis lacus. Morbi imperdiet ipsum sed consectetur maximus. Quisque sodales ligula lacus, et pulvinar elit efficitur at. Pellentesque augue lorem, ullamcorper sed iaculis nec, blandit ac nunc. Cras purus justo, malesuada nec feugiat vitae, egestas cursus ipsum. Pellentesque in massa fermentum, fermentum lacus ut, rhoncus velit. Phasellus sodales bibendum tellus vel bibendum. Ut convallis libero leo, eu pulvinar lorem tincidunt eget. Vivamus fringilla ipsum quis lacus consectetur ornare.

`.trim();
