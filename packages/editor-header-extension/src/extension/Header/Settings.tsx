import {useId, useLayoutEffect, useState} from 'react';

import {Xmark} from '@gravity-ui/icons';
import {EditorPopup} from '@gravity-ui/markdown-editor/_/plugins/BaseTooltip/EditorPopup.js';
import {getReactRendererFromState} from '@gravity-ui/markdown-editor/extensions';
import {NodeSelection, Plugin, PluginKey} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    headerHeights,
    headerWidths,
    isHeaderHeight,
    isHeaderWidth,
} from '@gravity-ui/markdown-plugin-header';
import {Button, Icon, Select, Text} from '@gravity-ui/uikit';

import {i18n} from '../../i18n';

import {setHeaderDimensions} from './commands';
import {headerNodeName} from './specs';

import './settings.scss';

/** Position of the header whose settings are open. */
export const headerSettingsKey = new PluginKey<number | null>('headerSettings');

function HeaderSettings({view}: {view: EditorView}) {
    const heightId = useId();
    const widthId = useId();
    const titleId = useId();
    // The markup editor renders the same items while this view is detached from the document.
    const [connected, setConnected] = useState(false);
    useLayoutEffect(() => setConnected(view.dom.isConnected), [view]);
    const pos = headerSettingsKey.getState(view.state);
    if (!connected || typeof pos !== 'number') return null;
    const node = view.state.doc.nodeAt(pos);
    const anchor = view.nodeDOM(pos);
    if (node?.type.name !== headerNodeName || !(anchor instanceof HTMLElement)) return null;
    const close = () => view.dispatch(view.state.tr.setMeta(headerSettingsKey, null));
    return (
        <EditorPopup
            editorElement={view.dom}
            anchorElement={anchor}
            placement={['bottom-start', 'top-start']}
            onOpenChange={(nextOpen, _event, reason) => {
                if (nextOpen) return;
                close();
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
                            close();
                            view.focus();
                        }}
                    >
                        <Icon data={Xmark} size={16} />
                    </Button>
                </div>
                <div className="g-md-header-settings__row">
                    <Text variant="body-1" id={heightId}>
                        {i18n('height')}
                    </Text>
                    <Select
                        size="m"
                        width={158}
                        aria-labelledby={heightId}
                        value={[node.attrs.height]}
                        options={headerHeights.map((value) => ({
                            value,
                            content: value.toUpperCase(),
                        }))}
                        onUpdate={([height]) => {
                            if (isHeaderHeight(height))
                                setHeaderDimensions(view.state, view.dispatch, view, {height});
                        }}
                    />
                </div>
                <div className="g-md-header-settings__row">
                    <Text variant="body-1" id={widthId}>
                        {i18n('width')}
                    </Text>
                    <Select
                        size="m"
                        width={158}
                        aria-labelledby={widthId}
                        value={[node.attrs.width]}
                        options={headerWidths.map((value) => ({
                            value,
                            content: value === 'full' ? i18n('full-width') : value.toUpperCase(),
                        }))}
                        onUpdate={([width]) => {
                            if (isHeaderWidth(width))
                                setHeaderDimensions(view.state, view.dispatch, view, {width});
                        }}
                    />
                </div>
            </div>
        </EditorPopup>
    );
}

export const headerSettingsPlugin = () =>
    new Plugin<number | null>({
        key: headerSettingsKey,
        state: {
            init: () => null,
            apply(tr, open) {
                const requested: number | null | undefined = tr.getMeta(headerSettingsKey);
                if (requested !== undefined) return requested;
                if (open === null) return null;
                const {pos, deleted} = tr.mapping.mapResult(open);
                return !deleted &&
                    tr.selection instanceof NodeSelection &&
                    tr.selection.from === pos
                    ? pos
                    : null;
            },
        },
        view(view) {
            const renderer = getReactRendererFromState(view.state);
            let item: ReturnType<typeof renderer.createItem> | undefined;
            function update() {
                if (!view.editable || headerSettingsKey.getState(view.state) === null) {
                    item?.remove();
                    item = undefined;
                } else if (item) item.rerender();
                else
                    item = renderer.createItem('header-settings', () => (
                        <HeaderSettings view={view} />
                    ));
            }
            update();
            return {update, destroy: () => item?.remove()};
        },
    });
