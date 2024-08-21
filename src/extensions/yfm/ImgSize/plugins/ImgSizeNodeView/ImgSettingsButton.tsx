import React, {RefObject, useEffect, useRef} from 'react';

import {Ellipsis} from '@gravity-ui/icons';
import {Button, Icon, Menu, Popup, PopupPlacement} from '@gravity-ui/uikit';
import {Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

import {i18n as i18nCommon} from '../../../../../i18n/common';
import {useBooleanState} from '../../../../../react-utils/hooks';
import {useNodeEditing} from '../../../../../react-utils/useNodeEditing';
import {useNodeHovered} from '../../../../../react-utils/useNodeHovered';
import {removeNode} from '../../../../../utils/remove-node';
import {imageRendererKey} from '../../const';

import {ImageForm} from './ImageForm';

export const ImgSettingsButton: React.FC<{
    node: Node;
    view: EditorView;
    getPos: () => number | undefined;
    nodeRef: RefObject<HTMLElement>;
    updateAttributes: (o: object) => void;
}> = function ({node, view, getPos, nodeRef, updateAttributes}) {
    const [popupOpen, setPopupOpen, unsetPopupOpen] = useBooleanState(false);
    const placement: PopupPlacement = ['bottom-end', 'bottom-start'];
    const buttonRef = useRef<HTMLDivElement>(null);

    const isNodeHovered = useNodeHovered(nodeRef);
    const isButtonHovered = useNodeHovered(buttonRef);

    const [edit, setEditing, unsetEdit, toggleEdit] = useNodeEditing({nodeRef, view});
    const visible = (isNodeHovered || isButtonHovered || popupOpen) && !edit;

    useEffect(() => {
        if (imageRendererKey.getState(view.state)?.linkAdded) {
            setEditing();
        }
    }, [view, setEditing]);

    if (edit)
        return (
            <ImageForm
                node={node}
                view={view}
                updateAttributes={updateAttributes}
                dom={nodeRef}
                unsetEdit={unsetEdit}
            />
        );

    return visible ? (
        <>
            <Button
                onClick={setPopupOpen}
                ref={buttonRef}
                size="s"
                view={'raised'}
                style={{position: 'absolute', right: '3px', top: '3px', zIndex: '2'}}
            >
                <Icon data={Ellipsis} />
            </Button>
            <Popup
                open={popupOpen}
                anchorRef={buttonRef}
                onClose={unsetPopupOpen}
                placement={placement}
            >
                <Menu>
                    <Menu.Item
                        onClick={() => {
                            toggleEdit();
                            unsetPopupOpen();
                        }}
                    >
                        {i18nCommon('edit')}
                    </Menu.Item>
                    <Menu.Item
                        onClick={() => {
                            const pos = getPos();
                            if (pos === undefined) return;
                            removeNode({
                                node,
                                pos,
                                tr: view.state.tr,
                                dispatch: view.dispatch,
                            });
                            view.focus();
                        }}
                    >
                        {i18nCommon('delete')}
                    </Menu.Item>
                </Menu>
            </Popup>
        </>
    ) : null;
};
