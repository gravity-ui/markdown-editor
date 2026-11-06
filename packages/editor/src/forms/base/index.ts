export * from './Form';
export * from './FormLayout';
export * from './FormRow';
export * from './FormFooter';

import {Form} from './Form';
import {FormFooter as Footer} from './FormFooter';
import {FormLayout as Layout} from './FormLayout';
import {FormRow as Row} from './FormRow';

const forms: {
    Form: typeof Form;
    Layout: typeof Layout;
    Row: typeof Row;
    Footer: typeof Footer;
} = {Form, Layout, Row, Footer};

export default forms;
