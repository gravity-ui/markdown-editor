import {Preset} from '../../demo/stories/presets/Preset';
import {presets, toolbarPresets} from '../../demo/stories/presets/presets';

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

export const Zero = () => <Preset {...args} preset={presets.zero} />;
export const Commonmark = () => <Preset {...args} preset={presets.commonmark} />;
export const Default = () => <Preset {...args} preset={presets.defaultPreset} />;
export const Yfm = () => <Preset {...args} preset={presets.yfm} />;
export const Full = () => <Preset {...args} preset={presets.full} />;
export const Custom = () => (
    <Preset {...args} preset={presets.full} toolbarsPreset={toolbarPresets.custom} />
);
