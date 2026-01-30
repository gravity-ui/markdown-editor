/* eslint-disable no-console, import/no-extraneous-dependencies, no-undef */
const process = require('process');

const {parseDependencyTree, parseCircular, prettyCircular} = require('dpdm');

const threshold = parseInt(process.argv[2], 10) || 99; // Default to 99 if no argument provided

parseDependencyTree('./src/index.ts', {
    /* options, see https://github.com/acrazing/dpdm?tab=readme-ov-file#api-reference */
}).then((tree) => {
    const circulars = parseCircular(tree);
    if (circulars.length > threshold) {
        console.error(prettyCircular(circulars));
        console.error(
            `Circular dependencies check failed (found: ${circulars.length}, threshold: ${threshold})`,
        );
        process.exit(1);
    }

    console.log(
        `Circular dependencies check passed (found: ${circulars.length}, threshold: ${threshold})`,
    );
    process.exit(0);
});
