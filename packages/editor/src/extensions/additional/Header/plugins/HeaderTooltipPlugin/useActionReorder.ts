import {type HTMLAttributes, useRef, useState} from 'react';

type Drag = {id: string; pointerId: number; startY: number; offset: number; over: string | null};

/** Two actions can be reordered with a pointer or the handle's arrow keys. */
export function useActionReorder(ids: string[], onReorder: () => void) {
    const rows = useRef(new Map<string, HTMLDivElement>());
    const pending = useRef<Drag | null>(null);
    const [drag, setDrag] = useState<Drag | null>(null);
    const update = (value: Drag | null) => {
        pending.current = value;
        setDrag(value);
    };

    const handleProps = (id: string): HTMLAttributes<HTMLButtonElement> => ({
        onPointerDown(event) {
            if (event.button !== 0 || ids.length !== 2) return;
            event.preventDefault();
            event.currentTarget.focus({preventScroll: true});
            event.currentTarget.setPointerCapture(event.pointerId);
            update({id, pointerId: event.pointerId, startY: event.clientY, offset: 0, over: null});
        },
        onPointerMove(event) {
            const current = pending.current;
            if (!current || current.pointerId !== event.pointerId) return;
            const offset = event.clientY - current.startY;
            const over =
                ids.find((other) => {
                    if (other === id || Math.abs(offset) < 4) return false;
                    const bounds = rows.current.get(other)?.getBoundingClientRect();
                    return (
                        bounds &&
                        event.clientY >= bounds.top &&
                        event.clientY <= bounds.bottom &&
                        event.clientX >= bounds.left &&
                        event.clientX <= bounds.right
                    );
                }) ?? null;
            update({...current, offset, over});
        },
        onPointerUp(event) {
            const current = pending.current;
            if (!current || current.pointerId !== event.pointerId) return;
            update(null);
            event.currentTarget.releasePointerCapture(event.pointerId);
            if (current.over) onReorder();
        },
        onPointerCancel() {
            update(null);
        },
        onLostPointerCapture() {
            update(null);
        },
        onKeyDown(event) {
            if (event.key === 'Escape' && pending.current) {
                event.preventDefault();
                event.stopPropagation();
                const {pointerId} = pending.current;
                update(null);
                event.currentTarget.releasePointerCapture(pointerId);
                return;
            }
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
            event.preventDefault();
            if (ids.length === 2 && ids.indexOf(id) === (event.key === 'ArrowUp' ? 1 : 0))
                onReorder();
        },
    });

    return {
        drag,
        handleProps,
        rowRef: (id: string) => (element: HTMLDivElement | null) => {
            if (element) rows.current.set(id, element);
            else rows.current.delete(id);
        },
    };
}
