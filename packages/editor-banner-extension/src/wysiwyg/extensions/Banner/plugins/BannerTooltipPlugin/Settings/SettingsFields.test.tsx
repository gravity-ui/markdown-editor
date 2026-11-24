// @vitest-environment jsdom
import {
    type BannerLayout,
    bannerBackgroundDefaults,
    bannerLayoutDefaults,
} from '@gravity-ui/markdown-plugin-banner';
import {ThemeProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {SettingsFields} from './SettingsFields';

describe('Banner settings alignment', () => {
    let container: HTMLDivElement;
    let root: Root;
    const onChange = vi.fn();

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        onChange.mockClear();
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
    });

    function render(value: BannerLayout) {
        act(() => {
            root.render(
                <ThemeProvider>
                    <SettingsFields
                        content={{
                            parts: {image: false, title: false, content: false},
                            available: {},
                            onPartChange: vi.fn(),
                        }}
                        layout={{value, onChange}}
                        background={{value: bannerBackgroundDefaults, onChange: vi.fn()}}
                    />
                </ThemeProvider>,
            );
        });
    }

    function group(label: string) {
        const found = Array.from(container.querySelectorAll('[role="radiogroup"]')).find(
            (element) =>
                document.getElementById(element.getAttribute('aria-labelledby') ?? '')
                    ?.textContent === label,
        );
        if (!found) throw new Error(`Group "${label}" is missing`);
        return found;
    }

    const option = (groupLabel: string, label: string) => {
        const found = group(groupLabel).querySelector<HTMLInputElement>(
            `input[aria-label="${label}"]`,
        );
        if (!found) throw new Error(`Option "${label}" is missing`);
        return found;
    };

    const checked = (groupLabel: string) =>
        group(groupLabel).querySelector<HTMLInputElement>('input:checked')?.ariaLabel;

    it('should show the current alignment', () => {
        render(bannerLayoutDefaults);
        expect(checked('Vertically')).toBe('Center');
        expect(checked('Horizontally')).toBe('Left');
        render({align: 'right', vertical: 'bottom'});
        expect(checked('Vertically')).toBe('Bottom');
        expect(checked('Horizontally')).toBe('Right');
    });

    it.each([
        ['Horizontally', 'Center', 'align', 'center'],
        ['Horizontally', 'Right', 'align', 'right'],
        ['Vertically', 'Top', 'vertical', 'top'],
        ['Vertically', 'Bottom', 'vertical', 'bottom'],
    ])('should choose %s %s', (groupLabel, label, name, value) => {
        render(bannerLayoutDefaults);
        act(() => option(groupLabel, label).click());
        expect(onChange).toHaveBeenCalledExactlyOnceWith(name, value);
    });
});
