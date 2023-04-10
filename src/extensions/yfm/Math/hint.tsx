import React from 'react';
import {createPortal} from 'react-dom';
import {HelpPopover, HelpPopoverProps, Link} from '@gravity-ui/uikit';

import {cn} from '../../../classname';
import {i18n} from '../../../i18n/math-hint';

export const b = cn('MathHint');

const MathHintContent: React.FC = function MathHintContent() {
    return (
        <>
            {i18n('math_hint')}{' '}
            <Link href={'https://katex.org/'} target={'blank'}>
                {i18n('math_hint_katex')}
            </Link>
        </>
    );
};

type MathHintProps = Pick<HelpPopoverProps, 'offset' | 'hasArrow'>;

const MathHint: React.FC<MathHintProps> = function MathHint(props) {
    return (
        <HelpPopover
            placement={['bottom-end', 'top-end']}
            {...props}
            content={<MathHintContent />}
        />
    );
};

export function renderMathHint(props: MathHintProps, container: Element): React.ReactNode {
    return createPortal(<MathHint {...props} />, container);
}
