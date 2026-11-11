import {type ReactNode, useState} from 'react';

import {ChevronDown, ChevronUp} from '@gravity-ui/icons';
import {cn} from '@gravity-ui/markdown-editor';
import {Button, Divider, Icon, Text, useUniqId} from '@gravity-ui/uikit';

import {logClick} from './utils';

const b = cn('header-settings');

export function SettingsSection({
    title,
    action,
    children,
}: {
    title: string;
    action: string;
    children: ReactNode;
}) {
    const [expanded, setExpanded] = useState(true);
    const contentId = useUniqId();
    return (
        <>
            <Divider />
            <div className={b('title')}>
                <Text variant="subheader-2">{title}</Text>
                <Button
                    view="flat-secondary"
                    size="m"
                    aria-label={title}
                    aria-expanded={expanded}
                    aria-controls={contentId}
                    onClick={() => {
                        setExpanded(!expanded);
                        logClick(`${action} section button`);
                    }}
                >
                    <Icon data={expanded ? ChevronUp : ChevronDown} size={16} />
                </Button>
            </div>
            <div className={b('fields', {hidden: !expanded})} id={contentId}>
                {children}
            </div>
        </>
    );
}
