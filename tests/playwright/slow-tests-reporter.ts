import type {Reporter, TestCase, TestResult} from '@playwright/test/reporter';

const DELTA = 5000;
const ONE_SECOND = 1000;

class SlowTestsReporter implements Reporter {
    private slowTests: {title: string; duration: number}[] = [];

    onTestEnd(test: TestCase, {duration}: TestResult) {
        if (duration > DELTA) {
            this.slowTests.push({
                title: `${test.titlePath().join(' › ')}`,
                duration,
            });
        }
    }

    onEnd() {
        if (this.slowTests.length > 0) {
            console.log(`Slow tests (duration > ${DELTA}):`);
            for (const test of this.slowTests) {
                console.log(`• ${test.title} (${(test.duration / ONE_SECOND).toFixed(1)}s)`);
            }
        }
    }
}

export default SlowTestsReporter;
