import React from 'react';

import {Node} from 'prosemirror-model';
import {Transaction} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';

import {ExtensionDeps} from '../../../../core';
import {normalizeUrlFactory} from '../../../../extensions/markdown';
import {fileType} from '../../../../extensions/yfm';
import {FileUploadHandler} from '../../../../utils/upload';
import {ReactWidgetDescriptor, removeDecoration} from '../../WidgetDecoration';
import {YfmFilesUploadProcessBase} from '../YfmFilePaste/upload';

import {FilePlaceholder, FilePlaceholderProps} from './view';

export const addWidget = (
    tr: Transaction,
    deps: ExtensionDeps,
    uploadFiles?: FileUploadHandler,
) => {
    return new FileWidgetDescriptor(tr.selection.from, deps, uploadFiles).applyTo(tr);
};

export const removeWidget = removeDecoration;

class FileWidgetDescriptor extends ReactWidgetDescriptor {
    private readonly domElem;
    private readonly deps;
    private readonly uploadFiles;

    private widgetHandler: FileWidgetHandler | null = null;

    constructor(initPos: number, deps: ExtensionDeps, uploadFiles?: FileUploadHandler) {
        super(initPos, 'file_placeholder');
        this.uploadFiles = uploadFiles;
        this.domElem = document.createElement('span');
        this.deps = deps;
    }

    getWidgetHandler(view: EditorView, getPos: () => number): FileWidgetHandler {
        if (!this.widgetHandler) {
            this.widgetHandler = new FileWidgetHandler(
                {
                    view,
                    getPos,
                    decoId: this.id,
                    uploadFiles: this.uploadFiles,
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
        this.widgetHandler = null;
    }
}

type FileWidgetHandlerProps = {
    decoId: string;
    view: EditorView;
    getPos: () => number;
    uploadFiles?: FileUploadHandler;
};

class FileWidgetHandler {
    private view;
    private getPos;

    private readonly decoId: string;
    private readonly uploadFiles;
    private readonly normalizeUrl;

    constructor({decoId, view, getPos, uploadFiles}: FileWidgetHandlerProps, deps: ExtensionDeps) {
        this.decoId = decoId;
        this.view = view;
        this.getPos = getPos;
        this.uploadFiles = uploadFiles;
        this.normalizeUrl = normalizeUrlFactory(deps);
    }

    renderWidgetView(view: EditorView, getPos: () => number): React.ReactElement {
        this.view = view;
        this.getPos = getPos;
        return (
            <FilePlaceholder
                onCancel={this.onCancel}
                onSubmit={this.onSubmit}
                onAttach={this.uploadFiles && this.onAttach}
            />
        );
    }

    private onCancel: FilePlaceholderProps['onCancel'] = () => {
        this.view.dispatch(removeDecoration(this.view.state.tr, this.decoId));
        this.view.focus();
    };

    private onSubmit: FilePlaceholderProps['onSubmit'] = (params) => {
        if (!params.src || !params.name) return;

        const href = this.normalizeUrl(params.src)?.url;
        const download = params.name;

        if (!href) return;

        const node = fileType(this.view.state.schema).create({href, download});
        this.insertNodes([node]);
    };

    private onAttach: FilePlaceholderProps['onAttach'] = async (files) => {
        if (!this.uploadFiles) return;

        const {view} = this;
        new YfmFileWidgetUploadProcess(view, files, this.uploadFiles, this.getPos()).run();
        view.dispatch(removeWidget(view.state.tr, this.decoId));
        view.focus();
    };

    private insertNodes(fileNodes: Node[]) {
        let tr = this.view.state.tr;
        tr = tr.insert(tr.mapping.map(this.getPos()), fileNodes);
        tr = removeWidget(tr, this.decoId);
        this.view.dispatch(tr);
        this.view.focus();
    }
}

class YfmFileWidgetUploadProcess extends YfmFilesUploadProcessBase {
    private readonly skeletonInitPos;

    constructor(
        view: EditorView,
        files: readonly File[],
        uploadHandler: FileUploadHandler,
        position: number,
    ) {
        super(view, files, uploadHandler);

        this.skeletonInitPos = position;
    }

    protected getSkeletonInitPos(): number {
        return this.skeletonInitPos;
    }
}
