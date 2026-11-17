import {VIEWER_SLOT_ATTRIBUTE} from '../components/ViewerTargets/constants';

const slotSelector = `[${VIEWER_SLOT_ATTRIBUTE}]`;

/**
 * Describes a node relative to the given viewer root at the time of inspection.
 * Inspect again after DOM changes. The result does not update itself.
 */
export type ViewerNodeInfo =
    | {
          /** The node is neither the root nor a descendant of the root. */
          readonly kind: 'outside';
      }
    | {
          /**
           * The node is a marked React slot or is inside one.
           * A slot marker on the root counts; markers above the root do not.
           */
          readonly kind: 'slot';
      }
    | {
          /**
           * The node belongs to the viewer's HTML content, including the root itself.
           * It is outside React slots, but may contain slots.
           */
          readonly kind: 'content';
          /**
           * True if the node has a marked slot at any depth below it.
           * Check this before replacing the node's content. Text nodes always return false.
           */
          readonly hasSlots: boolean;
      };

export function inspectViewerNode(root: Element, node: Node): ViewerNodeInfo {
    if (!root.contains(node)) return {kind: 'outside'};

    const element = isElement(node) ? node : node.parentElement;
    const slot = element?.closest(slotSelector);

    if (slot && root.contains(slot)) {
        return {kind: 'slot'};
    }

    return {
        kind: 'content',
        hasSlots: isElement(node) && node.querySelector(slotSelector) !== null,
    };
}

function isElement(node: Node): node is Element {
    return node.nodeType === node.ELEMENT_NODE;
}
