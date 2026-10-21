import {type DateTime, UtcTimeZone, dateTime} from '@gravity-ui/date-utils';

import {formatIsoDate, parseIsoDate} from '../YfmDateSpecs/utils';

/**
 * The value of the calendar for an ISO day: midnight UTC in the UTC time zone of the calendar.
 * The day does not depend on the time zone of the user. Returns null for a string that is not an ISO day.
 */
export const toCalendarValue = (value: string): DateTime | null => {
    const day = parseIsoDate(value);
    if (!day) return null;

    return dateTime({
        input: {year: day.year, month: day.month - 1, date: day.day},
        timeZone: UtcTimeZone,
    });
};

/** The ISO day of a calendar value, taken in the time zone of the value. */
export const fromCalendarValue = (value: DateTime): string =>
    formatIsoDate({year: value.year(), month: value.month() + 1, day: value.date()});
