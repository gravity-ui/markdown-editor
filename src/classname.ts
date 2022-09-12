import {withNaming} from '@bem-react/classname';

export const cn = withNaming({n: 'ye-', e: '__', m: '_', v: '_'});

export interface ClassNameProps {
    className?: string;
}
