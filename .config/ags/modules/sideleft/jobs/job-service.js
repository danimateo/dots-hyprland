import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';

class JobService extends Service {
  static {
    Service.register(
      this,
      { updated: [] },
      {
        jobs: ['jsobject', 'rw'],
      }
    );
  }
  constructor() {
    super();
  }

  #jobs = [];

  get jobs() {
    return this.#jobs;
  }

  triggerUpdate() {
    // print stack trace
    console.log(new Error().stack);
    Utils.execAsync('/home/dani/scripts/work s | jq').then((jobs) => {
      this.#jobs = JSON.parse(jobs).filter((job) => job.volumeEnabled || job.micEnabled);

      this.emit('updated');
    });
  }

  setJobMic(jobId, enabled) {
    Utils.execAsync(`/home/dani/scripts/work mic ${enabled ? 'on' : 'off'} ${jobId}`);
  }

  setBalance(jobId) {
    Utils.execAsync(`/home/dani/scripts/work balance ${jobId}`);
  }

  setVolume(jobId, volume) {
    Utils.execAsync(`/home/dani/scripts/work vol set ${jobId} ${volume}`);
  }
}

// instance
const service = new JobService();
// make it global for easy use with cli
globalThis['jobs'] = service;
export default service;
