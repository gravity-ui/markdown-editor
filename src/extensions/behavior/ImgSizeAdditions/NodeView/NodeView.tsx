import React, {useRef} from 'react';

import {cn} from '../../../../classname';
import {ReactNodeViewProps} from '../../../../react-utils/react-node-view';

import {ImgSettingsButton} from './ImgSettingsButton';

import './ImgNodeView.scss';

export const cnImgSizeNodeView = cn('img-size-node-view');

export const ImageNodeView: React.FC<ReactNodeViewProps> = ({
    node,
    view,
    getPos,
    updateAttributes,
}) => {
    const ref = useRef<HTMLImageElement>(null);

    return (
        <>
            <ImgSettingsButton
                node={node}
                view={view}
                getPos={getPos}
                updateAttributes={updateAttributes}
                nodeRef={ref}
            />
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img {...node.attrs} ref={ref} />
        </>
    );
};
