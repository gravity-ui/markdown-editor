import {
    ErrorLoggerBoundary,
    type RendererItem,
    getReactRendererFromState,
} from '@gravity-ui/markdown-editor';
import {
    type EditorState,
    Plugin,
    PluginKey,
    type PluginView,
    type Transaction,
} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {bannerImage, bannerImageDefaults} from '@gravity-ui/markdown-plugin-banner';

import {
    type BannerUploadLimits,
    cancelBannerUploads,
    uploadBannerFile,
} from '../../../../plugins/BannerUploadPlugin';
import type {BannerOptions} from '../../../Banner';
import {runCommand} from '../../../commands';
import {selectedBannerImage, setBannerImageAttrs} from '../../commands';

import {BannerImagePopup} from './BannerImagePopup';

/** `pos` is the image of the popup: it follows the image after the popup closes, for its uploads. */
type PopupState = {open: boolean; pos: number | null};

const key = new PluginKey<PopupState>('banner-image-popup');

export const setBannerImagePopupOpen = (tr: Transaction, open: boolean) => tr.setMeta(key, open);

export const isBannerImagePopupOpen = (state: EditorState) => key.getState(state)?.open ?? false;

class BannerImagePopupView implements PluginView {
    private readonly view: EditorView;
    private readonly options: BannerOptions;
    private readonly limits: BannerUploadLimits;
    private readonly renderItem: RendererItem;
    private anchor: HTMLElement | null = null;
    private src: string | null = null;

    constructor(view: EditorView, options: BannerOptions) {
        this.view = view;
        this.options = options;
        this.limits = {imageTypes: options.imageTypes, maxImageSize: options.maxImageSize};
        this.renderItem = getReactRendererFromState(view.state).createItem(
            'banner-image-popup',
            this.renderPopup,
        );
        this.update(view);
    }

    update(view: EditorView) {
        const {anchor, src} = this;
        const selected = isBannerImagePopupOpen(view.state) && selectedBannerImage(view.state);
        const dom = selected ? view.nodeDOM(selected.pos) : null;
        this.anchor = dom instanceof HTMLElement ? dom : null;
        this.src = selected ? bannerImage(selected.node.attrs).src : null;
        if (anchor !== this.anchor || src !== this.src) this.renderItem.rerender();
    }

    destroy() {
        this.renderItem.remove();
    }

    private get pos() {
        return key.getState(this.view.state)?.pos ?? null;
    }

    private renderPopup = () => {
        if (!this.anchor) return null;
        return (
            <ErrorLoggerBoundary>
                <BannerImagePopup
                    anchor={this.anchor}
                    src={this.src}
                    limits={this.limits}
                    upload={this.options.fileUploadHandler && this.upload}
                    cancelUpload={this.cancelUpload}
                    onLink={this.setSrc}
                    onReset={this.reset}
                    onClose={this.close}
                />
            </ErrorLoggerBoundary>
        );
    };

    private close = (reason?: string) => {
        if (this.view.isDestroyed) return;
        if (isBannerImagePopupOpen(this.view.state)) {
            this.view.dispatch(setBannerImagePopupOpen(this.view.state.tr, false));
        }
        if (reason !== 'outside-press') this.view.focus();
    };

    private upload = (file: File) => {
        const {pos} = this;
        const handler = this.options.fileUploadHandler;
        if (pos === null || !handler) return Promise.resolve(false);
        return uploadBannerFile(this.view, pos, file, handler, (current, src) =>
            setBannerImageAttrs(current, {src}),
        );
    };

    private cancelUpload = () => {
        const {pos} = this;
        if (pos !== null) cancelBannerUploads(this.view, pos);
    };

    /** A new source of the image drops a pending upload: its result comes too late. */
    private setSrc = (src: string) => {
        this.cancelUpload();
        if (this.pos !== null) runCommand(this.view, setBannerImageAttrs(this.pos, {src}));
    };

    private reset = () => {
        this.cancelUpload();
        if (this.pos !== null) {
            runCommand(this.view, setBannerImageAttrs(this.pos, {src: bannerImageDefaults.src}));
        }
    };
}

/**
 * The image window: Enter on the selected image or a click on it opens the window,
 * Escape closes it. The window closes when the image is no longer selected.
 */
export const bannerImagePopupPlugin = (options: BannerOptions = {}) =>
    new Plugin<PopupState>({
        key,
        state: {
            init: () => ({open: false, pos: null}),
            apply: (tr, prev, _oldState, state) => {
                const selected = selectedBannerImage(state);
                const open = Boolean((tr.getMeta(key) ?? prev.open) && selected);
                if (open && selected) return {open, pos: selected.pos};
                const mapped = prev.pos === null ? null : tr.mapping.mapResult(prev.pos, 1);
                const pos = mapped && !mapped.deleted ? mapped.pos : null;
                return open === prev.open && pos === prev.pos ? prev : {open, pos};
            },
        },
        view: (view) => new BannerImagePopupView(view, options),
        props: {
            handleKeyDown(view, event) {
                const open = isBannerImagePopupOpen(view.state);
                if (event.key === 'Enter' && !open && selectedBannerImage(view.state)) {
                    view.dispatch(setBannerImagePopupOpen(view.state.tr, true));
                    return true;
                }
                if (event.key === 'Escape' && open) {
                    view.dispatch(setBannerImagePopupOpen(view.state.tr, false));
                    return true;
                }
                return false;
            },
        },
    });
