import {MarkdownViewer, cnYFM} from '@gravity-ui/markdown-viewer';
import {HeadingAnchors} from '@gravity-ui/markdown-viewer/extensions';

import * as DefaultViewerStories from '../../src/stories/viewer/MarkdownViewer.stories';

import {composeStories} from './utils/compose-stories';

export const ViewerStories = composeStories(DefaultViewerStories);

export function HeadingAliasViewer({attribute}: {attribute: 'id' | 'name'}) {
    return (
        <div>
            <a href="#legacy-alias">Go to alias</a>
            <div style={{height: 1200}} />
            <MarkdownViewer
                className={cnYFM()}
                html={`<h2 id="heading"><a ${attribute}="legacy-alias" class="yfm-anchor yfm-clipboard-anchor" href="#heading">#</a>Heading</h2>`}
            >
                <HeadingAnchors getHref={({id}) => `#${id}`} />
            </MarkdownViewer>
            <div style={{height: 1200}} />
        </div>
    );
}
