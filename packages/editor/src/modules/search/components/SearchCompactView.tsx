import {useRef} from 'react';

import {ChevronsExpandUpRight, Xmark} from '@gravity-ui/icons';
import {
    Button,
    ButtonIcon,
    Card,
    type DOMProps,
    Icon,
    type QAProps,
    Tooltip,
    sp,
} from '@gravity-ui/uikit';

import {cn} from 'src/classname';
import {i18n} from 'src/i18n/search';
import {useAutoFocus} from 'src/react-utils/useAutoFocus';

import {SearchQA} from '../qa';
import type {SearchCounter} from '../types';

import {SearchTextInput} from './SearchTextInput';

import './SearchCompactView.scss';

const b = cn('search-compact');

export type SearchCompactProps = DOMProps &
    QAProps & {
        value: string;
        counter?: SearchCounter;
        onChange: (value: string) => void;
        onFindPrevious: () => void;
        onFindNext: () => void;
        onExpand: () => void;
        onClose: () => void;
    };

export const SeachCompactView: React.FC<SearchCompactProps> = function SearchCompactView({
    value,
    counter,

    onChange,
    onFindNext,
    onFindPrevious,
    onExpand,
    onClose,

    qa,
    style,
    className,
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    useAutoFocus(inputRef, [], 200);

    return (
        <Card spacing={{pr: 1}} data-qa={qa} style={style} className={b(null, className)}>
            <SearchTextInput
                counter={counter}
                onFindNext={onFindNext}
                onFindPrevious={onFindPrevious}
                value={value}
                view="clear"
                delay={300}
                onUpdate={onChange}
                controlRef={inputRef}
                placeholder={i18n('search_placeholder')}
                className={sp({pl: 3})}
            />

            <div
                className={sp({mr: 1})}
                style={{
                    flexShrink: 0,
                    background: 'var(--g-color-line-generic-solid)',
                    height: '36px',
                    width: '1px',
                }}
            />

            {/* eslint-disable-next-line jsx-a11y/aria-role */}
            <Tooltip content={i18n('action_expand')} role="label">
                {(props, ref) => (
                    <Button
                        {...props}
                        size="m"
                        view="flat-secondary"
                        onClick={onExpand}
                        qa={SearchQA.ExpandBtn}
                        ref={ref as React.Ref<HTMLButtonElement>}
                        aria-label={i18n('action_expand')}
                    >
                        <ButtonIcon>
                            <Icon data={ChevronsExpandUpRight} />
                        </ButtonIcon>
                    </Button>
                )}
            </Tooltip>
            <Button
                size="m"
                view="flat-secondary"
                onClick={onClose}
                className={sp({ml: 1})}
                aria-label={i18n('action_close')}
                qa={SearchQA.CloseBtn}
            >
                <ButtonIcon>
                    <Icon data={Xmark} />
                </ButtonIcon>
            </Button>
        </Card>
    );
};
