import ts from 'typescript';

import {callsOf} from '../extension-graph.mjs';
import {functionCalls} from '../function-calls.mjs';
import {importBinding, importLines} from '../imports.mjs';
import {codeBlock, dedentText, section} from '../markdown.mjs';
import {packageOf} from '../packages.mjs';
import {useCallImports} from '../printable-call.mjs';
import {asFunction, unwrapExpression} from '../syntax.mjs';
import {optionsList, parameterType} from '../type-members.mjs';

const SHARED_OPTIONS = {
    name: 'MarkdownItPluginOpts',
    file: '@diplodoc/transform/lib/typings.d.ts',
    line: '- Shared transform options: `MarkdownItPluginOpts` from `@diplodoc/transform/lib/typings`',
};

/** Checks for a `.use(...)` call. */
function isUseCall(node) {
    return (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'use'
    );
}

/** Reads the plugin identifier from `use(plugin, …)` or `use(factory(…), …)`. */
function pluginReference(call) {
    const argument = unwrapExpression(call.arguments[0]);
    if (argument && ts.isIdentifier(argument)) return {identifier: argument, isFactory: false};
    if (argument && ts.isCallExpression(argument) && ts.isIdentifier(argument.expression)) {
        return {identifier: argument.expression, isFactory: true};
    }

    return null;
}

/** Collects the plugins of the extension: a package plugin has its import binding, a plugin of the repository has none. */
function markdownPlugins(index, calls) {
    const callbacks = callsOf(calls, 'configureMd').map((call) => asFunction(call.arguments[0]));
    const registrations = callbacks.map((fn) =>
        fn ? functionCalls(index, fn).filter(isUseCall) : null,
    );
    const plugins = registrations
        .flatMap((registered) => registered ?? [])
        .map((call) => ({call, reference: pluginReference(call)}))
        .filter(({reference}) => reference)
        .map((plugin) => {
            const binding = importBinding(index, plugin.reference.identifier);
            return {...plugin, binding: binding?.isPackage ? binding : null};
        });
    const isRegistered = registrations.some((registered) => !registered || registered.length > 0);

    return {plugins, isRegistered};
}

/** Renders a `use` call on `md`; chained calls keep their arguments as written. */
function useCallText(call) {
    const typeArguments = call.typeArguments
        ? `<${call.typeArguments.map((type) => type.getText()).join(', ')}>`
        : '';
    const args = call.arguments.map((argument) => argument.getText()).join(', ');

    return dedentText(`md.use${typeArguments}(${args});`);
}

/** Renders package plugins as imports and printable `use` calls, then names plugins of the repository. */
function importBody(index, packages, plugins) {
    const packagePlugins = plugins.filter(({binding}) => binding);
    const printable = packagePlugins
        .map(({call}) => ({call, imports: useCallImports(index, call)}))
        .filter(({imports}) => imports);
    const imports = importLines([
        ...packagePlugins.map(({binding}) => binding),
        ...printable.flatMap(({imports: needed}) => needed),
    ]);
    const useLines = printable.map(({call}) => useCallText(call));
    const code =
        imports.length > 0
            ? codeBlock(useLines.length > 0 ? [...imports, '', ...useLines] : imports)
            : [];

    const localLines = [
        ...new Set(
            plugins
                .filter(({binding}) => !binding)
                .map(({call, reference}) => {
                    const owner = packageOf(packages, call.getSourceFile().fileName);
                    return `Defined in ${owner.title}: \`${reference.identifier.text}\``;
                }),
        ),
    ];

    return [...code, ...(code.length > 0 && localLines.length > 0 ? [''] : []), ...localLines];
}

/** Reads the options type: the factory parameter, or the second parameter of a plugin. */
function pluginOptions(index, {identifier, isFactory}) {
    const {checker} = index;
    const type = checker.getTypeAtLocation(identifier);

    return parameterType(checker, type, isFactory ? 0 : 1, identifier);
}

/** Renders plugin options; several plugins get a subheading each. */
function optionsBody(index, plugins) {
    const references = new Map(
        plugins.map(({reference}) => [reference.identifier.text, reference]),
    );
    const members = [...references].map(([name, reference]) => ({
        name,
        lines: optionsList(index.checker, pluginOptions(index, reference), SHARED_OPTIONS),
    }));
    if (members.length === 1) return members[0].lines;

    return members.flatMap(({name, lines}, position) => [
        ...(position > 0 ? [''] : []),
        ...section(`#### \`${name}\``, lines).slice(0, -1),
    ]);
}

/** Renders the markdown-it plugins of the extension. */
export function markdownPluginSection({index, packages, calls}) {
    const {plugins, isRegistered} = markdownPlugins(index, calls);

    return [
        '## Markdown plugin',
        '',
        ...section('### Import', importBody(index, packages, plugins), isRegistered),
        ...section('### Options', optionsBody(index, plugins)),
    ];
}
