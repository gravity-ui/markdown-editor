import {useRef} from 'react';

import {cnEditorComponent} from 'src/bundle/editor-classname';
import {EditorSettings, type EditorSettingsProps} from 'src/bundle/settings/EditorSettings';
import {stickyCn} from 'src/bundle/sticky';
import {useSticky} from 'src/react-utils';

const b = cnEditorComponent;

/** @internal */
export function SettingsLayout(props: EditorSettingsProps & {stickyToolbar: boolean}) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const isSticky = useSticky(wrapperRef) && props.toolbarVisibility && props.stickyToolbar;

    return (
        <>
            {(props.renderPreviewButton || props.settingsVisible) && (
                <div className={b('settings-wrapper')}>
                    <div
                        ref={wrapperRef}
                        className={stickyCn.settings({
                            withToolbar: props.toolbarVisibility,
                            stickyActive: isSticky,
                        })}
                    >
                        <EditorSettings {...props} />
                        <div className={`g-md-search-${props.mode}-anchor`} />
                    </div>
                </div>
            )}
        </>
    );
}
