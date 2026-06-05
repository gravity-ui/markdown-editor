---
extension: YfmNote
version: 15.40.0
category: yfm
---

# YfmNote

This YFM extension adds nodes such as `yfm_note`, `yfm_note_title`, `yfm_note_content`, 1 editor action, 1 ProseMirror plugin to the editor pipeline. It is included in `YfmPreset`, `FullPreset`.

## Presets

- YfmPreset
- FullPreset

## Schema

### Node: `yfm_note`

### Node: `yfm_note_title`

### Node: `yfm_note_content`

## Actions

| Action ID |
|-----------|
| `toYfmNote` |

## Keymaps

| Key |
|-----|
| `Enter` |
| `Backspace` |

## Input Rules

| Pattern |
|---------|
| `/(?:^)({% note)\s$/` |

## Markdown Parsing

Uses markdown-it plugins:

- `yfmPlugin`

## Markdown Serialization

Serializer patterns:

- `{% endnote %}`
- `{% note ${parent.attrs[NoteAttrs.Type]} `
- ` %}\n`
- `\n`

## Plugins

- `yfmNoteTooltipPlugin`

## Options

| Option | Type |
|--------|------|
| `yfmNoteKey` | `string | null` |

## Syntax Guide

This extension reacts to these editor input patterns:

- `/(?:^)({% note)\s$/` is registered as an input rule for this extension.

## Use Cases

- Enable it when your editor setup needs nodes `yfm_note`, `yfm_note_title`, `yfm_note_content`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Keep it aligned with `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
- Include it when your editor flow depends on the 1 ProseMirror plugin wired by this extension.
