# Button container

```md
:::button{href="/page" view="outlined" color="blue" new-tab="true"}
Read more
:::
```

A button is available independently and as a direct child of a cover. Its body is a plain text label. Attributes are `href`, `view` (`action`, `normal`, `outlined`, `flat`), `color` (`default`, `gray`, `blue`, `green`, `yellow`, `orange`, `red`, `violet`), `enabled` and `new-tab`. Defaults are an empty address, accent appearance, default theme color, enabled state and the current tab.

New tab links use `rel="noopener noreferrer"`. Unsafe link schemes are rejected consistently in Markdown, pasted HTML and visual editing. Empty addresses remain editable. Disabled buttons retain their data and are hidden in rendering.

Use `Button` for visual editing, `ButtonSpecs` for schema-only integration and `markdown-it/button` for preview. Include `extensions/additional/Button/index.css` for static viewing. The cover extension includes button editing automatically.
