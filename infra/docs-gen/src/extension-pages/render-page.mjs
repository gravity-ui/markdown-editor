import {actionNames, collectExtensionCalls, exportedDeclaration} from './extension-graph.mjs';
import {actionsSection} from './sections/actions.mjs';
import {descriptionSection} from './sections/description.mjs';
import {directiveSyntaxSection} from './sections/directive-syntax.mjs';
import {importSection} from './sections/import.mjs';
import {inputRulesSection} from './sections/input-rules.mjs';
import {keysSection} from './sections/keys.mjs';
import {markdownPluginSection} from './sections/markdown-plugin.mjs';
import {optionsSection} from './sections/options.mjs';
import {toolbarSection} from './sections/toolbar.mjs';

const EDITOR_EXTENSION_SECTIONS = [
    descriptionSection,
    importSection,
    optionsSection,
    actionsSection,
    keysSection,
    inputRulesSection,
    directiveSyntaxSection,
];

/** Collects what every section of one page reads. */
function pageContext({index, packages}, extension) {
    const declaration = exportedDeclaration(index, extension.file, extension.exportName);
    const {calls, files} = declaration
        ? collectExtensionCalls(index, declaration)
        : {calls: [], files: new Set()};
    const actions = actionNames(index, calls);

    return {index, packages, extension, declaration, calls, files, actions};
}

/** Renders the page of one extension. */
export function renderExtensionPage(generator, extension) {
    const context = pageContext(generator, extension);
    const lines = [
        `##### Extensions / ${extension.name}`,
        '',
        `# ${extension.name}`,
        '',
        '## Editor extension',
        '',
        ...EDITOR_EXTENSION_SECTIONS.flatMap((render) => render(context)),
        ...toolbarSection(context),
        ...markdownPluginSection(context),
    ];

    return `${lines.join('\n').trimEnd()}\n`;
}
