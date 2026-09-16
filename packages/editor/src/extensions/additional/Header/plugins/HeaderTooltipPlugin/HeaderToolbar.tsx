import type {ReactNode} from 'react';

import {LayoutHeader, Link, Palette, Picture, Pill, Plus, TrashBin} from '@gravity-ui/icons';
import {Popup} from '@gravity-ui/uikit';

import type {Node} from '#pm/model';
import type {EditorView} from '#pm/view';
import {cn} from 'src/classname';
import {i18n} from 'src/i18n/header';
import {Toolbar, type ToolbarButtonPopupData, type ToolbarData, ToolbarDataType} from 'src/toolbar';
import type {FileUploadHandler} from 'src/utils/upload';

import {HeaderActionType, type HeaderAttrs} from '../../HeaderSpecs';
import {addHeaderAction, findHeaderAction, removeHeader, setHeaderAttrs} from '../../commands';

import {FillPalette} from './FillPalette';
import {ActionSettings, AppearanceSettings, ImageSettings} from './HeaderSettings';

import './HeaderToolbar.scss';

const b = cn('header-toolbar');

export type HeaderToolbarProps = {
    node: Node;
    pos: number;
    editorView: EditorView;
    fileUploadHandler?: FileUploadHandler;
};

export function HeaderToolbar({node, pos, editorView, fileUploadHandler}: HeaderToolbarProps) {
    const attrs = node.attrs as HeaderAttrs;
    const focus = () => editorView.focus();
    const update = (patch: Partial<HeaderAttrs>) => {
        const control = editorView.dom.ownerDocument.activeElement;
        // Synchronize the DOM selection before changing a block while a popup owns focus.
        editorView.focus();
        setHeaderAttrs(pos, patch)(editorView.state, editorView.dispatch);
        if (control instanceof HTMLElement && control.isConnected)
            control.focus({preventScroll: true});
    };
    const action = findHeaderAction(editorView.state);

    const popup = (
        id: string,
        icon: ToolbarButtonPopupData<EditorView>['icon']['data'],
        title: string,
        content: (close: () => void) => ReactNode,
    ): ToolbarButtonPopupData<EditorView> => ({
        id,
        type: ToolbarDataType.ButtonPopup,
        icon: {data: icon},
        title,
        isActive: () => false,
        isEnable: () => true,
        exec: () => {},
        renderPopup: ({hide, anchorElement}) => {
            const close = () => {
                hide();
                focus();
            };
            return (
                <Popup
                    open
                    disablePortal
                    disableFocusOut
                    returnFocus={false}
                    initialFocus={0}
                    anchorElement={anchorElement}
                    placement={['bottom', 'top']}
                    onOpenChange={(open, _event, reason) => {
                        if (!open) {
                            hide();
                            if (reason === 'escape-key') anchorElement?.focus();
                        }
                    }}
                >
                    {content(close)}
                </Popup>
            );
        },
    });

    const data: ToolbarData<EditorView> = [
        [
            popup('header-appearance', LayoutHeader, i18n('appearance'), () => (
                <AppearanceSettings attrs={attrs} onChange={update} />
            )),
            popup('header-fill', Palette, i18n('fill'), (close) => (
                <div className={b('palette')}>
                    <FillPalette
                        value={attrs.fill}
                        onSelect={(fill) => {
                            update({fill});
                            close();
                        }}
                    />
                </div>
            )),
            popup('header-image', Picture, i18n('bg.image'), (close) => (
                <ImageSettings
                    key={pos}
                    attrs={attrs}
                    pos={pos}
                    editorView={editorView}
                    fileUploadHandler={fileUploadHandler}
                    onChange={update}
                    onClose={close}
                />
            )),
        ],
        [
            {
                id: 'header-cta-add',
                type: ToolbarDataType.ListButton,
                icon: {data: Plus},
                title: i18n('cta.add'),
                data: [
                    {type: HeaderActionType.Button, icon: Pill, title: i18n('cta.type_button')},
                    {type: HeaderActionType.Link, icon: Link, title: i18n('cta.type_link')},
                ].map(({type, icon, title}) => ({
                    id: `header-cta-add-${type}`,
                    icon: {data: icon},
                    title,
                    isActive: () => false,
                    isEnable: () => addHeaderAction(pos, {type})(editorView.state),
                    exec: () => addHeaderAction(pos, {type})(editorView.state, editorView.dispatch),
                })),
            },
            ...(action
                ? [
                      popup('header-cta-edit', Link, i18n('cta.edit'), (close) => (
                          <ActionSettings
                              key={action.pos}
                              action={action}
                              editorView={editorView}
                              onClose={close}
                          />
                      )),
                  ]
                : []),
        ],
        [
            {
                id: 'header-remove',
                type: ToolbarDataType.SingleButton,
                icon: {data: TrashBin},
                title: i18n('remove'),
                theme: 'danger',
                isActive: () => false,
                isEnable: () => true,
                exec: () => removeHeader(pos)(editorView.state, editorView.dispatch),
            },
        ],
    ];

    return (
        <Toolbar
            editor={editorView}
            focus={focus}
            className={b()}
            qa="g-md-toolbar-header"
            data={data}
        />
    );
}
