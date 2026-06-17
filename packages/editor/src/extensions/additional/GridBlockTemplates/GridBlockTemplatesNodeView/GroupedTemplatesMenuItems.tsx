import {useState} from 'react';

import {ChevronDown, ChevronRight} from '@gravity-ui/icons';
import {Icon, Menu} from '@gravity-ui/uikit';

import type {GridBlockTemplate} from '../types';

import {STOP_EVENT_CLASSNAME, cnGridBlockTemplates} from './const';
import {groupTemplatesForMenu} from './groupTemplates';

const b = cnGridBlockTemplates;
const stop = STOP_EVENT_CLASSNAME;

interface GroupedTemplatesMenuItemsProps<TTemplate extends GridBlockTemplate> {
    templates: TTemplate[];
    filter: string;
    emptyText: string;
    onApply: (template: TTemplate) => void;
}

interface TemplateGroupMenuItemProps<TTemplate extends GridBlockTemplate> {
    title: string;
    templates: TTemplate[];
    open: boolean;
    onApply: (template: TTemplate) => void;
    onToggle: (title: string) => void;
}

function TemplateGroupMenuItem<TTemplate extends GridBlockTemplate>({
    title,
    templates,
    open,
    onApply,
    onToggle,
}: TemplateGroupMenuItemProps<TTemplate>) {
    return (
        <>
            <Menu.Item
                className={b('templates-group-header', [stop])}
                iconEnd={<Icon data={open ? ChevronDown : ChevronRight} />}
                onClick={() => onToggle(title)}
                extraProps={{'aria-expanded': open}}
            >
                {title}
            </Menu.Item>
            {open &&
                templates.map((template) => (
                    <Menu.Item
                        key={template.id}
                        className={b('templates-group-template', [stop])}
                        onClick={() => onApply(template)}
                    >
                        {template.title}
                    </Menu.Item>
                ))}
        </>
    );
}

export function GroupedTemplatesMenuItems<TTemplate extends GridBlockTemplate>({
    templates,
    filter,
    emptyText,
    onApply,
}: GroupedTemplatesMenuItemsProps<TTemplate>) {
    const [openGroups, setOpenGroups] = useState<string[]>([]);
    const entries = groupTemplatesForMenu(templates, filter);
    const hasFilter = Boolean(filter.trim());

    const toggleGroup = (title: string) => {
        setOpenGroups((current) =>
            current.includes(title)
                ? current.filter((openTitle) => openTitle !== title)
                : [...current, title],
        );
    };

    if (entries.length === 0) {
        return (
            <Menu.Item disabled className={stop}>
                {emptyText}
            </Menu.Item>
        );
    }

    return (
        <>
            {entries.map((entry) =>
                entry.type === 'group' ? (
                    <TemplateGroupMenuItem
                        key={`group:${entry.title}`}
                        title={entry.title}
                        templates={entry.templates}
                        open={hasFilter || openGroups.includes(entry.title)}
                        onApply={onApply}
                        onToggle={toggleGroup}
                    />
                ) : (
                    <Menu.Item
                        key={entry.template.id}
                        className={stop}
                        onClick={() => onApply(entry.template)}
                    >
                        {entry.template.title}
                    </Menu.Item>
                ),
            )}
        </>
    );
}
