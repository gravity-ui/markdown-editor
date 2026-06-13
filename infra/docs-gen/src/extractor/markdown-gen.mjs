/**
 * English: Renders raw extension metadata records into markdown files.
 *
 * Русский: Рендерит сырые metadata records расширений в markdown-файлы.
 */
import {getPresetsForExtension} from './presets.mjs';

/**
 * Formats a value as inline Markdown code.
 */
function code(value) {
    return `\`${String(value).replace(/\|/g, '\\|').replace(/\n/g, '\\n')}\``;
}

/**
 * Adds a Markdown list section when values are present.
 */
function addList(lines, title, values) {
    if (values.length === 0) return;

    lines.push(`## ${title}`, '');
    for (const value of values) {
        lines.push(`- ${code(value)}`);
    }
    lines.push('');
}

/**
 * Generates a raw Markdown page for extracted extension data.
 */
export function generateRawMd(extension, presetMap, version) {
    const presets = getPresetsForExtension(presetMap, extension.name);
    const lines = [
        '---',
        `extension: ${extension.name}`,
        `version: ${version}`,
        `category: ${extension.category}`,
        `source: ${extension.sourcePath}`,
        '---',
        '',
        `# ${extension.name}`,
        '',
        '## Source',
        '',
        `- ${code(extension.sourcePath)}`,
        '',
        '## Presets',
        '',
    ];

    if (presets.length > 0) {
        for (const preset of presets) lines.push(`- ${preset}`);
    } else {
        lines.push('Not included in standard presets.');
    }
    lines.push('');

    if (extension.nodes.length > 0 || extension.marks.length > 0) {
        lines.push('## Schema', '');
        for (const node of extension.nodes) {
            lines.push(`- Node: ${code(node)}`);
        }
        for (const mark of extension.marks) {
            lines.push(`- Mark: ${code(mark)}`);
        }
        lines.push('');
    }

    addList(lines, 'Actions', extension.actions);
    addList(lines, 'Keymaps', extension.keymaps);
    addList(lines, 'Input Rules', extension.inputRules);
    addList(lines, 'Markdown-It Plugins', extension.mdPlugins);
    addList(lines, 'ProseMirror Plugins', extension.plugins);
    addList(lines, 'Serializer Hints', extension.serializerHints);

    if (extension.options.length > 0) {
        lines.push('## Options', '', '| Option | Type |', '|--------|------|');
        for (const option of extension.options) {
            lines.push(`| ${code(option.name)} | ${code(option.type)} |`);
        }
        lines.push('');
    }

    if (extension.markupExamples.length > 0) {
        lines.push('## Markup Examples', '');
        for (const example of extension.markupExamples.slice(0, 10)) {
            lines.push('```markdown', example, '```', '');
        }
    }

    return lines.join('\n');
}
