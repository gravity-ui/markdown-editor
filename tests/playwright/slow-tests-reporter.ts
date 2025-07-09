import type {Reporter, TestCase, TestResult} from '@playwright/test/reporter';

const DELTA = 5000;
const ONE_SECOND = 1000;

class SlowTestsReporter implements Reporter {
    private slowTests: {title: string; duration: number}[] = [];

    onTestEnd(test: TestCase, {duration}: TestResult) {
        if (duration > DELTA) {
            const [_, browser, ...rest] = test.titlePath();
            this.slowTests.push({
                title: `[${browser}] › ${rest.join(' › ')}`,
                duration,
            });
        }
    }

    onEnd() {
        if (this.slowTests.length > 0) {
            console.log('---');
            console.log(`Slow tests (duration > ${DELTA}), total ${this.slowTests.length}:`);

            const sorted = this.slowTests.sort((a, b) => b.duration - a.duration);
            sorted.forEach((test, index) => {
                console.log(
                    `${index + 1}. ${test.title} (${(test.duration / ONE_SECOND).toFixed(1)}s)`,
                );
            });
        }
    }
}

export default SlowTestsReporter;
