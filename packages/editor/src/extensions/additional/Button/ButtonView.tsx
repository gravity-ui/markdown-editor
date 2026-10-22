import {useRef, useState} from 'react';

import {Popup, Portal} from '@gravity-ui/uikit';

import type {Node} from '#pm/model';
import type {EditorView, NodeView} from '#pm/view';
import {getReactRendererFromState} from 'src/extensions/behavior/ReactRenderer';
import {i18n} from 'src/i18n/header';

import {ButtonFields} from './ButtonFields';
import {type ButtonAttrs, buttonDomAttrs, normalizeButtonAttrs} from './ButtonSpecs';

function EditableButton({
    node,
    view,
    getPos,
}: {
    node: Node;
    view: EditorView;
    getPos: () => number | undefined;
}) {
    const [open, setOpen] = useState(false);
    const anchor = useRef<HTMLAnchorElement>(null);
    const attrs = normalizeButtonAttrs(node.attrs);
    const update = (patch: Partial<ButtonAttrs>) => {
        const pos = getPos();
        if (pos === undefined || view.state.doc.nodeAt(pos)?.type !== node.type) return;
        view.dispatch(
            view.state.tr.setNodeMarkup(pos, null, normalizeButtonAttrs({...node.attrs, ...patch})),
        );
    };
    return (
        <>
            <a
                {...buttonDomAttrs(attrs)}
                ref={anchor}
                role="button"
                tabIndex={0}
                aria-label={attrs.label || i18n('action')}
                onClick={(event) => {
                    event.preventDefault();
                    if (view.editable) setOpen(!open);
                }}
                onKeyDown={(event) => {
                    if (view.editable && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault();
                        setOpen(!open);
                    }
                }}
            >
                {attrs.label || i18n('action')}
            </a>
            <Popup
                open={open}
                anchorElement={anchor.current}
                placement={['bottom-start', 'top-start']}
                onOpenChange={setOpen}
            >
                <div
                    className="g-md-button-settings"
                    role="dialog"
                    aria-label={i18n('button_settings')}
                    data-qa="g-md-button-settings"
                >
                    <ButtonFields attrs={attrs} label={i18n('action')} onUpdate={update} />
                </div>
            </Popup>
        </>
    );
}
export class ButtonView implements NodeView {
    readonly dom = document.createElement('span');
    private node: Node;
    private readonly renderItem;
    constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
        this.node = node;
        this.dom.className = 'g-md-button-slot';
        this.dom.contentEditable = 'false';
        this.dom.hidden = node.attrs.enabled === false;
        this.renderItem = getReactRendererFromState(view.state).createItem('button', () => (
            <Portal container={this.dom}>
                <EditableButton node={this.node} view={view} getPos={getPos} />
            </Portal>
        ));
    }
    update(node: Node) {
        if (node.type !== this.node.type) return false;
        this.node = node;
        this.dom.hidden = node.attrs.enabled === false;
        this.renderItem.rerender();
        return true;
    }
    ignoreMutation() {
        return true;
    }
    stopEvent() {
        return true;
    }
    destroy() {
        this.renderItem.remove();
    }
}
