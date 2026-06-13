/**
 * English: AST scanner for editor action identifiers registered by extensions.
 *
 * Русский: AST-сканер идентификаторов editor actions, регистрируемых расширениями.
 */
import {extractBuilderCallFirstArgs} from './builder.mjs';

/**
 * Extracts editor action identifiers from builder calls.
 */
export function extractActions(content) {
    return extractBuilderCallFirstArgs(content, new Set(['addAction']));
}
