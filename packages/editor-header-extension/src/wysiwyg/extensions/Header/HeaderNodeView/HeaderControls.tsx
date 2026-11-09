import {Copy, Gear, TrashBin} from '@gravity-ui/icons';
import {cn} from '@gravity-ui/markdown-editor';
import type {Command} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {Button, Icon} from '@gravity-ui/uikit';

import {i18n} from '../../../../i18n';
import {copyHeader, removeHeader} from '../commands';
import {STOP_EVENT_CLASSNAME} from '../const';

import './HeaderControls.scss';

const b = cn('header-view');

type HeaderControlsProps = {
    view: EditorView;
    getPos: () => number | undefined;
    onOpenSettings: () => void;
};

export function HeaderControls({view, getPos, onOpenSettings}: HeaderControlsProps) {
    const run = (command: (pos: number) => Command) => () => {
        const pos = getPos();
        if (pos !== undefined) command(pos)(view.state, view.dispatch, view);
    };

    return (
        <div className={b('toolbar', STOP_EVENT_CLASSNAME)} role="toolbar" contentEditable={false}>
            <Button view="flat" size="m" aria-label={i18n('settings')} onClick={onOpenSettings}>
                <Icon data={Gear} size={16} />
            </Button>
            <Button view="flat" size="m" aria-label={i18n('copy')} onClick={run(copyHeader)}>
                <Icon data={Copy} size={16} />
            </Button>
            <div className={b('divider')} />
            <Button
                view="flat-danger"
                size="m"
                aria-label={i18n('remove')}
                onClick={run(removeHeader)}
            >
                <Icon data={TrashBin} size={16} />
            </Button>
        </div>
    );
}
