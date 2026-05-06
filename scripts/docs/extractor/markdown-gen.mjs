import {getPresetsForExtension} from './presets.mjs';

/**
 * Generates a raw markdown doc page for a single extension.
 */
export function generateRawMd(ext, presetMap, version) {
    const presets = getPresetsForExtension(presetMap, ext.name);
    const lines = [];

    // Frontmatter
    lines.push('---');
    lines.push(`extension: ${ext.name}`);
    lines.push(`version: ${version}`);
    lines.push(`category: ${ext.category}`);
    lines.push('---');
    lines.push('');
    lines.push(`# ${ext.name}`);
    lines.push('');
    lines.push('<!-- AI:NEEDED:description -->');
    lines.push('');

    // Presets
    lines.push('## Presets');
    lines.push('');
    if (presets.length > 0) {
        for (const p of presets) lines.push(`- ${p}`);
    } else {
        lines.push('Not included in any standard preset (use directly).');
    }
    lines.push('');

    // Schema
    if (ext.nodes.length > 0 || ext.marks.length > 0) {
        lines.push('## Schema');
        lines.push('');
        for (const n of ext.nodes) {
            lines.push(`### Node: \`${n}\``);
            lines.push('');
        }
        for (const m of ext.marks) {
            lines.push(`### Mark: \`${m}\``);
            lines.push('');
        }
    }

    // Actions
    if (ext.actions.length > 0) {
        lines.push('## Actions');
        lines.push('');
        lines.push('| Action ID |');
        lines.push('|-----------|');
        for (const a of ext.actions) {
            lines.push(`| \`${a}\` |`);
        }
        lines.push('');
    }

    // Keymaps
    if (ext.keymaps.length > 0) {
        lines.push('## Keymaps');
        lines.push('');
        lines.push('| Key |');
        lines.push('|-----|');
        for (const k of ext.keymaps) {
            lines.push(`| \`${k}\` |`);
        }
        lines.push('');
    }

    // Input Rules
    if (ext.inputRules.length > 0) {
        lines.push('## Input Rules');
        lines.push('');
        lines.push('| Pattern |');
        lines.push('|---------|');
        for (const r of ext.inputRules) {
            lines.push(`| \`${r}\` |`);
        }
        lines.push('');
    }

    // Markdown Parsing
    lines.push('## Markdown Parsing');
    lines.push('');
    if (ext.mdPlugins.length > 0) {
        lines.push('Uses markdown-it plugins:');
        lines.push('');
        for (const p of ext.mdPlugins) lines.push(`- \`${p}\``);
    } else if (ext.nodes.length > 0 || ext.marks.length > 0) {
        lines.push('Uses built-in markdown-it tokens (CommonMark).');
    } else {
        lines.push('No markdown parsing.');
    }
    lines.push('');

    // Markdown Serialization
    lines.push('## Markdown Serialization');
    lines.push('');
    if (ext.serializerHints.length > 0) {
        lines.push('Serializer patterns:');
        lines.push('');
        for (const s of ext.serializerHints) {
            const escaped = s.replace(/\|/g, '\\|');
            lines.push(`- \`${escaped}\``);
        }
    } else {
        lines.push('<!-- AI:NEEDED:serialization -->');
    }
    lines.push('');

    // Plugins
    if (ext.plugins.length > 0) {
        lines.push('## Plugins');
        lines.push('');
        for (const p of ext.plugins) lines.push(`- \`${p}\``);
        lines.push('');
    }

    // Options
    if (ext.options.length > 0) {
        lines.push('## Options');
        lines.push('');
        lines.push('| Option | Type |');
        lines.push('|--------|------|');
        for (const o of ext.options) {
            lines.push(`| \`${o.name}\` | \`${o.type}\` |`);
        }
        lines.push('');
    }

    // Examples from tests
    if (ext.markupExamples.length > 0) {
        lines.push('## Markup Examples');
        lines.push('');
        lines.push('Extracted from tests:');
        lines.push('');
        for (const ex of ext.markupExamples.slice(0, 10)) {
            lines.push('```markdown');
            lines.push(ex);
            lines.push('```');
            lines.push('');
        }
    }

    // AI placeholder sections
    lines.push('## Syntax Guide');
    lines.push('');
    lines.push('<!-- AI:NEEDED:syntaxGuide -->');
    lines.push('');
    lines.push('## Use Cases');
    lines.push('');
    lines.push('<!-- AI:NEEDED:useCases -->');
    lines.push('');

    return lines.join('\n');
}
