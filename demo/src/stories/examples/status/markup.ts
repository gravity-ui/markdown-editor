export const markup = `
## Status

Release checklist: :status[In progress]{color=blue} — the badge is a text directive inside the line.

Every color of the palette:

- :status[Gray]
- :status[Blue]{color=blue}
- :status[Green]{color=green}
- :status[Yellow]{color=yellow}
- :status[Orange]{color=orange}
- :status[Red]{color=red}
- :status[Violet]{color=violet}

> Inside a quote: :status[On review]{color=yellow}

{% cut "Inside a cut" %}

:status[Done]{color=green}

{% endcut %}
`.trim();
