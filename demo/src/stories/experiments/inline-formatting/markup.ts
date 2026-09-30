import dd from 'ts-dedent';

export const initialMarkup = dd`
    # Inline formatting

    Select text and use the toolbar or shortcuts.

    - first item
    - second item
      - nested item
    - [ ] task item

    **one **two** three**

    > first line
    > second line

    [link text](https://example.com)

    https://example.com/path

    \`inline code\`

    \`\`\`js
    const value = 'text';
    \`\`\`

    | First | Second |
    | ----- | ------ |
    | one   | two    |
`;
