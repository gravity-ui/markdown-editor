export const markup = `
## Label

Release checklist: :label[In progress]{color=blue} is a text directive inside the line.

Every color of the palette:

- :label[Gray]
- :label[Green]{color=green}
- :label[Yellow]{color=yellow}
- :label[Blue]{color=blue}
- :label[Red]{color=red}
- :label[Purple]{color=purple}

The former directive and colors are read as labels: :status[Teal]{color=teal} :status[Orange]{color=orange}

> Inside a quote: :label[On review]{color=yellow}

{% cut "Inside a cut" %}

:label[Done]{color=green}

{% endcut %}
`.trim();
