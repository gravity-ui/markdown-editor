import React from 'react';

import isNumber from 'is-number';
import {Node} from 'prosemirror-model';
import {Transaction} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';

import {ExtensionDeps} from '../../../../core';
import {FileUploadHandler} from '../../../../utils/upload';
import {ReactWidgetDescriptor, removeDecoration} from '../../../behavior/WidgetDecoration';
import {imageType, normalizeUrlFactory} from '../../../markdown';
import {ImgSizeAttr} from '../../../specs';
import {ImagesUploadProcess} from '../ImagePaste/upload';

import {FilePlaceholder, FilePlaceholderProps} from './view';

export const addWidget = (
    tr: Transaction,
    deps: ExtensionDeps,
    opts: ImageWidgetDescriptorOpts,
) => {
    return new ImageWidgetDescriptor(tr.selection.from, deps, opts).applyTo(tr);
};

export const removeWidget = removeDecoration;

export type ImageWidgetDescriptorOpts = {
    needToSetDimensionsForUploadedImages: boolean;
    uploadImages?: FileUploadHandler;
};

class ImageWidgetDescriptor extends ReactWidgetDescriptor {
    private readonly domElem;
    private readonly deps;
    private readonly uploadImages;
    private readonly needToSetDimensionsForUploadedImages: boolean;

    private widgetHandler: ImageWidgetHandler | null = null;

    constructor(initPos: number, deps: ExtensionDeps, opts: ImageWidgetDescriptorOpts) {
        super(initPos, 'image_placeholder');
        this.domElem = document.createElement('span');
        this.deps = deps;
        this.uploadImages = opts.uploadImages;
        this.needToSetDimensionsForUploadedImages = opts.needToSetDimensionsForUploadedImages;
    }

    getWidgetHandler(view: EditorView, getPos: () => number): ImageWidgetHandler {
        if (!this.widgetHandler) {
            this.widgetHandler = new ImageWidgetHandler(
                {
                    view,
                    getPos,
                    decoId: this.id,
                    uploadImages: this.uploadImages,
                    needToSetDimensionsForUploadedImages: this.needToSetDimensionsForUploadedImages,
                },
                this.deps,
            );
        }
        return this.widgetHandler;
    }

    getDomElem(): HTMLElement {
        return this.domElem;
    }

    renderReactElement(view: EditorView, getPos: () => number): React.ReactElement {
        return this.getWidgetHandler(view, getPos).renderWidgetView(view, getPos);
    }

    remove(): void {
        super.remove();
        this.widgetHandler?.destruct();
        this.widgetHandler = null;
    }
}

type ImageWidgetHandlerProps = {
    decoId: string;
    view: EditorView;
    getPos: () => number;
    uploadImages?: FileUploadHandler;
    needToSetDimensionsForUploadedImages: boolean;
};

class ImageWidgetHandler {
    private view;
    private getPos;

    private readonly decoId: string;
    private readonly uploadImages;
    private readonly normalizeUrl;
    private readonly needToSetDimensionsForUploadedImages: boolean;

    private cancelled = false;

    constructor(
        {
            decoId,
            view,
            getPos,
            uploadImages,
            needToSetDimensionsForUploadedImages,
        }: ImageWidgetHandlerProps,
        deps: ExtensionDeps,
    ) {
        this.decoId = decoId;
        this.view = view;
        this.getPos = getPos;
        this.uploadImages = uploadImages;
        this.normalizeUrl = normalizeUrlFactory(deps);
        this.needToSetDimensionsForUploadedImages = needToSetDimensionsForUploadedImages;
    }

    destruct() {
        this.cancelled = true;
    }

    renderWidgetView(view: EditorView, getPos: () => number): React.ReactElement {
        this.view = view;
        this.getPos = getPos;
        return (
            <FilePlaceholder
                onCancel={this.onCancel}
                onSubmit={this.onSubmit}
                onAttach={this.uploadImages && this.onAttach}
            />
        );
    }

    private onCancel: FilePlaceholderProps['onCancel'] = () => {
        this.cancelled = true;
        this.view.dispatch(removeDecoration(this.view.state.tr, this.decoId));
        this.view.focus();
    };

    private onSubmit: FilePlaceholderProps['onSubmit'] = (params) => {
        if (this.cancelled) return;

        const url = this.normalizeUrl(params.url)?.url;
        if (!url) return;

        const attrs = {
            [ImgSizeAttr.Src]: url,
            [ImgSizeAttr.Title]: params.name,
            [ImgSizeAttr.Alt]: params.alt,
            [ImgSizeAttr.Width]: isNumber(params.width) ? String(params.width) : null,
            [ImgSizeAttr.Height]: isNumber(params.height) ? String(params.height) : null,
        };

        const node = imageType(this.view.state.schema).create(attrs);
        this.insertNodes([node]);
    };

    private onAttach: FilePlaceholderProps['onAttach'] = async (files) => {
        if (this.cancelled || !this.uploadImages) return;

        const {view} = this;
        new ImagesUploadProcess(view, files, this.uploadImages, this.getPos(), {
            needDimensions: this.needToSetDimensionsForUploadedImages,
        }).run();
        view.dispatch(removeWidget(view.state.tr, this.decoId));
        view.focus();
    };

    private insertNodes(fileNodes: Node[]) {
        if (this.cancelled) return;

        let tr = this.view.state.tr;
        tr = tr.insert(tr.mapping.map(this.getPos()), fileNodes);
        tr = removeWidget(tr, this.decoId);
        this.view.dispatch(tr);
        this.view.focus();
    }
}
