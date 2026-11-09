import {useId} from 'react';

import {Xmark} from '@gravity-ui/icons';
import {cn} from '@gravity-ui/markdown-editor';
import {
    type HeaderDimensions,
    headerHeights,
    headerWidths,
} from '@gravity-ui/markdown-plugin-header';
import {Button, Icon, Text} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import {STOP_EVENT_CLASSNAME} from '../../const';

import {DimensionSelect} from './DimensionSelect';

import './HeaderSettings.scss';

const b = cn('header-settings');

type HeaderSettingsProps = {
    dimensions: HeaderDimensions;
    onChange: (attrs: Partial<HeaderDimensions>) => void;
    onClose: () => void;
};

export function HeaderSettings({dimensions, onChange, onClose}: HeaderSettingsProps) {
    const titleId = useId();
    return (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Escape closes the dialog
        <section
            className={b(null, STOP_EVENT_CLASSNAME)}
            role="dialog"
            contentEditable={false}
            aria-labelledby={titleId}
            data-qa="header-settings"
            onKeyDown={(event) => {
                const target = event.target as Element;
                // Escape in an open Select or its list closes only the list.
                if (
                    event.key === 'Escape' &&
                    event.currentTarget.contains(target) &&
                    !target.closest('[aria-expanded="true"]')
                ) {
                    onClose();
                }
            }}
        >
            <div className={b('title')}>
                <Text variant="subheader-3" id={titleId}>
                    {i18n('title')}
                </Text>
                <Button
                    className={b('close')}
                    view="flat"
                    size="l"
                    aria-label={i18n('close')}
                    onClick={onClose}
                >
                    <Icon data={Xmark} size={16} />
                </Button>
            </div>
            <DimensionSelect
                autoFocus
                label={i18n('height')}
                value={dimensions.height}
                values={headerHeights}
                format={(value) => value.toUpperCase()}
                onUpdate={(value) => onChange({height: value})}
            />
            <DimensionSelect
                label={i18n('width')}
                value={dimensions.width}
                values={headerWidths}
                format={(value) => (value === 'full' ? i18n('full-width') : value.toUpperCase())}
                onUpdate={(value) => onChange({width: value})}
            />
        </section>
    );
}
