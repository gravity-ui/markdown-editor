import {type ViewerNodeInfo, inspectViewerNode} from '../../src';

export function shouldAcceptElementsAndNodes() {
    const inspect: (root: Element, node: Node) => ViewerNodeInfo = inspectViewerNode;
    return inspect;
}

export function shouldAcceptAllFourStates() {
    const outside: ViewerNodeInfo = {kind: 'outside'};
    const slot: ViewerNodeInfo = {kind: 'slot'};
    const content: ViewerNodeInfo = {kind: 'content', hasSlots: false};
    const mixed: ViewerNodeInfo = {kind: 'content', hasSlots: true};
    return {outside, slot, content, mixed};
}

export function shouldRequireContentBeforeReadingSlots(info: ViewerNodeInfo) {
    if (info.kind === 'content') {
        const kind: 'content' = info.kind;
        const hasSlots: boolean = info.hasSlots;
        return {kind, hasSlots};
    }

    const kind: 'outside' | 'slot' = info.kind;
    // @ts-expect-error Only content results have hasSlots.
    const hasSlots = info.hasSlots;
    return {kind, hasSlots};
}

export function shouldRejectInvalidResults() {
    // @ts-expect-error Content results must include hasSlots.
    const missingSlots: ViewerNodeInfo = {kind: 'content'};
    // @ts-expect-error Slot results have no hasSlots field.
    const slot: ViewerNodeInfo = {kind: 'slot', hasSlots: false};
    // @ts-expect-error Outside results have no hasSlots field.
    const outside: ViewerNodeInfo = {kind: 'outside', hasSlots: true};
    // @ts-expect-error hasSlots must be a boolean.
    const invalidSlots: ViewerNodeInfo = {kind: 'content', hasSlots: 'yes'};
    return {missingSlots, slot, outside, invalidSlots};
}

export function shouldKeepResultFieldsReadonly(root: Element, node: Node) {
    const info = inspectViewerNode(root, node);
    if (info.kind === 'content') {
        // @ts-expect-error The slot flag is readonly.
        info.hasSlots = true;
    }
    // @ts-expect-error The result kind is readonly.
    info.kind = 'outside';
}

export function shouldRejectMissingNodesAndEventTargets(
    root: Element,
    node: Node,
    target: EventTarget,
) {
    // @ts-expect-error The root must be an Element.
    inspectViewerNode(node, node);
    // @ts-expect-error The root cannot be null.
    inspectViewerNode(null, node);
    // @ts-expect-error The node cannot be null.
    inspectViewerNode(root, null);
    // @ts-expect-error The node cannot be undefined.
    inspectViewerNode(root, undefined);
    // @ts-expect-error An EventTarget is not always a Node.
    inspectViewerNode(root, target);
}
