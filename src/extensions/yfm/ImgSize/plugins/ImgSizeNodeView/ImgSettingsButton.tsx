import React from 'react';

import {Ellipsis} from '@gravity-ui/icons';
import {Button, Icon, Menu, Popup, PopupPlacement} from '@gravity-ui/uikit';
import {Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

import {cn} from '../../../../../classname';
import {i18n as i18nCommon} from '../../../../../i18n/common';
import {useBooleanState, useElementState} from '../../../../../react-utils/hooks';

import {ImageForm} from './ImageForm';

import './ImgSettingsButton.scss';

const b = cn('img-settings-button');

export const ImgSettingsButton: React.FC<{
    node: Node;
    view: EditorView;
    getPos: () => number | undefined;
    updateAttributes: (o: object) => void;
    nodeElement: HTMLElement | null;
    visible: boolean;
    toggleEdit: () => void;
    edit: boolean;
    unsetEdit: () => void;
    onDelete: () => void;
}> = function ({
    node,
    view,
    updateAttributes,
    visible,
    edit,
    toggleEdit,
    nodeElement,
    unsetEdit,
    onDelete,
}) {
    const [_anchorElement, setAnchorElement] = useElementState();
    const [popupOpen, setPopupOpen, unsetPopupOpen] = useBooleanState(false);
    const placement: PopupPlacement = ['bottom-end', 'bottom-start'];

    const handleEdit = () => {
        toggleEdit();
        unsetPopupOpen();
    };

    const isVisibleImageForm = edit;
    const isVisibleEditButton = !edit && (visible || popupOpen);
    const isVisiblePopup = !edit && popupOpen;

    const handleEditButtonClick = (event: React.MouseEvent<HTMLElement>) => {
        // debugger;
        event.preventDefault();
        setPopupOpen();
    };

    return (
        <>
            {isVisibleImageForm && (
                <ImageForm
                    node={node}
                    view={view}
                    updateAttributes={updateAttributes}
                    anchorElement={nodeElement}
                    unsetEdit={unsetEdit}
                />
            )}

            {isVisibleEditButton && (
                // <Button
                //     onClick={handleEditButtonClick}
                //     ref={setAnchorElement}
                //     size="s"
                //     view={'raised'}
                //     className={b()}
                // >
                //     <Icon data={Ellipsis} />
                // </Button>
                <></>
            )}

            <Button
                onClick={handleEditButtonClick}
                ref={setAnchorElement}
                size="s"
                view={'raised'}
                className={b()}
            >
                <Icon data={Ellipsis} />
            </Button>

            <Popup
                open={isVisiblePopup}
                anchorElement={nodeElement}
                // onOpenChange={(_0, _1, reason) => {
                //     if (reason !== 'focus-out') unsetPopupOpen();
                // }}
                placement={placement}
            >
                <Menu>
                    <Menu.Item onClick={handleEdit}>{i18nCommon('edit')}</Menu.Item>
                    <Menu.Item onClick={onDelete}>{i18nCommon('delete')}</Menu.Item>
                </Menu>
            </Popup>
        </>
    );
};
