import {useState} from 'react';

import {Gear} from '@gravity-ui/icons';
import {cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    sectionBackgrounds,
    sectionGaps,
    sectionMaxColumns,
    sectionSettings,
} from '@gravity-ui/markdown-plugin-section';
import {Button, Icon, Select, Switch} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import {
    canSetSectionColumns,
    setSectionColumnBackground,
    setSectionColumns,
    setSectionSetting,
} from '../../commands';

import './SectionToolbar.scss';

const b = cn('section-toolbar');

type SectionToolbarProps = {
    view: EditorView;
    node: Node;
    pos: number;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
};

export function SectionToolbar({view, node, pos, onMouseEnter, onMouseLeave}: SectionToolbarProps) {
    const [settingsOpen, setSettingsOpen] = useState(false);

    const {padding, gap, rounded} = sectionSettings(node.attrs);
    const columns = Array.from({length: sectionMaxColumns}, (_, index) => {
        const count = index + 1;
        const value = String(count);
        return {value, content: value, disabled: !canSetSectionColumns(node, count)};
    });
    const gapOptions = sectionGaps.map((value) => ({value, content: value}));
    const backgroundOptions = sectionBackgrounds.map((value) => ({value, content: i18n(value)}));

    const activateSection = () => {
        const {state} = view;
        if (state.selection.from < pos || state.selection.to > pos + node.nodeSize) {
            view.dispatch(state.tr.setSelection(TextSelection.near(state.doc.resolve(pos + 2))));
        }
    };
    const toggleSettings = () => setSettingsOpen(!settingsOpen);
    const changeCount = ([value]: string[]) => {
        setSectionColumns(pos, Number(value))(view.state, view.dispatch);
    };
    const changePadding = (checked: boolean) => {
        setSectionSetting(pos, 'padding', checked)(view.state, view.dispatch);
    };
    const changeRounded = (checked: boolean) => {
        setSectionSetting(pos, 'rounded', checked)(view.state, view.dispatch);
    };
    const changeGap = ([value]: string[]) => {
        const next = sectionGaps.find((spacing) => spacing === value);
        if (next) setSectionSetting(pos, 'gap', next)(view.state, view.dispatch);
    };
    const changeBackground = (index: number, [value]: string[]) => {
        const color = sectionBackgrounds.find((background) => background === value);
        if (color) setSectionColumnBackground(pos, index, color)(view.state, view.dispatch);
    };
    const renderBackgroundField = (column: Node, index: number) => {
        const label = i18n('column-background', {number: String(index + 1)});
        const handleUpdate = (value: string[]) => changeBackground(index, value);
        return (
            <div key={index} className={b('field')}>
                <span>{label}</span>
                <Select
                    aria-label={label}
                    size="s"
                    value={[column.attrs.background]}
                    options={backgroundOptions}
                    onUpdate={handleUpdate}
                />
            </div>
        );
    };

    return (
        <div
            className={b()}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onPointerDown={activateSection}
        >
            <div className={b('row')}>
                <Button
                    size="s"
                    view={settingsOpen ? 'flat-secondary' : 'flat'}
                    aria-label={i18n('settings')}
                    aria-expanded={settingsOpen}
                    onClick={toggleSettings}
                >
                    <Icon data={Gear} size={14} />
                </Button>
                <Select
                    aria-label={i18n('columns')}
                    label={i18n('columns')}
                    size="s"
                    value={[String(node.childCount)]}
                    options={columns}
                    onUpdate={changeCount}
                />
            </div>
            {settingsOpen && (
                <div className={b('settings')}>
                    <Switch checked={padding} onUpdate={changePadding} size="m">
                        {i18n('padding')}
                    </Switch>
                    <Switch checked={rounded} onUpdate={changeRounded} size="m">
                        {i18n('rounded')}
                    </Switch>
                    <div className={b('field')}>
                        <span>{i18n('gap')}</span>
                        <Select
                            aria-label={i18n('gap')}
                            size="s"
                            value={[gap]}
                            options={gapOptions}
                            onUpdate={changeGap}
                        />
                    </div>
                    {node.content.content.map(renderBackgroundField)}
                </div>
            )}
        </div>
    );
}
