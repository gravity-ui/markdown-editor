/**
 * English: Parses local TypeScript declarations that can describe extension options.
 *
 * Русский: Парсит локальные TypeScript declarations, описывающие options расширений.
 */
import ts from 'typescript';

import {parseSource} from '../ast.mjs';

/**
 * Creates a type declaration record.
 */
function createDeclaration(name, kind, node, sourceFile) {
    return {
        name,
        kind,
        node,
        sourceFile,
    };
}

/**
 * Parses local *Options declarations from TypeScript source.
 */
export function parseOptionDeclarations(content) {
    const sourceFile = parseSource(content);
    const declarations = new Map();

    for (const statement of sourceFile.statements) {
        if (
            (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) &&
            statement.name.text.endsWith('Options')
        ) {
            declarations.set(
                statement.name.text,
                createDeclaration(
                    statement.name.text,
                    ts.isInterfaceDeclaration(statement) ? 'interface' : 'type',
                    statement,
                    sourceFile,
                ),
            );
        }
    }

    return declarations;
}
