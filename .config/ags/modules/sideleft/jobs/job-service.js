import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';

class JobService extends Service {
  static {
    Service.register(
      this,
      { updated: [], 'values-updated': [] },
      {
        jobs: ['jsobject', 'rw'],
        vol1: ['float', 'rw'],
        vol2: ['float', 'rw'],
        vol3: ['float', 'rw'],
      }
    );
  }
  constructor() {
    super();

    [1, 2, 3].forEach((i) => {
      Object.defineProperty(this, 'mic' + i, {
        get: () => !this.#jobs.find((j) => j.jobIndex === i).muted,
        set: (enabled) => this.setJobMic(i, enabled),
      });
      Object.defineProperty(this, 'vol' + i, {
        get: () => this.#jobs.find((j) => j.jobIndex === i).normalizedVolume / 100,
        set: (volume) => this.setVolume(i, volume),
      });
      Object.defineProperty(this, 'balance' + i, {
        get: () => this.#jobs.find((j) => j.jobIndex === i).isBalanced,
        set: (enabled) => this.setBalance(i),
      });
    });
  }

  #jobs = [];

  get jobs() {
    return this.#jobs;
  }

  triggerUpdate() {
    // print stack trace
    Utils.execAsync('/home/dani/scripts/work s | jq').then((jobs) => {
      const goodJobs = JSON.parse(jobs).filter((job) => job.volumeEnabled || job.micEnabled);
      const indexesNoxEqual =
        goodJobs
          .map((j) => j.jobIndex)
          .sort()
          .join(',') !==
        this.#jobs
          .map((j) => j.jobIndex)
          .sort()
          .join(',');

      this.#jobs = goodJobs;

      this.#jobs.forEach((job) => {
        this.notify('vol' + job.jobIndex);
        this.notify('balance' + job.jobIndex);
        this.notify('mic' + job.jobIndex);
      });
      this.emit('values-updated');
      if (indexesNoxEqual) this.emit('updated');
    });
  }

  setJobMic(jobId, enabled) {
    Utils.execAsync(`/home/dani/scripts/work mic ${enabled ? 'on' : 'off'} ${jobId}`);
  }

  setBalance(jobId) {
    Utils.execAsync(`/home/dani/scripts/work balance ${jobId}`);
  }

  setVolume(jobId, volume) {
    Utils.execAsync(`/home/dani/scripts/work vol set ${jobId} ${volume * 100}`);
  }
}

// instance
const service = new JobService();
// make it global for easy use with cli
globalThis['jobs'] = service;
export default service;
