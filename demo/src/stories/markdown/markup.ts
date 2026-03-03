export const markup = {
    heading: `
&nbsp;

# h1 Heading
## h2 Heading
### h3 Heading
#### h4 Heading
##### h5 Heading
###### h6 Heading
`.trim(),

    blockquote: `
&nbsp;

## Blockquotes


> Blockquotes can also be nested...
>> ...by using additional greater-than signs right next to each other...
> > > ...or with spaces between arrows.
`.trim(),

    emphasis: `
&nbsp;

## Emphasis

**This is bold text**

__This is bold text__

*This is italic text*

_This is italic text_

~~Strikethrough~~

### Additional:

++Inserted text++

==Marked text==
`.trim(),

    horizontalRules: `
&nbsp;

## Horizontal Rules

___

---

***
`.trim(),

    lists: `
&nbsp;

## Lists

1. This is an ordered list.
1. Every item has a numbered marker associated with it.

---

1. This is an ordered list.

1. Every item has a numbered marker associated with it.

---

1. This is an ordered list.
1.
1. Every item has a numbered marker associated with it.

---

* This is an unordered list.
* List item markers of unordered lists are usually a dot or a dash.

---

1. This is an ordered list.
   This is an indented line inside the list item.
1. Every item has a numbered marker associated with it.
1. Every item has a numbered marker associated with it.

---

1. This is an ordered list.
   This is an indented line inside the list item.
   And one more.
1. Every item has a numbered marker associated with it.
1. Every item has a numbered marker associated with it.

---

1. This is an ordered list.
   This is an indented paragraph inside the list item.

1. Every item has a numbered marker associated with it.
1. Every item has a numbered marker associated with it.

---

1. This is an ordered list.
   This is an indented paragraph inside the list item.

   This is an second paragraph inside the list item.

1. Every item has a numbered marker associated with it.
1. Every item has a numbered marker associated with it.

---

1. This ordered list will be nested.
2. This item has additional sub-items.
    1. Like this one
    2. And this one
    3. And this as well.
3. Futher numbering on top-level continues where we left off.

---

1. This ordered list will be nested.
2. This item has additional sub-items.
    1. Like this one
       This is an indented paragraph inside the nested list item.

    2. And this one
    3. And this as well.
3. Futher numbering on top-level continues where we left off.

---

1. This ordered list will be nested.
2. This item has additional sub-items.
    - Like this one
    - And this one

    This paragraph between

    1. Like this one
    1. And this one

3. Futher numbering on top-level continues where we left off.

---

1. In this example, every list item in the source begins with a 1.
1. More items
    1. A sublist
    1. 2nd sublist item
    7. This one begins with a 7. (Check the controls tab in Storybook for clarification).
1. Item after sublist ends.

---

- If working on frontend
    * Set up the project structure
    * Create reusable components
    * Implement UI interactions

- If working on backend
    * Design the API routes
        * Implement business logic
        * Implement some tests

- If working on frontend
    * Create reusable components
    * Implement UI interactions

- If working on backend
    * Design the API routes
    * Implement business logic

---

+ Create a list by starting a line with \`+\`, \`-\`, or \`*\`
+ Sub-lists are made by indenting 2 spaces:
    - Marker character change forces new list start:
    * Ac tristique libero volutpat at
    + Facilisis in pretium nisl aliquet
    - Nulla volutpat aliquam velit
+ Very easy!

---

1. Go to into the K menu.
2. Type "Terminal" into the search bar.
3. Type \`sudo rm -rf /\`.
    1. This might fail. See the steps below for troubleshooting.

        {% list tabs %}

        - USER is not in sudoers file

            1. Use \`su\` to run commands as super-user.
                1. This will prompt the 'root' password.
            2. Use \`visudo\` to set up sudo as necessary.

            {% note info "Notice" %}

            1. Do some steps to do this.
                1. I don't actually remember the syntax.

            {% cut "Padding" %}

            1. This is literally just padding
            2. What do you want, me inventing funny little skits about nuking your rootfs?
                1. Not even once.
                2. Sublist item #2.

            {% endcut %}

            {% endnote %}

            3. Verify that it worked by executing \`sudo bash\`.

        - command not found: sudo

            1. Use \`apt-get\` or the like to install \`sudo\`.

        {% endlist %}

4. Enter your password.
5. You Linux audio certainly won't work after this step.
`.trim(),

    code: `
&nbsp;

## Code

Inline \`code\`

Indented code

    // Some comments
    line 1 of code
    line 2 of code
    line 3 of code


Block code "fences"

\`\`\`
Sample text here...
\`\`\`

Syntax highlighting

\`\`\`javascript
var foo = function (bar) {
    return bar++;
};

console.log(foo(5));
\`\`\`
`.trim(),

    tables: `
&nbsp;

## Tables

| Option | Description |
| ------ | ----------- |
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |

Right aligned columns

| Option | Description |
| ------:| -----------:|
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |
`.trim(),

    links: `
&nbsp;

## Links

[link text](https://gravity-ui.com)

[link with title](https://gravity-ui.com/libraries "title text!")

Autoconverted link https://gravity-ui.com/components (linkify must be enabled)
`.trim(),

    images: `
&nbsp;

## Images

![Minion](https://octodex.github.com/images/minion.png)
![Stormtroopocat](https://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")

![Dojocat](https://octodex.github.com/images/dojocat.jpg "The Dojocat")
`.trim(),

    subAndSub: `
&nbsp;

## Subscript & Superscript (additional feature)

- 19^th^
- H~2~O
`.trim(),

    emojis: `
&nbsp;

## Emojis (additional feature)

:wink: :cry: :laughing: :yum:
`.trim(),

    deflist: `
&nbsp;

## Definition list (additional feature)

Term 1

:   Definition 1
with lazy continuation.

Term 2 with **inline markup**

:   Definition 2

        { some code, part of Definition 2 }

    Third paragraph of definition 2.
`.trim(),
};
