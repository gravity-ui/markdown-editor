import React, {useCallback, useRef} from 'react';

import isNumber from 'is-number';

import {cn} from '../../../../../classname';
import {ReactNodeViewProps} from '../../../../../react-utils/react-node-view';
import {ImgSizeAttr} from '../../ImgSizeSpecs';

import {ImgSettingsButton} from './ImgSettingsButton';
import {ResizableImage} from './ResizableImage';

import './ImgNodeView.scss';

export const cnImgSizeNodeView = cn('img-size-node-view');

export const ImageNodeView: React.FC<ReactNodeViewProps> = ({
    node,
    view,
    getPos,
    updateAttributes,
}) => {
    const ref = useRef<HTMLImageElement>(null);
    const title = node.attrs[ImgSizeAttr.Title] || '';
    const alt = node.attrs[ImgSizeAttr.Alt] || '';

    const handleResize = useCallback(
        ({width}: {width: number}) => {
            const updatedWidth = Math.round(width);

            updateAttributes({
                width: isNumber(updatedWidth) && updatedWidth >= 0 ? String(updatedWidth) : '',
                height: '',
                name: title,
                alt,
            });
        },
        [alt, title, updateAttributes],
    );

    return (
        <>
            <ImgSettingsButton
                node={node}
                view={view}
                getPos={getPos}
                updateAttributes={updateAttributes}
                nodeRef={ref}
            />
            <ResizableImage
                onResize={handleResize}
                alt={node.attrs[ImgSizeAttr.Alt]}
                height={node.attrs[ImgSizeAttr.Height]}
                ref={ref}
                src={node.attrs[ImgSizeAttr.Src]}
                width={node.attrs[ImgSizeAttr.Width]}
            />
        </>
    );
};
