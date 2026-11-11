import {withNaming} from '@bem-react/classname';

export const NAMESPACE = 'g-mdv-';

export const cn = withNaming({n: NAMESPACE, e: '__', m: '_', v: '_'});
