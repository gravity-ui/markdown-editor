import {Fragment} from 'react';
import type {FC} from 'react';

import {BucketPaint} from '@gravity-ui/icons';
import {Icon, Menu} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/yfm-html-constructor';

import type {HtmlConstructorBlockTemplate, HtmlConstructorThemeTemplate} from '../types';

import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;

const getTitle = (template: {id: string; title?: string}) => template.title?.trim() || template.id;

type ThemesPanelProps = {
    themes: HtmlConstructorThemeTemplate[];
    activeThemeIds: string[];
    emptyText: string;
    onApply: (theme?: HtmlConstructorThemeTemplate) => void;
};

export const ThemesPanel: FC<ThemesPanelProps> = ({themes, activeThemeIds, emptyText, onApply}) => {
    if (themes.length === 0) {
        return (
            <div className={b('templates', [stop])}>
                <Menu className={stop}>
                    <Menu.Item disabled className={stop}>
                        {emptyText}
                    </Menu.Item>
                </Menu>
            </div>
        );
    }

    const hasActiveTheme = themes.some((theme) => activeThemeIds.includes(theme.id));

    return (
        <div className={b('templates', [stop])}>
            <Menu className={stop}>
                <Menu.Item
                    className={b('templates-group-template', {active: !hasActiveTheme}, [stop])}
                    onClick={() => onApply(undefined)}
                >
                    {i18n('auto')}
                </Menu.Item>
                {themes.map((theme) => (
                    <Menu.Item
                        key={theme.id}
                        className={b(
                            'templates-group-theme',
                            {active: activeThemeIds.includes(theme.id)},
                            [stop],
                        )}
                        iconStart={<Icon data={BucketPaint} />}
                        onClick={() => onApply(theme)}
                    >
                        {getTitle(theme)}
                    </Menu.Item>
                ))}
            </Menu>
        </div>
    );
};

type BlockStatesPanelProps = {
    states: HtmlConstructorBlockTemplate[];
    activeTemplateId?: string;
    themesByBlockId: Record<string, HtmlConstructorThemeTemplate[]>;
    activeThemeIds: string[];
    emptyText: string;
    onApply: (block: HtmlConstructorBlockTemplate, theme?: HtmlConstructorThemeTemplate) => void;
};

export const BlockStatesPanel: FC<BlockStatesPanelProps> = ({
    states,
    activeTemplateId,
    themesByBlockId,
    activeThemeIds,
    emptyText,
    onApply,
}) => {
    if (states.length === 0) {
        return (
            <div className={b('templates', [stop])}>
                <Menu className={stop}>
                    <Menu.Item disabled className={stop}>
                        {emptyText}
                    </Menu.Item>
                </Menu>
            </div>
        );
    }

    return (
        <div className={b('templates', [stop])}>
            <Menu className={stop}>
                {states.map((state, index) => (
                    <Fragment key={state.id}>
                        <Menu.Item
                            className={b(
                                index === 0 ? 'templates-group-template' : 'templates-group-state',
                                {active: activeTemplateId === state.id},
                                [stop],
                            )}
                            onClick={() => onApply(state)}
                        >
                            {getTitle(state)}
                        </Menu.Item>
                        {(themesByBlockId[state.id] ?? []).map((theme) => (
                            <Menu.Item
                                key={theme.id}
                                className={b(
                                    'templates-group-theme',
                                    {active: activeThemeIds.includes(theme.id)},
                                    [stop],
                                )}
                                iconStart={<Icon data={BucketPaint} />}
                                onClick={() => onApply(state, theme)}
                            >
                                {getTitle(theme)}
                            </Menu.Item>
                        ))}
                    </Fragment>
                ))}
            </Menu>
        </div>
    );
};
