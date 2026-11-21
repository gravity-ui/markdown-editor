import type {Placement} from '@floating-ui/react';
import {
    ErrorLoggerBoundary,
    type RendererItem,
    getReactRendererFromState,
} from '@gravity-ui/markdown-editor';
import {keydownHandler} from '@gravity-ui/markdown-editor/pm/keymap';
import {
    type Command,
    type EditorState,
    NodeSelection,
    Plugin,
    PluginKey,
    type PluginView,
} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {bannerImage} from '@gravity-ui/markdown-plugin-banner';

import {
    type BannerUploadLimits,
    cancelBannerUploads,
    uploadBannerFile,
} from '../../../../plugins/BannerUploadPlugin';
import {findDepth} from '../../../../plugins/SelectionInsidePlugin';
import type {BannerOptions} from '../../../Banner';
import {bannerNodeType} from '../../../Banner/BannerSpecs';
import {
    bannerToolbar,
    keepBannerToolbarWith,
    showBannerToolbar,
} from '../../../Banner/plugins/BannerTooltipPlugin';
import {runCommand} from '../../../commands';
import {bannerImagePlacement} from '../../../placement';
import {popupDismiss} from '../../../popup';
import {bannerImageNodeType} from '../../BannerImageSpecs';
import {resetBannerImage, selectedBannerImage, setBannerImageAttrs} from '../../commands';

import {BannerImagePopup} from './BannerImagePopup';

type SelectedImage = {pos: number; src: string | null; placement: Placement[]};
type ImageSelection = {pos: number | null; start: number | null};

const imageSelectionKey = new PluginKey<ImageSelection>('banner-image-selection');

const selectedImagePos = (state: EditorState) => selectedBannerImage(state)?.pos ?? null;

class ImagePopupView implements PluginView {
    readonly dismiss: ReturnType<typeof popupDismiss>;
    private readonly view: EditorView;
    private readonly options: BannerOptions;
    private readonly limits: BannerUploadLimits;
    private readonly firstField: {current: HTMLElement | null} = {current: null};
    private readonly renderItem: RendererItem;
    private selected: SelectedImage | null = null;
    private seen: ImageSelection | undefined;
    private anchor: HTMLElement | null = null;
    private engaged = false;
    private manualHidden = false;
    private untilFocus = false;
    private visible = false;
    private focusOnOpen = false;
    constructor(view: EditorView, options: BannerOptions) {
        this.view = view;
        this.options = options;
        this.limits = {imageTypes: options.imageTypes, maxImageSize: options.maxImageSize};
        this.dismiss = popupDismiss(view, {
            anchor: () => this.anchor,
            visible: () => this.visible,
            hide: () => this.hide(),
        });
        this.renderItem = getReactRendererFromState(view.state).createItem(
            'banner-image-popup',
            this.renderPopup,
        );
        this.update(view);
    }

    update(view: EditorView) {
        const {selected: prev, anchor, visible, focusOnOpen} = this;
        this.select(view);
        const moved = prev?.pos !== this.selected?.pos;
        this.updateVisible(view, this.reselected(view.state), visible);
        this.focusOnOpen &&= this.visible;
        if (!visible && this.visible) showBannerToolbar(view);
        const changed =
            moved ||
            prev?.src !== this.selected?.src ||
            prev?.placement !== this.selected?.placement ||
            anchor !== this.anchor ||
            visible !== this.visible ||
            focusOnOpen !== this.focusOnOpen;
        if (changed) this.renderItem.rerender();
    }

    destroy() {
        this.renderItem.remove();
    }

    show() {
        if (this.engaged && !this.manualHidden) return;
        this.engaged = true;
        this.manualHidden = false;
        this.update(this.view);
    }

    open(): boolean {
        if (!this.selected) return false;
        if (!this.focus()) {
            this.engaged = true;
            this.manualHidden = false;
            this.focusOnOpen = true;
            this.update(this.view);
            this.renderItem.rerender();
        }
        return true;
    }

    focus(): boolean {
        const field = this.visible ? this.firstField.current : null;
        field?.focus();
        return Boolean(field);
    }

    private reselected(state: EditorState) {
        const {seen} = this;
        this.seen = imageSelectionKey.getState(state);
        const pos = this.seen?.pos ?? null;
        return this.seen !== seen && pos !== null && pos !== this.seen?.start;
    }

    private updateVisible(view: EditorView, reselected: boolean, wasVisible: boolean) {
        const focused = view.hasFocus();
        if (reselected) this.manualHidden = false;
        const waiting = reselected ? !wasVisible && Boolean(this.selected) : this.untilFocus;
        this.untilFocus = waiting && !focused;
        this.engaged ||= focused;
        this.visible = Boolean(
            this.engaged && !this.manualHidden && !this.untilFocus && this.anchor,
        );
    }

    private select(view: EditorView) {
        const found = selectedBannerImage(view.state);
        const dom = found ? view.nodeDOM(found.pos) : null;
        this.selected = found && {
            pos: found.pos,
            src: bannerImage(found.node.attrs).src,
            placement: bannerImagePlacement(view.state, found.pos),
        };
        this.anchor = dom instanceof HTMLElement ? dom : null;
    }

    private renderPopup = () => {
        const {visible, selected, anchor} = this;
        if (!visible || !selected || !anchor) return null;
        return (
            <ErrorLoggerBoundary>
                <BannerImagePopup
                    anchor={anchor}
                    placement={selected.placement}
                    block={this.block}
                    toolbar={this.toolbar}
                    src={selected.src}
                    limits={this.limits}
                    focusOnOpen={this.focusOnOpen}
                    firstField={this.firstField}
                    onLayer={this.setLayer}
                    upload={this.options.fileUploadHandler && this.upload}
                    cancelUpload={this.cancelUpload}
                    onChange={this.changeSrc}
                    onReset={this.reset}
                    onOpenChange={this.dismiss.onOpenChange}
                    onClose={this.close}
                />
            </ErrorLoggerBoundary>
        );
    };

    private block = () => {
        if (!this.selected) return null;
        const {doc, schema} = this.view.state;
        const $pos = doc.resolve(this.selected.pos);
        const depth = findDepth($pos, bannerNodeType(schema));
        if (!depth) return null;
        const dom = this.view.nodeDOM($pos.before(depth));
        return dom instanceof HTMLElement ? dom : null;
    };

    private setLayer = (layer: HTMLDivElement | null) => {
        this.dismiss.setLayer(layer);
        keepBannerToolbarWith(this.view, layer);
    };

    private toolbar = () => bannerToolbar(this.view)?.closest<HTMLElement>('.g-popup');

    private hide() {
        this.manualHidden = true;
        this.update(this.view);
    }

    private close = () => {
        this.hide();
        this.view.focus();
    };

    private upload = async (file: File) => {
        const {fileUploadHandler} = this.options;
        if (!this.selected || !fileUploadHandler) return false;
        return uploadBannerFile(
            this.view,
            this.selected.pos,
            file,
            fileUploadHandler,
            (current, src) => setBannerImageAttrs(current, {src}),
        );
    };

    private cancelUpload = () => {
        if (this.selected) cancelBannerUploads(this.view, this.selected.pos);
    };

    private reset = () => {
        if (!this.selected) return;
        cancelBannerUploads(this.view, this.selected.pos);
        runCommand(this.view, resetBannerImage(this.selected.pos));
    };

    private changeSrc = (src: string) => {
        if (!this.selected) return;
        cancelBannerUploads(this.view, this.selected.pos);
        runCommand(this.view, setBannerImageAttrs(this.selected.pos, {src}));
    };
}

export function bannerImagePopup(options: BannerOptions) {
    let popup: ImagePopupView | undefined;
    const focus: Command = () => popup?.focus() ?? false;
    const select = (view: EditorView, pos: number) => {
        view.focus();
        view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos)));
    };
    const show = (view: EditorView, pos: number) => {
        select(view, pos);
        popup?.show();
    };
    const plugin = () =>
        new Plugin<ImageSelection>({
            key: imageSelectionKey,
            state: {
                init: (_config, state) => ({pos: selectedImagePos(state), start: null}),
                apply: (tr, prev, _old, state) => {
                    const from = tr.getMeta('appendedTransaction') ? prev.start : prev.pos;
                    const mapped = from === null ? null : tr.mapping.mapResult(from, 1);
                    const start = mapped && !mapped.deleted ? mapped.pos : null;
                    return {pos: selectedImagePos(state), start};
                },
            },
            view: (view) => {
                popup = new ImagePopupView(view, options);
                return popup;
            },
            props: {
                handleKeyDown: keydownHandler({
                    Enter: () => popup?.open() ?? false,
                    Escape: () => popup?.dismiss.onEscapeDown() ?? false,
                }),
                handleClickOn: (view, _pos, node) => {
                    if (node.type === bannerImageNodeType(view.state.schema)) popup?.show();
                    return false;
                },
                handleDOMEvents: {
                    focus: (view) => {
                        popup?.update(view);
                        return false;
                    },
                    focusout: (_view, event) => {
                        popup?.dismiss.onFocusOut(event);
                        return false;
                    },
                },
            },
        });
    return {plugin, focus, show};
}
