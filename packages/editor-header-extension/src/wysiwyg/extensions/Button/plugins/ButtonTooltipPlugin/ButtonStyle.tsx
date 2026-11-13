import {useState} from 'react';

import {cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    type ButtonColor,
    type ButtonView,
    buttonAttrs,
    buttonViewColors,
} from '@gravity-ui/markdown-plugin-header';
import {Button, Popup, Select, type SelectOption, Switch, Text, useUniqId} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import {setButtonAttrs} from '../../commands';

import './ButtonStyle.scss';

const b = cn('button-style');

type Style = {view: ButtonView; color: ButtonColor};

const styleValue = ({view, color}: Style) => `${view}/${color}`;

const styleGroups = Object.entries(buttonViewColors).map(([view, colors]) => ({
    label: i18n(`button-view-${view as ButtonView}`),
    options: colors.map(
        (color): SelectOption<Style> => ({
            value: styleValue({view: view as ButtonView, color}),
            data: {view: view as ButtonView, color},
        }),
    ),
}));

function Swatch({view, color}: Style) {
    return <span className={`${b('swatch')} ${buttonAttrs({view, color}).class}`} />;
}

function StyleOption({style, label}: {style: Style; label: string}) {
    return (
        <span className={b('option')}>
            <Swatch {...style} />
            {label}
        </span>
    );
}

type ButtonStyleProps = {
    view: EditorView;
    node: Node;
    pos: number;
};

export function ButtonStyle({view, node, pos}: ButtonStyleProps) {
    const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState(false);
    const switchId = useUniqId();
    const style: Style = {view: node.attrs.view, color: node.attrs.color};
    const update = (attrs: Parameters<typeof setButtonAttrs>[1]) =>
        setButtonAttrs(pos, attrs)(view.state, view.dispatch);
    return (
        <>
            <Button
                ref={setAnchor}
                view="flat"
                size="m"
                selected={open}
                onClick={() => setOpen(!open)}
            >
                {i18n('button-style')}
            </Button>
            <Popup
                open={open}
                anchorElement={anchor}
                placement={['bottom-end', 'top-end']}
                onOpenChange={(next, event, reason) => {
                    // The style button toggles the window on its own click.
                    const onButton =
                        reason === 'outside-press' &&
                        event?.target instanceof window.Node &&
                        anchor?.contains(event.target);
                    if (!next && !onButton) setOpen(false);
                }}
            >
                <section className={b()} data-qa="button-style">
                    <Select<Style>
                        size="l"
                        width="max"
                        value={[styleValue(style)]}
                        options={styleGroups}
                        popupWidth={158}
                        popupPlacement={['right-start', 'left-start']}
                        renderOption={({data}) =>
                            data ? (
                                <StyleOption
                                    style={data}
                                    label={i18n(`button-color-${data.color}`)}
                                />
                            ) : (
                                <span />
                            )
                        }
                        renderSelectedOption={({data}) =>
                            data ? (
                                <StyleOption
                                    style={data}
                                    label={i18n(`button-view-${data.view}`)}
                                />
                            ) : (
                                <span />
                            )
                        }
                        onUpdate={([value]) => {
                            const [nextView, nextColor] = value.split('/');
                            update({view: nextView as ButtonView, color: nextColor as ButtonColor});
                        }}
                    />
                    <div className={b('row')}>
                        <Text as="label" variant="body-1" htmlFor={switchId}>
                            {i18n('button-new-tab')}
                        </Text>
                        <Switch
                            id={switchId}
                            size="m"
                            checked={node.attrs.target === '_blank'}
                            onUpdate={(checked) => update({target: checked ? '_blank' : '_self'})}
                        />
                    </div>
                </section>
            </Popup>
        </>
    );
}
