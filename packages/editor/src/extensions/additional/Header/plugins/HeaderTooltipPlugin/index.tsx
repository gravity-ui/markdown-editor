import type {ExtensionDeps} from '#core';
import {Plugin} from '#pm/state';
import {normalizeUrlFactory} from 'src/extensions/markdown/Link/utils';
import {BaseTooltipPluginView} from 'src/plugins/BaseTooltip';
import type {FileUploadHandler} from 'src/utils/upload';

import {headerType} from '../../HeaderSpecs';
import {getHeaderTargets} from '../targets';

import {HeaderToolbar} from './HeaderToolbar';

export type HeaderTooltipOptions = {fileUploadHandler?: FileUploadHandler};

class HeaderTooltipView extends BaseTooltipPluginView {
    protected updateTooltipView() {
        this.setCurrentNode(headerType(this.view.state.schema));
        this.render();
    }
}

export const headerTooltipPlugin = (deps: ExtensionDeps, opts: HeaderTooltipOptions = {}) => {
    const normalize = normalizeUrlFactory(deps);
    const normalizeUrl = (url: string) => normalize(url)?.url ?? null;
    return new Plugin({
        view(view) {
            return new HeaderTooltipView(view, {
                idPrefix: 'header-tooltip',
                nodeType: headerType(view.state.schema),
                popupPlacement: ['bottom', 'top'],
                content: (editorView, {node, pos}) => (
                    <HeaderToolbar
                        key={getHeaderTargets(editorView.state)?.header.id}
                        node={node}
                        pos={pos}
                        editorView={editorView}
                        fileUploadHandler={opts.fileUploadHandler}
                        normalizeUrl={normalizeUrl}
                    />
                ),
            });
        },
    });
};
