import {memo, useMemo, useRef} from 'react';

import {Link} from '@gravity-ui/icons';
import {cn} from '@gravity-ui/markdown-editor';
import type {ButtonModel} from '@gravity-ui/markdown-plugin-banner';
import {Divider, Icon, Popup, type PopupProps, Switch, TextInput} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import {PopupLayer} from '../../../PopupLayer';
import {TabOutClose} from '../../../TabOutClose';
import {closeUnlessAnchor, nodeAnchor, useSavedText} from '../../../popup';

import {StyleSelect} from './StyleSelect';

import './ButtonSettings.scss';

const b = cn('button-settings');

const LINK_ICON_SIZE = 16;

const placement: PopupProps['placement'] = ['bottom-start', 'top-start'];

type ButtonSettingsProps = {
    anchor: HTMLElement;
    label: string;
    placeholder: string;
    attrs: ButtonModel;
    onChange: (attrs: Partial<ButtonModel>) => boolean;
    onHrefChange: (href: string) => boolean;
    onLabelChange: (label: string) => boolean;
    onClose: (reason?: string) => void;
};

export const ButtonSettings = memo<ButtonSettingsProps>(function ButtonSettings({
    anchor,
    label,
    placeholder,
    attrs,
    onChange,
    onHrefChange,
    onLabelChange,
    onClose,
}) {
    const labelRef = useRef<HTMLInputElement>(null);
    const close = () => onClose();
    const labelField = useSavedText(label, onLabelChange, close);
    const hrefField = useSavedText(attrs.href, onHrefChange, close);
    const saveAndClose = (reason?: string) => {
        labelField.save();
        hrefField.save();
        onClose(reason);
    };
    const saveAndCloseOnTab = () => saveAndClose();
    const handleNewTabUpdate = (checked: boolean) =>
        onChange({target: checked ? '_blank' : '_self'});
    const anchorElement = useMemo(() => nodeAnchor(anchor), [anchor]);
    return (
        <PopupLayer>
            <Popup
                open
                returnFocus={false}
                anchorElement={anchorElement}
                className={b('popup')}
                placement={placement}
                initialFocus={labelRef}
                onOpenChange={closeUnlessAnchor(anchor, saveAndClose)}
            >
                <TabOutClose onClose={saveAndCloseOnTab}>
                    <section
                        className={b()}
                        role="dialog"
                        aria-label={i18n('button-settings')}
                        data-qa="button-settings"
                        tabIndex={-1}
                    >
                        <TextInput
                            {...labelField.input}
                            size="l"
                            hasClear
                            controlRef={labelRef}
                            placeholder={placeholder}
                            controlProps={{'aria-label': i18n('button-label')}}
                        />
                        <Divider className={b('divider')} />
                        <div className={b('fields')}>
                            <StyleSelect style={attrs} onUpdate={onChange} />
                            <TextInput
                                {...hrefField.input}
                                size="l"
                                validationState={hrefField.invalid ? 'invalid' : undefined}
                                errorMessage={<span role="alert">{i18n('button-link-error')}</span>}
                                placeholder={i18n('button-link')}
                                controlProps={{'aria-label': i18n('button-link')}}
                                startContent={
                                    <Icon className={b('icon')} data={Link} size={LINK_ICON_SIZE} />
                                }
                            />
                            <Switch
                                size="m"
                                checked={attrs.target === '_blank'}
                                content={i18n('button-new-tab')}
                                onUpdate={handleNewTabUpdate}
                            />
                        </div>
                    </section>
                </TabOutClose>
            </Popup>
        </PopupLayer>
    );
});
