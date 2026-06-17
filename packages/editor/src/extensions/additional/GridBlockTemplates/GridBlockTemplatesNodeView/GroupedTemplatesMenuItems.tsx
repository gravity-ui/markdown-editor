import {useEffect, useRef, useState} from 'react';

import {ChevronRight} from '@gravity-ui/icons';
import {Icon, Menu, Popup} from '@gravity-ui/uikit';

import {useBooleanState, useElementState} from 'src/react-utils/hooks';

import type {GridBlockTemplate} from '../types';

import {STOP_EVENT_CLASSNAME, cnGridBlockTemplates} from './const';
import {groupTemplatesForMenu} from './groupTemplates';

const CLOSE_DELAY = 120;
const SUBMENU_WIDTH = 320;

const b = cnGridBlockTemplates;
const stop = STOP_EVENT_CLASSNAME;

type SubmenuPlacement = 'right-start' | 'left-start';

interface GroupedTemplatesMenuItemsProps<TTemplate extends GridBlockTemplate> {
    templates: TTemplate[];
    filter: string;
    emptyText: string;
    onApply: (template: TTemplate) => void;
}

interface TemplateGroupMenuItemProps<TTemplate extends GridBlockTemplate> {
    title: string;
    templates: TTemplate[];
    onApply: (template: TTemplate) => void;
}

function TemplateGroupMenuItem<TTemplate extends GridBlockTemplate>({
    title,
    templates,
    onApply,
}: TemplateGroupMenuItemProps<TTemplate>) {
    const [anchorElement, setAnchorElement] = useElementState<HTMLDivElement>();
    const [open, openPopup, closePopup] = useBooleanState(false);
    const [placement, setPlacement] = useState<SubmenuPlacement>('right-start');
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelClose = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    };

    const scheduleClose = () => {
        cancelClose();
        closeTimer.current = setTimeout(closePopup, CLOSE_DELAY);
    };

    const openSubmenu = () => {
        cancelClose();

        const rect = anchorElement?.getBoundingClientRect();
        const hasRightSpace =
            !rect ||
            typeof window === 'undefined' ||
            rect.right + SUBMENU_WIDTH <= window.innerWidth;
        setPlacement(hasRightSpace ? 'right-start' : 'left-start');
        openPopup();
    };

    useEffect(() => () => cancelClose(), []);

    return (
        <Menu.Item
            ref={setAnchorElement}
            className={stop}
            iconEnd={<Icon data={ChevronRight} />}
            onClick={openSubmenu}
            extraProps={{
                onFocus: openSubmenu,
                onMouseEnter: openSubmenu,
                onMouseLeave: scheduleClose,
            }}
        >
            {title}
            <Popup open={open} hasArrow={false} placement={placement} anchorElement={anchorElement}>
                <div
                    className={b('templates-submenu', [stop])}
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                >
                    <Menu className={stop}>
                        {templates.map((template) => (
                            <Menu.Item
                                key={template.id}
                                className={stop}
                                onClick={() => {
                                    onApply(template);
                                    closePopup();
                                }}
                            >
                                {template.title}
                            </Menu.Item>
                        ))}
                    </Menu>
                </div>
            </Popup>
        </Menu.Item>
    );
}

export function GroupedTemplatesMenuItems<TTemplate extends GridBlockTemplate>({
    templates,
    filter,
    emptyText,
    onApply,
}: GroupedTemplatesMenuItemsProps<TTemplate>) {
    const entries = groupTemplatesForMenu(templates, filter);

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
                        onApply={onApply}
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
