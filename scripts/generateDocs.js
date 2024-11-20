const fs = require('fs/promises');
const path = require('path');

const inputDir = path.join(__dirname, '../docs');
const outputDir = path.join(__dirname, '../demo/docs');

const kebabToCamelCase = (str) => {
    return str.replace(/-./g, (match) => match.charAt(1).toUpperCase());
};

const replaceImagePaths = (content, inputFilePath, outputFilePath) => {
    const inputDirPath = path.dirname(inputFilePath);
    const outputDirPath = path.dirname(outputFilePath);

    // img src="./path/to/file"
    return content.replace(/<img\s+src=["'](.+?)["']/g, (match, srcPath) => {
        const absolutePath = path.resolve(inputDirPath, srcPath);
        const relativePath = path.relative(outputDirPath, absolutePath);
        return `<img src="${relativePath.replace(/\\/g, '/')}"`;
    });
};

const getContent = (title, updatedContent) => `
{/*
This file is auto-generated. Any changes made to this file will be overwritten
*/}

import { Meta, Markdown } from '@storybook/blocks';

<Meta title="Docs / ${title}" />

<Markdown>{${JSON.stringify(updatedContent)}}</Markdown>

`;

async function generateMdxFile(inputFilePath, outputFilePath, title, updatedContent) {
    const content = getContent(title, updatedContent);

    await fs.writeFile(outputFilePath, content, 'utf8');
    console.log(`Generated: ${outputFilePath}`);
}

const main = async () => {
    try {
        await fs.mkdir(outputDir, {recursive: true});

        const files = await fs.readdir(inputDir);

        for (const file of files) {
            if (path.extname(file) === '.md') {
                const inputFilePath = path.join(inputDir, file);
                const content = await fs.readFile(inputFilePath, 'utf8');

                // extracting the title from the first line starting with #####
                const titleMatch = content.match(/^#####\s+(.*)$/m);
                if (!titleMatch) {
                    console.warn(`No title found in ${file}, skipping.`);
                    continue;
                }

                const title = titleMatch[1].trim();
                const baseName = kebabToCamelCase(file.replace(/\.md$/, ''));
                const outputFilePath = path.join(outputDir, `${baseName}.mdx`);

                // FIXME: @makhnatkin use paths from the main branch of the repository
                const updatedContent = replaceImagePaths(content, inputFilePath, outputFilePath);

                await generateMdxFile(inputFilePath, outputFilePath, title, updatedContent);
            }
        }
    } catch (err) {
        console.error('Error:', err);
    }
};

main();
