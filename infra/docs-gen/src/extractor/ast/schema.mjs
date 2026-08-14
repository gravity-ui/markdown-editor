/**
 * English: AST scanners for schema node and mark registrations.
 *
 * Русский: AST-сканеры регистраций schema node и mark.
 */
import {extractBuilderCallFirstArgs} from './builder.mjs';

/**
 * Extracts ProseMirror node registrations from builder calls.
 */
export function extractAddNode(content) {
    return extractBuilderCallFirstArgs(content, new Set(['addNode']));
}

/**
 * Extracts ProseMirror mark registrations from builder calls.
 */
export function extractAddMark(content) {
    return extractBuilderCallFirstArgs(content, new Set(['addMark']));
}

/**
 * Extracts node names from granular node spec registrations.
 */
export function extractNodeSpecs(content) {
    return extractBuilderCallFirstArgs(content, new Set(['addNodeSpec']));
}

/**
 * Extracts mark names from granular mark spec registrations.
 */
export function extractMarkSpecs(content) {
    return extractBuilderCallFirstArgs(content, new Set(['addMarkSpec']));
}
