import {Node} from 'prosemirror-model';
import {EditorView, NodeView} from 'prosemirror-view';
import {createPortal} from 'react-dom';

import {ExtensionAuto, getReactRendererFromState} from '../../../../src';
import {MarkdownEditorView, useMarkdownEditor} from '../../../../src/bundle';

import './index.scss';

export const editorInEditorNodeName = '__editor-in-editor';
export enum EditorInEditorAttr {
    Markup = '__markup',
}

const CONTAINER_CLASSNAME = editorInEditorNodeName;

export type EditorInEditorOptions = {};

export const EditorInEditor: ExtensionAuto<EditorInEditorOptions> = (builder) => {
    builder.addNode(editorInEditorNodeName, () => ({
        spec: {
            attrs: {[EditorInEditorAttr.Markup]: {}},
            atom: true,
            group: 'block',
            toDOM: (node) => ['div', {class: CONTAINER_CLASSNAME, ...node.attrs}, 0],
            parseDOM: [{tag: `div.${CONTAINER_CLASSNAME}`, priority: 100}],
        },
        fromMd: {
            tokenSpec: {
                name: editorInEditorNodeName,
                type: 'block',
            },
        },
        toMd: (state, node) => {
            state.closeBlock(node);
        },
        view: () => (node, view) => new EditorInEditorNodeView(node, view),
    }));
};

class EditorInEditorNodeView implements NodeView {
    readonly dom: HTMLElement;

    private node: Node;

    private readonly renderItem;

    constructor(node: Node, view: EditorView) {
        this.node = node;

        this.dom = document.createElement('div');
        this.dom.classList.add(CONTAINER_CLASSNAME);
        this.dom.contentEditable = 'false';
        this.dom.setAttribute(
            EditorInEditorAttr.Markup,
            this.node.attrs[EditorInEditorAttr.Markup],
        );

        this.renderItem = getReactRendererFromState(view.state).createItem(
            '__editor-in-editor-view',
            this.renderEditor.bind(this),
        );
    }

    update(node: Node): boolean {
        if (node.type !== this.node.type) return false;
        this.node = node;
        this.renderItem.rerender();
        return true;
    }

    destroy() {
        this.renderItem.remove();
    }

    stopEvent() {
        return true;
    }

    private renderEditor(): React.ReactNode {
        return createPortal(
            <InnerEditor initialContent={this.node.attrs[EditorInEditorAttr.Markup]} />,
            this.dom,
        );
    }
}

type YfmEditorProps = {
    initialContent: string;
};

function InnerEditor({initialContent}: YfmEditorProps) {
    const mdEditor = useMarkdownEditor({
        md: {
            linkify: true,
            breaks: true,
            html: false,
        },
        initial: {
            markup: initialContent,
            mode: 'wysiwyg',
            toolbarVisible: true,
        },
    });
    return <MarkdownEditorView editor={mdEditor} settingsVisible={false} stickyToolbar={false} />;
}
