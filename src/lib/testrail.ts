const axios = require('axios');
const chalk = require('chalk');
import { TestRailOptions, TestRailResult } from './testrail.interface';

export class TestRail {
  private base: String;
  private runId: Number;

  constructor(private options: TestRailOptions) {
    this.base = `https://${options.domain}/index.php?/api/v2`;
  }

  public async createRun(name: string, description: string) {
    await axios({
      method: 'post',
      url: `${this.base}/add_run/${this.options.projectId}`,
      headers: { 'Content-Type': 'application/json' },
      auth: {
        username: this.options.username,
        password: this.options.password
      },
      data: JSON.stringify({
        suite_id: this.options.suiteId,
        name,
        description,
        milestone_id: this.options.milestoneId,
        include_all: true
      })
    })
      .then(response => {
        this.runId = response.data.id;
      })
      .catch(error => console.error(error));
  }

  public async updateRun(
    name: string,
    description: string,
    caseIds: number[],
    results: TestRailResult[]
  ) {
    await axios({
      method: 'post',
      url: `${this.base}/update_run/${this.runId}`,
      headers: { 'Content-Type': 'application/json' },
      auth: {
        username: this.options.username,
        password: this.options.password
      },
      data: JSON.stringify({
        suite_id: this.options.suiteId,
        name,
        description,
        include_all: false,
        case_ids: caseIds
      })
    })
      .then(() => {
        this.publishResults(results);
      })
      .catch(error => console.error(error));
  }

  public async deleteRun() {
    await axios({
      method: 'post',
      url: `${this.base}/delete_run/${this.runId}`,
      headers: { 'Content-Type': 'application/json' },
      auth: {
        username: this.options.username,
        password: this.options.password
      }
    }).catch(error => console.error(error));
  }

  public async closeRun() {
    await axios({
      method: 'post',
      url: `${this.base}/close_run/${this.runId}`,
      headers: { 'Content-Type': 'application/json' },
      auth: {
        username: this.options.username,
        password: this.options.password
      }
    }).catch(error => console.error(error));
  }

  public async publishResults(results: TestRailResult[]) {
    await axios({
      method: 'post',
      url: `${this.base}/add_results_for_cases/${this.runId}`,
      headers: { 'Content-Type': 'application/json' },
      auth: {
        username: this.options.username,
        password: this.options.password
      },
      data: JSON.stringify({ results })
    })
      .then(response => {
        console.log('\n', chalk.magenta.underline.bold('(TestRail Reporter)'));
        console.log(
          '\n',
          ` - Results are published to ${chalk.magenta(
            `https://${this.options.domain}/index.php?/runs/view/${this.runId}`
          )}`,
          '\n'
        );
        this.closeRun();
      })
      .catch(error => console.error(error));
  }
}
