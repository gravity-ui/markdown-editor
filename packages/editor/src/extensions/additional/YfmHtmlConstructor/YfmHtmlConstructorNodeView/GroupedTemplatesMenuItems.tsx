import {useState} from 'react';
import type {FC, ReactNode} from 'react';

import {ChevronDown, ChevronRight, Palette} from '@gravity-ui/icons';
import {Icon, Menu} from '@gravity-ui/uikit';

import type {
    HtmlConstructorBlockTemplate,
    HtmlConstructorStructureTemplate,
    HtmlConstructorThemeTemplate,
} from '../types';

import {STOP_EVENT_CLASSNAME, cnYfmHtmlConstructor} from './const';
import type {
    BlockMenuItem,
    StructureMenuItem as GroupedStructureMenuItem,
    TemplateMenuGroup,
} from './groupTemplates';

const b = cnYfmHtmlConstructor;
const stop = STOP_EVENT_CLASSNAME;

const getTitle = (template: {id: string; title?: string}) => template.title?.trim() || template.id;

interface StructureTemplatesMenuItemsProps {
    groups: TemplateMenuGroup<GroupedStructureMenuItem>[];
    filter: string;
    emptyText: string;
    onApply: (
        structure: HtmlConstructorStructureTemplate,
        theme?: HtmlConstructorThemeTemplate,
    ) => void;
}

interface BlockTemplatesMenuItemsProps {
    groups: TemplateMenuGroup<BlockMenuItem>[];
    filter: string;
    emptyText: string;
    onApply: (block: HtmlConstructorBlockTemplate, theme?: HtmlConstructorThemeTemplate) => void;
}

interface TemplateGroupMenuItemProps<TItem> {
    group: TemplateMenuGroup<TItem>;
    open: boolean;
    children: ReactNode;
    onToggle: (title: string) => void;
}

function TemplateGroupMenuItem<TItem>({
    group,
    open,
    children,
    onToggle,
}: TemplateGroupMenuItemProps<TItem>) {
    return (
        <>
            <Menu.Item
                className={b('templates-group-header', [stop])}
                iconEnd={<Icon data={open ? ChevronDown : ChevronRight} />}
                onClick={() => onToggle(group.title)}
                extraProps={{'aria-expanded': open}}
            >
                {group.title}
            </Menu.Item>
            {open && children}
        </>
    );
}

const useOpenGroups = (filter: string) => {
    const [openGroups, setOpenGroups] = useState<string[]>([]);
    const hasFilter = Boolean(filter.trim());

    const toggleGroup = (title: string) => {
        setOpenGroups((current) =>
            current.includes(title)
                ? current.filter((openTitle) => openTitle !== title)
                : [...current, title],
        );
    };

    return {hasFilter, openGroups, toggleGroup};
};

export function StructureTemplatesMenuItems({
    groups,
    filter,
    emptyText,
    onApply,
}: StructureTemplatesMenuItemsProps) {
    const {hasFilter, openGroups, toggleGroup} = useOpenGroups(filter);

    if (groups.length === 0) {
        return (
            <Menu.Item disabled className={stop}>
                {emptyText}
            </Menu.Item>
        );
    }

    return (
        <>
            {groups.map((group) => (
                <TemplateGroupMenuItem
                    key={`structure-group:${group.title}`}
                    group={group}
                    open={hasFilter || openGroups.includes(group.title)}
                    onToggle={toggleGroup}
                >
                    {group.items.map(({structure, themes}) => (
                        <StructureMenuItem
                            key={structure.id}
                            structure={structure}
                            themes={themes}
                            onApply={onApply}
                        />
                    ))}
                </TemplateGroupMenuItem>
            ))}
        </>
    );
}

const StructureMenuItem: FC<{
    structure: HtmlConstructorStructureTemplate;
    themes: HtmlConstructorThemeTemplate[];
    onApply: (
        structure: HtmlConstructorStructureTemplate,
        theme?: HtmlConstructorThemeTemplate,
    ) => void;
}> = ({structure, themes, onApply}) => (
    <>
        <Menu.Item
            className={b('templates-group-template', [stop])}
            onClick={() => onApply(structure)}
        >
            {getTitle(structure)}
        </Menu.Item>
        {themes.map((theme) => (
            <Menu.Item
                key={theme.id}
                className={b('templates-group-theme', [stop])}
                iconStart={<Icon data={Palette} />}
                onClick={() => onApply(structure, theme)}
            >
                {getTitle(theme)}
            </Menu.Item>
        ))}
    </>
);

export function BlockTemplatesMenuItems({
    groups,
    filter,
    emptyText,
    onApply,
}: BlockTemplatesMenuItemsProps) {
    const {hasFilter, openGroups, toggleGroup} = useOpenGroups(filter);

    if (groups.length === 0) {
        return (
            <Menu.Item disabled className={stop}>
                {emptyText}
            </Menu.Item>
        );
    }

    return (
        <>
            {groups.map((group) => (
                <TemplateGroupMenuItem
                    key={`block-group:${group.title}`}
                    group={group}
                    open={hasFilter || openGroups.includes(group.title)}
                    onToggle={toggleGroup}
                >
                    {group.items.map((item) => (
                        <BlockMenuItemView key={item.block.id} item={item} onApply={onApply} />
                    ))}
                </TemplateGroupMenuItem>
            ))}
        </>
    );
}

const BlockMenuItemView: FC<{
    item: BlockMenuItem;
    onApply: (block: HtmlConstructorBlockTemplate, theme?: HtmlConstructorThemeTemplate) => void;
}> = ({item, onApply}) => (
    <>
        {item.states.map((state, index) => (
            <BlockStateMenuItems
                key={state.id}
                block={state}
                primary={index === 0}
                themes={item.themesByBlockId[state.id] ?? []}
                onApply={onApply}
            />
        ))}
    </>
);

const BlockStateMenuItems: FC<{
    block: HtmlConstructorBlockTemplate;
    primary: boolean;
    themes: HtmlConstructorThemeTemplate[];
    onApply: (block: HtmlConstructorBlockTemplate, theme?: HtmlConstructorThemeTemplate) => void;
}> = ({block, primary, themes, onApply}) => (
    <>
        <Menu.Item
            className={b(primary ? 'templates-group-template' : 'templates-group-state', [stop])}
            onClick={() => onApply(block)}
        >
            {getTitle(block)}
        </Menu.Item>
        {themes.map((theme) => (
            <Menu.Item
                key={theme.id}
                className={b('templates-group-theme', [stop])}
                iconStart={<Icon data={Palette} />}
                onClick={() => onApply(block, theme)}
            >
                {getTitle(theme)}
            </Menu.Item>
        ))}
    </>
);
