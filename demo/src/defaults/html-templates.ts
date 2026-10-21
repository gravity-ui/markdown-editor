export const htmlBlockTemplates = [
    {
        id: 'callout',
        title: 'Callout',
        content: `<div style="padding:16px;border-left:4px solid #2563eb;background:#eff6ff;border-radius:8px;">
  <strong>Heads up</strong>
  <p style="margin:8px 0 0;">Replace this text with your message.</p>
</div>`,
    },
    {
        id: 'two-columns',
        title: 'Two columns',
        content: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
  <div style="padding:16px;background:#f8fafc;border-radius:8px;">Left</div>
  <div style="padding:16px;background:#f8fafc;border-radius:8px;">Right</div>
</div>`,
    },
    {
        id: 'cta-button',
        title: 'CTA button',
        content: `<a href="#" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
  Get started
</a>`,
    },
];
