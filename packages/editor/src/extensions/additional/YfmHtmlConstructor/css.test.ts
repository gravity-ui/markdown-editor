import {parse} from 'postcss';

import {replaceCssAnchor, scopeCss} from './css';

describe('constructor CSS', () => {
    it('preserves keyframes, declarations and at-rules while scoping nested rules', () => {
        const css = `/* animation */ @keyframes slide { from { opacity: 0 } to { opacity: 1 } }
@font-face { font-family: "demo"; src: url("font.woff2") }
@media (min-width: 400px) { :is(h1, h2), [data-label="a,b"] { content: "} & {"; animation: slide 1s } }`;
        const scoped = scopeCss(css, '.instance');
        const selectors: string[] = [];
        parse(scoped).walkRules((rule) => {
            selectors.push(rule.selector);
        });
        expect(selectors).toEqual([
            'from',
            'to',
            '.instance :is(h1, h2), .instance [data-label="a,b"]',
        ]);
        expect(scoped).toContain('content: "} & {"');
        expect(scoped).toContain('src: url("font.woff2")');
    });

    it('replaces selector anchors without changing URLs, strings or attribute values', () => {
        const css = '&, &[data-label="A&B"] { background: url("/?a=1&b=2"); content: "&" }';
        expect(replaceCssAnchor(css, '.block')).toBe(
            '.block, .block[data-label="A&B"] { background: url("/?a=1&b=2"); content: "&" }',
        );
    });

    it('preserves native nesting and excludes editor controls from preview rules', () => {
        const css = '.card { & > button { color: red } }';
        expect(scopeCss(css, '.instance', '[data-hc-ui]')).toBe(
            '.instance .card:not([data-hc-ui], [data-hc-ui] *) { & > button:not([data-hc-ui], [data-hc-ui] *) { color: red } }',
        );
    });

    it('keeps incomplete CSS editable while excluding it from the preview', () => {
        expect(scopeCss('.card { color:', '.instance')).toBe('');
        expect(scopeCss('& {')).toBe('');
        expect(replaceCssAnchor('& {', '.block')).toBe('& {');
    });

    it('preserves nesting through conditional at-rules', () => {
        const css =
            '& { @media (width > 500px) { @supports (display: grid) { & > h2 { color: red } } } }';
        const prepared = replaceCssAnchor(css, '.block');

        expect(prepared).toBe(
            '.block { @media (width > 500px) { @supports (display: grid) { & > h2 { color: red } } } }',
        );
        expect(scopeCss(prepared, '.instance')).toBe(
            '.instance .block { @media (width > 500px) { @supports (display: grid) { & > h2 { color: red } } } }',
        );
    });

    it('keeps pseudo-elements valid when excluding editor controls', () => {
        expect(scopeCss('a::before { content: "&" }', '.instance', '[data-hc-ui]')).toBe(
            '.instance a:not([data-hc-ui], [data-hc-ui] *)::before { content: "&" }',
        );
    });
});
