import {dirname, join, relative} from 'node:path';

import {exportedDeclaration} from '../extension-graph.mjs';
import {codeBlock, section} from '../markdown.mjs';
import {sourceDir} from '../packages.mjs';

/** Builds the module path of a source file in the package build. */
function buildPath(descriptor, fileName) {
    return `${descriptor.name}/${relative(sourceDir(descriptor), fileName).replace(/\.tsx?$/, '.js')}`;
}

/** Finds the package module that exports the extension: an entry of the package, the directory index or the file itself. */
function extensionModule({index, extension}) {
    const {package: descriptor, file, exportName} = extension;
    const exports = (source) => source && exportedDeclaration(index, source, exportName);

    if (descriptor.entries) {
        const entry = descriptor.entries.find(({file: entryFile}) =>
            exports(index.files.get(join(sourceDir(descriptor), entryFile))),
        );
        return entry ? `${descriptor.name}${entry.subpath}` : null;
    }

    const directoryIndex = index.files.get(join(dirname(file.fileName), 'index.ts'));
    const source = exports(directoryIndex) ? directoryIndex : file;

    return buildPath(descriptor, source.fileName);
}

/** Renders the import of the extension from its public package path. */
export function importSection(context) {
    const {extension, declaration} = context;
    const module = declaration && extensionModule(context);
    const body = module ? codeBlock([`import {${extension.exportName}} from '${module}';`]) : [];

    return section('### Import', body);
}
