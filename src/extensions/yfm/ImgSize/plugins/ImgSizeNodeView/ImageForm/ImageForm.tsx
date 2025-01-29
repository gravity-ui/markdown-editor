import {useRef, useState} from 'react';

import {Popup, TextInput, TextInputProps} from '@gravity-ui/uikit';
import isNumber from 'is-number';
import {Mark, Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

import {cn} from '../../../../../../classname';
import Form from '../../../../../../forms/base';
import {NumberInput} from '../../../../../../forms/components';
import {i18n} from '../../../../../../i18n/forms';
import {useAutoFocus} from '../../../../../../react-utils/useAutoFocus';
import {enterKeyHandler} from '../../../../../../utils/handlers';
import {LinkAttr, linkType} from '../../../../../markdown';
import {ImgSizeAttr} from '../../../../../specs';

import './ImageForm.scss';

const b = cn('image-tooltip-form');

export const ImageForm: React.FC<{
    node: Node;
    anchorElement: HTMLElement | null;
    updateAttributes: (o: object, marks?: Mark[]) => void;
    view: EditorView;
    unsetEdit: () => void;
}> = ({node, updateAttributes, view, unsetEdit, anchorElement}) => {
    const {attrs, marks} = node;
    const link = marks.find((m) => m.type.name === linkType(view.state.schema).name);

    const [name, setName] = useState(attrs[ImgSizeAttr.Title] || '');
    const [alt, setAlt] = useState(attrs[ImgSizeAttr.Alt] || '');
    const [width, setWidth] = useState(attrs[ImgSizeAttr.Width] || '');
    const [height, setHeight] = useState(attrs[ImgSizeAttr.Height] || '');
    const [linkHref, setLinkHref] = useState(link?.attrs.href || '');
    const handleSubmit = () => {
        updateAttributes(
            {
                title: name.trim(),
                alt: alt.trim(),
                width: isNumber(width) && Number(width) >= 0 ? String(width) : '',
                height: isNumber(height) && Number(height) >= 0 ? String(height) : '',
            },
            link
                ? [
                      linkType(view.state.schema).create({
                          ...link.attrs,
                          [LinkAttr.Href]: linkHref,
                      }),
                  ]
                : [],
        );
        unsetEdit();
    };
    const linkRef = useRef<HTMLInputElement>(null);
    const imageNameRef = useRef<HTMLInputElement>(null);

    useAutoFocus(link ? linkRef : imageNameRef);

    const inputEnterKeyHandler: TextInputProps['onKeyPress'] = enterKeyHandler(handleSubmit);

    return (
        <Popup
            open
            modal
            anchorElement={anchorElement}
            placement={['bottom-start', 'top-start', 'bottom-end', 'top-end']}
            onOpenChange={(_open, _event, reason) => {
                if (reason !== 'escape-key') unsetEdit();
            }}
        >
            <Form.Form className={b()}>
                <Form.Layout>
                    {link && (
                        <Form.Row
                            label={i18n('image_link_href')}
                            help={i18n('image_link_href_help')}
                            control={
                                <TextInput
                                    controlRef={linkRef}
                                    size="s"
                                    view="normal"
                                    value={linkHref}
                                    onUpdate={setLinkHref}
                                    className={b('input', {type: 'link'})}
                                    onKeyPress={inputEnterKeyHandler}
                                />
                            }
                        />
                    )}
                    <Form.Row
                        label={i18n('image_name')}
                        control={
                            <TextInput
                                controlRef={imageNameRef}
                                size="s"
                                view="normal"
                                value={name}
                                onUpdate={setName}
                                className={b('input', {type: 'name'})}
                                onKeyPress={inputEnterKeyHandler}
                            />
                        }
                    />
                    <Form.Row
                        label={i18n('image_alt')}
                        help={i18n('image_alt_help')}
                        control={
                            <TextInput
                                size="s"
                                view="normal"
                                value={alt}
                                onUpdate={setAlt}
                                className={b('input', {type: 'alt'})}
                                onKeyPress={inputEnterKeyHandler}
                            />
                        }
                    />
                    <Form.Row
                        label={i18n('common_sizes')}
                        control={
                            <div className={b('size-controls')}>
                                <NumberInput
                                    min={0}
                                    size="s"
                                    view="normal"
                                    value={width}
                                    onUpdate={setWidth}
                                    placeholder={i18n('image_size_width')}
                                    className={b('input', {type: 'width'})}
                                    onKeyPress={inputEnterKeyHandler}
                                />
                                x
                                <NumberInput
                                    min={0}
                                    size="s"
                                    view="normal"
                                    value={height}
                                    onUpdate={setHeight}
                                    placeholder={i18n('image_size_height')}
                                    className={b('input', {type: 'height'})}
                                    onKeyPress={inputEnterKeyHandler}
                                />
                            </div>
                        }
                    />
                </Form.Layout>
                <Form.Footer onSubmit={handleSubmit} />
            </Form.Form>
        </Popup>
    );
};
