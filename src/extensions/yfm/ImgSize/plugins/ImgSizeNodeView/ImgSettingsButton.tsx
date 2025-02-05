import {RefObject, useRef} from 'react';

import {Ellipsis} from '@gravity-ui/icons';
import {Button, Icon, Menu, Popup, PopupPlacement} from '@gravity-ui/uikit';
import {Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

import {cn} from '../../../../../classname';
import {i18n as i18nCommon} from '../../../../../i18n/common';
import {useBooleanState} from '../../../../../react-utils/hooks';

import {ImageForm} from './ImageForm';

import './ImgSettingsButton.scss';

const b = cn('img-settings-button');

export const ImgSettingsButton: React.FC<{
    node: Node;
    view: EditorView;
    getPos: () => number | undefined;
    updateAttributes: (o: object) => void;
    nodeRef: RefObject<HTMLDivElement>;
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
    nodeRef,
    unsetEdit,
    onDelete,
}) {
    const [popupOpen, setPopupOpen, unsetPopupOpen] = useBooleanState(false);
    const placement: PopupPlacement = ['bottom-end', 'bottom-start'];
    const buttonRef = useRef<HTMLDivElement>(null);

    const handleEdit = () => {
        toggleEdit();
        unsetPopupOpen();
    };

    const isVisibleImageForm = edit;
    const isVisibleEditButton = !edit && (visible || popupOpen);
    const isVisiblePopup = !edit && popupOpen;

    const handleEditButtonClick = (event: React.MouseEvent<HTMLElement>) => {
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
                    dom={nodeRef}
                    unsetEdit={unsetEdit}
                />
            )}

            {isVisibleEditButton && (
                <Button
                    onClick={handleEditButtonClick}
                    ref={buttonRef}
                    size="s"
                    view={'raised'}
                    className={b()}
                >
                    <Icon data={Ellipsis} />
                </Button>
            )}

            <Popup
                open={isVisiblePopup}
                anchorRef={buttonRef}
                onClose={unsetPopupOpen}
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
