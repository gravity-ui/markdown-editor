import {Preset} from '../../demo/stories/presets/Preset';
import {toolbarPresets} from '../../demo/stories/presets/presets';

const args = {
    settingsVisible: true,
    allowHTML: true,
    breaks: true,
    linkify: true,
    linkifyTlds: [],
    splitModeOrientation: 'horizontal' as const,
    stickyToolbar: true,
    height: 'initial',
};

export const Zero = () => <Preset {...args} preset="zero" />;
export const Commonmark = () => <Preset {...args} preset="commonmark" />;
export const Default = () => <Preset {...args} preset="default" />;
export const Yfm = () => <Preset {...args} preset="yfm" />;
export const Full = () => <Preset {...args} preset="full" />;
export const Custom = () => (
    <Preset {...args} preset="full" toolbarsPreset={toolbarPresets.custom} />
);
