import {useMemo} from 'react';

import type {YfmHtmlConstructorOptions} from '../types';

import {getStructureTemplateById, getStructureThemeTemplates} from './state';
import {mergeTemplatesById, useStoredTemplates} from './storage';

export const useTemplateCatalog = (
    options: YfmHtmlConstructorOptions | undefined,
    structureId?: string,
) => {
    const stored = useStoredTemplates();
    return useMemo(() => {
        const items = mergeTemplatesById(options?.items ?? [], stored);
        const allowAdd = Boolean(options?.allowAdd);
        return {
            items,
            allowAdd,
            hasStored: stored.length > 0,
            showButton:
                Boolean(options?.showButton) &&
                (allowAdd || items.some((item) => item.type === 'structure')),
            activeStructure: getStructureTemplateById(items, structureId),
            themes: getStructureThemeTemplates(items, structureId),
        };
    }, [options, stored, structureId]);
};

export type TemplateCatalog = ReturnType<typeof useTemplateCatalog>;
