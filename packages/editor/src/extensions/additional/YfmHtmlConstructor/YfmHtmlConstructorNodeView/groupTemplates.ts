import type {
    HtmlConstructorBlockTemplate,
    HtmlConstructorFamilyTemplate,
    HtmlConstructorStructureTemplate,
    HtmlConstructorTemplate,
    HtmlConstructorThemeTemplate,
} from '../types';

export type StructureMenuItem = {
    structure: HtmlConstructorStructureTemplate;
    themes: HtmlConstructorThemeTemplate[];
};

export type BlockMenuItem = {
    block: HtmlConstructorBlockTemplate;
    states: HtmlConstructorBlockTemplate[];
    themesByBlockId: Record<string, HtmlConstructorThemeTemplate[]>;
};

export type TemplateMenuGroup<TItem> = {
    familyId?: string;
    title: string;
    items: TItem[];
};

const DEFAULT_FAMILY_TITLE = 'Other';

const getTitle = (template: {id: string; title?: string}) => template.title?.trim() || template.id;

const matches = (value: string, query: string) => value.toLowerCase().includes(query);

const byFamily = (templates: HtmlConstructorTemplate[]) =>
    new Map(
        templates.flatMap((template): [string, HtmlConstructorFamilyTemplate][] =>
            template.type === 'family' ? [[template.id, template]] : [],
        ),
    );

const getFamilyTitle = (
    families: Map<string, HtmlConstructorFamilyTemplate>,
    familyId: string | undefined,
) => (familyId ? getTitle(families.get(familyId) ?? {id: familyId}) : DEFAULT_FAMILY_TITLE);

const addToFamilyGroup = <TItem>(
    groups: TemplateMenuGroup<TItem>[],
    familyId: string | undefined,
    title: string,
    item: TItem,
) => {
    let group = groups.find((entry) => entry.familyId === familyId);
    if (!group) {
        group = {familyId, title, items: []};
        groups.push(group);
    }
    group.items.push(item);
};

const getThemesForStructure = (themes: HtmlConstructorThemeTemplate[], structureId: string) =>
    themes.filter((theme) => theme.structure === structureId && !theme.block);

const isCompatibleWithStructure = (
    template: HtmlConstructorBlockTemplate | HtmlConstructorThemeTemplate,
    activeStructureId: string | undefined,
) => !activeStructureId || !template.structure || template.structure === activeStructureId;

export const buildStructureMenuGroups = (
    templates: HtmlConstructorTemplate[],
    filter = '',
): TemplateMenuGroup<StructureMenuItem>[] => {
    const query = filter.trim().toLowerCase();
    const families = byFamily(templates);
    const themes = templates.filter(
        (template): template is HtmlConstructorThemeTemplate => template.type === 'theme',
    );
    const groups: TemplateMenuGroup<StructureMenuItem>[] = [];

    for (const structure of templates.filter(
        (template): template is HtmlConstructorStructureTemplate => template.type === 'structure',
    )) {
        const item = {structure, themes: getThemesForStructure(themes, structure.id)};
        const familyTitle = getFamilyTitle(families, structure.family);

        if (
            query &&
            !matches(familyTitle, query) &&
            !matches(getTitle(structure), query) &&
            !item.themes.some((theme) => matches(getTitle(theme), query))
        ) {
            continue;
        }

        addToFamilyGroup(groups, structure.family, familyTitle, item);
    }

    return groups;
};

export const buildBlockMenuGroups = (
    templates: HtmlConstructorTemplate[],
    activeStructureId?: string,
    filter = '',
): TemplateMenuGroup<BlockMenuItem>[] => {
    const query = filter.trim().toLowerCase();
    const families = byFamily(templates);
    const blocks = templates.filter(
        (template): template is HtmlConstructorBlockTemplate => template.type === 'block',
    );
    const themes = templates.filter(
        (template): template is HtmlConstructorThemeTemplate => template.type === 'theme',
    );
    const groups: TemplateMenuGroup<BlockMenuItem>[] = [];

    for (const block of blocks) {
        if (block.block || !isCompatibleWithStructure(block, activeStructureId)) continue;

        const states = [
            block,
            ...blocks.filter(
                (state) =>
                    state.block === block.id && isCompatibleWithStructure(state, activeStructureId),
            ),
        ];
        const themesByBlockId = Object.fromEntries(
            states.map((state) => [
                state.id,
                themes.filter(
                    (theme) =>
                        theme.block === state.id &&
                        isCompatibleWithStructure(theme, activeStructureId),
                ),
            ]),
        );
        const item = {block, states, themesByBlockId};
        const familyTitle = getFamilyTitle(families, block.family);

        if (
            query &&
            !matches(familyTitle, query) &&
            !states.some((state) => matches(getTitle(state), query)) &&
            !Object.values(themesByBlockId)
                .flat()
                .some((theme) => matches(getTitle(theme), query))
        ) {
            continue;
        }

        addToFamilyGroup(groups, block.family, familyTitle, item);
    }

    return groups;
};
