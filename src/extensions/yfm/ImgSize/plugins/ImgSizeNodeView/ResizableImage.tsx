import React, {MutableRefObject, forwardRef, useEffect, useState} from 'react';

import throttle from 'lodash/throttle';

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
const RESIZE_DELAY = 50;
const MIN_WIDTH = 20;
const THRESHOLD = 3;

type ResizeDirection = 'left' | 'right';

interface GetWidthArgs {
    direction: ResizeDirection;
    element: HTMLElement;
    event: MouseEvent | React.MouseEvent<HTMLDivElement>;
}
const getWidthByDirection = ({direction, element, event}: GetWidthArgs) => {
    return direction === 'right'
        ? event.clientX - element.getBoundingClientRect().left
        : element.getBoundingClientRect().right - event.clientX;
};

export const ResizableImage = forwardRef<HTMLImageElement, ResizableImageProps>(
    ({src, alt, width, height, onResize = noop}, ref) => {
        const [initialDimensions, setInitialDimensions] = useState({width, height});
        const [dimensions, setDimensions] = useState({width, height});

        useEffect(() => {
            if (width !== initialDimensions.width || height !== initialDimensions.height) {
                setInitialDimensions({width, height});
                setDimensions({width, height});
            }
        }, [width, height]);

        const startResizing = (
            event: React.MouseEvent<HTMLDivElement>,
            direction: ResizeDirection,
        ) => {
            // prohibit the selection of text and other artifacts when resizing.
            event.preventDefault();

            const element = (ref as MutableRefObject<HTMLImageElement | null>)?.current;

            if (!element) {
                throw new Error('Reference element not found!');
            }

            const aspectRatio = element.naturalWidth / element.naturalHeight;
            const initialWidth = getWidthByDirection({direction, element, event});

            let animationFrameId: number;
            const onMouseMove = throttle((event: MouseEvent) => {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }

                animationFrameId = requestAnimationFrame(() => {
                    const newWidth = getWidthByDirection({direction, element, event});

                    if (newWidth < MIN_WIDTH || Math.abs(newWidth - initialWidth) < THRESHOLD) {
                        return;
                    }

                    const newHeight = newWidth / aspectRatio;

                    setDimensions({width: newWidth, height: newHeight});
                    onResize({width: newWidth, height: newHeight});
                });
            }, RESIZE_DELAY);

            const onMouseUp = () => {
                document.body.removeEventListener('mousemove', onMouseMove);
                document.body.removeEventListener('mouseup', onMouseUp);

                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
            };

            document.body.addEventListener('mousemove', onMouseMove);
            document.body.addEventListener('mouseup', onMouseUp);
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
                    className={b('resizer-wrapper', {left: true})}
                    role="button"
                    tabIndex={0}
                    onMouseDown={(e) => startResizing(e, 'left')}
                >
                    <div className={b('resizer')} />
                </div>
                <div
                    className={b('resizer-wrapper', {right: true})}
                    role="button"
                    tabIndex={0}
                    onMouseDown={(e) => startResizing(e, 'right')}
                >
                    <div className={b('resizer')} />
                </div>
            </div>
        );
    },
);

ResizableImage.displayName = 'ResizableImage';
