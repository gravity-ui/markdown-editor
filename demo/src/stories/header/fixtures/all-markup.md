Please implement a story for all cases.

673 examples. Each example is a separate Markdown code block. These examples describe the target syntax; support in an existing implementation must be verified.

Images use `::header-image{...}`; titles use `::header-title[Plain text]{...}`. Only `header` and `header-content` are containers with closing fences.

## Block composition

All combinations of image, plain-text title, description and zero to three buttons.

### structure-001 — Image: off · Title: off · Description: off · Buttons: 0

```markdown
:::header
:::
```

### structure-002 — Image: off · Title: off · Description: off · Buttons: 1

```markdown
:::header

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### structure-003 — Image: off · Title: off · Description: off · Buttons: 2

```markdown
:::header

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}
:::
```

### structure-004 — Image: off · Title: off · Description: off · Buttons: 3

```markdown
:::header

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### structure-005 — Image: off · Title: off · Description: on · Buttons: 0

```markdown
:::header

:::header-content
Portal description.
:::
:::
```

### structure-006 — Image: off · Title: off · Description: on · Buttons: 1

```markdown
:::header

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### structure-007 — Image: off · Title: off · Description: on · Buttons: 2

```markdown
:::header

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}
:::
```

### structure-008 — Image: off · Title: off · Description: on · Buttons: 3

```markdown
:::header

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### structure-009 — Image: off · Title: on · Description: off · Buttons: 0

```markdown
:::header

::header-title[Team portal]
:::
```

### structure-010 — Image: off · Title: on · Description: off · Buttons: 1

```markdown
:::header

::header-title[Team portal]

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### structure-011 — Image: off · Title: on · Description: off · Buttons: 2

```markdown
:::header

::header-title[Team portal]

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}
:::
```

### structure-012 — Image: off · Title: on · Description: off · Buttons: 3

```markdown
:::header

::header-title[Team portal]

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### structure-013 — Image: off · Title: on · Description: on · Buttons: 0

```markdown
:::header

::header-title[Team portal]

:::header-content
Portal description.
:::
:::
```

### structure-014 — Image: off · Title: on · Description: on · Buttons: 1

```markdown
:::header

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### structure-015 — Image: off · Title: on · Description: on · Buttons: 2

```markdown
:::header

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}
:::
```

### structure-016 — Image: off · Title: on · Description: on · Buttons: 3

```markdown
:::header

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### structure-017 — Image: on · Title: off · Description: off · Buttons: 0

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt="Team"}
:::
```

### structure-018 — Image: on · Title: off · Description: off · Buttons: 1

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt="Team"}

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### structure-019 — Image: on · Title: off · Description: off · Buttons: 2

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt="Team"}

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}
:::
```

### structure-020 — Image: on · Title: off · Description: off · Buttons: 3

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt="Team"}

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### structure-021 — Image: on · Title: off · Description: on · Buttons: 0

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt="Team"}

:::header-content
Portal description.
:::
:::
```

### structure-022 — Image: on · Title: off · Description: on · Buttons: 1

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt="Team"}

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### structure-023 — Image: on · Title: off · Description: on · Buttons: 2

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt="Team"}

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}
:::
```

### structure-024 — Image: on · Title: off · Description: on · Buttons: 3

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt="Team"}

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### structure-025 — Image: on · Title: on · Description: off · Buttons: 0

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt="Team"}

::header-title[Team portal]
:::
```

### structure-026 — Image: on · Title: on · Description: off · Buttons: 1

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt="Team"}

::header-title[Team portal]

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### structure-027 — Image: on · Title: on · Description: off · Buttons: 2

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt="Team"}

::header-title[Team portal]

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}
:::
```

### structure-028 — Image: on · Title: on · Description: off · Buttons: 3

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt="Team"}

::header-title[Team portal]

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### structure-029 — Image: on · Title: on · Description: on · Buttons: 0

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt="Team"}

::header-title[Team portal]

:::header-content
Portal description.
:::
:::
```

### structure-030 — Image: on · Title: on · Description: on · Buttons: 1

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt="Team"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### structure-031 — Image: on · Title: on · Description: on · Buttons: 2

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt="Team"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}
:::
```

### structure-032 — Image: on · Title: on · Description: on · Buttons: 3

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt="Team"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

## Sizes and alignment

All combinations of height, width and the two alignment axes.

### layout-001 — Height: s · Width: s · Align: left · Vertical: top

```markdown
:::header{height="s" width="s" align="left" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-002 — Height: s · Width: s · Align: left · Vertical: center

```markdown
:::header{height="s" width="s" align="left" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-003 — Height: s · Width: s · Align: left · Vertical: bottom

```markdown
:::header{height="s" width="s" align="left" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-004 — Height: s · Width: s · Align: center · Vertical: top

```markdown
:::header{height="s" width="s" align="center" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-005 — Height: s · Width: s · Align: center · Vertical: center

```markdown
:::header{height="s" width="s" align="center" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-006 — Height: s · Width: s · Align: center · Vertical: bottom

```markdown
:::header{height="s" width="s" align="center" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-007 — Height: s · Width: s · Align: right · Vertical: top

```markdown
:::header{height="s" width="s" align="right" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-008 — Height: s · Width: s · Align: right · Vertical: center

```markdown
:::header{height="s" width="s" align="right" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-009 — Height: s · Width: s · Align: right · Vertical: bottom

```markdown
:::header{height="s" width="s" align="right" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-010 — Height: s · Width: m · Align: left · Vertical: top

```markdown
:::header{height="s" width="m" align="left" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-011 — Height: s · Width: m · Align: left · Vertical: center

```markdown
:::header{height="s" width="m" align="left" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-012 — Height: s · Width: m · Align: left · Vertical: bottom

```markdown
:::header{height="s" width="m" align="left" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-013 — Height: s · Width: m · Align: center · Vertical: top

```markdown
:::header{height="s" width="m" align="center" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-014 — Height: s · Width: m · Align: center · Vertical: center

```markdown
:::header{height="s" width="m" align="center" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-015 — Height: s · Width: m · Align: center · Vertical: bottom

```markdown
:::header{height="s" width="m" align="center" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-016 — Height: s · Width: m · Align: right · Vertical: top

```markdown
:::header{height="s" width="m" align="right" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-017 — Height: s · Width: m · Align: right · Vertical: center

```markdown
:::header{height="s" width="m" align="right" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-018 — Height: s · Width: m · Align: right · Vertical: bottom

```markdown
:::header{height="s" width="m" align="right" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-019 — Height: s · Width: l · Align: left · Vertical: top

```markdown
:::header{height="s" width="l" align="left" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-020 — Height: s · Width: l · Align: left · Vertical: center

```markdown
:::header{height="s" width="l" align="left" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-021 — Height: s · Width: l · Align: left · Vertical: bottom

```markdown
:::header{height="s" width="l" align="left" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-022 — Height: s · Width: l · Align: center · Vertical: top

```markdown
:::header{height="s" width="l" align="center" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-023 — Height: s · Width: l · Align: center · Vertical: center

```markdown
:::header{height="s" width="l" align="center" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-024 — Height: s · Width: l · Align: center · Vertical: bottom

```markdown
:::header{height="s" width="l" align="center" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-025 — Height: s · Width: l · Align: right · Vertical: top

```markdown
:::header{height="s" width="l" align="right" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-026 — Height: s · Width: l · Align: right · Vertical: center

```markdown
:::header{height="s" width="l" align="right" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-027 — Height: s · Width: l · Align: right · Vertical: bottom

```markdown
:::header{height="s" width="l" align="right" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-028 — Height: s · Width: full · Align: left · Vertical: top

```markdown
:::header{height="s" width="full" align="left" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-029 — Height: s · Width: full · Align: left · Vertical: center

```markdown
:::header{height="s" width="full" align="left" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-030 — Height: s · Width: full · Align: left · Vertical: bottom

```markdown
:::header{height="s" width="full" align="left" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-031 — Height: s · Width: full · Align: center · Vertical: top

```markdown
:::header{height="s" width="full" align="center" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-032 — Height: s · Width: full · Align: center · Vertical: center

```markdown
:::header{height="s" width="full" align="center" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-033 — Height: s · Width: full · Align: center · Vertical: bottom

```markdown
:::header{height="s" width="full" align="center" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-034 — Height: s · Width: full · Align: right · Vertical: top

```markdown
:::header{height="s" width="full" align="right" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-035 — Height: s · Width: full · Align: right · Vertical: center

```markdown
:::header{height="s" width="full" align="right" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-036 — Height: s · Width: full · Align: right · Vertical: bottom

```markdown
:::header{height="s" width="full" align="right" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-037 — Height: m · Width: s · Align: left · Vertical: top

```markdown
:::header{height="m" width="s" align="left" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-038 — Height: m · Width: s · Align: left · Vertical: center

```markdown
:::header{height="m" width="s" align="left" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-039 — Height: m · Width: s · Align: left · Vertical: bottom

```markdown
:::header{height="m" width="s" align="left" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-040 — Height: m · Width: s · Align: center · Vertical: top

```markdown
:::header{height="m" width="s" align="center" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-041 — Height: m · Width: s · Align: center · Vertical: center

```markdown
:::header{height="m" width="s" align="center" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-042 — Height: m · Width: s · Align: center · Vertical: bottom

```markdown
:::header{height="m" width="s" align="center" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-043 — Height: m · Width: s · Align: right · Vertical: top

```markdown
:::header{height="m" width="s" align="right" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-044 — Height: m · Width: s · Align: right · Vertical: center

```markdown
:::header{height="m" width="s" align="right" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-045 — Height: m · Width: s · Align: right · Vertical: bottom

```markdown
:::header{height="m" width="s" align="right" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-046 — Height: m · Width: m · Align: left · Vertical: top

```markdown
:::header{height="m" width="m" align="left" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-047 — Height: m · Width: m · Align: left · Vertical: center

```markdown
:::header{height="m" width="m" align="left" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-048 — Height: m · Width: m · Align: left · Vertical: bottom

```markdown
:::header{height="m" width="m" align="left" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-049 — Height: m · Width: m · Align: center · Vertical: top

```markdown
:::header{height="m" width="m" align="center" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-050 — Height: m · Width: m · Align: center · Vertical: center

```markdown
:::header{height="m" width="m" align="center" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-051 — Height: m · Width: m · Align: center · Vertical: bottom

```markdown
:::header{height="m" width="m" align="center" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-052 — Height: m · Width: m · Align: right · Vertical: top

```markdown
:::header{height="m" width="m" align="right" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-053 — Height: m · Width: m · Align: right · Vertical: center

```markdown
:::header{height="m" width="m" align="right" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-054 — Height: m · Width: m · Align: right · Vertical: bottom

```markdown
:::header{height="m" width="m" align="right" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-055 — Height: m · Width: l · Align: left · Vertical: top

```markdown
:::header{height="m" width="l" align="left" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-056 — Height: m · Width: l · Align: left · Vertical: center

```markdown
:::header{height="m" width="l" align="left" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-057 — Height: m · Width: l · Align: left · Vertical: bottom

```markdown
:::header{height="m" width="l" align="left" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-058 — Height: m · Width: l · Align: center · Vertical: top

```markdown
:::header{height="m" width="l" align="center" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-059 — Height: m · Width: l · Align: center · Vertical: center

```markdown
:::header{height="m" width="l" align="center" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-060 — Height: m · Width: l · Align: center · Vertical: bottom

```markdown
:::header{height="m" width="l" align="center" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-061 — Height: m · Width: l · Align: right · Vertical: top

```markdown
:::header{height="m" width="l" align="right" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-062 — Height: m · Width: l · Align: right · Vertical: center

```markdown
:::header{height="m" width="l" align="right" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-063 — Height: m · Width: l · Align: right · Vertical: bottom

```markdown
:::header{height="m" width="l" align="right" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-064 — Height: m · Width: full · Align: left · Vertical: top

```markdown
:::header{height="m" width="full" align="left" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-065 — Height: m · Width: full · Align: left · Vertical: center

```markdown
:::header{height="m" width="full" align="left" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-066 — Height: m · Width: full · Align: left · Vertical: bottom

```markdown
:::header{height="m" width="full" align="left" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-067 — Height: m · Width: full · Align: center · Vertical: top

```markdown
:::header{height="m" width="full" align="center" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-068 — Height: m · Width: full · Align: center · Vertical: center

```markdown
:::header{height="m" width="full" align="center" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-069 — Height: m · Width: full · Align: center · Vertical: bottom

```markdown
:::header{height="m" width="full" align="center" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-070 — Height: m · Width: full · Align: right · Vertical: top

```markdown
:::header{height="m" width="full" align="right" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-071 — Height: m · Width: full · Align: right · Vertical: center

```markdown
:::header{height="m" width="full" align="right" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-072 — Height: m · Width: full · Align: right · Vertical: bottom

```markdown
:::header{height="m" width="full" align="right" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-073 — Height: l · Width: s · Align: left · Vertical: top

```markdown
:::header{height="l" width="s" align="left" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-074 — Height: l · Width: s · Align: left · Vertical: center

```markdown
:::header{height="l" width="s" align="left" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-075 — Height: l · Width: s · Align: left · Vertical: bottom

```markdown
:::header{height="l" width="s" align="left" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-076 — Height: l · Width: s · Align: center · Vertical: top

```markdown
:::header{height="l" width="s" align="center" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-077 — Height: l · Width: s · Align: center · Vertical: center

```markdown
:::header{height="l" width="s" align="center" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-078 — Height: l · Width: s · Align: center · Vertical: bottom

```markdown
:::header{height="l" width="s" align="center" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-079 — Height: l · Width: s · Align: right · Vertical: top

```markdown
:::header{height="l" width="s" align="right" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-080 — Height: l · Width: s · Align: right · Vertical: center

```markdown
:::header{height="l" width="s" align="right" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-081 — Height: l · Width: s · Align: right · Vertical: bottom

```markdown
:::header{height="l" width="s" align="right" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-082 — Height: l · Width: m · Align: left · Vertical: top

```markdown
:::header{height="l" width="m" align="left" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-083 — Height: l · Width: m · Align: left · Vertical: center

```markdown
:::header{height="l" width="m" align="left" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-084 — Height: l · Width: m · Align: left · Vertical: bottom

```markdown
:::header{height="l" width="m" align="left" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-085 — Height: l · Width: m · Align: center · Vertical: top

```markdown
:::header{height="l" width="m" align="center" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-086 — Height: l · Width: m · Align: center · Vertical: center

```markdown
:::header{height="l" width="m" align="center" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-087 — Height: l · Width: m · Align: center · Vertical: bottom

```markdown
:::header{height="l" width="m" align="center" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-088 — Height: l · Width: m · Align: right · Vertical: top

```markdown
:::header{height="l" width="m" align="right" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-089 — Height: l · Width: m · Align: right · Vertical: center

```markdown
:::header{height="l" width="m" align="right" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-090 — Height: l · Width: m · Align: right · Vertical: bottom

```markdown
:::header{height="l" width="m" align="right" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-091 — Height: l · Width: l · Align: left · Vertical: top

```markdown
:::header{height="l" width="l" align="left" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-092 — Height: l · Width: l · Align: left · Vertical: center

```markdown
:::header{height="l" width="l" align="left" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-093 — Height: l · Width: l · Align: left · Vertical: bottom

```markdown
:::header{height="l" width="l" align="left" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-094 — Height: l · Width: l · Align: center · Vertical: top

```markdown
:::header{height="l" width="l" align="center" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-095 — Height: l · Width: l · Align: center · Vertical: center

```markdown
:::header{height="l" width="l" align="center" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-096 — Height: l · Width: l · Align: center · Vertical: bottom

```markdown
:::header{height="l" width="l" align="center" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-097 — Height: l · Width: l · Align: right · Vertical: top

```markdown
:::header{height="l" width="l" align="right" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-098 — Height: l · Width: l · Align: right · Vertical: center

```markdown
:::header{height="l" width="l" align="right" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-099 — Height: l · Width: l · Align: right · Vertical: bottom

```markdown
:::header{height="l" width="l" align="right" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-100 — Height: l · Width: full · Align: left · Vertical: top

```markdown
:::header{height="l" width="full" align="left" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-101 — Height: l · Width: full · Align: left · Vertical: center

```markdown
:::header{height="l" width="full" align="left" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-102 — Height: l · Width: full · Align: left · Vertical: bottom

```markdown
:::header{height="l" width="full" align="left" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-103 — Height: l · Width: full · Align: center · Vertical: top

```markdown
:::header{height="l" width="full" align="center" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-104 — Height: l · Width: full · Align: center · Vertical: center

```markdown
:::header{height="l" width="full" align="center" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-105 — Height: l · Width: full · Align: center · Vertical: bottom

```markdown
:::header{height="l" width="full" align="center" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-106 — Height: l · Width: full · Align: right · Vertical: top

```markdown
:::header{height="l" width="full" align="right" vertical="top"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-107 — Height: l · Width: full · Align: right · Vertical: center

```markdown
:::header{height="l" width="full" align="right" vertical="center"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### layout-108 — Height: l · Width: full · Align: right · Vertical: bottom

```markdown
:::header{height="l" width="full" align="right" vertical="bottom"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

## Backgrounds

All fill colors, background image themes and blur states.

### background-001 — Image: off · Fill: omitted · Theme: omitted · Blur: omitted

```markdown
:::header

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-002 — Image: on · Fill: omitted · Theme: omitted · Blur: omitted

```markdown
:::header{bg-image="https://example.org/banner.jpg"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-003 — Image: on · Fill: omitted · Theme: omitted · Blur: true

```markdown
:::header{bg-image="https://example.org/banner.jpg" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-004 — Image: on · Fill: omitted · Theme: system · Blur: omitted

```markdown
:::header{bg-image="https://example.org/banner.jpg" bg-image-theme="system"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-005 — Image: on · Fill: omitted · Theme: system · Blur: true

```markdown
:::header{bg-image="https://example.org/banner.jpg" bg-image-theme="system" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-006 — Image: on · Fill: omitted · Theme: light · Blur: omitted

```markdown
:::header{bg-image="https://example.org/banner.jpg" bg-image-theme="light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-007 — Image: on · Fill: omitted · Theme: light · Blur: true

```markdown
:::header{bg-image="https://example.org/banner.jpg" bg-image-theme="light" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-008 — Image: on · Fill: omitted · Theme: dark · Blur: omitted

```markdown
:::header{bg-image="https://example.org/banner.jpg" bg-image-theme="dark"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-009 — Image: on · Fill: omitted · Theme: dark · Blur: true

```markdown
:::header{bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-010 — Image: off · Fill: gray-light · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="gray-light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-011 — Image: on · Fill: gray-light · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="gray-light" bg-image="https://example.org/banner.jpg"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-012 — Image: on · Fill: gray-light · Theme: omitted · Blur: true

```markdown
:::header{bg-color="gray-light" bg-image="https://example.org/banner.jpg" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-013 — Image: on · Fill: gray-light · Theme: system · Blur: omitted

```markdown
:::header{bg-color="gray-light" bg-image="https://example.org/banner.jpg" bg-image-theme="system"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-014 — Image: on · Fill: gray-light · Theme: system · Blur: true

```markdown
:::header{bg-color="gray-light" bg-image="https://example.org/banner.jpg" bg-image-theme="system" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-015 — Image: on · Fill: gray-light · Theme: light · Blur: omitted

```markdown
:::header{bg-color="gray-light" bg-image="https://example.org/banner.jpg" bg-image-theme="light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-016 — Image: on · Fill: gray-light · Theme: light · Blur: true

```markdown
:::header{bg-color="gray-light" bg-image="https://example.org/banner.jpg" bg-image-theme="light" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-017 — Image: on · Fill: gray-light · Theme: dark · Blur: omitted

```markdown
:::header{bg-color="gray-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-018 — Image: on · Fill: gray-light · Theme: dark · Blur: true

```markdown
:::header{bg-color="gray-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-019 — Image: off · Fill: gray-medium · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="gray-medium"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-020 — Image: on · Fill: gray-medium · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="gray-medium" bg-image="https://example.org/banner.jpg"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-021 — Image: on · Fill: gray-medium · Theme: omitted · Blur: true

```markdown
:::header{bg-color="gray-medium" bg-image="https://example.org/banner.jpg" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-022 — Image: on · Fill: gray-medium · Theme: system · Blur: omitted

```markdown
:::header{bg-color="gray-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="system"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-023 — Image: on · Fill: gray-medium · Theme: system · Blur: true

```markdown
:::header{bg-color="gray-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="system" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-024 — Image: on · Fill: gray-medium · Theme: light · Blur: omitted

```markdown
:::header{bg-color="gray-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-025 — Image: on · Fill: gray-medium · Theme: light · Blur: true

```markdown
:::header{bg-color="gray-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="light" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-026 — Image: on · Fill: gray-medium · Theme: dark · Blur: omitted

```markdown
:::header{bg-color="gray-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="dark"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-027 — Image: on · Fill: gray-medium · Theme: dark · Blur: true

```markdown
:::header{bg-color="gray-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-028 — Image: off · Fill: gray-heavy · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="gray-heavy"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-029 — Image: on · Fill: gray-heavy · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="gray-heavy" bg-image="https://example.org/banner.jpg"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-030 — Image: on · Fill: gray-heavy · Theme: omitted · Blur: true

```markdown
:::header{bg-color="gray-heavy" bg-image="https://example.org/banner.jpg" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-031 — Image: on · Fill: gray-heavy · Theme: system · Blur: omitted

```markdown
:::header{bg-color="gray-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="system"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-032 — Image: on · Fill: gray-heavy · Theme: system · Blur: true

```markdown
:::header{bg-color="gray-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="system" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-033 — Image: on · Fill: gray-heavy · Theme: light · Blur: omitted

```markdown
:::header{bg-color="gray-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-034 — Image: on · Fill: gray-heavy · Theme: light · Blur: true

```markdown
:::header{bg-color="gray-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="light" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-035 — Image: on · Fill: gray-heavy · Theme: dark · Blur: omitted

```markdown
:::header{bg-color="gray-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="dark"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-036 — Image: on · Fill: gray-heavy · Theme: dark · Blur: true

```markdown
:::header{bg-color="gray-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-037 — Image: off · Fill: green-light · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="green-light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-038 — Image: on · Fill: green-light · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="green-light" bg-image="https://example.org/banner.jpg"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-039 — Image: on · Fill: green-light · Theme: omitted · Blur: true

```markdown
:::header{bg-color="green-light" bg-image="https://example.org/banner.jpg" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-040 — Image: on · Fill: green-light · Theme: system · Blur: omitted

```markdown
:::header{bg-color="green-light" bg-image="https://example.org/banner.jpg" bg-image-theme="system"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-041 — Image: on · Fill: green-light · Theme: system · Blur: true

```markdown
:::header{bg-color="green-light" bg-image="https://example.org/banner.jpg" bg-image-theme="system" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-042 — Image: on · Fill: green-light · Theme: light · Blur: omitted

```markdown
:::header{bg-color="green-light" bg-image="https://example.org/banner.jpg" bg-image-theme="light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-043 — Image: on · Fill: green-light · Theme: light · Blur: true

```markdown
:::header{bg-color="green-light" bg-image="https://example.org/banner.jpg" bg-image-theme="light" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-044 — Image: on · Fill: green-light · Theme: dark · Blur: omitted

```markdown
:::header{bg-color="green-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-045 — Image: on · Fill: green-light · Theme: dark · Blur: true

```markdown
:::header{bg-color="green-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-046 — Image: off · Fill: green-medium · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="green-medium"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-047 — Image: on · Fill: green-medium · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="green-medium" bg-image="https://example.org/banner.jpg"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-048 — Image: on · Fill: green-medium · Theme: omitted · Blur: true

```markdown
:::header{bg-color="green-medium" bg-image="https://example.org/banner.jpg" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-049 — Image: on · Fill: green-medium · Theme: system · Blur: omitted

```markdown
:::header{bg-color="green-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="system"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-050 — Image: on · Fill: green-medium · Theme: system · Blur: true

```markdown
:::header{bg-color="green-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="system" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-051 — Image: on · Fill: green-medium · Theme: light · Blur: omitted

```markdown
:::header{bg-color="green-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-052 — Image: on · Fill: green-medium · Theme: light · Blur: true

```markdown
:::header{bg-color="green-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="light" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-053 — Image: on · Fill: green-medium · Theme: dark · Blur: omitted

```markdown
:::header{bg-color="green-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="dark"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-054 — Image: on · Fill: green-medium · Theme: dark · Blur: true

```markdown
:::header{bg-color="green-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-055 — Image: off · Fill: green-heavy · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="green-heavy"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-056 — Image: on · Fill: green-heavy · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="green-heavy" bg-image="https://example.org/banner.jpg"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-057 — Image: on · Fill: green-heavy · Theme: omitted · Blur: true

```markdown
:::header{bg-color="green-heavy" bg-image="https://example.org/banner.jpg" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-058 — Image: on · Fill: green-heavy · Theme: system · Blur: omitted

```markdown
:::header{bg-color="green-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="system"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-059 — Image: on · Fill: green-heavy · Theme: system · Blur: true

```markdown
:::header{bg-color="green-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="system" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-060 — Image: on · Fill: green-heavy · Theme: light · Blur: omitted

```markdown
:::header{bg-color="green-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-061 — Image: on · Fill: green-heavy · Theme: light · Blur: true

```markdown
:::header{bg-color="green-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="light" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-062 — Image: on · Fill: green-heavy · Theme: dark · Blur: omitted

```markdown
:::header{bg-color="green-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="dark"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-063 — Image: on · Fill: green-heavy · Theme: dark · Blur: true

```markdown
:::header{bg-color="green-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-064 — Image: off · Fill: yellow-light · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="yellow-light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-065 — Image: on · Fill: yellow-light · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="yellow-light" bg-image="https://example.org/banner.jpg"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-066 — Image: on · Fill: yellow-light · Theme: omitted · Blur: true

```markdown
:::header{bg-color="yellow-light" bg-image="https://example.org/banner.jpg" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-067 — Image: on · Fill: yellow-light · Theme: system · Blur: omitted

```markdown
:::header{bg-color="yellow-light" bg-image="https://example.org/banner.jpg" bg-image-theme="system"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-068 — Image: on · Fill: yellow-light · Theme: system · Blur: true

```markdown
:::header{bg-color="yellow-light" bg-image="https://example.org/banner.jpg" bg-image-theme="system" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-069 — Image: on · Fill: yellow-light · Theme: light · Blur: omitted

```markdown
:::header{bg-color="yellow-light" bg-image="https://example.org/banner.jpg" bg-image-theme="light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-070 — Image: on · Fill: yellow-light · Theme: light · Blur: true

```markdown
:::header{bg-color="yellow-light" bg-image="https://example.org/banner.jpg" bg-image-theme="light" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-071 — Image: on · Fill: yellow-light · Theme: dark · Blur: omitted

```markdown
:::header{bg-color="yellow-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-072 — Image: on · Fill: yellow-light · Theme: dark · Blur: true

```markdown
:::header{bg-color="yellow-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-073 — Image: off · Fill: yellow-medium · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="yellow-medium"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-074 — Image: on · Fill: yellow-medium · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="yellow-medium" bg-image="https://example.org/banner.jpg"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-075 — Image: on · Fill: yellow-medium · Theme: omitted · Blur: true

```markdown
:::header{bg-color="yellow-medium" bg-image="https://example.org/banner.jpg" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-076 — Image: on · Fill: yellow-medium · Theme: system · Blur: omitted

```markdown
:::header{bg-color="yellow-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="system"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-077 — Image: on · Fill: yellow-medium · Theme: system · Blur: true

```markdown
:::header{bg-color="yellow-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="system" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-078 — Image: on · Fill: yellow-medium · Theme: light · Blur: omitted

```markdown
:::header{bg-color="yellow-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-079 — Image: on · Fill: yellow-medium · Theme: light · Blur: true

```markdown
:::header{bg-color="yellow-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="light" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-080 — Image: on · Fill: yellow-medium · Theme: dark · Blur: omitted

```markdown
:::header{bg-color="yellow-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="dark"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-081 — Image: on · Fill: yellow-medium · Theme: dark · Blur: true

```markdown
:::header{bg-color="yellow-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-082 — Image: off · Fill: yellow-heavy · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="yellow-heavy"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-083 — Image: on · Fill: yellow-heavy · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="yellow-heavy" bg-image="https://example.org/banner.jpg"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-084 — Image: on · Fill: yellow-heavy · Theme: omitted · Blur: true

```markdown
:::header{bg-color="yellow-heavy" bg-image="https://example.org/banner.jpg" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-085 — Image: on · Fill: yellow-heavy · Theme: system · Blur: omitted

```markdown
:::header{bg-color="yellow-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="system"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-086 — Image: on · Fill: yellow-heavy · Theme: system · Blur: true

```markdown
:::header{bg-color="yellow-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="system" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-087 — Image: on · Fill: yellow-heavy · Theme: light · Blur: omitted

```markdown
:::header{bg-color="yellow-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-088 — Image: on · Fill: yellow-heavy · Theme: light · Blur: true

```markdown
:::header{bg-color="yellow-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="light" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-089 — Image: on · Fill: yellow-heavy · Theme: dark · Blur: omitted

```markdown
:::header{bg-color="yellow-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="dark"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-090 — Image: on · Fill: yellow-heavy · Theme: dark · Blur: true

```markdown
:::header{bg-color="yellow-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-091 — Image: off · Fill: blue-light · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="blue-light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-092 — Image: on · Fill: blue-light · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="blue-light" bg-image="https://example.org/banner.jpg"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-093 — Image: on · Fill: blue-light · Theme: omitted · Blur: true

```markdown
:::header{bg-color="blue-light" bg-image="https://example.org/banner.jpg" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-094 — Image: on · Fill: blue-light · Theme: system · Blur: omitted

```markdown
:::header{bg-color="blue-light" bg-image="https://example.org/banner.jpg" bg-image-theme="system"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-095 — Image: on · Fill: blue-light · Theme: system · Blur: true

```markdown
:::header{bg-color="blue-light" bg-image="https://example.org/banner.jpg" bg-image-theme="system" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-096 — Image: on · Fill: blue-light · Theme: light · Blur: omitted

```markdown
:::header{bg-color="blue-light" bg-image="https://example.org/banner.jpg" bg-image-theme="light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-097 — Image: on · Fill: blue-light · Theme: light · Blur: true

```markdown
:::header{bg-color="blue-light" bg-image="https://example.org/banner.jpg" bg-image-theme="light" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-098 — Image: on · Fill: blue-light · Theme: dark · Blur: omitted

```markdown
:::header{bg-color="blue-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-099 — Image: on · Fill: blue-light · Theme: dark · Blur: true

```markdown
:::header{bg-color="blue-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-100 — Image: off · Fill: blue-medium · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="blue-medium"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-101 — Image: on · Fill: blue-medium · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="blue-medium" bg-image="https://example.org/banner.jpg"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-102 — Image: on · Fill: blue-medium · Theme: omitted · Blur: true

```markdown
:::header{bg-color="blue-medium" bg-image="https://example.org/banner.jpg" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-103 — Image: on · Fill: blue-medium · Theme: system · Blur: omitted

```markdown
:::header{bg-color="blue-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="system"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-104 — Image: on · Fill: blue-medium · Theme: system · Blur: true

```markdown
:::header{bg-color="blue-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="system" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-105 — Image: on · Fill: blue-medium · Theme: light · Blur: omitted

```markdown
:::header{bg-color="blue-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-106 — Image: on · Fill: blue-medium · Theme: light · Blur: true

```markdown
:::header{bg-color="blue-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="light" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-107 — Image: on · Fill: blue-medium · Theme: dark · Blur: omitted

```markdown
:::header{bg-color="blue-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="dark"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-108 — Image: on · Fill: blue-medium · Theme: dark · Blur: true

```markdown
:::header{bg-color="blue-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-109 — Image: off · Fill: blue-heavy · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="blue-heavy"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-110 — Image: on · Fill: blue-heavy · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="blue-heavy" bg-image="https://example.org/banner.jpg"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-111 — Image: on · Fill: blue-heavy · Theme: omitted · Blur: true

```markdown
:::header{bg-color="blue-heavy" bg-image="https://example.org/banner.jpg" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-112 — Image: on · Fill: blue-heavy · Theme: system · Blur: omitted

```markdown
:::header{bg-color="blue-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="system"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-113 — Image: on · Fill: blue-heavy · Theme: system · Blur: true

```markdown
:::header{bg-color="blue-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="system" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-114 — Image: on · Fill: blue-heavy · Theme: light · Blur: omitted

```markdown
:::header{bg-color="blue-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-115 — Image: on · Fill: blue-heavy · Theme: light · Blur: true

```markdown
:::header{bg-color="blue-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="light" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-116 — Image: on · Fill: blue-heavy · Theme: dark · Blur: omitted

```markdown
:::header{bg-color="blue-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="dark"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-117 — Image: on · Fill: blue-heavy · Theme: dark · Blur: true

```markdown
:::header{bg-color="blue-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-118 — Image: off · Fill: red-light · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="red-light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-119 — Image: on · Fill: red-light · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="red-light" bg-image="https://example.org/banner.jpg"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-120 — Image: on · Fill: red-light · Theme: omitted · Blur: true

```markdown
:::header{bg-color="red-light" bg-image="https://example.org/banner.jpg" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-121 — Image: on · Fill: red-light · Theme: system · Blur: omitted

```markdown
:::header{bg-color="red-light" bg-image="https://example.org/banner.jpg" bg-image-theme="system"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-122 — Image: on · Fill: red-light · Theme: system · Blur: true

```markdown
:::header{bg-color="red-light" bg-image="https://example.org/banner.jpg" bg-image-theme="system" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-123 — Image: on · Fill: red-light · Theme: light · Blur: omitted

```markdown
:::header{bg-color="red-light" bg-image="https://example.org/banner.jpg" bg-image-theme="light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-124 — Image: on · Fill: red-light · Theme: light · Blur: true

```markdown
:::header{bg-color="red-light" bg-image="https://example.org/banner.jpg" bg-image-theme="light" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-125 — Image: on · Fill: red-light · Theme: dark · Blur: omitted

```markdown
:::header{bg-color="red-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-126 — Image: on · Fill: red-light · Theme: dark · Blur: true

```markdown
:::header{bg-color="red-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-127 — Image: off · Fill: red-medium · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="red-medium"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-128 — Image: on · Fill: red-medium · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="red-medium" bg-image="https://example.org/banner.jpg"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-129 — Image: on · Fill: red-medium · Theme: omitted · Blur: true

```markdown
:::header{bg-color="red-medium" bg-image="https://example.org/banner.jpg" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-130 — Image: on · Fill: red-medium · Theme: system · Blur: omitted

```markdown
:::header{bg-color="red-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="system"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-131 — Image: on · Fill: red-medium · Theme: system · Blur: true

```markdown
:::header{bg-color="red-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="system" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-132 — Image: on · Fill: red-medium · Theme: light · Blur: omitted

```markdown
:::header{bg-color="red-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-133 — Image: on · Fill: red-medium · Theme: light · Blur: true

```markdown
:::header{bg-color="red-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="light" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-134 — Image: on · Fill: red-medium · Theme: dark · Blur: omitted

```markdown
:::header{bg-color="red-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="dark"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-135 — Image: on · Fill: red-medium · Theme: dark · Blur: true

```markdown
:::header{bg-color="red-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-136 — Image: off · Fill: red-heavy · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="red-heavy"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-137 — Image: on · Fill: red-heavy · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="red-heavy" bg-image="https://example.org/banner.jpg"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-138 — Image: on · Fill: red-heavy · Theme: omitted · Blur: true

```markdown
:::header{bg-color="red-heavy" bg-image="https://example.org/banner.jpg" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-139 — Image: on · Fill: red-heavy · Theme: system · Blur: omitted

```markdown
:::header{bg-color="red-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="system"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-140 — Image: on · Fill: red-heavy · Theme: system · Blur: true

```markdown
:::header{bg-color="red-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="system" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-141 — Image: on · Fill: red-heavy · Theme: light · Blur: omitted

```markdown
:::header{bg-color="red-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-142 — Image: on · Fill: red-heavy · Theme: light · Blur: true

```markdown
:::header{bg-color="red-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="light" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-143 — Image: on · Fill: red-heavy · Theme: dark · Blur: omitted

```markdown
:::header{bg-color="red-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="dark"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-144 — Image: on · Fill: red-heavy · Theme: dark · Blur: true

```markdown
:::header{bg-color="red-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-145 — Image: off · Fill: violet-light · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="violet-light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-146 — Image: on · Fill: violet-light · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="violet-light" bg-image="https://example.org/banner.jpg"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-147 — Image: on · Fill: violet-light · Theme: omitted · Blur: true

```markdown
:::header{bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-148 — Image: on · Fill: violet-light · Theme: system · Blur: omitted

```markdown
:::header{bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="system"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-149 — Image: on · Fill: violet-light · Theme: system · Blur: true

```markdown
:::header{bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="system" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-150 — Image: on · Fill: violet-light · Theme: light · Blur: omitted

```markdown
:::header{bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-151 — Image: on · Fill: violet-light · Theme: light · Blur: true

```markdown
:::header{bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="light" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-152 — Image: on · Fill: violet-light · Theme: dark · Blur: omitted

```markdown
:::header{bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-153 — Image: on · Fill: violet-light · Theme: dark · Blur: true

```markdown
:::header{bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-154 — Image: off · Fill: violet-medium · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="violet-medium"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-155 — Image: on · Fill: violet-medium · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="violet-medium" bg-image="https://example.org/banner.jpg"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-156 — Image: on · Fill: violet-medium · Theme: omitted · Blur: true

```markdown
:::header{bg-color="violet-medium" bg-image="https://example.org/banner.jpg" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-157 — Image: on · Fill: violet-medium · Theme: system · Blur: omitted

```markdown
:::header{bg-color="violet-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="system"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-158 — Image: on · Fill: violet-medium · Theme: system · Blur: true

```markdown
:::header{bg-color="violet-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="system" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-159 — Image: on · Fill: violet-medium · Theme: light · Blur: omitted

```markdown
:::header{bg-color="violet-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-160 — Image: on · Fill: violet-medium · Theme: light · Blur: true

```markdown
:::header{bg-color="violet-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="light" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-161 — Image: on · Fill: violet-medium · Theme: dark · Blur: omitted

```markdown
:::header{bg-color="violet-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="dark"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-162 — Image: on · Fill: violet-medium · Theme: dark · Blur: true

```markdown
:::header{bg-color="violet-medium" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-163 — Image: off · Fill: violet-heavy · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="violet-heavy"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-164 — Image: on · Fill: violet-heavy · Theme: omitted · Blur: omitted

```markdown
:::header{bg-color="violet-heavy" bg-image="https://example.org/banner.jpg"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-165 — Image: on · Fill: violet-heavy · Theme: omitted · Blur: true

```markdown
:::header{bg-color="violet-heavy" bg-image="https://example.org/banner.jpg" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-166 — Image: on · Fill: violet-heavy · Theme: system · Blur: omitted

```markdown
:::header{bg-color="violet-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="system"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-167 — Image: on · Fill: violet-heavy · Theme: system · Blur: true

```markdown
:::header{bg-color="violet-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="system" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-168 — Image: on · Fill: violet-heavy · Theme: light · Blur: omitted

```markdown
:::header{bg-color="violet-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="light"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-169 — Image: on · Fill: violet-heavy · Theme: light · Blur: true

```markdown
:::header{bg-color="violet-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="light" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-170 — Image: on · Fill: violet-heavy · Theme: dark · Blur: omitted

```markdown
:::header{bg-color="violet-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="dark"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

### background-171 — Image: on · Fill: violet-heavy · Theme: dark · Blur: true

```markdown
:::header{bg-color="violet-heavy" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]

:::header-content
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}
:::
```

## Title size and color

The title is a single leaf directive with plain text in square brackets. Links and formatting belong in the description.

### title-001 — Size: omitted · Color: omitted

```markdown
:::header

::header-title[Team portal]
:::
```

### title-002 — Size: omitted · Color: auto

```markdown
:::header

::header-title[Team portal]{color="auto"}
:::
```

### title-003 — Size: omitted · Color: gray

```markdown
:::header

::header-title[Team portal]{color="gray"}
:::
```

### title-004 — Size: omitted · Color: yellow

```markdown
:::header

::header-title[Team portal]{color="yellow"}
:::
```

### title-005 — Size: omitted · Color: orange

```markdown
:::header

::header-title[Team portal]{color="orange"}
:::
```

### title-006 — Size: omitted · Color: red

```markdown
:::header

::header-title[Team portal]{color="red"}
:::
```

### title-007 — Size: omitted · Color: green

```markdown
:::header

::header-title[Team portal]{color="green"}
:::
```

### title-008 — Size: omitted · Color: blue

```markdown
:::header

::header-title[Team portal]{color="blue"}
:::
```

### title-009 — Size: omitted · Color: violet

```markdown
:::header

::header-title[Team portal]{color="violet"}
:::
```

### title-010 — Size: 1 · Color: omitted

```markdown
:::header

::header-title[Team portal]{size="1"}
:::
```

### title-011 — Size: 1 · Color: auto

```markdown
:::header

::header-title[Team portal]{size="1" color="auto"}
:::
```

### title-012 — Size: 1 · Color: gray

```markdown
:::header

::header-title[Team portal]{size="1" color="gray"}
:::
```

### title-013 — Size: 1 · Color: yellow

```markdown
:::header

::header-title[Team portal]{size="1" color="yellow"}
:::
```

### title-014 — Size: 1 · Color: orange

```markdown
:::header

::header-title[Team portal]{size="1" color="orange"}
:::
```

### title-015 — Size: 1 · Color: red

```markdown
:::header

::header-title[Team portal]{size="1" color="red"}
:::
```

### title-016 — Size: 1 · Color: green

```markdown
:::header

::header-title[Team portal]{size="1" color="green"}
:::
```

### title-017 — Size: 1 · Color: blue

```markdown
:::header

::header-title[Team portal]{size="1" color="blue"}
:::
```

### title-018 — Size: 1 · Color: violet

```markdown
:::header

::header-title[Team portal]{size="1" color="violet"}
:::
```

### title-019 — Size: 2 · Color: omitted

```markdown
:::header

::header-title[Team portal]{size="2"}
:::
```

### title-020 — Size: 2 · Color: auto

```markdown
:::header

::header-title[Team portal]{size="2" color="auto"}
:::
```

### title-021 — Size: 2 · Color: gray

```markdown
:::header

::header-title[Team portal]{size="2" color="gray"}
:::
```

### title-022 — Size: 2 · Color: yellow

```markdown
:::header

::header-title[Team portal]{size="2" color="yellow"}
:::
```

### title-023 — Size: 2 · Color: orange

```markdown
:::header

::header-title[Team portal]{size="2" color="orange"}
:::
```

### title-024 — Size: 2 · Color: red

```markdown
:::header

::header-title[Team portal]{size="2" color="red"}
:::
```

### title-025 — Size: 2 · Color: green

```markdown
:::header

::header-title[Team portal]{size="2" color="green"}
:::
```

### title-026 — Size: 2 · Color: blue

```markdown
:::header

::header-title[Team portal]{size="2" color="blue"}
:::
```

### title-027 — Size: 2 · Color: violet

```markdown
:::header

::header-title[Team portal]{size="2" color="violet"}
:::
```

### title-028 — Size: 3 · Color: omitted

```markdown
:::header

::header-title[Team portal]{size="3"}
:::
```

### title-029 — Size: 3 · Color: auto

```markdown
:::header

::header-title[Team portal]{size="3" color="auto"}
:::
```

### title-030 — Size: 3 · Color: gray

```markdown
:::header

::header-title[Team portal]{size="3" color="gray"}
:::
```

### title-031 — Size: 3 · Color: yellow

```markdown
:::header

::header-title[Team portal]{size="3" color="yellow"}
:::
```

### title-032 — Size: 3 · Color: orange

```markdown
:::header

::header-title[Team portal]{size="3" color="orange"}
:::
```

### title-033 — Size: 3 · Color: red

```markdown
:::header

::header-title[Team portal]{size="3" color="red"}
:::
```

### title-034 — Size: 3 · Color: green

```markdown
:::header

::header-title[Team portal]{size="3" color="green"}
:::
```

### title-035 — Size: 3 · Color: blue

```markdown
:::header

::header-title[Team portal]{size="3" color="blue"}
:::
```

### title-036 — Size: 3 · Color: violet

```markdown
:::header

::header-title[Team portal]{size="3" color="violet"}
:::
```

### title-037 — Size: 4 · Color: omitted

```markdown
:::header

::header-title[Team portal]{size="4"}
:::
```

### title-038 — Size: 4 · Color: auto

```markdown
:::header

::header-title[Team portal]{size="4" color="auto"}
:::
```

### title-039 — Size: 4 · Color: gray

```markdown
:::header

::header-title[Team portal]{size="4" color="gray"}
:::
```

### title-040 — Size: 4 · Color: yellow

```markdown
:::header

::header-title[Team portal]{size="4" color="yellow"}
:::
```

### title-041 — Size: 4 · Color: orange

```markdown
:::header

::header-title[Team portal]{size="4" color="orange"}
:::
```

### title-042 — Size: 4 · Color: red

```markdown
:::header

::header-title[Team portal]{size="4" color="red"}
:::
```

### title-043 — Size: 4 · Color: green

```markdown
:::header

::header-title[Team portal]{size="4" color="green"}
:::
```

### title-044 — Size: 4 · Color: blue

```markdown
:::header

::header-title[Team portal]{size="4" color="blue"}
:::
```

### title-045 — Size: 4 · Color: violet

```markdown
:::header

::header-title[Team portal]{size="4" color="violet"}
:::
```

### title-046 — Size: 5 · Color: omitted

```markdown
:::header

::header-title[Team portal]{size="5"}
:::
```

### title-047 — Size: 5 · Color: auto

```markdown
:::header

::header-title[Team portal]{size="5" color="auto"}
:::
```

### title-048 — Size: 5 · Color: gray

```markdown
:::header

::header-title[Team portal]{size="5" color="gray"}
:::
```

### title-049 — Size: 5 · Color: yellow

```markdown
:::header

::header-title[Team portal]{size="5" color="yellow"}
:::
```

### title-050 — Size: 5 · Color: orange

```markdown
:::header

::header-title[Team portal]{size="5" color="orange"}
:::
```

### title-051 — Size: 5 · Color: red

```markdown
:::header

::header-title[Team portal]{size="5" color="red"}
:::
```

### title-052 — Size: 5 · Color: green

```markdown
:::header

::header-title[Team portal]{size="5" color="green"}
:::
```

### title-053 — Size: 5 · Color: blue

```markdown
:::header

::header-title[Team portal]{size="5" color="blue"}
:::
```

### title-054 — Size: 5 · Color: violet

```markdown
:::header

::header-title[Team portal]{size="5" color="violet"}
:::
```

### title-055 — Size: 6 · Color: omitted

```markdown
:::header

::header-title[Team portal]{size="6"}
:::
```

### title-056 — Size: 6 · Color: auto

```markdown
:::header

::header-title[Team portal]{size="6" color="auto"}
:::
```

### title-057 — Size: 6 · Color: gray

```markdown
:::header

::header-title[Team portal]{size="6" color="gray"}
:::
```

### title-058 — Size: 6 · Color: yellow

```markdown
:::header

::header-title[Team portal]{size="6" color="yellow"}
:::
```

### title-059 — Size: 6 · Color: orange

```markdown
:::header

::header-title[Team portal]{size="6" color="orange"}
:::
```

### title-060 — Size: 6 · Color: red

```markdown
:::header

::header-title[Team portal]{size="6" color="red"}
:::
```

### title-061 — Size: 6 · Color: green

```markdown
:::header

::header-title[Team portal]{size="6" color="green"}
:::
```

### title-062 — Size: 6 · Color: blue

```markdown
:::header

::header-title[Team portal]{size="6" color="blue"}
:::
```

### title-063 — Size: 6 · Color: violet

```markdown
:::header

::header-title[Team portal]{size="6" color="violet"}
:::
```

## Description size and paragraphs

The description is a container and can contain several paragraphs.

### description-001 — Size: omitted · Paragraphs: 1

```markdown
:::header

:::header-content
Portal description.
:::
:::
```

### description-002 — Size: omitted · Paragraphs: 2

```markdown
:::header

:::header-content
Portal description.

Second paragraph with a [link](/page), **bold**, *italic*, ~~strikethrough~~ and `monospace` text.
:::
:::
```

### description-003 — Size: 1 · Paragraphs: 1

```markdown
:::header

:::header-content{size="1"}
Portal description.
:::
:::
```

### description-004 — Size: 1 · Paragraphs: 2

```markdown
:::header

:::header-content{size="1"}
Portal description.

Second paragraph with a [link](/page), **bold**, *italic*, ~~strikethrough~~ and `monospace` text.
:::
:::
```

### description-005 — Size: 2 · Paragraphs: 1

```markdown
:::header

:::header-content{size="2"}
Portal description.
:::
:::
```

### description-006 — Size: 2 · Paragraphs: 2

```markdown
:::header

:::header-content{size="2"}
Portal description.

Second paragraph with a [link](/page), **bold**, *italic*, ~~strikethrough~~ and `monospace` text.
:::
:::
```

### description-007 — Size: 3 · Paragraphs: 1

```markdown
:::header

:::header-content{size="3"}
Portal description.
:::
:::
```

### description-008 — Size: 3 · Paragraphs: 2

```markdown
:::header

:::header-content{size="3"}
Portal description.

Second paragraph with a [link](/page), **bold**, *italic*, ~~strikethrough~~ and `monospace` text.
:::
:::
```

### description-009 — Size: 4 · Paragraphs: 1

```markdown
:::header

:::header-content{size="4"}
Portal description.
:::
:::
```

### description-010 — Size: 4 · Paragraphs: 2

```markdown
:::header

:::header-content{size="4"}
Portal description.

Second paragraph with a [link](/page), **bold**, *italic*, ~~strikethrough~~ and `monospace` text.
:::
:::
```

### description-011 — Size: 5 · Paragraphs: 1

```markdown
:::header

:::header-content{size="5"}
Portal description.
:::
:::
```

### description-012 — Size: 5 · Paragraphs: 2

```markdown
:::header

:::header-content{size="5"}
Portal description.

Second paragraph with a [link](/page), **bold**, *italic*, ~~strikethrough~~ and `monospace` text.
:::
:::
```

### description-013 — Size: 6 · Paragraphs: 1

```markdown
:::header

:::header-content{size="6"}
Portal description.
:::
:::
```

### description-014 — Size: 6 · Paragraphs: 2

```markdown
:::header

:::header-content{size="6"}
Portal description.

Second paragraph with a [link](/page), **bold**, *italic*, ~~strikethrough~~ and `monospace` text.
:::
:::
```

## Image attributes

The image is a leaf directive with src, alt and title attributes. It has no body or closing fence.

### image-001 — URL type: HTTPS · Alt: off · Title: off

```markdown
:::header

::header-image{src="https://example.org/image.jpg"}

::header-title[Team portal]
:::
```

### image-002 — URL type: HTTPS · Alt: off · Title: on

```markdown
:::header

::header-image{src="https://example.org/image.jpg" title="Project team"}

::header-title[Team portal]
:::
```

### image-003 — URL type: HTTPS · Alt: on · Title: off

```markdown
:::header

::header-image{src="https://example.org/image.jpg" alt="Team"}

::header-title[Team portal]
:::
```

### image-004 — URL type: HTTPS · Alt: on · Title: on

```markdown
:::header

::header-image{src="https://example.org/image.jpg" alt="Team" title="Project team"}

::header-title[Team portal]
:::
```

### image-005 — URL type: HTTP · Alt: off · Title: off

```markdown
:::header

::header-image{src="http://example.org/image.jpg"}

::header-title[Team portal]
:::
```

### image-006 — URL type: HTTP · Alt: off · Title: on

```markdown
:::header

::header-image{src="http://example.org/image.jpg" title="Project team"}

::header-title[Team portal]
:::
```

### image-007 — URL type: HTTP · Alt: on · Title: off

```markdown
:::header

::header-image{src="http://example.org/image.jpg" alt="Team"}

::header-title[Team portal]
:::
```

### image-008 — URL type: HTTP · Alt: on · Title: on

```markdown
:::header

::header-image{src="http://example.org/image.jpg" alt="Team" title="Project team"}

::header-title[Team portal]
:::
```

### image-009 — URL type: relative path · Alt: off · Title: off

```markdown
:::header

::header-image{src="https://example.org/banner.jpg"}

::header-title[Team portal]
:::
```

### image-010 — URL type: relative path · Alt: off · Title: on

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" title="Project team"}

::header-title[Team portal]
:::
```

### image-011 — URL type: relative path · Alt: on · Title: off

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt="Team"}

::header-title[Team portal]
:::
```

### image-012 — URL type: relative path · Alt: on · Title: on

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt="Team" title="Project team"}

::header-title[Team portal]
:::
```

### image-013 — Alt: empty string · Title: omitted · Explicit empty attributes: on

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt=""}
:::
```

### image-014 — Alt: omitted · Title: empty string · Explicit empty attributes: on

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" title=""}
:::
```

### image-015 — Alt: empty string · Title: empty string · Explicit empty attributes: on

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt="" title=""}
:::
```

## Button styles and target

Every allowed view/color pair with each target value.

### button-001 — View: action · Color: standard · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="standard"}
:::
```

### button-002 — View: action · Color: standard · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="standard" target="_self"}
:::
```

### button-003 — View: action · Color: standard · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="standard" target="_blank"}
:::
```

### button-004 — View: action · Color: standard · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="standard" target="_parent"}
:::
```

### button-005 — View: action · Color: standard · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="standard" target="_top"}
:::
```

### button-006 — View: action · Color: blue · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="blue"}
:::
```

### button-007 — View: action · Color: blue · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="blue" target="_self"}
:::
```

### button-008 — View: action · Color: blue · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="blue" target="_blank"}
:::
```

### button-009 — View: action · Color: blue · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="blue" target="_parent"}
:::
```

### button-010 — View: action · Color: blue · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="blue" target="_top"}
:::
```

### button-011 — View: action · Color: green · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="green"}
:::
```

### button-012 — View: action · Color: green · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="green" target="_self"}
:::
```

### button-013 — View: action · Color: green · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="green" target="_blank"}
:::
```

### button-014 — View: action · Color: green · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="green" target="_parent"}
:::
```

### button-015 — View: action · Color: green · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="green" target="_top"}
:::
```

### button-016 — View: action · Color: yellow · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="yellow"}
:::
```

### button-017 — View: action · Color: yellow · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="yellow" target="_self"}
:::
```

### button-018 — View: action · Color: yellow · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="yellow" target="_blank"}
:::
```

### button-019 — View: action · Color: yellow · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="yellow" target="_parent"}
:::
```

### button-020 — View: action · Color: yellow · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="yellow" target="_top"}
:::
```

### button-021 — View: action · Color: red · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="red"}
:::
```

### button-022 — View: action · Color: red · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="red" target="_self"}
:::
```

### button-023 — View: action · Color: red · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="red" target="_blank"}
:::
```

### button-024 — View: action · Color: red · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="red" target="_parent"}
:::
```

### button-025 — View: action · Color: red · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="red" target="_top"}
:::
```

### button-026 — View: action · Color: violet · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="violet"}
:::
```

### button-027 — View: action · Color: violet · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="violet" target="_self"}
:::
```

### button-028 — View: action · Color: violet · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="violet" target="_blank"}
:::
```

### button-029 — View: action · Color: violet · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="violet" target="_parent"}
:::
```

### button-030 — View: action · Color: violet · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="violet" target="_top"}
:::
```

### button-031 — View: normal · Color: gray · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="gray"}
:::
```

### button-032 — View: normal · Color: gray · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="gray" target="_self"}
:::
```

### button-033 — View: normal · Color: gray · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="gray" target="_blank"}
:::
```

### button-034 — View: normal · Color: gray · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="gray" target="_parent"}
:::
```

### button-035 — View: normal · Color: gray · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="gray" target="_top"}
:::
```

### button-036 — View: normal · Color: blue · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="blue"}
:::
```

### button-037 — View: normal · Color: blue · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="blue" target="_self"}
:::
```

### button-038 — View: normal · Color: blue · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="blue" target="_blank"}
:::
```

### button-039 — View: normal · Color: blue · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="blue" target="_parent"}
:::
```

### button-040 — View: normal · Color: blue · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="blue" target="_top"}
:::
```

### button-041 — View: normal · Color: green · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="green"}
:::
```

### button-042 — View: normal · Color: green · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="green" target="_self"}
:::
```

### button-043 — View: normal · Color: green · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="green" target="_blank"}
:::
```

### button-044 — View: normal · Color: green · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="green" target="_parent"}
:::
```

### button-045 — View: normal · Color: green · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="green" target="_top"}
:::
```

### button-046 — View: normal · Color: yellow · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="yellow"}
:::
```

### button-047 — View: normal · Color: yellow · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="yellow" target="_self"}
:::
```

### button-048 — View: normal · Color: yellow · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="yellow" target="_blank"}
:::
```

### button-049 — View: normal · Color: yellow · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="yellow" target="_parent"}
:::
```

### button-050 — View: normal · Color: yellow · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="yellow" target="_top"}
:::
```

### button-051 — View: normal · Color: red · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="red"}
:::
```

### button-052 — View: normal · Color: red · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="red" target="_self"}
:::
```

### button-053 — View: normal · Color: red · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="red" target="_blank"}
:::
```

### button-054 — View: normal · Color: red · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="red" target="_parent"}
:::
```

### button-055 — View: normal · Color: red · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="red" target="_top"}
:::
```

### button-056 — View: normal · Color: violet · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="violet"}
:::
```

### button-057 — View: normal · Color: violet · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="violet" target="_self"}
:::
```

### button-058 — View: normal · Color: violet · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="violet" target="_blank"}
:::
```

### button-059 — View: normal · Color: violet · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="violet" target="_parent"}
:::
```

### button-060 — View: normal · Color: violet · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="normal" color="violet" target="_top"}
:::
```

### button-061 — View: outline · Color: gray · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="gray"}
:::
```

### button-062 — View: outline · Color: gray · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="gray" target="_self"}
:::
```

### button-063 — View: outline · Color: gray · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="gray" target="_blank"}
:::
```

### button-064 — View: outline · Color: gray · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="gray" target="_parent"}
:::
```

### button-065 — View: outline · Color: gray · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="gray" target="_top"}
:::
```

### button-066 — View: outline · Color: blue · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="blue"}
:::
```

### button-067 — View: outline · Color: blue · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="blue" target="_self"}
:::
```

### button-068 — View: outline · Color: blue · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="blue" target="_blank"}
:::
```

### button-069 — View: outline · Color: blue · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="blue" target="_parent"}
:::
```

### button-070 — View: outline · Color: blue · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="blue" target="_top"}
:::
```

### button-071 — View: outline · Color: green · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="green"}
:::
```

### button-072 — View: outline · Color: green · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="green" target="_self"}
:::
```

### button-073 — View: outline · Color: green · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="green" target="_blank"}
:::
```

### button-074 — View: outline · Color: green · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="green" target="_parent"}
:::
```

### button-075 — View: outline · Color: green · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="green" target="_top"}
:::
```

### button-076 — View: outline · Color: yellow · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="yellow"}
:::
```

### button-077 — View: outline · Color: yellow · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="yellow" target="_self"}
:::
```

### button-078 — View: outline · Color: yellow · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="yellow" target="_blank"}
:::
```

### button-079 — View: outline · Color: yellow · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="yellow" target="_parent"}
:::
```

### button-080 — View: outline · Color: yellow · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="yellow" target="_top"}
:::
```

### button-081 — View: outline · Color: red · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="red"}
:::
```

### button-082 — View: outline · Color: red · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="red" target="_self"}
:::
```

### button-083 — View: outline · Color: red · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="red" target="_blank"}
:::
```

### button-084 — View: outline · Color: red · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="red" target="_parent"}
:::
```

### button-085 — View: outline · Color: red · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="red" target="_top"}
:::
```

### button-086 — View: outline · Color: violet · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="violet"}
:::
```

### button-087 — View: outline · Color: violet · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="violet" target="_self"}
:::
```

### button-088 — View: outline · Color: violet · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="violet" target="_blank"}
:::
```

### button-089 — View: outline · Color: violet · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="violet" target="_parent"}
:::
```

### button-090 — View: outline · Color: violet · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="outline" color="violet" target="_top"}
:::
```

### button-091 — View: flat · Color: standard · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="standard"}
:::
```

### button-092 — View: flat · Color: standard · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="standard" target="_self"}
:::
```

### button-093 — View: flat · Color: standard · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="standard" target="_blank"}
:::
```

### button-094 — View: flat · Color: standard · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="standard" target="_parent"}
:::
```

### button-095 — View: flat · Color: standard · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="standard" target="_top"}
:::
```

### button-096 — View: flat · Color: gray · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="gray"}
:::
```

### button-097 — View: flat · Color: gray · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="gray" target="_self"}
:::
```

### button-098 — View: flat · Color: gray · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="gray" target="_blank"}
:::
```

### button-099 — View: flat · Color: gray · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="gray" target="_parent"}
:::
```

### button-100 — View: flat · Color: gray · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="gray" target="_top"}
:::
```

### button-101 — View: flat · Color: blue · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="blue"}
:::
```

### button-102 — View: flat · Color: blue · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="blue" target="_self"}
:::
```

### button-103 — View: flat · Color: blue · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="blue" target="_blank"}
:::
```

### button-104 — View: flat · Color: blue · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="blue" target="_parent"}
:::
```

### button-105 — View: flat · Color: blue · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="blue" target="_top"}
:::
```

### button-106 — View: flat · Color: green · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="green"}
:::
```

### button-107 — View: flat · Color: green · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="green" target="_self"}
:::
```

### button-108 — View: flat · Color: green · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="green" target="_blank"}
:::
```

### button-109 — View: flat · Color: green · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="green" target="_parent"}
:::
```

### button-110 — View: flat · Color: green · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="green" target="_top"}
:::
```

### button-111 — View: flat · Color: yellow · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="yellow"}
:::
```

### button-112 — View: flat · Color: yellow · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="yellow" target="_self"}
:::
```

### button-113 — View: flat · Color: yellow · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="yellow" target="_blank"}
:::
```

### button-114 — View: flat · Color: yellow · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="yellow" target="_parent"}
:::
```

### button-115 — View: flat · Color: yellow · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="yellow" target="_top"}
:::
```

### button-116 — View: flat · Color: red · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="red"}
:::
```

### button-117 — View: flat · Color: red · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="red" target="_self"}
:::
```

### button-118 — View: flat · Color: red · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="red" target="_blank"}
:::
```

### button-119 — View: flat · Color: red · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="red" target="_parent"}
:::
```

### button-120 — View: flat · Color: red · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="red" target="_top"}
:::
```

### button-121 — View: flat · Color: violet · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="violet"}
:::
```

### button-122 — View: flat · Color: violet · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="violet" target="_self"}
:::
```

### button-123 — View: flat · Color: violet · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="violet" target="_blank"}
:::
```

### button-124 — View: flat · Color: violet · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="violet" target="_parent"}
:::
```

### button-125 — View: flat · Color: violet · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="flat" color="violet" target="_top"}
:::
```

## Button URLs

Missing, empty, relative, HTTPS and HTTP URLs with each target value.

### link-001 — URL type: omitted · Target: omitted

```markdown
:::header

:button[Learn more]{view="action" color="blue"}
:::
```

### link-002 — URL type: omitted · Target: _self

```markdown
:::header

:button[Learn more]{view="action" color="blue" target="_self"}
:::
```

### link-003 — URL type: omitted · Target: _blank

```markdown
:::header

:button[Learn more]{view="action" color="blue" target="_blank"}
:::
```

### link-004 — URL type: omitted · Target: _parent

```markdown
:::header

:button[Learn more]{view="action" color="blue" target="_parent"}
:::
```

### link-005 — URL type: omitted · Target: _top

```markdown
:::header

:button[Learn more]{view="action" color="blue" target="_top"}
:::
```

### link-006 — URL type: empty string · Target: omitted

```markdown
:::header

:button[Learn more]{href="" view="action" color="blue"}
:::
```

### link-007 — URL type: empty string · Target: _self

```markdown
:::header

:button[Learn more]{href="" view="action" color="blue" target="_self"}
:::
```

### link-008 — URL type: empty string · Target: _blank

```markdown
:::header

:button[Learn more]{href="" view="action" color="blue" target="_blank"}
:::
```

### link-009 — URL type: empty string · Target: _parent

```markdown
:::header

:button[Learn more]{href="" view="action" color="blue" target="_parent"}
:::
```

### link-010 — URL type: empty string · Target: _top

```markdown
:::header

:button[Learn more]{href="" view="action" color="blue" target="_top"}
:::
```

### link-011 — URL type: relative · Target: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="blue"}
:::
```

### link-012 — URL type: relative · Target: _self

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="blue" target="_self"}
:::
```

### link-013 — URL type: relative · Target: _blank

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="blue" target="_blank"}
:::
```

### link-014 — URL type: relative · Target: _parent

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="blue" target="_parent"}
:::
```

### link-015 — URL type: relative · Target: _top

```markdown
:::header

:button[Learn more]{href="/page" view="action" color="blue" target="_top"}
:::
```

### link-016 — URL type: HTTPS · Target: omitted

```markdown
:::header

:button[Learn more]{href="https://example.org/page" view="action" color="blue"}
:::
```

### link-017 — URL type: HTTPS · Target: _self

```markdown
:::header

:button[Learn more]{href="https://example.org/page" view="action" color="blue" target="_self"}
:::
```

### link-018 — URL type: HTTPS · Target: _blank

```markdown
:::header

:button[Learn more]{href="https://example.org/page" view="action" color="blue" target="_blank"}
:::
```

### link-019 — URL type: HTTPS · Target: _parent

```markdown
:::header

:button[Learn more]{href="https://example.org/page" view="action" color="blue" target="_parent"}
:::
```

### link-020 — URL type: HTTPS · Target: _top

```markdown
:::header

:button[Learn more]{href="https://example.org/page" view="action" color="blue" target="_top"}
:::
```

### link-021 — URL type: HTTP · Target: omitted

```markdown
:::header

:button[Learn more]{href="http://example.org/page" view="action" color="blue"}
:::
```

### link-022 — URL type: HTTP · Target: _self

```markdown
:::header

:button[Learn more]{href="http://example.org/page" view="action" color="blue" target="_self"}
:::
```

### link-023 — URL type: HTTP · Target: _blank

```markdown
:::header

:button[Learn more]{href="http://example.org/page" view="action" color="blue" target="_blank"}
:::
```

### link-024 — URL type: HTTP · Target: _parent

```markdown
:::header

:button[Learn more]{href="http://example.org/page" view="action" color="blue" target="_parent"}
:::
```

### link-025 — URL type: HTTP · Target: _top

```markdown
:::header

:button[Learn more]{href="http://example.org/page" view="action" color="blue" target="_top"}
:::
```

## Defaults and empty values

Omitted attributes, explicit defaults and empty text.

### defaults-001 — Empty header

```markdown
:::header
:::
```

### defaults-002 — Minimal title

```markdown
:::header

::header-title[Team portal]
:::
```

### defaults-003 — Minimal description

```markdown
:::header

:::header-content
Portal description.
:::
:::
```

### defaults-004 — Button without attributes

```markdown
:::header

:button[Learn more]
:::
```

### defaults-005 — Button with URL only

```markdown
:::header

:button[Learn more]{href="/page"}
:::
```

### defaults-006 — Button with color only

```markdown
:::header

:button[Learn more]{color="blue"}
:::
```

### defaults-007 — Explicit header defaults

```markdown
:::header{height="s" width="m" align="left" vertical="center"}

::header-title[Team portal]
:::
```

### defaults-008 — Empty title and description

```markdown
:::header

::header-title[]

:::header-content
:::
:::
```

### defaults-009 — View: action · Color: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="action"}
:::
```

### defaults-010 — View: normal · Color: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="normal"}
:::
```

### defaults-011 — View: outline · Color: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="outline"}
:::
```

### defaults-012 — View: flat · Color: omitted

```markdown
:::header

:button[Learn more]{href="/page" view="flat"}
:::
```

## Links and nested formatting in the description

All combinations of the five text marks and a link, followed by nested formatting and multi-paragraph examples. The title stays plain text.

### nested-001 — Bold: off · Italic: off · Underline: off · Strikethrough: off · Inline code: off · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text.
:::
:::
```

### nested-002 — Bold: off · Italic: off · Underline: off · Strikethrough: off · Inline code: off · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. [Team page](/page)
:::
:::
```

### nested-003 — Bold: off · Italic: off · Underline: off · Strikethrough: off · Inline code: on · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. `inline code`
:::
:::
```

### nested-004 — Bold: off · Italic: off · Underline: off · Strikethrough: off · Inline code: on · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. `inline code` [Team page](/page)
:::
:::
```

### nested-005 — Bold: off · Italic: off · Underline: off · Strikethrough: on · Inline code: off · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. ~~Strikethrough text.~~
:::
:::
```

### nested-006 — Bold: off · Italic: off · Underline: off · Strikethrough: on · Inline code: off · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. ~~Strikethrough text.~~ [Team page](/page)
:::
:::
```

### nested-007 — Bold: off · Italic: off · Underline: off · Strikethrough: on · Inline code: on · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. ~~Strikethrough text.~~ `inline code`
:::
:::
```

### nested-008 — Bold: off · Italic: off · Underline: off · Strikethrough: on · Inline code: on · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. ~~Strikethrough text.~~ `inline code` [Team page](/page)
:::
:::
```

### nested-009 — Bold: off · Italic: off · Underline: on · Strikethrough: off · Inline code: off · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. ++Underlined text.++
:::
:::
```

### nested-010 — Bold: off · Italic: off · Underline: on · Strikethrough: off · Inline code: off · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. ++Underlined text.++ [Team page](/page)
:::
:::
```

### nested-011 — Bold: off · Italic: off · Underline: on · Strikethrough: off · Inline code: on · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. ++Underlined text.++ `inline code`
:::
:::
```

### nested-012 — Bold: off · Italic: off · Underline: on · Strikethrough: off · Inline code: on · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. ++Underlined text.++ `inline code` [Team page](/page)
:::
:::
```

### nested-013 — Bold: off · Italic: off · Underline: on · Strikethrough: on · Inline code: off · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. ++Underlined text.++ ~~Strikethrough text.~~
:::
:::
```

### nested-014 — Bold: off · Italic: off · Underline: on · Strikethrough: on · Inline code: off · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. ++Underlined text.++ ~~Strikethrough text.~~ [Team page](/page)
:::
:::
```

### nested-015 — Bold: off · Italic: off · Underline: on · Strikethrough: on · Inline code: on · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. ++Underlined text.++ ~~Strikethrough text.~~ `inline code`
:::
:::
```

### nested-016 — Bold: off · Italic: off · Underline: on · Strikethrough: on · Inline code: on · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. ++Underlined text.++ ~~Strikethrough text.~~ `inline code` [Team page](/page)
:::
:::
```

### nested-017 — Bold: off · Italic: on · Underline: off · Strikethrough: off · Inline code: off · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. *Italic text.*
:::
:::
```

### nested-018 — Bold: off · Italic: on · Underline: off · Strikethrough: off · Inline code: off · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. *Italic text.* [Team page](/page)
:::
:::
```

### nested-019 — Bold: off · Italic: on · Underline: off · Strikethrough: off · Inline code: on · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. *Italic text.* `inline code`
:::
:::
```

### nested-020 — Bold: off · Italic: on · Underline: off · Strikethrough: off · Inline code: on · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. *Italic text.* `inline code` [Team page](/page)
:::
:::
```

### nested-021 — Bold: off · Italic: on · Underline: off · Strikethrough: on · Inline code: off · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. *Italic text.* ~~Strikethrough text.~~
:::
:::
```

### nested-022 — Bold: off · Italic: on · Underline: off · Strikethrough: on · Inline code: off · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. *Italic text.* ~~Strikethrough text.~~ [Team page](/page)
:::
:::
```

### nested-023 — Bold: off · Italic: on · Underline: off · Strikethrough: on · Inline code: on · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. *Italic text.* ~~Strikethrough text.~~ `inline code`
:::
:::
```

### nested-024 — Bold: off · Italic: on · Underline: off · Strikethrough: on · Inline code: on · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. *Italic text.* ~~Strikethrough text.~~ `inline code` [Team page](/page)
:::
:::
```

### nested-025 — Bold: off · Italic: on · Underline: on · Strikethrough: off · Inline code: off · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. *Italic text.* ++Underlined text.++
:::
:::
```

### nested-026 — Bold: off · Italic: on · Underline: on · Strikethrough: off · Inline code: off · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. *Italic text.* ++Underlined text.++ [Team page](/page)
:::
:::
```

### nested-027 — Bold: off · Italic: on · Underline: on · Strikethrough: off · Inline code: on · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. *Italic text.* ++Underlined text.++ `inline code`
:::
:::
```

### nested-028 — Bold: off · Italic: on · Underline: on · Strikethrough: off · Inline code: on · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. *Italic text.* ++Underlined text.++ `inline code` [Team page](/page)
:::
:::
```

### nested-029 — Bold: off · Italic: on · Underline: on · Strikethrough: on · Inline code: off · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. *Italic text.* ++Underlined text.++ ~~Strikethrough text.~~
:::
:::
```

### nested-030 — Bold: off · Italic: on · Underline: on · Strikethrough: on · Inline code: off · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. *Italic text.* ++Underlined text.++ ~~Strikethrough text.~~ [Team page](/page)
:::
:::
```

### nested-031 — Bold: off · Italic: on · Underline: on · Strikethrough: on · Inline code: on · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. *Italic text.* ++Underlined text.++ ~~Strikethrough text.~~ `inline code`
:::
:::
```

### nested-032 — Bold: off · Italic: on · Underline: on · Strikethrough: on · Inline code: on · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. *Italic text.* ++Underlined text.++ ~~Strikethrough text.~~ `inline code` [Team page](/page)
:::
:::
```

### nested-033 — Bold: on · Italic: off · Underline: off · Strikethrough: off · Inline code: off · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.**
:::
:::
```

### nested-034 — Bold: on · Italic: off · Underline: off · Strikethrough: off · Inline code: off · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** [Team page](/page)
:::
:::
```

### nested-035 — Bold: on · Italic: off · Underline: off · Strikethrough: off · Inline code: on · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** `inline code`
:::
:::
```

### nested-036 — Bold: on · Italic: off · Underline: off · Strikethrough: off · Inline code: on · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** `inline code` [Team page](/page)
:::
:::
```

### nested-037 — Bold: on · Italic: off · Underline: off · Strikethrough: on · Inline code: off · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** ~~Strikethrough text.~~
:::
:::
```

### nested-038 — Bold: on · Italic: off · Underline: off · Strikethrough: on · Inline code: off · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** ~~Strikethrough text.~~ [Team page](/page)
:::
:::
```

### nested-039 — Bold: on · Italic: off · Underline: off · Strikethrough: on · Inline code: on · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** ~~Strikethrough text.~~ `inline code`
:::
:::
```

### nested-040 — Bold: on · Italic: off · Underline: off · Strikethrough: on · Inline code: on · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** ~~Strikethrough text.~~ `inline code` [Team page](/page)
:::
:::
```

### nested-041 — Bold: on · Italic: off · Underline: on · Strikethrough: off · Inline code: off · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** ++Underlined text.++
:::
:::
```

### nested-042 — Bold: on · Italic: off · Underline: on · Strikethrough: off · Inline code: off · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** ++Underlined text.++ [Team page](/page)
:::
:::
```

### nested-043 — Bold: on · Italic: off · Underline: on · Strikethrough: off · Inline code: on · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** ++Underlined text.++ `inline code`
:::
:::
```

### nested-044 — Bold: on · Italic: off · Underline: on · Strikethrough: off · Inline code: on · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** ++Underlined text.++ `inline code` [Team page](/page)
:::
:::
```

### nested-045 — Bold: on · Italic: off · Underline: on · Strikethrough: on · Inline code: off · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** ++Underlined text.++ ~~Strikethrough text.~~
:::
:::
```

### nested-046 — Bold: on · Italic: off · Underline: on · Strikethrough: on · Inline code: off · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** ++Underlined text.++ ~~Strikethrough text.~~ [Team page](/page)
:::
:::
```

### nested-047 — Bold: on · Italic: off · Underline: on · Strikethrough: on · Inline code: on · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** ++Underlined text.++ ~~Strikethrough text.~~ `inline code`
:::
:::
```

### nested-048 — Bold: on · Italic: off · Underline: on · Strikethrough: on · Inline code: on · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** ++Underlined text.++ ~~Strikethrough text.~~ `inline code` [Team page](/page)
:::
:::
```

### nested-049 — Bold: on · Italic: on · Underline: off · Strikethrough: off · Inline code: off · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** *Italic text.*
:::
:::
```

### nested-050 — Bold: on · Italic: on · Underline: off · Strikethrough: off · Inline code: off · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** *Italic text.* [Team page](/page)
:::
:::
```

### nested-051 — Bold: on · Italic: on · Underline: off · Strikethrough: off · Inline code: on · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** *Italic text.* `inline code`
:::
:::
```

### nested-052 — Bold: on · Italic: on · Underline: off · Strikethrough: off · Inline code: on · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** *Italic text.* `inline code` [Team page](/page)
:::
:::
```

### nested-053 — Bold: on · Italic: on · Underline: off · Strikethrough: on · Inline code: off · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** *Italic text.* ~~Strikethrough text.~~
:::
:::
```

### nested-054 — Bold: on · Italic: on · Underline: off · Strikethrough: on · Inline code: off · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** *Italic text.* ~~Strikethrough text.~~ [Team page](/page)
:::
:::
```

### nested-055 — Bold: on · Italic: on · Underline: off · Strikethrough: on · Inline code: on · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** *Italic text.* ~~Strikethrough text.~~ `inline code`
:::
:::
```

### nested-056 — Bold: on · Italic: on · Underline: off · Strikethrough: on · Inline code: on · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** *Italic text.* ~~Strikethrough text.~~ `inline code` [Team page](/page)
:::
:::
```

### nested-057 — Bold: on · Italic: on · Underline: on · Strikethrough: off · Inline code: off · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** *Italic text.* ++Underlined text.++
:::
:::
```

### nested-058 — Bold: on · Italic: on · Underline: on · Strikethrough: off · Inline code: off · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** *Italic text.* ++Underlined text.++ [Team page](/page)
:::
:::
```

### nested-059 — Bold: on · Italic: on · Underline: on · Strikethrough: off · Inline code: on · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** *Italic text.* ++Underlined text.++ `inline code`
:::
:::
```

### nested-060 — Bold: on · Italic: on · Underline: on · Strikethrough: off · Inline code: on · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** *Italic text.* ++Underlined text.++ `inline code` [Team page](/page)
:::
:::
```

### nested-061 — Bold: on · Italic: on · Underline: on · Strikethrough: on · Inline code: off · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** *Italic text.* ++Underlined text.++ ~~Strikethrough text.~~
:::
:::
```

### nested-062 — Bold: on · Italic: on · Underline: on · Strikethrough: on · Inline code: off · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** *Italic text.* ++Underlined text.++ ~~Strikethrough text.~~ [Team page](/page)
:::
:::
```

### nested-063 — Bold: on · Italic: on · Underline: on · Strikethrough: on · Inline code: on · Link: off

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** *Italic text.* ++Underlined text.++ ~~Strikethrough text.~~ `inline code`
:::
:::
```

### nested-064 — Bold: on · Italic: on · Underline: on · Strikethrough: on · Inline code: on · Link: on

```markdown
:::header

::header-title[Team portal]

:::header-content
Plain text. **Bold text.** *Italic text.* ++Underlined text.++ ~~Strikethrough text.~~ `inline code` [Team page](/page)
:::
:::
```

### nested-065 — Relative link

```markdown
:::header

::header-title[Team portal]

:::header-content
Visit the [team page](/page).
:::
:::
```

### nested-066 — Absolute link

```markdown
:::header

::header-title[Team portal]

:::header-content
Read the [public documentation](https://example.org/docs).
:::
:::
```

### nested-067 — Anchor link

```markdown
:::header

::header-title[Team portal]

:::header-content
Jump to the [contacts section](#contacts).
:::
:::
```

### nested-068 — Several links

```markdown
:::header

::header-title[Team portal]

:::header-content
Open the [team page](/page) or the [documentation](https://example.org/docs).
:::
:::
```

### nested-069 — Bold text inside a link

```markdown
:::header

::header-title[Team portal]

:::header-content
Read the [**team documentation**](/docs).
:::
:::
```

### nested-070 — Italic text inside a link

```markdown
:::header

::header-title[Team portal]

:::header-content
Open the [*team page*](/page).
:::
:::
```

### nested-071 — Link inside bold text

```markdown
:::header

::header-title[Team portal]

:::header-content
**Read the [team documentation](/docs) before publishing.**
:::
:::
```

### nested-072 — Link inside italic text

```markdown
:::header

::header-title[Team portal]

:::header-content
*See the [team page](/page) for details.*
:::
:::
```

### nested-073 — Link inside underlined text

```markdown
:::header

::header-title[Team portal]

:::header-content
++Open the [team page](/page).++
:::
:::
```

### nested-074 — Link inside strikethrough text

```markdown
:::header

::header-title[Team portal]

:::header-content
~~See the [old page](/old-page).~~
:::
:::
```

### nested-075 — Nested bold and italic

```markdown
:::header

::header-title[Team portal]

:::header-content
**Important: *read this first* and visit the [team page](/page).**
:::
:::
```

### nested-076 — Two paragraphs with links

```markdown
:::header

::header-title[Team portal]

:::header-content
Open the [team page](/page).

Read the [documentation](https://example.org/docs) and **contact the team**.
:::
:::
```

### nested-077 — Three paragraphs with mixed formatting

```markdown
:::header

::header-title[Team portal]

:::header-content
**Welcome to the team portal.**

Read the [documentation](/docs), check ++announcements++ and use `team-cli`.

*Need help?* Open the [support page](/support).
:::
:::
```

### nested-078 — Full banner with rich description

```markdown
:::header

::header-image{src="https://example.org/banner.jpg" alt="Team"}

::header-title[Team portal]

:::header-content
**Team resources:** [documentation](/docs), [contacts](/contacts) and ++announcements++.

Use `team-cli` for routine tasks. *Read the documentation first.*
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

## Combined examples

Composition, background, typography and buttons used together.

### mixed-001 — Image: off · Title: off · Description: off · Buttons: 0

```markdown
:::header{height="l" width="full" align="center" vertical="bottom" bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}
:::
```

### mixed-002 — Image: off · Title: off · Description: off · Buttons: 3

```markdown
:::header{height="l" width="full" align="center" vertical="bottom" bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### mixed-003 — Image: off · Title: off · Description: on · Buttons: 0

```markdown
:::header{height="l" width="full" align="center" vertical="bottom" bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

:::header-content{size="3"}
Portal description.
:::
:::
```

### mixed-004 — Image: off · Title: off · Description: on · Buttons: 3

```markdown
:::header{height="l" width="full" align="center" vertical="bottom" bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

:::header-content{size="3"}
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### mixed-005 — Image: off · Title: on · Description: off · Buttons: 0

```markdown
:::header{height="l" width="full" align="center" vertical="bottom" bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]{size="1" color="yellow"}
:::
```

### mixed-006 — Image: off · Title: on · Description: off · Buttons: 3

```markdown
:::header{height="l" width="full" align="center" vertical="bottom" bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]{size="1" color="yellow"}

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### mixed-007 — Image: off · Title: on · Description: on · Buttons: 0

```markdown
:::header{height="l" width="full" align="center" vertical="bottom" bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]{size="1" color="yellow"}

:::header-content{size="3"}
Portal description.
:::
:::
```

### mixed-008 — Image: off · Title: on · Description: on · Buttons: 3

```markdown
:::header{height="l" width="full" align="center" vertical="bottom" bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]{size="1" color="yellow"}

:::header-content{size="3"}
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### mixed-009 — Image: on · Title: off · Description: off · Buttons: 0

```markdown
:::header{height="l" width="full" align="right" vertical="bottom" bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-image{src="https://example.org/banner.jpg" alt="Team"}
:::
```

### mixed-010 — Image: on · Title: off · Description: off · Buttons: 3

```markdown
:::header{height="l" width="full" align="right" vertical="bottom" bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-image{src="https://example.org/banner.jpg" alt="Team"}

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### mixed-011 — Image: on · Title: off · Description: on · Buttons: 0

```markdown
:::header{height="l" width="full" align="right" vertical="bottom" bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-image{src="https://example.org/banner.jpg" alt="Team"}

:::header-content{size="3"}
Portal description.
:::
:::
```

### mixed-012 — Image: on · Title: off · Description: on · Buttons: 3

```markdown
:::header{height="l" width="full" align="right" vertical="bottom" bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-image{src="https://example.org/banner.jpg" alt="Team"}

:::header-content{size="3"}
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### mixed-013 — Image: on · Title: on · Description: off · Buttons: 0

```markdown
:::header{height="l" width="full" align="right" vertical="bottom" bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-image{src="https://example.org/banner.jpg" alt="Team"}

::header-title[Team portal]{size="1" color="yellow"}
:::
```

### mixed-014 — Image: on · Title: on · Description: off · Buttons: 3

```markdown
:::header{height="l" width="full" align="right" vertical="bottom" bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-image{src="https://example.org/banner.jpg" alt="Team"}

::header-title[Team portal]{size="1" color="yellow"}

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

### mixed-015 — Image: on · Title: on · Description: on · Buttons: 0

```markdown
:::header{height="l" width="full" align="right" vertical="bottom" bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-image{src="https://example.org/banner.jpg" alt="Team"}

::header-title[Team portal]{size="1" color="yellow"}

:::header-content{size="3"}
Portal description.
:::
:::
```

### mixed-016 — Image: on · Title: on · Description: on · Buttons: 3

```markdown
:::header{height="l" width="full" align="right" vertical="bottom" bg-color="violet-light" bg-image="https://example.org/banner.jpg" bg-image-theme="dark" bg-image-blur="true"}

::header-image{src="https://example.org/banner.jpg" alt="Team"}

::header-title[Team portal]{size="1" color="yellow"}

:::header-content{size="3"}
Portal description.
:::

:button[Button 1]{href="/page" view="action" color="blue"}

:button[Button 2]{href="/page" view="normal" color="gray"}

:button[Button 3]{href="/page" view="flat" color="standard"}
:::
```

## Unsupported input and normalization

These are rejection and normalization cases, not additional allowed syntax.

### boundaries-001 — Button outside header: not rendered

```markdown
:button[Learn more]{href="/page" view="action" color="blue"}
```

### boundaries-002 — Title outside header: not rendered

```markdown
::header-title[Heading]
```

### boundaries-003 — Description outside header: not rendered

```markdown
:::header-content
Description.
:::
```

### boundaries-004 — Image outside header: not rendered

```markdown
::header-image{src="https://example.org/banner.jpg"}
```

### boundaries-005 — Fourth button: ignored

```markdown
:::header

:button[Button 1]{view="action" color="blue"}

:button[Button 2]{view="action" color="blue"}

:button[Button 3]{view="action" color="blue"}

:button[Button 4]{view="action" color="blue"}
:::
```

### boundaries-006 — Second title: ignored

```markdown
:::header

::header-title[First]

::header-title[Second]
:::
```

### boundaries-007 — Unknown attribute: skipped

```markdown
:::header{unknown="value"}

::header-title[Team portal]
:::
```

### boundaries-008 — Invalid height: default value

```markdown
:::header{height="huge"}

::header-title[Team portal]
:::
```

### boundaries-009 — Invalid action/gray pair: standard color

```markdown
:::header

:button[Learn more]{view="action" color="gray"}
:::
```

### boundaries-010 — Invalid normal/standard pair: gray color

```markdown
:::header

:button[Learn more]{view="normal" color="standard"}
:::
```

### boundaries-011 — Empty button label: not rendered

```markdown
:::header

:button[]{href="/page" view="action" color="blue"}
:::
```

### boundaries-012 — javascript URL: rejected

```markdown
:::header

:button[Learn more]{href="javascript:alert(1)" view="action" color="blue"}
:::
```

### boundaries-013 — data URL: rejected

```markdown
:::header

:button[Learn more]{href="data:text/plain,test" view="action" color="blue"}
:::
```

### boundaries-014 — Theme and blur without a background image: reset to defaults

```markdown
:::header{bg-image-theme="dark" bg-image-blur="true"}

::header-title[Team portal]
:::
```


