import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { MarkdownConverter } from '../converters';

describe('HTML to Markdown Converter', () => {
    const fixturesPath = path.join(__dirname, '../fixtures');
    const testCases = fs.readdirSync(fixturesPath);
    let converter: MarkdownConverter;

    beforeEach(() => {
        converter = new MarkdownConverter();
    });

    testCases.forEach(testCase => {
        it(`should convert ${testCase} correctly`, () => {
            const inputPath = path.join(fixturesPath, testCase, 'input.html');
            const outputPath = path.join(fixturesPath, testCase, 'output.md');
            
            const inputHtml = fs.readFileSync(inputPath, 'utf-8');
            const expectedOutput = fs.readFileSync(outputPath, 'utf-8').trim();

            // Create a proper HTML document
            const dom = new JSDOM(`
                <!DOCTYPE html>
                <html>
                    <body>
                        ${inputHtml}
                    </body>
                </html>
            `);

            // Process the content inside body
            const result = converter.processNode(dom.window.document.body).trim();

            // Compare the result with expected output
            expect(result).toBe(expectedOutput);
        });
    });
});
