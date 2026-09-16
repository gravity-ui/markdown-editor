import {Plugin} from '#pm/state';
import {BaseTooltipPluginView} from 'src/plugins/BaseTooltip';
import type {FileUploadHandler} from 'src/utils/upload';

import {headerType} from '../../HeaderSpecs';

import {HeaderToolbar} from './HeaderToolbar';

export type HeaderTooltipOptions = {fileUploadHandler?: FileUploadHandler};

class HeaderTooltipView extends BaseTooltipPluginView {
    protected updateTooltipView() {
        this.setCurrentNode(headerType(this.view.state.schema));
        this.render();
    }
}

export const headerTooltipPlugin = (opts: HeaderTooltipOptions = {}) =>
    new Plugin({
        view(view) {
            return new HeaderTooltipView(view, {
                idPrefix: 'header-tooltip',
                nodeType: headerType(view.state.schema),
                popupPlacement: ['bottom', 'top'],
                content: (editorView, {node, pos}) => (
                    <HeaderToolbar
                        node={node}
                        pos={pos}
                        editorView={editorView}
                        fileUploadHandler={opts.fileUploadHandler}
                    />
                ),
            });
        },
    });
