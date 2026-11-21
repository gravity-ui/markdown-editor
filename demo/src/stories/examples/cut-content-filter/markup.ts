export const markup = `# Cut content filter

A cut keeps paragraphs of text and links. The other groups are dropped while parsing, or kept as
source markup when the control is switched to preserving.

{% cut "Text and links" %}

Plain text stays.

A paragraph with a [link](https://gravity-ui.com) stays too.
A soft-wrapped line belongs to the same paragraph and stays with it.

{% endcut %}

{% cut "An image is dropped" %}

The paragraph above the image stays.

![Gravity UI](https://github.com/user-attachments/assets/0b4e5f65-54cf-475f-9c68-557a4e9edb46 =700x)

The paragraph below the image stays, and the order of the kept paragraphs holds.

{% endcut %}

{% cut "Other inline markup is dropped" %}

A paragraph with **bold** text is dropped: only text and links are allowed.

A paragraph with \`code\` is dropped as well.

{% endcut %}

{% cut "Blocks are dropped" %}

Text before the blocks.

## Heading

- First item
- Second item

1. Ordered item

| Column | Column |
| --- | --- |
| Cell | Cell |

~~~js
code();
~~~

> Quote

Text after the blocks.

{% endcut %}

{% cut "A nested cut is dropped" %}

Text next to the nested cut.

{% cut "Nested" %}

Nested text.

{% endcut %}

{% endcut %}

{% cut "Nothing is left" %}

## Only a heading inside

{% endcut %}

## The filter ends at the cut

This heading and the list below stay: they are outside any cut.

- Untouched item
`;
