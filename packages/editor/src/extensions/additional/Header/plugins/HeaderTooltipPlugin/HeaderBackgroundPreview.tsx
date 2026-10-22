import type {CSSProperties} from 'react';

import type {Node} from '#pm/model';
import {cn} from 'src/classname';
import {i18n} from 'src/i18n/header';

import type {HeaderAttrs} from '../../HeaderSpecs';
import {toCssUrl} from '../../HeaderSpecs/dom';

const b = cn('header-settings');
export function HeaderBackgroundPreview({node, attrs}: {node: Node; attrs: HeaderAttrs}) {
    const fixed = attrs['image-enabled'] === 'true' && attrs['bg-image-theme'] !== 'system';
    return (
        <div className={b('background-previews')}>
            {(['light', 'dark'] as const).map((theme) => (
                <figure key={theme} className={b('theme-preview')}>
                    <figcaption>{i18n(`preview_${theme}`)}</figcaption>
                    <div
                        className={`g-root g-root_theme_${theme} ${b('background-preview')}`}
                        data-effect={attrs.effect}
                        style={
                            {'--g-md-header-preview-image': toCssUrl(attrs.image)} as CSSProperties
                        }
                    >
                        <div
                            className={`${b('preview-text')}${fixed ? ` g-root g-root_theme_${attrs['bg-image-theme']}` : ''}`}
                            data-text={attrs.text}
                        >
                            {attrs.title === 'true' && (
                                <span
                                    className={b('preview-title')}
                                    data-color={node.child(0).attrs.color}
                                >
                                    {node.child(0).textContent || i18n('placeholder')}
                                </span>
                            )}
                            {attrs.description === 'true' && (
                                <span className={b('preview-description')}>
                                    {node.child(1).textContent || i18n('preview_description')}
                                </span>
                            )}
                        </div>
                    </div>
                </figure>
            ))}
        </div>
    );
}
