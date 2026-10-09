import {useCallback} from 'react';
import type {FC} from 'react';

import {i18n} from 'src/i18n/yfm-html-constructor';

import type {HtmlConstructorThemeTemplate} from '../types';

import {type PickerGroup, type PickerPreview, TemplatePickerPanel} from './TemplatePicker';

export const ThemePickerPanel: FC<{
    themes: HtmlConstructorThemeTemplate[];
    activeIds: string[];
    buildPreview?: (theme?: HtmlConstructorThemeTemplate) => PickerPreview;
    onApply: (theme?: HtmlConstructorThemeTemplate) => void;
    onClose: () => void;
}> = ({themes, activeIds, buildPreview, onApply, onClose}) => {
    const buildGroups = useCallback((): PickerGroup[] => {
        if (!themes.length || !buildPreview) return [];
        return [
            {
                title: '',
                cards: [
                    {
                        id: '__auto',
                        title: i18n('auto'),
                        preview: buildPreview(),
                        active: !themes.some(({id}) => activeIds.includes(id)),
                        onApply: () => onApply(),
                        variants: [],
                    },
                    ...themes.map((theme) => ({
                        id: theme.id,
                        title: theme.title?.trim() || theme.id,
                        preview: buildPreview(theme),
                        active: activeIds.includes(theme.id),
                        onApply: () => onApply(theme),
                        variants: [],
                    })),
                ],
            },
        ];
    }, [themes, activeIds, buildPreview, onApply]);

    return (
        <TemplatePickerPanel
            title={i18n('select_theme')}
            emptyText={i18n('themes_empty')}
            showSearch={false}
            buildGroups={buildGroups}
            onClose={onClose}
        />
    );
};
