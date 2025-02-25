import {HelpMark, type HelpMarkProps, Link, Portal} from '@gravity-ui/uikit';

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

type MathHintProps = Pick<NonNullable<HelpMarkProps['popoverProps']>, 'offset' | 'hasArrow'>;

const MathHint: React.FC<MathHintProps> = function MathHint(props) {
    return (
        <HelpMark
            popoverProps={{
                placement: ['bottom-end', 'top-end'],
                modal: false,
                ...props,
            }}
        >
            <MathHintContent />
        </HelpMark>
    );
};

export function renderMathHint(props: MathHintProps, container: HTMLElement): React.ReactNode {
    return (
        <Portal container={container}>
            <MathHint {...props} />
        </Portal>
    );
}
