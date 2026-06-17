import type {GridBlockTemplate} from '../types';

export type TemplateMenuEntry<TTemplate extends GridBlockTemplate> =
    | {type: 'template'; template: TTemplate}
    | {type: 'group'; title: string; templates: TTemplate[]};

const getGroup = (template: GridBlockTemplate) => template.group?.trim() || null;

const matches = (value: string, query: string) => value.toLowerCase().includes(query);

export const groupTemplatesForMenu = <TTemplate extends GridBlockTemplate>(
    templates: TTemplate[],
    filter: string,
): TemplateMenuEntry<TTemplate>[] => {
    const grouped = new Map<string, Extract<TemplateMenuEntry<TTemplate>, {type: 'group'}>>();
    const entries: TemplateMenuEntry<TTemplate>[] = [];

    for (const template of templates) {
        const group = getGroup(template);

        if (!group) {
            entries.push({type: 'template', template});
            continue;
        }

        let entry = grouped.get(group);
        if (!entry) {
            entry = {type: 'group', title: group, templates: []};
            grouped.set(group, entry);
            entries.push(entry);
        }
        entry.templates.push(template);
    }

    const query = filter.trim().toLowerCase();
    if (!query) return entries;

    const filteredEntries: TemplateMenuEntry<TTemplate>[] = [];

    for (const entry of entries) {
        if (entry.type === 'template') {
            if (matches(entry.template.title, query)) filteredEntries.push(entry);
            continue;
        }

        if (matches(entry.title, query)) {
            filteredEntries.push(entry);
            continue;
        }

        const templatesByTitle = entry.templates.filter((template) =>
            matches(template.title, query),
        );
        if (templatesByTitle.length) {
            filteredEntries.push({type: 'group', title: entry.title, templates: templatesByTitle});
        }
    }

    return filteredEntries;
};
