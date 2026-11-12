import {YfmStaticView} from '@gravity-ui/markdown-editor/view';
import {buttonPlugin} from '@gravity-ui/markdown-plugin-header';
import {useThemeType} from '@gravity-ui/uikit';
import MarkdownIt from 'markdown-it';

import {block} from '../../utils/cn';

import './Button.scss';
import '@gravity-ui/markdown-plugin-header/styles.css';

const b = block('button-example');
const md = new MarkdownIt().use(buttonPlugin);

export function ButtonExample({
    initial = ':::button{href="https://example.com"}\nКнопка\n:::',
    palette = false,
}: {
    initial?: string;
    palette?: boolean;
}) {
    const theme = useThemeType();

    return (
        <YfmStaticView
            qa="button-example"
            className={b({theme, palette})}
            html={md.render(initial)}
        />
    );
}
