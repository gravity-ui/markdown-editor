/* eslint-disable no-console */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, '../../docs');
const outputDir = path.join(__dirname, '../src/docs');

/**
 * Converts a kebab-case string to camelCase
 */
const kebabToCamelCase = (str: string): string => {
    return str.replace(/-./g, (match) => match.charAt(1).toUpperCase());
};

/**
 * Generates the content for the MDX file
 */
const getContent = (title: string, updatedContent: string): string => `
{/*
This file is auto-generated. Any changes made to this file will be overwritten
*/}

import { Meta, Markdown } from '@storybook/addon-docs/blocks';

<Meta title="Docs / ${title}" />

<Markdown>{${JSON.stringify(updatedContent)}}</Markdown>
`;

/**
 * Writes the MDX file to the specified path
 */
const generateMdxFile = async (
    _: string,
    outputFilePath: string,
    title: string,
    updatedContent: string,
): Promise<void> => {
    const content = getContent(title, updatedContent);
    await fs.writeFile(outputFilePath, content, 'utf8');
    console.log(`Generated: ${outputFilePath}`);
};

const TITLE_MATCH = /^#####\s+(.*)$/m;

/**
 * Clears the output directory
 */
const clearOutputDir = async (): Promise<void> => {
    try {
        await fs.rm(outputDir, {recursive: true, force: true});
        console.log(`Cleared directory: ${outputDir}`);
    } catch (error) {
        console.error(`Failed to clear directory: ${outputDir}`, error);
        throw error;
    }
};

/**
 * Generate MDX files from Markdown
 */
export const generateDocs = async (): Promise<void> => {
    console.log('Running docs:generate...');
    try {
        await clearOutputDir();
        await fs.mkdir(outputDir, {recursive: true});

        const files = await fs.readdir(inputDir);

        for (const file of files) {
            if (path.extname(file) === '.md') {
                const inputFilePath = path.join(inputDir, file);
                const content = await fs.readFile(inputFilePath, 'utf8');

                const titleMatch = content.match(TITLE_MATCH);
                if (!titleMatch) {
                    console.warn(`No title found in ${file}, skipping.`);
                    continue;
                }

                const title = titleMatch[1].trim();
                const baseName = kebabToCamelCase(file.replace(/\.md$/, ''));
                const outputFilePath = path.join(outputDir, `${baseName}.mdx`);

                await generateMdxFile(inputFilePath, outputFilePath, title, content);
            }
        }
    } catch (error) {
        console.error('Error generating docs:', error);
        throw error;
    }
};

/**
 * Custom storybook addon for generate docs
 */
export default {
    name: 'generate-docs',
    async previewAnnotations(entries: string[] = []): Promise<string[]> {
        try {
            await generateDocs();
        } catch (error) {
            console.error('Error running docs:generate:', error);
        }
        return entries;
    },
};
