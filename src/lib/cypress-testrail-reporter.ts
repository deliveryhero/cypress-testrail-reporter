import { reporters } from 'mocha';
import * as moment from 'moment';
import { TestRail } from './testrail';
import { titleToCaseIds } from './shared';
import { Status, TestRailResult } from './testrail.interface';
const chalk = require('chalk');

export class CypressTestRailReporter extends reporters.Spec {
  private results: TestRailResult[] = [];
  private testRail: TestRail;
  private name: string;
  private description: string;

  constructor(runner: any, options: any) {
    super(runner);

    const { TRAVIS_BUILD_NUMBER: buildNumber } = process.env;

    if (buildNumber) {
      let reporterOptions = options.reporterOptions;

      this.testRail = new TestRail(reporterOptions);
      this.validate(reporterOptions, 'domain');
      this.validate(reporterOptions, 'username');
      this.validate(reporterOptions, 'password');
      this.validate(reporterOptions, 'projectId');
      this.validate(reporterOptions, 'milestoneId');
      this.validate(reporterOptions, 'suiteId');

      runner.on('start', () => {
        const executionDateTime = moment().format('YYYY-MM-DD, HH:mm (Z)');

        this.name = `${executionDateTime} , TA UI E2E, Travis Build: #${buildNumber}`;
        this.description = `Travis Build Number: ${buildNumber}`;
        this.testRail.createRun(this.name, this.description);
      });

      runner.on('pass', test => {
        const caseIds = titleToCaseIds(test.title);
        if (caseIds.length > 0) {
          const results = caseIds.map(caseId => {
            return {
              case_id: caseId,
              status_id: Status.Passed,
              comment: `Execution time: ${test.duration}ms`
            };
          });
          this.results.push(...results);
        }
      });

      runner.on('fail', test => {
        const caseIds = titleToCaseIds(test.title);
        if (caseIds.length > 0) {
          const results = caseIds.map(caseId => {
            return {
              case_id: caseId,
              status_id: Status.Failed,
              comment: `${test.err.message}`
            };
          });
          this.results.push(...results);
        }
      });

      runner.on('end', () => {
        if (this.results.length == 0) {
          console.log(
            '\n',
            chalk.magenta.underline.bold('(TestRail Reporter)')
          );
          console.warn(
            '\n',
            'No testcases were matched. Ensure that your tests are declared correctly and matches Cxxx',
            '\n'
          );

          this.testRail.deleteRun();
        } else {
          const caseIds = this.results.map(item => item.case_id);

          this.testRail.updateRun(
            this.name,
            this.description,
            caseIds,
            this.results
          );
        }
      });
    }
  }

  private validate(options, name: string) {
    if (options == null) {
      throw new Error('Missing reporterOptions in cypress.json');
    }
    if (options[name] == null) {
      throw new Error(
        `Missing ${name} value. Please update reporterOptions in cypress.json`
      );
    }
  }
}
