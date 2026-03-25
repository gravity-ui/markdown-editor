import {memo} from 'react';

import {cn} from '@bem-react/classname';
import {Select, type SelectOption} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/codeblock';
import {i18n as i18nPlaceholder} from 'src/i18n/placeholder';

import {PlainTextLang} from '../const';

const bCodeBlock = cn('code-block');

export type CodeLangSelectProps = {
    lang: string;
    selectItems: SelectOption[];
    mapping: Record<string, string>;
    focus: () => void;
    onChange: (value: string) => void;
};

export const CodeLangSelect: React.FC<CodeLangSelectProps> = memo<CodeLangSelectProps>(
    function CodeLangSelect({lang, focus, onChange, selectItems, mapping}) {
        const value = mapping[lang] || lang || PlainTextLang;

        const handleClick = (type: string) => {
            focus();
            if (type === value) return;
            onChange(type);
        };

        return (
            <Select
                size="m"
                width="max"
                disablePortal
                value={[value]}
                onUpdate={(v) => handleClick(v[0])}
                options={selectItems}
                filterable
                filterPlaceholder={i18nPlaceholder('select_filter')}
                popupClassName={bCodeBlock('select-popup')}
                className={bCodeBlock('select-button')}
                renderEmptyOptions={() => (
                    <div className={bCodeBlock('select-empty')}>{i18n('empty_option')}</div>
                )}
                // TODO: in onOpenChange return focus to view.dom after press Esc in Select
                // after https://github.com/gravity-ui/uikit/issues/2075
            />
        );
    },
);
