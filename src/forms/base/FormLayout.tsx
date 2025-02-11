import {ClassNameProps, cn} from '../../classname';

import './FormLayout.scss';

const b = cn('form-layout');

export type FormLayoutProps = ClassNameProps & {
    children?: React.ReactNode;
};

export const FormLayout: React.FC<FormLayoutProps> = ({className, children}) => {
    return <div className={b({}, [className])}>{children}</div>;
};
