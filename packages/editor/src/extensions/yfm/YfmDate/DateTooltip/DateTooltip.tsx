import {useEffect, useMemo, useRef} from 'react';

import {Calendar, type CalendarInstance} from '@gravity-ui/date-components';

import type {Node} from '#pm/model';
import {TextSelection} from '#pm/state';
import type {EditorView} from '#pm/view';
import {cn} from 'src/classname';

import {DateAttr} from '../YfmDateSpecs';
import {getDateLang} from '../YfmDateSpecs/utils';
import {updateDate} from '../commands';

import {fromCalendarValue, toCalendarValue} from './calendar-value';
import {useCalendarLocale} from './use-calendar-locale';

import './DateTooltip.scss';

const b = cn('date-tooltip');

export type DateTooltipProps = {
    node: Node;
    pos: number;
    view: EditorView;
    /** The date is opened by a click or an insertion, so the calendar takes the focus. */
    edited: boolean;
};

export function DateTooltip({node, pos, view, edited}: DateTooltipProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<CalendarInstance>(null);
    const date: string = node.attrs[DateAttr.Date];
    const value = useMemo(() => toCalendarValue(date), [date]);
    const locale = useCalendarLocale(getDateLang());

    // Covers a popover opened for editing, `Enter` on an open one and a calendar mounted for a new locale.
    useEffect(() => {
        if (edited) calendarRef.current?.focus();
    }, [edited, locale]);

    // Moving the selection out of the date closes the popover.
    const close = () => {
        const {state} = view;
        const selection = TextSelection.near(state.doc.resolve(pos + node.nodeSize));

        view.dispatch(state.tr.setSelection(selection));
        view.focus();
    };
    const closeRef = useRef(close);
    closeRef.current = close;

    // The calendar has no keyboard handler props, so `Escape` is caught on the container.
    useEffect(() => {
        const root = rootRef.current;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeRef.current();
        };

        root?.addEventListener('keydown', onKeyDown);
        return () => root?.removeEventListener('keydown', onKeyDown);
    }, []);

    return (
        <div ref={rootRef} className={b()}>
            <Calendar
                // The calendar reads the locale on render, so it is mounted again for a new one.
                key={locale}
                ref={calendarRef}
                value={value}
                onUpdate={(newValue) => {
                    updateDate(pos, fromCalendarValue(newValue))(view.state, view.dispatch);
                    close();
                }}
            />
        </div>
    );
}
