import {inlineCode, section} from '../markdown.mjs';
import {sortedUnique} from '../utils.mjs';

/** Renders toolbar buttons that run actions of the extension. */
export function toolbarSection({index, actions}) {
    const rows = actions.flatMap((action) =>
        (index.toolbarItems.get(action) ?? []).map(
            (title) => `| ${title} | ${inlineCode(action)} |`,
        ),
    );
    const table = rows.length > 0 ? ['| Button | Action |', '|--------|--------|'] : [];

    return section('## Toolbar', [...table, ...sortedUnique(rows)]);
}
