import {ToasterPublicMethods} from '@gravity-ui/uikit';
import {Node} from 'prosemirror-model';
import {EditorView, NodeView} from 'prosemirror-view';
import {createPortal} from 'react-dom';

import {ExtensionAuto, getReactRendererFromState} from '../../../../src';
import {
    MarkdownEditorView,
    MarkdownEditorViewProps,
    useMarkdownEditor,
} from '../../../../src/bundle';

import './index.scss';

export const editorInEditorNodeName = '__editor-in-editor';
export enum EditorInEditorAttr {
    Markup = '__markup',
}

const CONTAINER_CLASSNAME = editorInEditorNodeName;

export type EditorInEditorOptions = {
    toaster: ToasterPublicMethods;
};

export const EditorInEditor: ExtensionAuto<EditorInEditorOptions> = (builder, opts) => {
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
        view: () => (node, view) => new EditorInEditorNodeView(node, view, opts),
    }));
};

type EditorInEditorNodeViewParams = Pick<EditorInEditorOptions, 'toaster'>;

class EditorInEditorNodeView implements NodeView {
    readonly dom: HTMLElement;

    private node: Node;

    private readonly renderItem;

    private readonly toaster: ToasterPublicMethods;

    constructor(node: Node, view: EditorView, {toaster}: EditorInEditorNodeViewParams) {
        this.node = node;

        this.toaster = toaster;

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
        const {toaster} = this;
        return createPortal(
            <InnerEditor
                toaster={toaster}
                initialContent={this.node.attrs[EditorInEditorAttr.Markup]}
            />,
            this.dom,
        );
    }
}

type YfmEditorProps = {
    initialContent: string;
    toaster: MarkdownEditorViewProps['toaster'];
};

function InnerEditor({initialContent, toaster}: YfmEditorProps) {
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
    return (
        <MarkdownEditorView
            editor={mdEditor}
            toaster={toaster}
            settingsVisible={false}
            stickyToolbar={false}
        />
    );
}
