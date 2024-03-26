import 'codemirror/mode/clike/clike';
import 'codemirror/mode/css/css';
import 'codemirror/mode/diff/diff';
import 'codemirror/mode/go/go';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/jsx/jsx';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/python/python';
import 'codemirror/mode/rust/rust';
import 'codemirror/mode/shell/shell';
import 'codemirror/mode/sql/sql';

export const modeMimes: Record<string, string> = {
    text: 'text/text',

    // 'codemirror/mode/diff/diff'
    diff: 'text/x-diff',

    // codemirror/mode/markdown/markdown
    md: 'text/markdown',
    markdown: 'text/markdown',

    // codemirror/mode/javascript/javascript
    json: 'application/json',
    js: 'text/javascript',
    ts: 'text/typescript',
    javascript: 'text/javascript',
    typescript: 'text/typescript',

    // // codemirror/mode/jsx/jsx
    jsx: 'text/jsx',
    tsx: 'text/typescript-jsx',

    // codemirror/mode/python/python
    python: 'text/x-python',

    // codemirror/mode/css/css
    css: 'text/css',
    scss: 'text/x-scss',
    less: 'text/x-less',
    gss: 'text/x-gss',

    // codemirror/mode/clike/clike
    c: 'text/x-csrc',
    cpp: 'text/x-c++src',
    'c++': 'text/x-c++src',
    java: 'text/x-java',
    cs: 'text/x-csharp',
    'c#': 'text/x-csharp',
    csharp: 'text/x-csharp',
    scala: 'text/x-scala',
    kotlin: 'text/x-kotlin',
    // TODO: add more clike langs support

    // 'codemirror/mode/go/go'
    go: 'text/x-go',

    // 'codemirror/mode/rust/rust'
    rust: 'text/x-rustsrc',

    // 'codemirror/mode/sql/sql'
    sql: 'text/x-sql',
    mysql: 'text/x-mysql',
    postgresql: 'text/x-pgsql',
    pg: 'text/x-pgsql',

    // 'codemirror/mode/shell/shell'
    shell: 'application/x-sh',

    // codemirror/mode/htmlmixed/htmlmixed
    html: 'text/html',
};

export const getUniqueModeNames = () => {
    const names: Record<string, string> = {};

    for (const modeName in modeMimes) {
        if (modeMimes[modeName]) {
            const modeMime = modeMimes[modeName];

            const oldName = names[modeMimes[modeMime]];
            if ((oldName && oldName.length < modeName.length) || !oldName)
                names[modeMime] = modeName;
        }
    }

    return Object.values(names);
};

export function getModeMIME(langValue: string) {
    return modeMimes[langValue] || 'text/plain';
}
