import React, {RefObject, useRef} from 'react';

import {ArrowRight} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';
import {Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

import {useNodeHovered} from '../../../../../react-utils/useNodeHovered';

export const ImgDragButton: React.FC<{
    node: Node;
    view: EditorView;
    getPos: () => number | undefined;
    nodeRef: RefObject<HTMLElement>;
    updateAttributes: (o: object) => void;
}> = function ({nodeRef}) {
    const buttonRef = useRef<HTMLDivElement>(null);

    const isNodeHovered = useNodeHovered(nodeRef);
    const isButtonHovered = useNodeHovered(buttonRef);

    const visible = isNodeHovered || isButtonHovered;

    return visible ? (
        <>
            <Button
                onMouseEnter={() => {
                    console.log('sdfsdf');
                }}
                ref={buttonRef}
                size="s"
                view={'raised'}
                style={{position: 'absolute', right: '3px', top: '30px'}}
            >
                <Icon data={ArrowRight} />
            </Button>
        </>
    ) : null;
};
