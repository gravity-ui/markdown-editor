import {DOMSerializer, type Node} from '@gravity-ui/markdown-editor/pm/model';
import type {NodeView} from '@gravity-ui/markdown-editor/pm/view';

export class WButtonNodeView implements NodeView {
    readonly dom: HTMLElement;
    constructor(node: Node) {
        this.dom = DOMSerializer.fromSchema(node.type.schema).serializeNode(node) as HTMLElement;
        this.dom.addEventListener('click', (event) => event.preventDefault());
    }
}
