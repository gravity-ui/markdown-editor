const escapeHtml = (value) =>
    String(value).replace(
        /[&<>"']/g,
        (char) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[char],
    );

export function renderReport(entries, base, head) {
    const sections = entries
        .map((entry, index) => {
            const modes = ['diff', 'before', 'after'].filter((mode) => entry.images[mode]);
            const title = escapeHtml(entry.path);
            let summary = entry.beforeSize ? 'Removed screenshot' : 'Added screenshot';
            if (entry.changedPixels !== undefined) {
                summary = `${entry.changedPixels.toLocaleString('en-US')} changed pixels (${((entry.changedPixels / (entry.width * entry.height)) * 100).toFixed(2)}%)`;
            }

            return `<section>
<h2>${title}</h2>
${entry.previousPath ? `<p>Renamed from ${escapeHtml(entry.previousPath)}</p>` : ''}
<p>${summary} · ${entry.beforeSize ?? '—'} → ${entry.afterSize ?? '—'}</p>
<fieldset><legend class="sr-only">Image view for ${title}</legend>
${modes.map((mode, i) => `<input type="radio" name="view-${index}" id="${index}-${mode}" value="${mode}" ${i === 0 ? 'checked' : ''}><label for="${index}-${mode}">${{diff: 'Diff', before: 'Before', after: 'After'}[mode]}</label>`).join('')}
<div class="views">${modes.map((mode) => `<a class="${mode}" href="${index}-${mode}.png"><img src="${index}-${mode}.png" alt="${mode === 'diff' ? 'Highlighted differences' : mode} for ${title}" loading="lazy"></a>`).join('')}</div>
</fieldset>
</section>`;
        })
        .join('\n');

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Screenshot Diff</title>
<style>
:root { color-scheme: light dark; font: 16px system-ui, sans-serif; }
body { margin: 24px auto; padding: 0 16px; max-width: 1200px; }
h1 { font-size: 1.6rem; }
h2 { font-size: 1rem; overflow-wrap: anywhere; }
p { line-height: 1.6; }
code { font-family: ui-monospace, monospace; }
section { margin: 24px 0; padding-top: 12px; border-top: 1px solid GrayText; }
fieldset { border: 0; padding: 0; margin: 0; }
label { display: inline-block; padding: 8px 16px; cursor: pointer; border: 1px solid GrayText; border-radius: 4px 4px 0 0; }
input { position: absolute; opacity: 0; }
input:checked + label { background: Highlight; color: HighlightText; }
input:focus-visible + label { outline: 3px solid Highlight; outline-offset: 3px; }
.views { overflow: auto; padding-top: 12px; }
.views a { display: none; width: fit-content; }
input[value="diff"]:checked ~ .views .diff,
input[value="before"]:checked ~ .views .before,
input[value="after"]:checked ~ .views .after { display: block; }
img { display: block; max-width: 100%; height: auto; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
</style>
</head>
<body>
<h1>Screenshot Diff</h1>
<p>${entries.length} changed screenshot${entries.length === 1 ? '' : 's'} · <code>${escapeHtml(base.slice(0, 12))}</code> → <code>${escapeHtml(head.slice(0, 12))}</code></p>
<p>Changed pixels are highlighted in pink; anti-aliasing differences are yellow. Diff opens by default. Select an image to open it at full size.</p>
${sections || '<p>No screenshot baselines changed.</p>'}
</body>
</html>`;
}
