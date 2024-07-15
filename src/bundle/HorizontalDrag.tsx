import React, {EventHandler, useCallback, useEffect, useRef, useState} from 'react';

import {clamp} from '../lodash';

import {EditorInt} from './Editor';
import {cnEditorComponent} from './MarkdownEditorView';

export const IN_RESIZE_CLASSNAME = 'in-resize';

type UseDragHandlersParams = {
    onStart: () => void;
    onMove: (delta: number) => void;
    onEnd: (delta: number) => void;
};

const useColResize = ({onStart, onMove, onEnd}: UseDragHandlersParams) => {
    const initialXPosition = useRef(0);
    const currentXPosition = useRef(0);

    const handleMove = useCallback(
        (e: MouseEvent | TouchEvent) => {
            const currentX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;

            if (currentXPosition.current === currentX) {
                return;
            }

            currentXPosition.current = currentX;
            const delta = initialXPosition.current - currentX;

            onMove(delta);
        },
        [onMove],
    );

    const handleDragEnd = useCallback(
        (e: MouseEvent | TouchEvent) => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);

            document.body.style.removeProperty('user-select');

            const currentX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
            const delta = initialXPosition.current - currentX;

            onEnd(delta);
        },
        [handleMove, onEnd],
    );

    const handleStart: EventHandler<React.MouseEvent | React.TouchEvent> = useCallback(
        (e) => {
            const currentX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
            initialXPosition.current = currentX;
            currentXPosition.current = currentX;

            window.addEventListener('mouseup', handleDragEnd, {once: true});
            window.addEventListener('touchend', handleDragEnd, {once: true});
            window.addEventListener('touchcancel', handleDragEnd, {once: true});

            window.addEventListener('mousemove', handleMove);
            window.addEventListener('touchmove', handleMove);

            document.body.style.setProperty('user-select', 'none');

            onStart();
        },
        [handleDragEnd, handleMove, onStart],
    );

    return {
        listeners: {
            onMouseDown: handleStart,
            onTouchStart: handleStart,
        },
    };
};

export type HorizontalDragProps = {
    leftElRef: React.RefObject<HTMLDivElement>;
    rightElRef: React.RefObject<HTMLDivElement>;
    wrapperRef: React.RefObject<HTMLDivElement>;
    editor: EditorInt;
    onEndMove?: (right: HTMLDivElement | null, left: HTMLDivElement | null) => any;
};

const HorizontalDrag: React.FC<HorizontalDragProps> = ({
    leftElRef,
    rightElRef,
    wrapperRef,
    editor,
    onEndMove,
}) => {
    const cm = editor.cm;

    const [lCardWidth, lSetCardWidth] = useState((wrapperRef.current?.clientWidth ?? 0) / 2);
    const [rCardWidth, rSetCardWidth] = useState((wrapperRef.current?.clientWidth ?? 0) / 2);

    const updateWidth = useCallback(
        (lNewWidth: number, rNewWidth: number) => {
            leftElRef.current?.style?.setProperty('width', `${lNewWidth}px`);
            rightElRef.current?.style?.setProperty('width', `${rNewWidth}px`);
        },
        [leftElRef, rightElRef],
    );

    const calculateWidth = useCallback(
        (delta: number) => [
            clamp(
                lCardWidth - delta,
                (wrapperRef.current?.clientWidth ?? 0) / 8,
                ((wrapperRef.current?.clientWidth ?? 0) * 3) / 4,
            ),
            clamp(
                rCardWidth + delta,
                (wrapperRef.current?.clientWidth ?? 0) / 8,
                ((wrapperRef.current?.clientWidth ?? 0) * 3) / 4,
            ),
        ],
        [lCardWidth, rCardWidth, wrapperRef],
    );

    // Set initially calculated width
    useEffect(() => {
        updateWidth(lCardWidth, rCardWidth);
        cm.requestMeasure();
    }, []);

    useEffect(() => {
        const [leftElCurrent, rightElCurrent] = [leftElRef.current, rightElRef.current];

        return () => {
            leftElCurrent?.classList.remove(IN_RESIZE_CLASSNAME);
            rightElCurrent?.classList.remove(IN_RESIZE_CLASSNAME);

            leftElCurrent?.style?.removeProperty('width');
            rightElCurrent?.style?.removeProperty('width');
        };
    }, [leftElRef, rightElRef]);

    const onStart = useCallback(() => {
        wrapperRef.current?.style.setProperty('user-select', 'none');

        leftElRef.current?.classList.add(IN_RESIZE_CLASSNAME);
        rightElRef.current?.classList.add(IN_RESIZE_CLASSNAME);
    }, [leftElRef, rightElRef, wrapperRef]);

    const onMove = useCallback(
        (delta: number) => {
            const [lNewWidth, rNewWidth] = calculateWidth(delta);
            updateWidth(lNewWidth, rNewWidth);
        },
        [calculateWidth, lCardWidth, rCardWidth, updateWidth],
    );

    const onEnd = useCallback(
        (delta: number) => {
            const [lNewWidth, rNewWidth] = calculateWidth(delta);
            lSetCardWidth(lNewWidth);
            rSetCardWidth(rNewWidth);
            updateWidth(lNewWidth, rNewWidth);

            wrapperRef.current?.style.removeProperty('user-select');
            cm.requestMeasure();

            rightElRef.current?.classList.remove(IN_RESIZE_CLASSNAME);
            leftElRef.current?.classList.remove(IN_RESIZE_CLASSNAME);

            onEndMove?.(rightElRef.current, leftElRef.current);
        },
        [calculateWidth, cm, leftElRef, rightElRef, updateWidth, wrapperRef],
    );

    const {listeners} = useColResize({onStart, onMove, onEnd});

    return (
        <div className={cnEditorComponent('resizer', {horizontal: true})} {...listeners}>
            <div className={cnEditorComponent('gutter')} />
        </div>
    );
};

const HorizontalDragWrapper: React.FC<HorizontalDragProps & {isMounted: boolean}> = (props) => {
    // If component calling HorizontalDrag is not mounted, then most likely wrapperRef will be null
    if (!props.isMounted)
        return (
            <div className={cnEditorComponent('resizer', {horizontal: true})}>
                <div className={cnEditorComponent('gutter')} />
            </div>
        );
    return <HorizontalDrag {...props} />;
};

export {HorizontalDragWrapper as HorizontalDrag};
