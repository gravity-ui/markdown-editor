import {useEffect, useState} from 'react';

import {ArrowUpRightFromSquare, Link} from '@gravity-ui/icons';
import {cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {ActionTooltip, Button, Icon, TextInput} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import {setButtonAttrs} from '../../commands';

import {ButtonStyle} from './ButtonStyle';

import './ButtonToolbar.scss';

const b = cn('button-toolbar');

type ButtonToolbarProps = {
    view: EditorView;
    node: Node;
    pos: number;
};

export function ButtonToolbar({view, node, pos}: ButtonToolbarProps) {
    const [href, setHref] = useState<string>(node.attrs.href);
    useEffect(() => setHref(node.attrs.href), [node.attrs.href]);
    const saveHref = () => {
        const value = href.trim();
        if (value !== node.attrs.href)
            setButtonAttrs(pos, {href: value})(view.state, view.dispatch);
    };
    return (
        <div className={b()} data-qa="button-toolbar">
            <TextInput
                className={b('input')}
                size="l"
                view="clear"
                hasClear
                value={href}
                placeholder={i18n('button-link')}
                startContent={<Icon className={b('icon')} data={Link} size={16} />}
                onUpdate={setHref}
                onBlur={saveHref}
                onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    saveHref();
                    view.focus();
                }}
            />
            {href && (
                <ActionTooltip title={i18n('button-open-link')}>
                    <Button
                        view="flat"
                        size="m"
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Icon data={ArrowUpRightFromSquare} size={16} />
                    </Button>
                </ActionTooltip>
            )}
            <ButtonStyle view={view} node={node} pos={pos} />
        </div>
    );
}
