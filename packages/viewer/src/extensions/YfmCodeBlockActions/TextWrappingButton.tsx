import {useState} from 'react';

import {ArrowUturnCwLeft as WrappingIcon} from '@gravity-ui/icons';
import {ActionTooltip, Button, type DOMProps, Icon, type QAProps} from '@gravity-ui/uikit';

import {i18n} from './i18n';

export type CodeTextWrappingToggleButtonProps = DOMProps &
    QAProps & {
        codeElement: HTMLElement;
    };

export function CodeTextWrappingToggleButton({
    qa,
    style,
    className,
    codeElement,
}: CodeTextWrappingToggleButtonProps) {
    const {t} = i18n.useTranslation();
    const [hasWrapping, setHasWrapping] = useState<boolean>(() =>
        Boolean(codeElement.querySelector('pre code')?.classList.contains('wrap')),
    );

    return (
        <ActionTooltip title={t('code_wrapping')}>
            <Button
                size="m"
                view="flat"
                aria-label={t('code_wrapping')}
                selected={hasWrapping}
                style={style}
                data-qa={qa}
                className={className}
                onClick={() => {
                    const code = codeElement.querySelector('pre code');
                    setHasWrapping(Boolean(code?.classList.toggle('wrap')));
                }}
            >
                <Button.Icon>
                    <Icon data={WrappingIcon} />
                </Button.Icon>
            </Button>
        </ActionTooltip>
    );
}
