import {useMemo} from 'react';

import {Xmark} from '@gravity-ui/icons';
import {Button, Icon, Popup, type PopupAnchorElement, Select, Text} from '@gravity-ui/uikit';

import type {Node} from '#pm/model';
import type {EditorView} from '#pm/view';
import {cn} from 'src/classname';
import {i18n} from 'src/i18n/header';

import {HeaderAttr, HeaderHeight, normalizeHeaderHeight} from '../../HeaderSpecs';

import './HeaderSettings.scss';

const b = cn('header-settings');

const heightOptions = Object.values(HeaderHeight).map((value) => ({
    value,
    content: value.toUpperCase(),
}));

/** Вертикальная линия по правой границе блока: попап прижимается к ней, а не к кнопке. */
const rightEdgeOf = (view: EditorView, pos: number): PopupAnchorElement => {
    // DOM блока пересоздаётся при смене атрибутов, поэтому берётся при каждом расчёте.
    const block = () => (view.nodeDOM(pos) as Element | null) ?? undefined;
    return {
        get contextElement() {
            return block();
        },
        getBoundingClientRect() {
            const rect = block()?.getBoundingClientRect() ?? new DOMRect();
            return new DOMRect(rect.right, rect.top, 0, rect.height);
        },
    };
};

export type HeaderSettingsProps = {
    node: Node;
    pos: number;
    editorView: EditorView;
    onClose: () => void;
};

export function HeaderSettings({node, pos, editorView, onClose}: HeaderSettingsProps) {
    const anchor = useMemo(() => rightEdgeOf(editorView, pos), [editorView, pos]);

    const setHeight = ([value]: string[]) => {
        editorView.dispatch(
            editorView.state.tr.setNodeAttribute(
                pos,
                HeaderAttr.Height,
                normalizeHeaderHeight(value),
            ),
        );
    };

    return (
        <Popup
            open
            anchorElement={anchor}
            placement={['right-start', 'left-start']}
            offset={{mainAxis: 8}}
            onOpenChange={(open) => open || onClose()}
        >
            <div className={b()}>
                <div className={b('title')}>
                    <Text variant="subheader-3">{i18n('settings_title')}</Text>
                    <Button view="flat" size="m" title={i18n('close')} onClick={onClose}>
                        <Icon data={Xmark} />
                    </Button>
                </div>
                <div className={b('item')}>
                    <Text className={b('label')}>{i18n('height')}</Text>
                    <Select
                        className={b('control')}
                        value={[node.attrs[HeaderAttr.Height]]}
                        options={heightOptions}
                        onUpdate={setHeight}
                    />
                </div>
            </div>
        </Popup>
    );
}
