/**
 * Extracts ProseMirror node registrations from builder.addNode() calls
 */
export function extractAddNode(content) {
    const nodes = [];
    // builder.addNode(name, callback) — second arg starts with `(` or line-end
    const re = /builder\s*\.addNode\(\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])\s*,\s*(?:\(|$)/gm;
    let m;
    while ((m = re.exec(content))) {
        nodes.push(m[3] || m[1] || m[2]);
    }
    // Chained: ).addNode(name, ...)
    const re2 = /\)\s*\.addNode\(\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])\s*,\s*(?:\(|$)/gm;
    while ((m = re2.exec(content))) {
        nodes.push(m[3] || m[1] || m[2]);
    }
    return nodes;
}

/**
 * Extracts ProseMirror mark registrations from builder.addMark() calls
 */
export function extractAddMark(content) {
    const marks = [];
    // builder.addMark(name, ...) — require builder prefix to avoid matching tr.addMark
    const re = /builder\s*\.addMark\(\s*\n?\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])\s*,/g;
    let m;
    while ((m = re.exec(content))) {
        marks.push(m[3] || m[1] || m[2]);
    }
    // Chained: newline + indent + .addMark — excludes inline tr.addMark
    const re2 = /\)\s*\n\s*\.addMark\(\s*\n?\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])\s*,/g;
    while ((m = re2.exec(content))) {
        marks.push(m[3] || m[1] || m[2]);
    }
    return marks;
}

/**
 * Extracts node specs from .addNodeSpec({ name: ... }) calls
 */
export function extractNodeSpecs(content) {
    const nodes = [];
    const re = /\.addNodeSpec\(\s*\{\s*name:\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])/g;
    let m;
    while ((m = re.exec(content))) {
        nodes.push(m[3] || m[1] || m[2]);
    }
    return nodes;
}

/**
 * Extracts mark specs from .addMarkSpec({ name: ... }) calls
 */
export function extractMarkSpecs(content) {
    const marks = [];
    const re = /\.addMarkSpec\(\s*\{\s*name:\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])/g;
    let m;
    while ((m = re.exec(content))) {
        marks.push(m[3] || m[1] || m[2]);
    }
    return marks;
}

/**
 * Extracts action IDs from .addAction() calls
 */
export function extractActions(content) {
    const actions = [];
    const re = /\.addAction\(\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])/g;
    let m;
    while ((m = re.exec(content))) {
        actions.push(m[3] || m[1] || m[2]);
    }
    return actions;
}

/**
 * Extracts plugin function names from .addPlugin() calls
 */
export function extractPlugins(content) {
    const plugins = [];
    const re = /\.addPlugin\(\s*(\w+)/g;
    let m;
    while ((m = re.exec(content))) {
        plugins.push(m[1]);
    }
    return plugins;
}

/**
 * Extracts keymap bindings from .addKeymap() callbacks
 */
export function extractKeymaps(content) {
    const keymaps = [];
    const re = /\.addKeymap\(\s*\([^)]*\)\s*=>\s*\(\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\)/gs;
    let m;
    while ((m = re.exec(content))) {
        const block = m[1];
        const keyRe = /['"]?([^'",:]+)['"]?\s*:/g;
        let km;
        while ((km = keyRe.exec(block))) {
            const key = km[1].trim();
            if (key && !key.startsWith('//') && !key.startsWith('...')) {
                keymaps.push(key);
            }
        }
    }
    return [...new Set(keymaps)];
}

/**
 * Extracts input rule patterns (markInputRule, wrappingInputRule, etc.)
 */
export function extractInputRules(content) {
    const rules = [];
    const re =
        /(?:markInputRule|textblockTypeInputRule|nodeInputRule|wrappingInputRule|inlineNodeInputRule)\s*\(\s*(?:\/([^/]+)\/|{[^}]*open:\s*'([^']*)'[^}]*close:\s*'([^']*)'[^}]*})/g;
    let m;
    while ((m = re.exec(content))) {
        if (m[1]) {
            rules.push(`/${m[1]}/`);
        } else if (m[2] && m[3]) {
            rules.push(`${m[2]}...${m[3]}`);
        }
    }
    return rules;
}

/**
 * Extracts markdown-it plugin registrations from md.use() calls
 */
export function extractMdPlugins(content) {
    const plugins = [];
    const re = /md\.use\(\s*(\w+)/g;
    let m;
    while ((m = re.exec(content))) {
        plugins.push(m[1]);
    }
    return plugins;
}

/**
 * Extracts the Options type fields from `export type FooOptions = { ... }`
 */
export function extractOptionsType(content) {
    const fields = [];
    const re = /export\s+type\s+\w+Options\s*(?:=\s*(?:\w+\s*&\s*)?)?(?:\{([^}]*)\}|([^;]*))/gs;
    const m = re.exec(content);
    if (!m) return fields;
    const block = m[1] || m[2] || '';
    const fieldRe = /(\w+)\??\s*:\s*([^;]+)/g;
    let fm;
    while ((fm = fieldRe.exec(block))) {
        const name = fm[1].trim();
        const type = fm[2].trim().replace(/\s+/g, ' ');
        if (name && !name.startsWith('//')) {
            fields.push({name, type});
        }
    }
    return fields;
}

/**
 * Extracts markup examples from same() assertions in test files
 */
export function extractTestExamples(content) {
    const examples = [];
    const re = /same\(\s*'([^']+)'/g;
    let m;
    while ((m = re.exec(content))) {
        examples.push(m[1]);
    }
    const re2 = /same\(\s*`([^`]+)`/g;
    while ((m = re2.exec(content))) {
        examples.push(m[1]);
    }
    return examples;
}

/**
 * Extracts serializer syntax patterns from state.write() and state.text() calls
 */
export function extractSerializerSyntax(content) {
    const snippets = [];
    const writeRe = /state\.write\(\s*[`'"]([^`'"]*)[`'"]/g;
    let m;
    while ((m = writeRe.exec(content))) {
        if (m[1].trim()) snippets.push(m[1]);
    }
    const textRe = /state\.text\(\s*[`'"]([^`'"]*)[`'"]/g;
    while ((m = textRe.exec(content))) {
        if (m[1].trim()) snippets.push(m[1]);
    }
    return snippets;
}
