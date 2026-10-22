import {afterEach, describe, expect, it} from 'vitest';

import {fromCalendarValue, toCalendarValue} from '../DateTooltip/calendar-value';

import {formatDisplayDate, formatIsoDate, getTodayIsoDate, isIsoDate, parseIsoDate} from './utils';

const initialTimeZone = process.env.TZ;

// Time zones at both ends of the offset range and one with a daylight saving change at midnight.
const timeZones = ['UTC', 'Pacific/Kiritimati', 'Pacific/Pago_Pago', 'America/Santiago'];

afterEach(() => {
    process.env.TZ = initialTimeZone;
});

describe('Date utils', () => {
    it.each([
        ['2026-10-21', {year: 2026, month: 10, day: 21}],
        ['2024-02-29', {year: 2024, month: 2, day: 29}],
        ['2000-02-29', {year: 2000, month: 2, day: 29}],
        ['2026-01-31', {year: 2026, month: 1, day: 31}],
        ['2026-04-30', {year: 2026, month: 4, day: 30}],
        ['2026-12-31', {year: 2026, month: 12, day: 31}],
        ['0001-01-01', {year: 1, month: 1, day: 1}],
    ])('should parse the valid day %s', (value, day) => {
        expect(parseIsoDate(value)).toEqual(day);
        expect(isIsoDate(value)).toBe(true);
        expect(formatIsoDate(day)).toBe(value);
    });

    it.each([
        ['a day that does not exist in a common year', '2026-02-29'],
        ['February 29 of a century year', '1900-02-29'],
        ['February 30', '2024-02-30'],
        ['April 31', '2026-04-31'],
        ['the month 13', '2026-13-01'],
        ['the month 00', '2026-00-10'],
        ['the day 00', '2026-01-00'],
        ['the day 32', '2026-01-32'],
        ['a day without zero padding', '2026-1-5'],
        ['a day with time', '2026-10-21T10:00'],
        ['spaces around the day', ' 2026-10-21 '],
        ['another format', '21.10.2026'],
        ['a word', 'today'],
        ['an empty string', ''],
    ])('should reject %s', (_case, value) => {
        expect(parseIsoDate(value)).toBeNull();
        expect(isIsoDate(value)).toBe(false);
    });

    it.each([undefined, null, 20261021, {}])('should reject the non-string value %s', (value) => {
        expect(isIsoDate(value)).toBe(false);
    });

    it.each(timeZones)('should take today from the local day in the %s time zone', (timeZone) => {
        process.env.TZ = timeZone;

        expect(getTodayIsoDate(new Date(2026, 9, 21, 0, 0, 0))).toBe('2026-10-21');
        expect(getTodayIsoDate(new Date(2026, 9, 21, 23, 59, 59))).toBe('2026-10-21');
        expect(getTodayIsoDate(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
        expect(getTodayIsoDate(new Date(2028, 1, 29, 12))).toBe('2028-02-29');
    });

    it.each(timeZones)('should display the same day in the %s time zone', (timeZone) => {
        process.env.TZ = timeZone;

        expect(formatDisplayDate('2026-10-21', 'en')).toBe('Oct 21, 2026');
        expect(formatDisplayDate('2026-01-01', 'en')).toBe('Jan 1, 2026');
        expect(formatDisplayDate('2026-12-31', 'en')).toBe('Dec 31, 2026');
    });

    it('should display the day in the language of the editor', () => {
        expect(formatDisplayDate('2026-10-21', 'ru')).toMatch(/^21 окт\.? 2026/);
    });

    it('should display a two-digit year without the 1900 shift', () => {
        expect(formatDisplayDate('0050-06-15', 'en')).toBe('Jun 15, 50');
    });

    it('should display a string that is not a day as is', () => {
        expect(formatDisplayDate('2026-02-30', 'en')).toBe('2026-02-30');
    });

    it.each(timeZones)(
        'should keep the day through the calendar value in the %s time zone',
        (timeZone) => {
            process.env.TZ = timeZone;

            for (const value of ['2026-10-21', '2024-02-29', '2026-12-31', '2027-01-01']) {
                const calendarValue = toCalendarValue(value);
                if (!calendarValue) throw new Error(`No calendar value for ${value}`);

                expect(calendarValue.isValid()).toBe(true);
                expect(fromCalendarValue(calendarValue)).toBe(value);
                expect(fromCalendarValue(calendarValue.startOf('day'))).toBe(value);
            }
        },
    );

    it('should not create a calendar value for an invalid day', () => {
        expect(toCalendarValue('2026-02-30')).toBeNull();
    });
});
