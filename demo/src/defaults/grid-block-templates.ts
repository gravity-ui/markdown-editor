import type {GridBlockTemplate} from '@gravity-ui/markdown-editor/extensions/additional/GridBlockTemplates/templates/index.js';

export const gridBlockTemplates: GridBlockTemplate[] = [
    {
        id: 'feature-grid',
        title: 'Feature grid',
        type: 'container',
        content: `<div class="grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:16px;background:#f8fafc;border-radius:12px">
  <div style="padding:18px;background:#fff;border:1px solid #e5e7eb;border-radius:8px"><strong>Fast setup</strong><p>Start from a reusable layout.</p></div>
  <div style="padding:18px;background:#fff;border:1px solid #e5e7eb;border-radius:8px"><strong>Editable blocks</strong><p>Change content inline.</p></div>
  <div style="padding:18px;background:#fff;border:1px solid #e5e7eb;border-radius:8px"><strong>Static output</strong><p>Serialize to HTML.</p></div>
</div>`,
        containerCss:
            'display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:16px;background:#f8fafc;border-radius:12px',
        blocks: [
            {
                css: 'padding:18px;background:#fff;border:1px solid #e5e7eb;border-radius:8px',
                content: '<strong>Fast setup</strong><p>Start from a reusable layout.</p>',
            },
            {
                css: 'padding:18px;background:#fff;border:1px solid #e5e7eb;border-radius:8px',
                content: '<strong>Editable blocks</strong><p>Change content inline.</p>',
            },
            {
                css: 'padding:18px;background:#fff;border:1px solid #e5e7eb;border-radius:8px',
                content: '<strong>Static output</strong><p>Serialize to HTML.</p>',
            },
        ],
    },
    {
        id: 'header-two-columns',
        title: 'Header and two columns',
        type: 'container',
        content: `<div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:14px">
  <div style="grid-column:1 / -1;padding:24px;background:#2563eb;color:#fff;border-radius:10px"><h2>Section title</h2></div>
  <div style="padding:18px;background:#eff6ff;border-radius:8px">Left column</div>
  <div style="padding:18px;background:#f0fdf4;border-radius:8px">Right column</div>
</div>`,
        containerCss: 'display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:14px',
        blocks: [
            {
                css: 'grid-column:1 / -1;padding:24px;background:#2563eb;color:#fff;border-radius:10px',
                content: '<h2>Section title</h2>',
            },
            {
                css: 'padding:18px;background:#eff6ff;border-radius:8px',
                content: 'Left column',
            },
            {
                css: 'padding:18px;background:#f0fdf4;border-radius:8px',
                content: 'Right column',
            },
        ],
    },
];
