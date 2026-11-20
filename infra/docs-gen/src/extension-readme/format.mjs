export const FRONTMATTER_FIELDS = ['generated', 'editor', 'commit', 'date', 'source-hash'];

const FRONTMATTER_VALUES = {
    generated: [/^(ai|edited)$/, '`ai` or `edited`'],
    editor: [/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/, 'a semver version'],
    commit: [/^[0-9a-f]{40}$/, '40 lowercase hex characters'],
    date: [/^\d{4}-\d{2}-\d{2}$/, 'a `YYYY-MM-DD` date'],
    'source-hash': [/^[0-9a-f]{64}$/, '64 lowercase hex characters'],
};

const MAX_TASKS = 3;
const MAX_SENTENCES = 3;
const FENCE_RE = /^(`{3,}|~{3,})(.*)$/;
const HEADING_RE = /^(#{1,6})\s+(.*?)\s*$/;

/** Checks that a line closes a code block opened with `fence`. */
function closesFence(line, fence) {
    const match = line.match(FENCE_RE);
    return Boolean(
        match && match[1][0] === fence[0] && match[1].length >= fence.length && !match[2].trim(),
    );
}

/** Checks that a string is a real calendar date in the `YYYY-MM-DD` form. */
function isCalendarDate(value) {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Reads the frontmatter lines; returns the field values and the index of the first line after it. */
function readFrontmatter(lines, report) {
    if (lines[0] !== '---') {
        report(1, 'The README must start with a `---` frontmatter line.');
        return {frontmatter: {}, next: 0};
    }

    const end = lines.indexOf('---', 1);
    if (end === -1) {
        report(1, 'The frontmatter has no closing `---` line.');
        return {frontmatter: {}, next: lines.length};
    }

    const frontmatter = {};
    const fieldLines = lines.slice(1, end);
    fieldLines.forEach((line, i) => {
        const lineNumber = i + 2;
        const match = line.match(/^([a-z-]+): (.+)$/);
        const expected = FRONTMATTER_FIELDS[i];
        if (!match) {
            report(lineNumber, `Expected a \`key: value\` line, found "${line}".`);
            return;
        }
        const [, key, value] = match;
        if (key !== expected) {
            report(
                lineNumber,
                expected
                    ? `Expected the \`${expected}\` field, found \`${key}\`.`
                    : `Unexpected field \`${key}\`.`,
            );
            return;
        }
        const [pattern, description] = FRONTMATTER_VALUES[key];
        if (!pattern.test(value) || (key === 'date' && !isCalendarDate(value))) {
            report(lineNumber, `\`${key}\` must be ${description}, found "${value}".`);
            return;
        }
        frontmatter[key] = value;
    });

    for (const field of FRONTMATTER_FIELDS.slice(fieldLines.length)) {
        report(end + 1, `The frontmatter has no \`${field}\` field.`);
    }

    return {frontmatter, next: end + 1};
}

/** Splits the body into sections by headings; headings inside code blocks are skipped. */
function readSections(lines, start, report) {
    const sections = [];
    const preamble = [];
    let fence = null;
    let fenceLine = 0;

    for (let i = start; i < lines.length; i++) {
        const line = lines[i];
        const item = {line, number: i + 1};
        const fenceMatch = line.match(FENCE_RE);
        if (fence) {
            if (closesFence(line, fence)) fence = null;
        } else if (fenceMatch) {
            fence = fenceMatch[1];
            fenceLine = i + 1;
        } else {
            const heading = line.match(HEADING_RE);
            if (heading) {
                sections.push({
                    level: heading[1].length,
                    title: heading[2],
                    number: i + 1,
                    lines: [],
                });
                continue;
            }
        }
        (sections.at(-1)?.lines ?? preamble).push(item);
    }

    if (fence) report(fenceLine, `The code block opened with \`${fence}\` is not closed.`);
    for (const {line, number} of preamble) {
        if (line.trim()) report(number, 'Text before `## Description` is not allowed.');
    }

    return sections;
}

/** Counts sentences; inline code does not end a sentence. */
function countSentences(text) {
    return text
        .replace(/`[^`]*`/g, 'code')
        .split(/(?<=[.!?])\s+/)
        .filter((sentence) => sentence.trim()).length;
}

/** Checks the description section and returns its text. */
function readDescription(section, report) {
    const content = section.lines.filter(({line}) => line.trim());
    if (!content.length) {
        report(section.number, '`## Description` has no text.');
        return '';
    }

    let valid = true;
    for (const {line, number} of content) {
        if (/^\s*([-*+>|]|\d+[.)]|`{3}|~{3})/.test(line)) {
            report(number, '`## Description` must contain plain sentences only.');
            valid = false;
        }
    }
    const lastLine = content.at(-1).number;
    const between = section.lines.filter(
        ({line, number}) => !line.trim() && number > content[0].number && number < lastLine,
    );
    if (between.length) {
        report(between[0].number, '`## Description` must be one paragraph.');
        valid = false;
    }

    const text = content.map(({line}) => line.trim()).join(' ');
    if (!valid) return text;

    const sentences = countSentences(text);
    if (sentences > MAX_SENTENCES) {
        report(
            section.number,
            `\`## Description\` must have one to ${MAX_SENTENCES} sentences, found ${sentences}.`,
        );
    }
    if (!/[.!?]$/.test(text)) {
        report(lastLine, '`## Description` must end with a full sentence.');
    }

    return text;
}

/** Checks that an example section holds one `ts` code block and returns its code. */
function readExample(section, report) {
    const content = section.lines.filter(({line}) => line.trim());
    const open = content[0];
    const openMatch = open?.line.match(FENCE_RE);
    if (!openMatch || openMatch[2].trim() !== 'ts') {
        report(
            open?.number ?? section.number,
            `\`### ${section.title}\` must start with a \`ts\` code block.`,
        );
        return null;
    }

    const fence = openMatch[1];
    const closeIndex = content.findIndex(({line}, i) => i > 0 && closesFence(line, fence));
    if (closeIndex === -1) return null;

    for (const {number} of content.slice(closeIndex + 1)) {
        report(
            number,
            `\`### ${section.title}\` must contain one \`ts\` code block and nothing else.`,
        );
    }

    const from = section.lines.indexOf(open) + 1;
    const to = section.lines.indexOf(content[closeIndex]);
    const code = section.lines
        .slice(from, to)
        .map(({line}) => line)
        .join('\n');
    if (!code.trim()) report(open.number, `The code block of \`### ${section.title}\` is empty.`);

    return code;
}

/** Checks the heading order and reads the description and examples. */
function readBody(sections, report) {
    const result = {description: '', examples: []};
    const expected = [
        [2, 'Description'],
        [2, 'Examples'],
        [3, 'Connect'],
    ];

    expected.forEach(([level, title], i) => {
        const section = sections[i];
        if (section?.level !== level || section.title !== title) {
            report(
                section?.number ?? sections.at(-1)?.number ?? 1,
                section
                    ? `Expected \`${'#'.repeat(level)} ${title}\`, found \`${'#'.repeat(section.level)} ${section.title}\`.`
                    : `The README has no \`${'#'.repeat(level)} ${title}\` heading.`,
            );
        }
    });

    const [description, examples, ...exampleSections] = sections;
    if (description?.title === 'Description') {
        result.description = readDescription(description, report);
    }
    if (examples?.title === 'Examples') {
        for (const {line, number} of examples.lines) {
            if (line.trim())
                report(number, 'Text between `## Examples` and `### Connect` is not allowed.');
        }
    }

    exampleSections.forEach((section, i) => {
        if (i > 0 && section.level !== 3) {
            report(
                section.number,
                `Only \`###\` headings may follow \`### Connect\`, found \`${'#'.repeat(section.level)} ${section.title}\`.`,
            );
            return;
        }
        if (i > MAX_TASKS) {
            report(section.number, `The README may have at most ${MAX_TASKS} task examples.`);
        }
        const code = readExample(section, report);
        if (code !== null) result.examples.push({title: section.title, code});
    });

    return result;
}

/**
 * Parses an extension README.
 * Throws an error that lists every format violation with its line number.
 */
export function parseExtensionReadme(text) {
    const errors = [];
    const report = (line, message) => errors.push({line, message});
    const lines = text.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');

    const {frontmatter, next} = readFrontmatter(lines, report);
    const sections = readSections(lines, next, report);
    const {description, examples} = readBody(sections, report);

    if (errors.length) {
        errors.sort((a, b) => a.line - b.line);
        const error = new Error(
            [
                'Invalid extension README:',
                ...errors.map(({line, message}) => `  line ${line}: ${message}`),
            ].join('\n'),
        );
        error.violations = errors;
        throw error;
    }

    return {frontmatter, description, examples};
}
