import {useId, useLayoutEffect, useState} from 'react';

import {Xmark} from '@gravity-ui/icons';
import {EditorPopup} from '@gravity-ui/markdown-editor/_/plugins/BaseTooltip/EditorPopup.js';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {headerDimensions, headerHeights, headerWidths} from '@gravity-ui/markdown-plugin-header';
import {Button, Icon, Text} from '@gravity-ui/uikit';

import {i18n} from '../../../i18n';
import {setHeaderDimensions} from '../commands';
import {headerNodeName} from '../const';

import {DimensionSelect} from './DimensionSelect';

import './HeaderSettings.scss';

type HeaderSettingsProps = {
    view: EditorView;
    pos: number;
    onClose: () => void;
};

export function HeaderSettings({view, pos, onClose}: HeaderSettingsProps) {
    const titleId = useId();
    // The markup editor renders the same items while this view is detached from the document.
    const [connected, setConnected] = useState(false);
    useLayoutEffect(() => setConnected(view.dom.isConnected), [view]);
    if (!connected) return null;
    const node = view.state.doc.nodeAt(pos);
    const anchor = view.nodeDOM(pos);
    if (node?.type.name !== headerNodeName || !(anchor instanceof HTMLElement)) return null;
    const {height, width} = headerDimensions(node.attrs);
    return (
        <EditorPopup
            editorElement={view.dom}
            anchorElement={anchor}
            placement={['bottom-start', 'top-start']}
            onOpenChange={(nextOpen, _event, reason) => {
                if (nextOpen) return;
                onClose();
                if (reason === 'escape-key') view.focus();
            }}
        >
            <div
                className="g-md-header-settings"
                role="dialog"
                aria-labelledby={titleId}
                data-qa="header-settings"
            >
                <div className="g-md-header-settings__title">
                    <Text variant="subheader-3" id={titleId}>
                        {i18n('title')}
                    </Text>
                    <Button
                        view="flat"
                        size="s"
                        aria-label={i18n('close')}
                        onClick={() => {
                            onClose();
                            view.focus();
                        }}
                    >
                        <Icon data={Xmark} size={16} />
                    </Button>
                </div>
                <DimensionSelect
                    label={i18n('height')}
                    value={height}
                    values={headerHeights}
                    format={(value) => value.toUpperCase()}
                    onUpdate={(value) =>
                        setHeaderDimensions(view.state, view.dispatch, view, {height: value})
                    }
                />
                <DimensionSelect
                    label={i18n('width')}
                    value={width}
                    values={headerWidths}
                    format={(value) =>
                        value === 'full' ? i18n('full-width') : value.toUpperCase()
                    }
                    onUpdate={(value) =>
                        setHeaderDimensions(view.state, view.dispatch, view, {width: value})
                    }
                />
            </div>
        </EditorPopup>
    );
}
