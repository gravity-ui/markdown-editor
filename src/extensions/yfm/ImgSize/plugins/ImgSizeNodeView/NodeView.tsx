import React, {useRef} from 'react';

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

    console.log('ref', ref);

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
                onResize={({width, height}) => {
                    const updatedWidth = Math.round(width);
                    const updatedHeight = Math.round(height);

                    updateAttributes({
                        width:
                            isNumber(updatedWidth) && Number(updatedWidth) >= 0
                                ? String(updatedWidth)
                                : '',
                        height:
                            isNumber(updatedHeight) && Number(updatedHeight) >= 0
                                ? String(updatedHeight)
                                : '',
                        name: node.attrs[ImgSizeAttr.Title] || '',
                        alt: node.attrs[ImgSizeAttr.Alt] || '',
                    });
                }}
                alt={node.attrs[ImgSizeAttr.Alt]}
                height={node.attrs[ImgSizeAttr.Height]}
                ref={ref}
                src={node.attrs[ImgSizeAttr.Src]}
                width={node.attrs[ImgSizeAttr.Width]}
            />
        </>
    );
};
