import {builders} from 'prosemirror-test-builder';

import {parseDOM} from '../../../../tests/parse-dom';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSchemaSpecs} from '../../base/specs';
import {BoldSpecs, boldMarkName} from '../../markdown/specs';

import {CheckboxAttr, CheckboxNode, CheckboxSpecs} from './CheckboxSpecs';
import {fixPastePlugin} from './plugins/fix-paste';

const {
    schema,
    markupParser: parser,
    serializer,
} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(BoldSpecs)
            .use(CheckboxSpecs, {checkboxLabelPlaceholder: 'checkbox-placeholder'}),
}).buildDeps();

const {
    doc,
    b,
    checkbox,
    cbInput,
    cbLabel,
    checkboxInput0,
    checkboxInput1,
    checkboxInput2,
    checkboxLabel0,
    checkboxLabel1,
    checkboxLabel2,
} = builders<
    | 'doc'
    | 'p'
    | 'b'
    | 'checkbox'
    | 'cbInput'
    | 'cbLabel'
    | 'checkboxInput0'
    | 'checkboxInput1'
    | 'checkboxInput2'
    | 'checkboxLabel0'
    | 'checkboxLabel1'
    | 'checkboxLabel2'
>(schema, {
    doc: {nodeType: BaseNode.Doc},
    p: {nodeType: BaseNode.Paragraph},
    b: {nodeType: boldMarkName},
    checkbox: {nodeType: CheckboxNode.Checkbox},
    cbInput: {nodeType: CheckboxNode.Input},
    cbLabel: {nodeType: CheckboxNode.Label},
    checkboxInput0: {nodeType: CheckboxNode.Input, id: 'yfm-editor-checkbox0'},
    checkboxInput1: {
        nodeType: CheckboxNode.Input,
        id: 'yfm-editor-checkbox1',
        checked: 'true',
    },
    checkboxInput2: {nodeType: CheckboxNode.Input, id: 'yfm-editor-checkbox2'},
    checkboxLabel0: {nodeType: CheckboxNode.Label, for: 'yfm-editor-checkbox0'},
    checkboxLabel1: {nodeType: CheckboxNode.Label, for: 'yfm-editor-checkbox1'},
    checkboxLabel2: {nodeType: CheckboxNode.Label, for: 'yfm-editor-checkbox2'},
});

const {same, serialize} = createMarkupChecker({parser, serializer});

describe('Checkbox extension', () => {
    it('should parse unchecked checkbox', () =>
        same('[ ] checkbox', doc(checkbox(checkboxInput0(), checkboxLabel0('checkbox')))));

    it('should parse checked checkbox', () =>
        same('[X] checkbox', doc(checkbox(checkboxInput1(), checkboxLabel1('checkbox')))));

    it('should not escape characters', () =>
        same('[ ] abobo +', doc(checkbox(checkboxInput2(), checkboxLabel2('abobo +')))));

    it('should parse and serialize inline markup in label', () =>
        same(
            '[X] **bold** text',
            doc(
                checkbox(
                    cbInput({checked: 'true', id: 'yfm-editor-checkbox3'}),
                    cbLabel({for: 'yfm-editor-checkbox3'}, b('bold'), ' text'),
                ),
            ),
        ));

    it('should substitute placeholder when label is empty', () => {
        serialize(doc(checkbox(cbInput(), cbLabel())), '[ ] checkbox-placeholder');
    });

    it('should substitute placeholder when label contains only whitespace characters', () => {
        serialize(
            doc(checkbox(cbInput(), cbLabel('    \t    \n    '))),
            '[ ] checkbox-placeholder',
        );
    });

    it('should parse dom with checkbox', () => {
        parseDOM(
            schema,
            `
<meta charset='utf-8'>
<div class="checkbox">
<input type="checkbox" id="checkbox1" disabled="" checked="true">
<label for="checkbox1">два</label>
</div>`,
            doc(checkbox(cbInput({[CheckboxAttr.Checked]: 'true'}), cbLabel('два'))),
            [fixPastePlugin()],
        );
    });

    it('should parse dom with input[type=checkbox]', () => {
        parseDOM(
            schema,
            `
<input type="checkbox" id="checkbox2" disabled="">
<span></span>
<label for="checkbox2">todo2</label>
`,
            doc(checkbox(cbInput(), cbLabel('todo2'))),
            [fixPastePlugin()],
        );
    });

    it('should parse dom with input[type=checkbox] without id', () => {
        parseDOM(
            schema,
            `
<input type="checkbox" disabled="">
<label>todo without id</label>
`,
            doc(checkbox(cbInput(), cbLabel('todo without id'))),
            [fixPastePlugin()],
        );
    });
});
