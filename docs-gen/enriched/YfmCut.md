---
extension: YfmCut
version: 15.40.0
category: yfm
---

# YfmCut

This YFM extension adds nodes such as `yfm_cut`, `yfm_cut_title`, `yfm_cut_content`, 1 editor action, 2 ProseMirror plugins to the editor pipeline. It is included in `YfmPreset`, `FullPreset`.

## Presets

- YfmPreset
- FullPreset

## Schema

### Node: `yfm_cut`

### Node: `yfm_cut_title`

### Node: `yfm_cut_content`

## Actions

| Action ID |
|-----------|
| `toYfmCut` |

## Keymaps

| Key |
|-----|
| `Backspace` |
| `Enter` |

## Input Rules

| Pattern |
|---------|
| `/(?:^)({% cut)\s$/` |

## Markdown Parsing

Uses markdown-it plugins:

- `yfmCut`

## Markdown Serialization

Serializer patterns:

- `:::cut [`
- `]`
- `{% cut `
- `\n`

## Plugins

- `cutActivePlugin`
- `cutAutoOpenPlugin`

## Options

| Option | Type |
|--------|------|
| `yfmCutKey` | `string | null` |

## Syntax Guide

This extension reacts to these editor input patterns:

- `/(?:^)({% cut)\s$/` is registered as an input rule for this extension.

## Use Cases

- Enable it when your editor setup needs nodes `yfm_cut`, `yfm_cut_title`, `yfm_cut_content`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Keep it aligned with `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
- Include it when your editor flow depends on the 2 ProseMirror plugins wired by this extension.
