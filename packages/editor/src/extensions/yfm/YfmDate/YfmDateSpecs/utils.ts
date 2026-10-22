import {Lang} from 'src/configure';
import {i18n} from 'src/i18n/i18n';

import {dateCn, dateNodeName, dateTheme} from './const';

/** A day of the calendar without time and time zone. `month` starts from 1. */
export type CalendarDay = {year: number; month: number; day: number};

const isoDateRe = /^(\d{4})-(\d{2})-(\d{2})$/;

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const getDaysInMonth = (year: number, month: number) =>
    month === 2 && isLeapYear(year)
        ? 29
        : [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];

/** Parses an ISO `YYYY-MM-DD` day. Returns null for any other string and for a day that does not exist. */
export const parseIsoDate = (value: unknown): CalendarDay | null => {
    if (typeof value !== 'string') return null;

    const match = isoDateRe.exec(value);
    if (!match) return null;

    const [year, month, day] = match.slice(1).map(Number);
    if (month < 1 || month > 12 || day < 1 || day > getDaysInMonth(year, month)) return null;

    return {year, month, day};
};

export const isIsoDate = (value: unknown): value is string => parseIsoDate(value) !== null;

const pad = (value: number, length: number) => String(value).padStart(length, '0');

export const formatIsoDate = ({year, month, day}: CalendarDay): string =>
    `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;

/** The current day in the local time zone of the user. */
export const getTodayIsoDate = (now = new Date()): string =>
    formatIsoDate({year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate()});

/** The language of the editor, which the date follows. */
export const getDateLang = (): string => i18n.lang ?? Lang.En;

const formatters = new Map<string, Intl.DateTimeFormat>();

const getFormatter = (lang: string) => {
    let formatter = formatters.get(lang);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat(lang, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            // The day is placed at midnight UTC and formatted in UTC, so the time zone of the user does not shift it.
            timeZone: 'UTC',
        });
        formatters.set(lang, formatter);
    }
    return formatter;
};

/** The day for display, as `Oct 21, 2026` in English. A string that is not an ISO day is returned as is. */
export const formatDisplayDate = (value: string, lang = getDateLang()): string => {
    const day = parseIsoDate(value);
    if (!day) return value;

    const date = new Date(0);
    date.setUTCFullYear(day.year, day.month - 1, day.day);
    return getFormatter(lang).format(date);
};

/** Classes of the UIKit Label, so the date looks like a label without React. */
export const getDateDomAttrs = (value: string): Record<string, string> => ({
    class: `g-label g-label_theme_${dateTheme} g-label_size_xs ${dateCn()}`,
    'data-qa': dateNodeName,
    datetime: value,
});
