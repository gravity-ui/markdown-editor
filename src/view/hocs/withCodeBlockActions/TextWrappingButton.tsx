import {useState} from 'react';

import {ArrowUturnCwLeft as WrappingIcon} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';

export type CodeTextWrappingToggleButtonProps = {
    codeElement: HTMLElement;
};

export function CodeTextWrappingToggleButton({codeElement}: CodeTextWrappingToggleButtonProps) {
    const [hasWrapping, setHasWrapping] = useState(() =>
        codeElement.querySelector<HTMLElement>('pre code')?.classList.contains('wrap'),
    );

    return (
        <ActionTooltip title="Перенос текста">
            <Button
                size="m"
                view="flat"
                selected={hasWrapping}
                onClick={() => {
                    const preCode = codeElement.querySelector<HTMLElement>('pre code');
                    setHasWrapping(preCode?.classList.toggle('wrap'));
                }}
            >
                <Button.Icon>
                    <Icon data={WrappingIcon} />
                </Button.Icon>
            </Button>
        </ActionTooltip>
    );
}
