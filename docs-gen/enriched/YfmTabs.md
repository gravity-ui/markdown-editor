---
extension: YfmTabs
version: 15.40.0
category: yfm
---

# YfmTabs

This YFM extension adds nodes such as `yfm_radio_tabs`, `yfm_tab`, `yfm_tabs_list`, `yfm_tab_panel`, 1 editor action, 1 ProseMirror plugin to the editor pipeline. It is included in `YfmPreset`, `FullPreset`.

## Presets

- YfmPreset
- FullPreset

## Schema

### Node: `yfm_radio_tabs`

### Node: `yfm_tab`

### Node: `yfm_tabs_list`

### Node: `yfm_tab_panel`

### Node: `yfm_tabs`

### Node: `yfm_radio_tab`

### Node: `yfm_radio_tab_input`

### Node: `yfm_radio_tab_label`

## Actions

| Action ID |
|-----------|
| `toYfmTabs` |

## Keymaps

| Key |
|-----|
| `Backspace` |
| `ArrowDown` |
| `Enter` |
| `Shift-Enter` |

## Markdown Parsing

Uses built-in markdown-it tokens (CommonMark).

## Markdown Serialization

Serializer patterns:

- `{% list tabs %}`
- `\n`
- `\n`
- `- `
- `\n`
- `\n`
- `{% endlist %}`
- `{% list tabs radio %}`
- `\n`
- `\n`
- `- `
- `\n`
- `\n`
- `{% endlist %}`

## Plugins

- `dragAutoSwitch`

## Options

| Option | Type |
|--------|------|
| `tabView` | `ExtensionNodeSpec['view']` |
| `tabsListView` | `ExtensionNodeSpec['view']` |
| `tabPanelView` | `ExtensionNodeSpec['view']` |
| `tabsView` | `ExtensionNodeSpec['view']` |
| `vtabView` | `ExtensionNodeSpec['view']` |
| `vtabInputView` | `ExtensionNodeSpec['view']` |

## Syntax Guide

The exact syntax is inferred from serializer hints:

- `{% list tabs %}` appears in the serializer implementation and documents the expected markup shape.
- `\n` appears in the serializer implementation and documents the expected markup shape.
- `\n` appears in the serializer implementation and documents the expected markup shape.
- `- ` appears in the serializer implementation and documents the expected markup shape.

## Use Cases

- Enable it when your editor setup needs nodes `yfm_radio_tabs`, `yfm_tab`, `yfm_tabs_list`, `yfm_tab_panel`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Keep it aligned with `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
- Include it when your editor flow depends on the 1 ProseMirror plugin wired by this extension.
