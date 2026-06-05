---
extension: YfmConfigs
version: 15.40.0
category: yfm
---

# YfmConfigs

This YFM extension adds nodes such as `__yfm_lint` to the editor pipeline. It is included in `YfmPreset`, `FullPreset`.

## Presets

- YfmPreset
- FullPreset

## Schema

### Node: `__yfm_lint`

## Markdown Parsing

Uses built-in markdown-it tokens (CommonMark).

## Markdown Serialization

This extension does not produce markdown output.

## Options

| Option | Type |
|--------|------|
| `mods` | `YfmMods` |
| `mix` | `string` |

## Syntax Guide

This extension does not define custom markdown syntax.

## Use Cases

- Enable it when your editor setup needs nodes `__yfm_lint`.
- Keep it aligned with `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
