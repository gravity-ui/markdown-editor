import type {EditorView} from '#pm/view';
import {BaseTooltipPluginView} from 'src/plugins/BaseTooltip';

import {codeBlockType} from '../../CodeBlockSpecs';
import {getCodeBlockLangsState} from '../plugins/codeBlockLangsPlugin';

import {CodeBlockToolbar} from './CodeBlockToolbar';

import './TooltipView.scss';

type Options = {
    showCodeWrapping: boolean;
    showLineNumbers: boolean;
};

export const codeLangSelectTooltipViewCreator = (
    view: EditorView,
    {showCodeWrapping, showLineNumbers}: Options,
) => {
    return new BaseTooltipPluginView(view, {
        idPrefix: 'code-block-tooltip',
        nodeType: codeBlockType(view.state.schema),
        popupPlacement: ['bottom', 'top'],
        content: (view, {node, pos}, _onChange, _forceEdit, _onOutsideClick, rerender) => {
            const {langItems, aliasMapping} = getCodeBlockLangsState(view.state);

            return (
                <CodeBlockToolbar
                    pos={pos}
                    node={node}
                    editorView={view}
                    mapping={aliasMapping}
                    langItems={langItems}
                    rerenderTooltip={rerender}
                    showLineNumbers={showLineNumbers}
                    showCodeWrapping={showCodeWrapping}
                />
            );
        },
    });
};
