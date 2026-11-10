export type GridTemplateBlock = {text: string; css: string};

export type GridTemplate = {
    id: string;
    title: string;
    /** layout-only CSS for the grid container */
    containerCss: string;
    blocks: GridTemplateBlock[];
};

const layout = (extra: string) => `display: grid; gap: 12px; padding: 12px; ${extra}`;
const fullWidth = 'grid-column: 1 / -1;';

export const GRID_TEMPLATES: GridTemplate[] = [
    // 1. Solid filled header on white columns, bold large heading
    {
        id: 'solid-header-white',
        title: 'Solid header · white cards',
        containerCss: layout('grid-template-columns: repeat(3, 1fr);'),
        blocks: [
            {
                text: 'Main heading',
                css: `${fullWidth} padding: 28px 32px; font-size: 30px; font-weight: 800; line-height: 1.1; letter-spacing: -0.5px; color: #fff; background: #2563eb; border-radius: 14px;`,
            },
            {
                text: 'First',
                css: 'padding: 20px; color: #1f2937; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;',
            },
            {
                text: 'Second',
                css: 'padding: 20px; color: #1f2937; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;',
            },
            {
                text: 'Third',
                css: 'padding: 20px; color: #1f2937; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;',
            },
        ],
    },

    // 2. Long columns (tall full-height columns)
    {
        id: 'long-columns',
        title: 'Long columns',
        containerCss: layout('grid-template-columns: repeat(3, 1fr); grid-auto-rows: 320px;'),
        blocks: [
            {
                text: 'Column one',
                css: 'padding: 24px; min-height: 320px; color: #0f172a; background: #f8fafc; border-top: 4px solid #0ea5e9; border-radius: 10px;',
            },
            {
                text: 'Column two',
                css: 'padding: 24px; min-height: 320px; color: #0f172a; background: #f8fafc; border-top: 4px solid #6366f1; border-radius: 10px;',
            },
            {
                text: 'Column three',
                css: 'padding: 24px; min-height: 320px; color: #0f172a; background: #f8fafc; border-top: 4px solid #ec4899; border-radius: 10px;',
            },
        ],
    },

    // 3. Dark theme — dark block backgrounds, light text
    {
        id: 'dark',
        title: 'Dark theme',
        containerCss: layout(
            'grid-template-columns: repeat(3, 1fr); background: #0b1120; border-radius: 14px;',
        ),
        blocks: [
            {
                text: 'Header',
                css: `${fullWidth} padding: 24px; font-size: 24px; font-weight: 700; color: #f8fafc; background: #1e293b; border: 1px solid #334155; border-radius: 12px;`,
            },
            {
                text: 'One',
                css: 'padding: 20px; color: #cbd5e1; background: #111827; border: 1px solid #334155; border-radius: 12px;',
            },
            {
                text: 'Two',
                css: 'padding: 20px; color: #cbd5e1; background: #111827; border: 1px solid #334155; border-radius: 12px;',
            },
            {
                text: 'Three',
                css: 'padding: 20px; color: #cbd5e1; background: #111827; border: 1px solid #334155; border-radius: 12px;',
            },
        ],
    },

    // 4. Festive (kitsch) — gold on deep red, ornamental double borders
    {
        id: 'festive',
        title: 'Festive theme',
        containerCss: layout(
            'grid-template-columns: repeat(3, 1fr); background: #5b0a0a; border: 4px double #ffd700; border-radius: 16px;',
        ),
        blocks: [
            {
                text: '✦ Праздник ✦',
                css: `${fullWidth} padding: 22px; font-size: 26px; font-weight: 800; text-align: center; letter-spacing: 1px; color: #ffd700; text-shadow: 0 1px 0 #7a0000; background: linear-gradient(135deg, #8b0000, #b8860b); border: 3px double #ffd700; border-radius: 12px;`,
            },
            {
                text: '❖ Узор',
                css: 'padding: 18px; text-align: center; color: #fff6d5; background: #7a0000; border: 2px dashed #ffd700; border-radius: 12px;',
            },
            {
                text: '❖ Орнамент',
                css: 'padding: 18px; text-align: center; color: #7a0000; background: #ffd700; border: 2px solid #8b0000; border-radius: 12px;',
            },
            {
                text: '❖ Золото',
                css: 'padding: 18px; text-align: center; color: #fff6d5; background: #7a0000; border: 2px dashed #ffd700; border-radius: 12px;',
            },
            {
                text: '✦ Festive footer ✦',
                css: `${fullWidth} padding: 14px; text-align: center; font-weight: 700; color: #5b0a0a; background: linear-gradient(90deg, #ffd700, #f0c000, #ffd700); border-radius: 12px;`,
            },
        ],
    },

    // 5. Minimal — hairlines, no fill, lots of whitespace
    {
        id: 'minimal',
        title: 'Minimal',
        containerCss: layout('grid-template-columns: repeat(2, 1fr); gap: 24px; padding: 24px;'),
        blocks: [
            {
                text: 'Left',
                css: 'padding: 8px 0 24px; color: #111; background: transparent; border-bottom: 1px solid #111;',
            },
            {
                text: 'Right',
                css: 'padding: 8px 0 24px; color: #111; background: transparent; border-bottom: 1px solid #111;',
            },
        ],
    },

    // 6. Pastel — soft tinted cards, no borders
    {
        id: 'pastel',
        title: 'Pastel cards',
        containerCss: layout('grid-template-columns: repeat(2, 1fr);'),
        blocks: [
            {
                text: 'Peach',
                css: 'padding: 22px; color: #7c2d12; background: #ffedd5; border-radius: 16px;',
            },
            {
                text: 'Mint',
                css: 'padding: 22px; color: #065f46; background: #d1fae5; border-radius: 16px;',
            },
            {
                text: 'Lavender',
                css: 'padding: 22px; color: #5b21b6; background: #ede9fe; border-radius: 16px;',
            },
            {
                text: 'Sky',
                css: 'padding: 22px; color: #075985; background: #e0f2fe; border-radius: 16px;',
            },
        ],
    },

    // 7. Gradient cards — vivid diagonal gradients, white text
    {
        id: 'gradient',
        title: 'Gradient cards',
        containerCss: layout('grid-template-columns: repeat(3, 1fr);'),
        blocks: [
            {
                text: 'Sunset',
                css: 'padding: 26px; color: #fff; font-weight: 600; background: linear-gradient(135deg, #f97316, #db2777); border-radius: 16px;',
            },
            {
                text: 'Ocean',
                css: 'padding: 26px; color: #fff; font-weight: 600; background: linear-gradient(135deg, #0ea5e9, #6366f1); border-radius: 16px;',
            },
            {
                text: 'Forest',
                css: 'padding: 26px; color: #fff; font-weight: 600; background: linear-gradient(135deg, #22c55e, #0d9488); border-radius: 16px;',
            },
        ],
    },

    // 8. Neon — dark bg + glowing cyan/magenta outlines
    {
        id: 'neon',
        title: 'Neon',
        containerCss: layout(
            'grid-template-columns: repeat(2, 1fr); background: #05010f; border-radius: 14px;',
        ),
        blocks: [
            {
                text: 'CYBER',
                css: `${fullWidth} padding: 22px; text-align: center; font-size: 24px; font-weight: 800; letter-spacing: 4px; color: #22d3ee; background: #0a0a1a; border: 2px solid #22d3ee; border-radius: 12px; box-shadow: 0 0 16px rgba(34,211,238,0.7);`,
            },
            {
                text: 'NODE 01',
                css: 'padding: 22px; color: #f0abfc; background: #0a0a1a; border: 2px solid #e879f9; border-radius: 12px; box-shadow: 0 0 14px rgba(232,121,249,0.6);',
            },
            {
                text: 'NODE 02',
                css: 'padding: 22px; color: #5eead4; background: #0a0a1a; border: 2px solid #2dd4bf; border-radius: 12px; box-shadow: 0 0 14px rgba(45,212,191,0.6);',
            },
        ],
    },

    // 9. Newspaper — sepia, serif, ruled columns
    {
        id: 'newspaper',
        title: 'Newspaper',
        containerCss: layout(
            'grid-template-columns: 2fr 1fr; gap: 0; background: #f4ecd8; border: 2px solid #3a2f1b;',
        ),
        blocks: [
            {
                text: 'THE DAILY GRID',
                css: `${fullWidth} padding: 18px; text-align: center; font-family: Georgia, serif; font-size: 30px; font-weight: 700; letter-spacing: 2px; color: #2b2317; background: #f4ecd8; border-bottom: 3px double #3a2f1b;`,
            },
            {
                text: 'Lead story',
                css: 'padding: 18px; font-family: Georgia, serif; color: #2b2317; background: #f4ecd8; border-right: 1px solid #3a2f1b;',
            },
            {
                text: 'Sidebar',
                css: 'padding: 18px; font-family: Georgia, serif; color: #2b2317; background: #efe6cf;',
            },
        ],
    },

    // 10. Header / 3 columns / footer using grid-template-areas → swap header & footer
    //     by simply reordering the rows in grid-template-areas (see chat answer).
    {
        id: 'areas-header-footer',
        title: 'Header · 3 cols · footer (areas)',
        containerCss: layout(
            'grid-template-columns: repeat(3, 1fr); grid-template-areas: "head head head" "c1 c2 c3" "foot foot foot";',
        ),
        blocks: [
            {
                text: 'Header',
                css: 'grid-area: head; padding: 22px; font-size: 22px; font-weight: 700; color: #fff; background: #4338ca; border-radius: 12px;',
            },
            {
                text: 'One',
                css: 'grid-area: c1; padding: 18px; color: #312e81; background: #eef2ff; border-radius: 12px;',
            },
            {
                text: 'Two',
                css: 'grid-area: c2; padding: 18px; color: #312e81; background: #eef2ff; border-radius: 12px;',
            },
            {
                text: 'Three',
                css: 'grid-area: c3; padding: 18px; color: #312e81; background: #eef2ff; border-radius: 12px;',
            },
            {
                text: 'Footer',
                css: 'grid-area: foot; padding: 16px; color: #fff; background: #6366f1; border-radius: 12px;',
            },
        ],
    },
];
