/* eslint-disable no-console, no-undef */
const process = require('process');

const {parseDependencyTree, parseCircular, prettyCircular} = require('dpdm');

const threshold = process.argv[2] !== undefined ? parseInt(process.argv[2], 10) : 0;
if (isNaN(threshold)) {
    console.error(`Invalid threshold argument: "${process.argv[2]}"`);
    process.exit(1);
}

parseDependencyTree('./src/index.ts', {}).then((tree) => {
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
