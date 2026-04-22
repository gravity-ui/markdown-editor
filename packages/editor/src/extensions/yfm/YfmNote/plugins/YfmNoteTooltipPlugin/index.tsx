import {Plugin} from 'prosemirror-state';

import type {ExtensionDeps} from '#core';
import {BaseTooltipPluginView} from 'src/plugins/BaseTooltip';

import {noteType} from '../../utils';

import {YfmNoteToolbar} from './YfmNoteToolbar';

export const yfmNoteTooltipPlugin = (_deps: ExtensionDeps) =>
    new Plugin({
        view(view) {
            return new BaseTooltipPluginView(view, {
                idPrefix: 'yfm-note-tooltip',
                nodeType: noteType(view.state.schema),
                popupPlacement: ['bottom', 'top'],
                content: (view, {node, pos}) => (
                    <YfmNoteToolbar node={node} pos={pos} editorView={view} />
                ),
            });
        },
    });
