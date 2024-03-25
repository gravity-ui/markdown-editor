import type CodeMirror from 'codemirror';

export const wrapToBold = wrapTo('**');
export const wrapToItalic = wrapTo('*');
export const wrapToStrike = wrapTo('~~');
export const wrapToUnderline = wrapTo('++');
export const wrapToMonospace = wrapTo('##');
export const wrapToMark = wrapTo('==');

export const toH1 = toHeading(1);
export const toH2 = toHeading(2);
export const toH3 = toHeading(3);
export const toH4 = toHeading(4);
export const toH5 = toHeading(5);
export const toH6 = toHeading(6);

export const colorify = (cm: CodeMirror.Editor, color: string) => wrapTo(`{${color}}(`, ')')(cm);

type WrapPerLineOptions = {
    beforeText: string;
    afterText?: string; // or false
    wrapEmptyLine?: boolean; // default false
};

const wrapPerLine =
    ({beforeText, afterText = beforeText, wrapEmptyLine = false}: WrapPerLineOptions) =>
    (cm: CodeMirror.Editor) => {
        const from = cm.getCursor('from');
        const to = cm.getCursor('to');

        const lines: string[] = [];

        for (let line = from.line; line <= to.line; line++) {
            lines.push(cm.getLine(line));
        }

        lines.forEach((l, i) => {
            const currLine = from.line + i;
            const shouldAppend =
                l.length || (wrapEmptyLine && !l.length) || (l.length === 0 && lines.length === 1);

            cm.replaceRange(
                shouldAppend ? beforeText + l + afterText : l,
                {line: currLine, ch: 0},
                {line: currLine, ch: Number.MAX_SAFE_INTEGER},
            );
        });

        cm.setSelection({line: to.line, ch: Number.MAX_SAFE_INTEGER});
    };

const needEmptyLines = (cm: CodeMirror.Editor) => {
    const start = cm.getCursor('from');
    const end = cm.getCursor('to');

    const emptyLineBefore = cm.getLine(end.line - 1)?.length || start.ch !== 0 ? '\n\n' : '';
    const emptyLineAfter =
        cm.getLine(end.line + 1)?.length || end.ch !== cm.getLine(end.line).length ? '\n\n' : '';

    return {emptyLineBefore, emptyLineAfter};
};

const wrapToBlock =
    (openToken: string, closeToken: string = openToken) =>
    (cm: CodeMirror.Editor) => {
        const text = cm.getSelection();
        const start = cm.getCursor('from');
        const {emptyLineBefore, emptyLineAfter} = needEmptyLines(cm);

        cm.replaceSelection(emptyLineBefore + openToken + text + closeToken + emptyLineAfter);
        cm.setSelection({
            line: start.line + (emptyLineBefore + openToken + text).split('\n').length - 1,
            ch: Number.MAX_SAFE_INTEGER,
        });
    };

export const toCheckbox = wrapPerLine({beforeText: '[ ] ', afterText: ''});

export const toQuote = wrapPerLine({beforeText: '> ', afterText: '', wrapEmptyLine: true});

export const toBulletList = wrapPerLine({beforeText: '* ', afterText: ''});
export const toOrderedList = wrapPerLine({beforeText: '1. ', afterText: ''});

export const toInlineCode = wrapTo('`');
export const toCodeBlock = wrapToBlock('```\n', '\n```');

export const wrapToMathInline = wrapTo('$');
export const wrapToMathBlock = wrapToBlock('$$\n', '\n$$');

export const sinkListItem = wrapPerLine({beforeText: '  ', afterText: ''});
export const liftListItem = (cm: CodeMirror.Editor) => {
    const from = cm.getCursor('from');
    const to = cm.getCursor('to');

    const lines: string[] = [];

    for (let line = from.line; line <= to.line; line++) {
        lines.push(cm.getLine(line));
    }

    lines.forEach((l, i) => {
        const currLine = from.line + i;

        cm.replaceRange(
            l.replace(/ {2}/, ''),
            {line: currLine, ch: 0},
            {line: currLine, ch: Number.MAX_SAFE_INTEGER},
        );
    });
};

export const wrapToCut = wrapToBlock('{% cut "title" %}\n\n', '\n\n{% endcut %}');

export const wrapToNote = wrapToBlock('{% note info %}\n\n', '\n\n{% endnote %}');

export const wrapToYfmBlock = wrapToBlock('{% block %}\n\n', '\n\n{% endblock %}');

export const wrapToYfmLayout = wrapToBlock(
    '{% layout gap=l %}\n\n{% block %}\n\n',
    '\n\n{% endblock %}\n\n{% endlayout %}',
);

export const insertTable = (cm: CodeMirror.Editor) => {
    const tableTokens = ['#|', '||', '', '|', '', '||', '||', '', '|', '', '||', '|#', ''].join(
        '\n\n',
    );

    const {emptyLineBefore, emptyLineAfter} = needEmptyLines(cm);

    cm.replaceSelection(emptyLineBefore + tableTokens + emptyLineAfter);
};

export const insertLink =
    ({url, text, title}: {url: string; text?: string; title?: string}) =>
    (cm: CodeMirror.Editor) => {
        if (cm.getSelection()) {
            // ignore text if editor has selection
            wrapTo('[', `](${url}${title ? ` "${title}"` : ''})`)(cm);
            return;
        }

        const markup = `[${text ?? ''}](${url}${title ? ` "${title}"` : ''})`;
        cm.replaceSelection(markup);
    };

export const insertAnchor =
    ({href: href, text, title}: {href?: string; text?: string; title?: string} = {}) =>
    (cm: CodeMirror.Editor) => {
        if (cm.getSelection()) {
            // ignore text if editor has selection
            wrapTo('#[', `](${href ?? ''}${title ? ` "${title}"` : ''})`)(cm);
            return;
        }

        const markup = `#[${text ?? ''}](${href ?? ''}${title ? ` "${title}"` : ''})`;
        cm.replaceSelection(markup);
    };

export type ImageItem = {
    url?: string;
    title?: string;
    alt?: string;
    width?: string;
    height?: string;
};
export function insertImages(cm: CodeMirror.Editor, images: ImageItem[]) {
    const markup = images
        .map(({title, url, alt, width, height}) => {
            const titleStr = title ? ` "${title}"` : '';
            const sizeStr = width ?? height ? ` =${width ?? ''}x${height ?? ''}` : '';
            return `![${alt ?? ''}](${url ?? ''}${titleStr}${sizeStr})`;
        })
        .join(' ');
    cm.replaceSelection(markup);
}

export const insertIframe = (
    cm: CodeMirror.Editor,
    args: {src: string; width?: number; height?: number},
) => {
    const argsMarkup = Object.entries(args)
        .map(([k, v]) => `${k}=${v}`)
        .join(' ');
    const markup = `/iframe/(${argsMarkup})`;

    const {emptyLineBefore, emptyLineAfter} = needEmptyLines(cm);

    cm.replaceSelection(emptyLineBefore + markup + emptyLineAfter);
};

export type FileItem = {src: string; name: string; type?: string};
export const insertFiles = (cm: CodeMirror.Editor, files: FileItem[]) => {
    const markup = files
        .map((attrs) => {
            const attrsStr = Object.entries(attrs)
                .map(([key, value]) => `${key}="${value.replace('"', '')}"`)
                .join(' ');
            return `{% file ${attrsStr} %}`;
        })
        .join(' ');
    cm.replaceSelection(markup);
};

export const toMermaid = (cm: CodeMirror.Editor) => {
    cm.replaceSelection(`\`\`\`mermaid
sequenceDiagram
	Alice->>Bob: Hi Bob
	Bob->>Alice: Hi Alice
\`\`\``);
};

function wrapTo(beforeText: string, afterText: string = beforeText) {
    return function (cm: CodeMirror.Editor) {
        const text = cm.getSelection();
        const start = cm.getCursor('from');
        const end = cm.getCursor('to');

        cm.replaceSelection(beforeText + text + afterText);
        cm.setSelection(
            {line: start.line, ch: start.ch + beforeText.length},
            {line: end.line, ch: start.line === end.line ? end.ch + beforeText.length : end.ch},
        );
    };
}

function toHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
    const re = /^\s*#*\s*/;
    const str = Array<string>(level).fill('#').join('') + ' ';

    return function (cm: CodeMirror.Editor) {
        const startLine = cm.getCursor('from').line;
        const endLine = cm.getCursor('to').line;

        if (startLine === endLine) {
            replace(startLine, cm.getLine(startLine));
            return;
        }

        for (let i = startLine; i <= endLine; i++) {
            const lineContent = cm.getLine(i);
            if (lineContent.trim().length) {
                replace(i, lineContent);
            }
        }

        function replace(line: number, content: string) {
            const newContent = content.replace(re, str);
            cm.replaceRange(newContent, {line, ch: 0}, {line, ch: Number.MAX_SAFE_INTEGER});
        }
    };
}

export function toHr(cm: CodeMirror.Editor) {
    const start = cm.getCursor('from');
    cm.replaceSelection('---\n');
    cm.setSelection({line: start.line + 1, ch: 0});
}

export function toTabs(cm: CodeMirror.Editor) {
    cm.replaceSelection(['{% list tabs %}', '', '- ', '  ', '', '{% endlist %}', ''].join('\n'));
}
