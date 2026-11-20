import {appendFileSync, readFileSync} from 'node:fs';
import process from 'node:process';

// Arguments: the answer file and the file that collects the prompts.
const [answerFile, promptLog] = process.argv.slice(2);
const prompt = readFileSync(process.stdin.fd, 'utf8');
appendFileSync(promptLog, `${prompt}\n<<<END OF PROMPT>>>\n`);
process.stdout.write(readFileSync(answerFile, 'utf8'));
