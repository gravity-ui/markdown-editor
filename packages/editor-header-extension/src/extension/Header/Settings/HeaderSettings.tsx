import {useId, useLayoutEffect, useState} from 'react';

import {Xmark} from '@gravity-ui/icons';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    type HeaderDimensions,
    headerDimensions,
    headerHeights,
    headerWidths,
} from '@gravity-ui/markdown-plugin-header';
import {Button, Icon, Portal, Text} from '@gravity-ui/uikit';

import {i18n} from '../../../i18n';
import {setHeaderDimensions} from '../commands';
import {headerNodeType} from '../const';

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
    if (node?.type !== headerNodeType(view.state.schema)) return null;
    const {height, width} = headerDimensions(node.attrs);
    const update = (attrs: Partial<HeaderDimensions>) =>
        setHeaderDimensions(pos, attrs)(view.state, view.dispatch);
    return (
        <Portal>
            <section
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
                        className="g-md-header-settings__close"
                        view="flat"
                        size="l"
                        aria-label={i18n('close')}
                        onClick={onClose}
                    >
                        <Icon data={Xmark} size={16} />
                    </Button>
                </div>
                <DimensionSelect
                    label={i18n('height')}
                    value={height}
                    values={headerHeights}
                    format={(value) => value.toUpperCase()}
                    onUpdate={(value) => update({height: value})}
                />
                <DimensionSelect
                    label={i18n('width')}
                    value={width}
                    values={headerWidths}
                    format={(value) =>
                        value === 'full' ? i18n('full-width') : value.toUpperCase()
                    }
                    onUpdate={(value) => update({width: value})}
                />
            </section>
        </Portal>
    );
}
