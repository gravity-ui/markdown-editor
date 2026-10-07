/* eslint-disable no-console */
import {writeFileSync} from 'node:fs';

import type {FullResult, Reporter, TestCase, TestResult} from '@playwright/test/reporter';

const DELTA = 5000;
const ONE_SECOND = 1000;

class SlowTestsReporter implements Reporter {
    private slowTests: {title: string; durationMs: number; retry: number}[] = [];
    private tests = new Map<string, TestCase>();

    onTestEnd(test: TestCase, {duration, retry}: TestResult) {
        this.tests.set(test.id, test);

        if (duration > DELTA) {
            const [_, browser, ...rest] = test.titlePath();
            this.slowTests.push({
                title: `[${browser}] › ${rest.join(' › ')}`,
                durationMs: duration,
                retry,
            });
        }
    }

    onEnd(result: FullResult) {
        const sorted = this.slowTests.sort((a, b) => b.durationMs - a.durationMs);

        if (this.slowTests.length > 0) {
            console.log('---');
            console.log(`Slow tests (duration > ${DELTA}), total ${this.slowTests.length}:`);

            sorted.forEach((test, index) => {
                console.log(
                    `${index + 1}. ${test.title} (${(test.durationMs / ONE_SECOND).toFixed(1)}s)`,
                );
            });
        }

        const output = process.env.VISUAL_TEST_METRICS_PATH;
        if (output) {
            const flakyTests = [...this.tests.values()]
                .filter((test) => test.outcome() === 'flaky')
                .map((test) => ({
                    title: test.titlePath().slice(1).join(' › '),
                    attempts: test.results.map(({status, duration}) => ({
                        status,
                        durationMs: duration,
                    })),
                }));

            writeFileSync(
                output,
                JSON.stringify(
                    {
                        version: 1,
                        startedAt: result.startTime.toISOString(),
                        status: result.status,
                        totalTests: this.tests.size,
                        slowTests: sorted,
                        flakyTests,
                    },
                    null,
                    2,
                ),
            );
        }
    }
}

export default SlowTestsReporter;
