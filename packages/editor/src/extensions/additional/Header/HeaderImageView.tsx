import {Picture} from '@gravity-ui/icons';
import {Icon, Portal, useToaster} from '@gravity-ui/uikit';

import type {Node} from '#pm/model';
import type {EditorView, NodeView} from '#pm/view';
import {getReactRendererFromState} from 'src/extensions/behavior/ReactRenderer';
import {i18n} from 'src/i18n/header';
import type {FileUploadHandler} from 'src/utils/upload';

import {mediaDomAttrs} from './HeaderSpecs/dom';
import {uploadHeaderImage} from './plugins/imageUpload';

function UploadControl({
    upload,
    disabled,
    hasImage,
}: {
    upload: () => Promise<'done' | 'cancelled' | 'failed'>;
    disabled: boolean;
    hasImage: boolean;
}) {
    const toaster = useToaster();
    return (
        <button
            type="button"
            className="g-md-header__media-placeholder"
            aria-label={i18n('media_upload')}
            disabled={disabled}
            onClick={async () => {
                if ((await upload()) === 'failed')
                    toaster.add({
                        name: 'header-media-upload',
                        theme: 'danger',
                        title: i18n('image_error'),
                    });
            }}
        >
            <Icon data={Picture} size={hasImage ? 24 : 118} />
        </button>
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
        const upload = async () => {
            const pos = getPos();
            if (pos === undefined || !handler) return 'cancelled' as const;
            const $pos = view.state.doc.resolve(pos);
            return uploadHeaderImage(view, $pos.before($pos.depth), handler, 'media');
        };
        this.renderItem = getReactRendererFromState(view.state).createItem('header-media', () => {
            const attrs = mediaDomAttrs(this.node.attrs);
            for (const [key, value] of Object.entries(attrs)) this.dom.setAttribute(key, value);
            return (
                <Portal container={this.dom}>
                    {attrs['data-src'] && (
                        <img
                            className="g-md-header__image"
                            src={attrs['data-src']}
                            alt={this.node.attrs.alt}
                        />
                    )}
                    <UploadControl
                        upload={upload}
                        disabled={!handler}
                        hasImage={Boolean(attrs['data-src'])}
                    />
                </Portal>
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
