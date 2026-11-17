type Editor = {actions: Record<string, {run(): void}>};

export const sampleItemWysiwyg = {exec: (e: Editor) => e.actions.toSample.run()};

export const sampleFrameItemWysiwyg = {exec: (e: Editor) => e.actions.toggleSampleFrame.run()};

export const sampleExtraItemWisywig = {exec: (e: Editor) => e.actions.toSample.run()};
