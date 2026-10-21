/**
 * Footnote examples: group → example name → markup.
 * The native term runtime finds definitions by id in the whole document,
 * so every key is unique across the catalogue.
 */
export const footnoteExamples: Record<string, Record<string, string>> = {
    Basic: {
        'Star marker': [
            'The rate is 15%[*](*basic-rate).',
            '[*basic-rate]: The rate applies from January.',
        ].join('\n\n'),
        'Selected phrase': [
            'Read the [release notes](*basic-notes) first.',
            '[*basic-notes]: The notes list every change in this version.',
        ].join('\n\n'),
        'Cyrillic text and key': [
            'Ставка составляет 15%[*](*ставка).',
            '[*ставка]: Ставка действует с января.',
        ].join('\n\n'),
        'Key with spaces': [
            'Delivery[*](*basic delivery time) takes two days.',
            '[*basic delivery time]: Business days only.',
        ].join('\n\n'),
    },
    'Shared definitions': {
        'Several references to one definition': [
            'First mention[*](*shared-source), second [mention](*shared-source).',
            '[*shared-source]: Both references open this definition.',
        ].join('\n\n'),
        'Several definitions': [
            'Speed[*](*shared-speed) and weight[*](*shared-weight).',
            '[*shared-speed]: Measured at sea level.\n[*shared-weight]: Measured without packaging.',
        ].join('\n\n'),
        'Definition before the reference': [
            '[*shared-first]: A definition can precede its references.',
            'Value[*](*shared-first).',
        ].join('\n\n'),
        'Duplicate definition': [
            'Value[*](*shared-duplicate).',
            '[*shared-duplicate]: The first definition is used.',
            '[*shared-duplicate]: The second definition stays in the source.',
        ].join('\n\n'),
        'Unused definition': [
            'This paragraph has no references.',
            '[*shared-unused]: The source keeps this definition. The output omits it.',
        ].join('\n\n'),
    },
    'Explanation Markdown': {
        'Formatting and links': [
            'Release[*](*md-format).',
            '[*md-format]: **Bold**, _italic_, ~~strike~~, `code` and [a link](https://example.com).',
        ].join('\n\n'),
        'Nested reference': [
            'API[*](*md-api).',
            '[*md-api]: Requests pass through the [gateway](*md-gateway).',
            '[*md-gateway]: The gateway checks every request.',
        ].join('\n\n'),
        'Several lines': [
            'Address[*](*md-lines).',
            '[*md-lines]: The first line.\nThe second line of the same definition.',
        ].join('\n\n'),
        'Blank line ends the definition': [
            'Note[*](*md-end).',
            '[*md-end]: The definition ends here.',
            'This paragraph is ordinary text.',
        ].join('\n\n'),
    },
    'Surrounding content': {
        'Inside marks': [
            '**Bold text[*](*context-marks)** and _an italic [phrase](*context-marks)_.',
            '[*context-marks]: The reference keeps the surrounding formatting.',
        ].join('\n\n'),
        'Next to a link': [
            'See [the guide](https://example.com)[*](*context-link).',
            '[*context-link]: The link and the reference stay separate.',
        ].join('\n\n'),
        Heading: [
            '## Pricing[*](*context-heading)',
            '[*context-heading]: Prices include taxes.',
        ].join('\n\n'),
        'List and quote': [
            '- List item[*](*context-blocks)',
            '> Quote[*](*context-blocks)',
            '[*context-blocks]: References work in lists and quotes.',
        ].join('\n\n'),
    },
    Escaping: {
        'Brackets in visible text': [
            '[Plan \\[beta\\]](*escape-brackets) is available.',
            '[*escape-brackets]: Escaped brackets stay in the visible text.',
        ].join('\n\n'),
        'Star in visible text': [
            '[Rate\\*](*escape-star) is fixed.',
            '[*escape-star]: An escaped star stays in the visible text.',
        ].join('\n\n'),
        'Syntax in inline code': [
            'The code `[*](*escape-code)` shows the syntax.',
            '[*escape-code]: Inline code does not create a reference.',
        ].join('\n\n'),
    },
    'Edge cases': {
        'Reference without a definition': 'The value[*](*edge-missing) has no definition here.',
        'Keys are case sensitive': [
            'Value[*](*Edge-Case).',
            '[*edge-case]: This key differs from the reference.',
        ].join('\n\n'),
        'Adjacent references': [
            'Value[*](*edge-first)[*](*edge-second).',
            '[*edge-first]: The first explanation.\n[*edge-second]: The second explanation.',
        ].join('\n\n'),
    },
};

/** Examples shown together in the live editor. */
export const footnoteEditorMarkup = [
    footnoteExamples.Basic['Star marker'],
    footnoteExamples.Basic['Selected phrase'],
    footnoteExamples['Shared definitions']['Several references to one definition'],
    footnoteExamples['Explanation Markdown']['Formatting and links'],
    footnoteExamples['Explanation Markdown']['Nested reference'],
    footnoteExamples['Surrounding content']['Inside marks'],
    footnoteExamples.Basic['Cyrillic text and key'],
    footnoteExamples['Edge cases']['Reference without a definition'],
].join('\n\n');
