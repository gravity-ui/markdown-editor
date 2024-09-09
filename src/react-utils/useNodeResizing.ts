import React, {RefObject, useEffect, useState} from 'react';

import throttle from 'lodash/throttle';

import {useBooleanState} from './hooks';

export type ResizeDirection = 'left' | 'right';

const RESIZE_DELAY = 50;
const MIN_WIDTH = 40;
const THRESHOLD = 4;

export interface UseNodeResizingArgs {
    width?: number;
    height?: number;
    onResize?: ({width, height}: {width: number; height: number}) => void;
    ref: RefObject<HTMLImageElement | HTMLDivElement> | null;
    delay?: number;
    threshold?: number;
    minWidth?: number;
}

export const useNodeResizing = ({
    width,
    height,
    onResize,
    ref,
    delay = RESIZE_DELAY,
    threshold = THRESHOLD,
    minWidth = MIN_WIDTH,
}: UseNodeResizingArgs) => {
    const state = useBooleanState(false);
    const [resizing, , , toggleResizing] = state;
    const [initialWidth, setInitialWidth] = useState(width);
    const [initialHeight, setInitialHeight] = useState(height);
    const [currentWidth, setCurrentWidth] = useState(width);
    const [currentHeight, setCurrentHeight] = useState(height);

    // The dimensions specified as arguments take primacy over
    // the dimensions detected during the mouse movement.
    useEffect(() => {
        console.log('width', width, initialWidth);
        if (width !== initialWidth) {
            console.log('width changed');
            setCurrentWidth(width);
            setInitialWidth(width);
        }
        console.log('height', height, initialHeight);
        if (height !== initialHeight) {
            console.log('height changed');
            setCurrentHeight(height);
            setInitialHeight(height);
        }
    }, [width, height, initialWidth, initialHeight]);

    const startResizing = (event: React.MouseEvent<HTMLElement>, direction: ResizeDirection) => {
        // prohibit the selection of text and other artifacts when resizing.
        event.preventDefault();

        console.log('startResizing');

        const element = ref?.current;

        if (!element) {
            throw new Error('Reference element not found!');
        }
        const startX = event.pageX;
        const startWidth = element.getBoundingClientRect().width || 0;
        const startHeight = element.getBoundingClientRect().height || 0;

        let animationFrameId: number;
        const handleMouseMove = throttle((event: MouseEvent) => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }

            animationFrameId = requestAnimationFrame(() => {
                const currentX = event.pageX;
                const diffX = currentX - startX;

                const newWidthByDirection =
                    direction === 'right' ? startWidth + diffX : startWidth - diffX;

                if (Math.abs(newWidthByDirection - startWidth) >= threshold) {
                    const newWidth =
                        newWidthByDirection >= minWidth ? newWidthByDirection : minWidth;
                    const newHeight = (startHeight / startWidth) * newWidth;

                    setCurrentWidth(newWidth);
                    setCurrentHeight(newHeight);
                    onResize?.({width: newWidth, height: newHeight});
                }
            });
        }, delay);

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            toggleResizing();

            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        toggleResizing();
    };

    return {
        startResizing,
        state: {
            resizing,
            width: initialWidth === undefined ? undefined : currentWidth,
            height: initialHeight === undefined ? undefined : currentHeight,
        },
    };
};
