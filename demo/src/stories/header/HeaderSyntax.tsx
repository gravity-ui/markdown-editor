import {Fragment, memo, useCallback} from 'react';

import {Divider, Text} from '@gravity-ui/uikit';

import {SplitModePreviewLazy} from '../../components/SplitModePreviewLazy';
import {block} from '../../utils/cn';

import {type MarkupExample, type MarkupSection, withLocalImages} from './examples';
import {markupSections} from './sections';

import './HeaderSyntax.scss';

const b = block('header-syntax');

const Example = memo(function Example({id, title, markup}: MarkupExample) {
    const getValue = useCallback(() => withLocalImages(markup), [markup]);
    return (
        <div className={b('example')} data-qa="header-syntax-example" data-example={id}>
            <Text className={b('name')} variant="subheader-1">
                {id} — {title}
            </Text>
            <pre className={b('markup')}>{markup}</pre>
            <div className={b('preview')}>
                <SplitModePreviewLazy getValue={getValue} needToSanitizeHtml />
            </div>
        </div>
    );
});

/** Every example of the Header syntax: the Markdown source next to its preview. */
export function HeaderSyntax({
    sections = markupSections,
}: {
    /** The sections to show, all of them by default. */
    sections?: readonly MarkupSection[];
}) {
    return (
        <div className={b()} data-qa="header-syntax">
            {sections.map(({title, description, examples}) => (
                <section key={title} className={b('section')} data-qa="header-syntax-section">
                    <Text as="h2" variant="header-2">
                        {title}
                    </Text>
                    <Text color="secondary">
                        {description} {examples.length} examples.
                    </Text>
                    {examples.map((example) => (
                        <Fragment key={example.id}>
                            <Divider />
                            <Example {...example} />
                        </Fragment>
                    ))}
                </section>
            ))}
        </div>
    );
}
