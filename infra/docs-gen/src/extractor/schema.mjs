/**
 * English: Resolves extension schema nodes and marks from spec source content.
 *
 * Русский: Резолвит schema nodes и marks расширения из spec source content.
 */
import {extractAddMark, extractAddNode, extractMarkSpecs, extractNodeSpecs} from './ast.mjs';
import {resolveAllConstants} from './constants.mjs';

/**
 * Extracts schema nodes and marks.
 */
export function extractSchema(specContent, constants) {
    return {
        nodes: resolveAllConstants(
            [...extractAddNode(specContent), ...extractNodeSpecs(specContent)],
            constants,
        ),
        marks: resolveAllConstants(
            [...extractAddMark(specContent), ...extractMarkSpecs(specContent)],
            constants,
        ),
    };
}
