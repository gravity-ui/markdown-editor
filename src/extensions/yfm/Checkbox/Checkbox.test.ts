import {builders} from 'prosemirror-test-builder';
import {createMarkupChecker} from '../../../../tests/sameMarkup';
import {ExtensionsManager} from '../../../core';
import {BaseNode, BaseSpecsPreset} from '../../base/specs';
import {boldMarkName, BoldSpecs} from '../../markdown/specs';
import {CheckboxSpecs, CheckboxNode} from './CheckboxSpecs';

const {schema, parser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSpecsPreset, {})
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
} = builders(schema, {
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
}) as PMTestBuilderResult<
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
>;

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
});
