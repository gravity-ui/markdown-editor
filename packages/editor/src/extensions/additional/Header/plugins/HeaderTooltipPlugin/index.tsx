import {Plugin} from 'prosemirror-state';

import {BaseTooltipPluginView} from 'src/plugins/BaseTooltip';
import type {FileUploadHandler} from 'src/utils/upload';

import {headerType} from '../../HeaderSpecs';

import {HeaderToolbar} from './HeaderToolbar';

export const headerTooltipPlugin = (fileUploadHandler?: FileUploadHandler) =>
    new Plugin({
        view(view) {
            return new BaseTooltipPluginView(view, {
                idPrefix: 'header-tooltip',
                nodeType: headerType(view.state.schema),
                popupPlacement: ['bottom', 'top'],
                content: (editorView, {node, pos}) => (
                    <HeaderToolbar
                        node={node}
                        pos={pos}
                        editorView={editorView}
                        fileUploadHandler={fileUploadHandler}
                    />
                ),
            });
        },
    });
