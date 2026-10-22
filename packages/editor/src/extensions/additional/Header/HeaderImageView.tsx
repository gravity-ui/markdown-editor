import {useState} from 'react';
import {createPortal} from 'react-dom';

import {Picture, TrashBin} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';

import type {Node} from '#pm/model';
import type {EditorView, NodeView} from '#pm/view';
import {getReactRendererFromState} from 'src/extensions/behavior/ReactRenderer';
import {i18n} from 'src/i18n/header';
import type {FileUploadHandler} from 'src/utils/upload';

import {HeaderImagePopup} from './HeaderImagePopup';
import {mediaDomAttrs} from './HeaderSpecs/dom';
import {setHeaderMedia} from './commands';

function ImageControls({
    node,
    editorView,
    getHeaderPos,
    fileUploadHandler,
}: {
    node: Node;
    editorView: EditorView;
    getHeaderPos: () => number | undefined;
    fileUploadHandler?: FileUploadHandler;
}) {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const close = () => {
        setAnchor(null);
        editorView.focus();
    };
    const src = mediaDomAttrs(node.attrs)['data-src'];
    return (
        <>
            {src ? (
                <>
                    <img className="g-md-header__image" src={src} alt={node.attrs.alt} />
                    <Button
                        className="g-md-header__media-remove"
                        view="flat-contrast"
                        size="m"
                        aria-label={i18n('media_remove')}
                        disabled={!editorView.editable}
                        onClick={() => {
                            const pos = getHeaderPos();
                            if (pos === undefined) return;
                            setHeaderMedia(pos, {src: '', name: ''})(
                                editorView.state,
                                editorView.dispatch,
                            );
                            editorView.focus();
                        }}
                    >
                        <Icon data={TrashBin} size={16} />
                    </Button>
                </>
            ) : (
                <button
                    type="button"
                    className="g-md-header__media-placeholder"
                    aria-label={i18n('media_upload')}
                    aria-expanded={Boolean(anchor)}
                    disabled={!editorView.editable}
                    onClick={(event) => setAnchor(event.currentTarget)}
                >
                    <Icon data={Picture} size={118} />
                </button>
            )}
            {anchor && (
                <HeaderImagePopup
                    editorView={editorView}
                    getHeaderPos={getHeaderPos}
                    fileUploadHandler={fileUploadHandler}
                    anchorElement={anchor}
                    onClose={close}
                />
            )}
        </>
    );
}

export class HeaderImageView implements NodeView {
    readonly dom = document.createElement('div');
    private node: Node;
    private readonly renderItem;
    constructor(
        node: Node,
        view: EditorView,
        getPos: () => number | undefined,
        handler?: FileUploadHandler,
    ) {
        this.node = node;
        this.dom.contentEditable = 'false';
        const getHeaderPos = () => {
            const pos = getPos();
            if (pos === undefined || view.isDestroyed) return undefined;
            const $pos = view.state.doc.resolve(pos);
            return $pos.before($pos.depth);
        };
        this.renderItem = getReactRendererFromState(view.state).createItem('header-media', () => {
            const attrs = mediaDomAttrs(this.node.attrs);
            for (const [key, value] of Object.entries(attrs)) this.dom.setAttribute(key, value);
            return createPortal(
                <ImageControls
                    node={this.node}
                    editorView={view}
                    getHeaderPos={getHeaderPos}
                    fileUploadHandler={handler}
                />,
                this.dom,
            );
        });
    }
    update(node: Node) {
        if (node.type !== this.node.type) return false;
        this.node = node;
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
