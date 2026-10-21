import {useEffect, useState} from 'react';

import {settings} from '@gravity-ui/date-utils';

/**
 * The calendar takes the names of months and weekdays from the global locale of date-utils.
 * The hook sets that locale to the language of the editor and returns the current locale.
 */
export function useCalendarLocale(lang: string): string {
    const [locale, setLocale] = useState(() => settings.getLocale());

    useEffect(() => {
        if (settings.getLocale() === lang) {
            setLocale(lang);
            return undefined;
        }

        let active = true;
        settings
            .loadLocale(lang)
            .then(() => {
                settings.setLocale(lang);
                if (active) setLocale(lang);
            })
            // An unknown locale keeps the current one.
            .catch(() => {});

        return () => {
            active = false;
        };
    }, [lang]);

    return locale;
}
