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
    p,
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

    it('should parse dom with multiple checkboxes without id', () => {
        parseDOM(
            schema,
            `
<input type="checkbox">
<label>First checkbox</label>
<input type="checkbox" checked="">
<label>Second checkbox</label>
`,
            doc(
                checkbox(cbInput(), cbLabel('First checkbox')),
                checkbox(cbInput({checked: 'true'}), cbLabel('Second checkbox')),
            ),
            [fixPastePlugin()],
        );
    });

    it('should create empty label when next sibling is not a label', () => {
        parseDOM(
            schema,
            `<input type="checkbox"><span>Not a label</span>`,
            doc(checkbox(cbInput(), cbLabel()), p('Not a label')),
            [fixPastePlugin()],
        );
    });

    it('should parse multiple checkboxes wrapped in div.checkbox', () => {
        parseDOM(
            schema,
            `
<div class="checkbox">
  <input type="checkbox" id="checkbox0">
  <label for="checkbox0">Task 1</label>
</div>
<div class="checkbox">
  <input type="checkbox" id="checkbox1" checked="true">
  <label for="checkbox1">Task 2</label>
</div>`,
            doc(
                checkbox(cbInput(), cbLabel('Task 1')),
                checkbox(cbInput({checked: 'true'}), cbLabel('Task 2')),
            ),
            [fixPastePlugin()],
        );
    });

    it('should parse checkboxes with special characters in id', () => {
        parseDOM(
            schema,
            `
<div class="checkbox">
  <input type="checkbox" id="my:invalid[id]">
  <label for="my:invalid[id]">Task with invalid ID</label>
</div>
<div class="checkbox">
  <input type="checkbox" id="checkbox1" checked="true">
  <label for="checkbox1">Task with valid ID</label>
</div>`,
            doc(
                checkbox(cbInput(), cbLabel('Task with invalid ID')),
                checkbox(cbInput({checked: 'true'}), cbLabel('Task with valid ID')),
            ),
            [fixPastePlugin()],
        );
    });
});
