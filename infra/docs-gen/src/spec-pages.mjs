import {slugify} from './slugify.mjs';

/** The category of documentation pages that hold specifications. */
export const SPEC_CATEGORY = 'Spec';

const FENCE_RE = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const HEADING_RE = /^(#{2,3}) +(.+?)(?: +\{#([^\s}]+)\})?\s*$/;
const EXAMPLE_INFO = 'example';
const SEPARATOR = '.';

// Backticks and pipes split a YFM table, braces start a Liquid tag.
const CODE_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '`': '&#96;',
    '|': '&#124;',
    '{': '&#123;',
    '}': '&#125;',
};

/** Renders lines as an HTML code block that a YFM table cell keeps as is. */
function codeBlock(lines) {
    const code = lines.join('\n').replace(/[&<>`|{}]/g, (char) => CODE_ENTITIES[char]);

    return `<pre><code>${code}</code></pre>`;
}

/** Renders an `example` block as a numbered example: Markdown on the left, HTML on the right. */
function renderExample(body, number) {
    const separator = body.indexOf(SEPARATOR);
    if (separator === -1) {
        throw new Error(`Example ${number} has no "${SEPARATOR}" line between Markdown and HTML`);
    }
    const id = `example-${number}`;

    return [
        `{% anchor ${id} %}`,
        '',
        `[Example ${number}](#${id})`,
        '',
        '#|',
        '||',
        '',
        codeBlock(body.slice(0, separator)),
        '',
        '|',
        '',
        codeBlock(body.slice(separator + 1)),
        '',
        '||',
        '|#',
    ];
}

/** Finds the line that closes a fenced block; an unclosed block runs to the end of the page. */
function closingLine(lines, from, marker) {
    const closing = new RegExp(`^ {0,3}${marker[0]}{${marker.length},}\\s*$`);
    for (let index = from; index < lines.length; index++) {
        if (closing.test(lines[index])) return index;
    }

    return lines.length;
}

/** Numbers chapters as `2` and their sections as `2.1`. */
function createSectionNumbers() {
    let chapter = 0;
    let section = 0;

    return (marks) => {
        if (marks === '##') {
            chapter++;
            section = 0;

            return `${chapter}`;
        }
        section++;

        return `${chapter}.${section}`;
    };
}

/**
 * Numbers the `##` and `###` headings of a specification page, gives each an anchor
 * from its text unless it has `{#anchor}`, and renders `example` blocks as numbered examples.
 */
export function renderSpecPage(content) {
    const lines = content.split('\n');
    const out = [];
    const anchors = new Set();
    const sectionNumber = createSectionNumbers();
    let examples = 0;

    const addAnchor = (anchor) => {
        if (anchors.has(anchor)) throw new Error(`Duplicate anchor "#${anchor}"`);
        anchors.add(anchor);
    };

    for (let index = 0; index < lines.length; index++) {
        const fence = lines[index].match(FENCE_RE);
        if (fence && !(fence[1][0] === '`' && fence[2].includes('`'))) {
            const end = closingLine(lines, index + 1, fence[1]);
            if (fence[2].trim() === EXAMPLE_INFO) {
                examples++;
                if (end === lines.length) throw new Error(`Example ${examples} is not closed`);
                addAnchor(`example-${examples}`);
                out.push(...renderExample(lines.slice(index + 1, end), examples));
            } else {
                out.push(...lines.slice(index, end + 1));
            }
            index = end;
            continue;
        }

        const heading = lines[index].match(HEADING_RE);
        if (!heading) {
            out.push(lines[index]);
            continue;
        }
        const [, marks, text, customAnchor] = heading;
        const anchor = customAnchor ?? slugify(text);
        addAnchor(anchor);
        out.push(`${marks} ${sectionNumber(marks)} ${text} {#${anchor}}`);
    }

    return out.join('\n');
}
