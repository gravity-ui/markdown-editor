import {useState} from 'react';

import {ArrowUturnCwLeft as WrappingIcon} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/viewer';

export type CodeTextWrappingToggleButtonProps = {
    codeElement: HTMLElement;
};

export function CodeTextWrappingToggleButton({codeElement}: CodeTextWrappingToggleButtonProps) {
    const [hasWrapping, setHasWrapping] = useState<boolean>(() =>
        Boolean(codeElement.querySelector<HTMLElement>('pre code')?.classList?.contains('wrap')),
    );

    return (
        <ActionTooltip title={i18n('code_wrapping')}>
            <Button
                size="m"
                view="flat"
                selected={hasWrapping}
                onClick={() => {
                    const preCode = codeElement.querySelector<HTMLElement>('pre code');
                    setHasWrapping(Boolean(preCode?.classList?.toggle('wrap')));
                }}
            >
                <Button.Icon>
                    <Icon data={WrappingIcon} />
                </Button.Icon>
            </Button>
        </ActionTooltip>
    );
}
