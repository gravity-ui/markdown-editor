export const markup = `
## Status

Release checklist: :status[In progress]{color=blue} — the badge is a text directive inside the line.

Every color of the palette:

- :status[Gray]
- :status[Blue]{color=blue}
- :status[Teal]{color=teal}
- :status[Green]{color=green}
- :status[Lime]{color=lime}
- :status[Yellow]{color=yellow}
- :status[Orange]{color=orange}
- :status[Red]{color=red}
- :status[Magenta]{color=magenta}
- :status[Purple]{color=purple}

> Inside a quote: :status[On review]{color=yellow}

{% cut "Inside a cut" %}

:status[Done]{color=green}

{% endcut %}
`.trim();
