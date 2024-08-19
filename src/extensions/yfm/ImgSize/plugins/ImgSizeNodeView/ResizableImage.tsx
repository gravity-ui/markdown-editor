import React, {MutableRefObject, forwardRef, useState} from 'react';

import {cn} from '../../../../../classname';

import './ResizableImage.scss';

interface ResizableImageProps {
    alt: string;
    height: number;
    src: string;
    width: number;
    onResize?: ({width, height}: {width: number; height: number}) => void;
}

const b = cn('resizable-image');

const noop = () => {};

export const ResizableImage = forwardRef<HTMLImageElement, ResizableImageProps>(
    ({src, alt, width, height, onResize = noop}, ref) => {
        const [dimensions, setDimensions] = useState({width, height});

        const startResizing = () => {
            const img = (ref as MutableRefObject<HTMLImageElement | null>)?.current;

            if (img) {
                const aspectRatio = img.naturalWidth / img.naturalHeight;

                const onMouseMove = (e: MouseEvent) => {
                    const newWidth = e.clientX - img.getBoundingClientRect().left;
                    const newHeight = newWidth / aspectRatio;
                    setDimensions({width: newWidth, height: newHeight});
                    onResize({width: newWidth, height: newHeight});
                };

                const onMouseUp = () => {
                    document.body.removeEventListener('mousemove', onMouseMove);
                    document.body.removeEventListener('mouseup', onMouseUp);
                };

                document.body.addEventListener('mousemove', onMouseMove);
                document.body.addEventListener('mouseup', onMouseUp);
            }
        };

        return (
            <div className={b()}>
                <img
                    ref={ref}
                    src={src}
                    alt={alt}
                    style={{width: `${dimensions.width}px`, height: `${dimensions.height}px`}}
                />
                <div
                    className={b('resizer')}
                    role="button"
                    tabIndex={0}
                    onMouseDown={startResizing}
                />
            </div>
        );
    },
);

ResizableImage.displayName = 'ResizableImage';
