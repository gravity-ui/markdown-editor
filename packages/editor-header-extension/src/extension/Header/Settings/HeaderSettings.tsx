import {useId} from 'react';

import {Xmark} from '@gravity-ui/icons';
import {cn} from '@gravity-ui/markdown-editor';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    type HeaderDimensions,
    headerDimensions,
    headerHeights,
    headerWidths,
} from '@gravity-ui/markdown-plugin-header';
import {Button, Icon, Portal, Text} from '@gravity-ui/uikit';

import {i18n} from '../../../i18n';
import {headerNodeType} from '../HeaderSpecs';
import {setHeaderDimensions} from '../commands';
import {STOP_EVENT_CLASSNAME} from '../const';

import {DimensionSelect} from './DimensionSelect';

import './HeaderSettings.scss';

const b = cn('header-settings');

type HeaderSettingsProps = {
    view: EditorView;
    pos: number;
    onClose: () => void;
};

export function HeaderSettings({view, pos, onClose}: HeaderSettingsProps) {
    const titleId = useId();
    const node = view.state.doc.nodeAt(pos);
    if (node?.type !== headerNodeType(view.state.schema)) return null;
    const block = view.nodeDOM(pos);
    if (!(block instanceof HTMLElement)) return null;
    const {height, width} = headerDimensions(node.attrs);
    const update = (attrs: Partial<HeaderDimensions>) =>
        setHeaderDimensions(pos, attrs)(view.state, view.dispatch);
    return (
        <Portal container={block}>
            <section
                className={b(null, STOP_EVENT_CLASSNAME)}
                role="dialog"
                contentEditable={false}
                aria-labelledby={titleId}
                data-qa="header-settings"
            >
                <div className={b('title')}>
                    <Text variant="subheader-3" id={titleId}>
                        {i18n('title')}
                    </Text>
                    <Button
                        className={b('close')}
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
