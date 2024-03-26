import React, {RefObject} from 'react';

import {Popup, TextInput, TextInputProps} from '@gravity-ui/uikit';
import isNumber from 'is-number';
import {Mark, Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

import {cn} from '../../../../../classname';
import {LinkAttr, linkType} from '../../../../../extensions/markdown';
import {ImgSizeAttr} from '../../../../../extensions/specs';
import Form from '../../../../../forms/base';
import {NumberInput} from '../../../../../forms/components';
import {enterKeyHandler} from '../../../../../forms/utils';
import {i18n} from '../../../../../i18n/forms';

import './ImageForm.scss';

const b = cn('image-tooltip-form');

export const ImageForm: React.FC<{
    node: Node;
    dom: RefObject<HTMLElement>;
    updateAttributes: (o: object, marks?: Mark[]) => void;
    view: EditorView;
    unsetEdit: () => void;
}> = ({node, updateAttributes, view, unsetEdit, dom}) => {
    const {attrs, marks} = node;
    const link = marks.find((m) => m.type.name === linkType(view.state.schema).name);

    const [name, setName] = React.useState(attrs[ImgSizeAttr.Title] || '');
    const [alt, setAlt] = React.useState(attrs[ImgSizeAttr.Alt] || '');
    const [width, setWidth] = React.useState(attrs[ImgSizeAttr.Width] || '');
    const [height, setHeight] = React.useState(attrs[ImgSizeAttr.Height] || '');
    const [linkHref, setLinkHref] = React.useState(link?.attrs.href || '');
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

    const inputEnterKeyHandler: TextInputProps['onKeyPress'] = enterKeyHandler(handleSubmit);

    return (
        <Popup
            open
            anchorRef={dom}
            placement={['bottom-start', 'top-start', 'bottom-end', 'top-end']}
            onOutsideClick={unsetEdit}
        >
            <Form.Form className={b()}>
                <Form.Layout>
                    {link && (
                        <Form.Row
                            label={i18n('image_link_href')}
                            help={i18n('image_link_href_help')}
                            control={
                                <TextInput
                                    autoFocus
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
                                autoFocus={Boolean(!link)}
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
