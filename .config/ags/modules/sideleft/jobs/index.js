import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Bluetooth from 'resource:///com/github/Aylur/ags/service/bluetooth.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { Box, Button, Icon, Label, Scrollable, Slider, Stack, Overlay } = Widget;
const { execAsync, exec } = Utils;
import { MaterialIcon } from '../../.commonwidgets/materialicon.js';
import { setupCursorHover } from '../../.widgetutils/cursorhover.js';
import { ConfigToggle } from '../../.commonwidgets/configwidgets.js';
import JobService from './job-service.js';

const JobEl = (job) => {
  const deviceStatus = Box({
    hexpand: true,
    vpack: 'center',
    vertical: true,
    children: [
      Label({
        xalign: 0,
        maxWidthChars: 1,
        truncate: 'end',
        label: job.name,
        className: 'txt-small',
      }),
    ],
  });
  const jobMicButton = ConfigToggle({
    vpack: 'center',
    expandWidget: false,
    desc: 'Toggle mic',
    name: 'Mic',
    initValue: !job.muted,
    onChange: (self, newValue) => {
      JobService.setJobMic(job.jobIndex, newValue);
    },
    extraSetup: (self) =>
      self.hook(
        JobService,
        (self) => {
          self.enabled.value = !JobService.jobs.find((j) => j.jobIndex === job.jobIndex).muted;
        },
        'updated'
      ),
  });
  const jobBalanceButton = ConfigToggle({
    vpack: 'center',
    expandWidget: false,
    desc: 'Balance',
    name: 'Balance',
    initValue: job.isBalanced,
    onChange: (self, newValue) => {
      JobService.setBalance(job.jobIndex);
    },
    extraSetup: (self) =>
      self.hook(
        JobService,
        (self) => {
          self.enabled.value = JobService.jobs.find((j) => j.jobIndex === job.jobIndex).isBalanced;
        },
        'updated'
      ),
  });

  function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(this, args);
      }, timeout);
    };
  }

  const debouncedSetVolume = debounce((jobIndex, volume) => {
    JobService.setVolume(jobIndex, volume);
  });

  const jobVolumeSlider = Slider({
    drawValue: false,
    hpack: 'fill',
    className: 'sidebar-volmixer-stream-slider',
    value: job.normalizedVolume / 100,
    min: 0,
    max: 1,
    onChange: ({ value }) => {
      debouncedSetVolume(job.jobIndex, Math.round(value * 100));
    },
    setup: (self) =>
      self.hook(
        JobService,
        (self) => {
          const normalizedVolume = JobService.jobs.find((j) => j.jobIndex === job.jobIndex).normalizedVolume;
          self.value = normalizedVolume / 100;
        },
        'updated'
      ),
  });
  return Box({
    className: 'sidebar-bluetooth-device spacing-h-10',
    vertical: true,
    children: [
      deviceStatus,
      Box({
        className: 'spacing-h-5',
        vertical: true,
        children: [jobMicButton, jobBalanceButton, jobVolumeSlider],
      }),
    ],
  });
};

export const JobsModule = (props) => {
  const jobList = Overlay({
    passThrough: true,
    child: Scrollable({
      vexpand: true,
      child: Box({
        attribute: {
          childrenIds: [],
          updateJobs: (self) => {
            self.children = JobService.jobs.map((job) => JobEl(job));
          },
        },
        vertical: true,
        className: 'spacing-v-5 margin-bottom-15',
        setup: (self) => self.hook(JobService, self.attribute.updateJobs, 'updated'),
      }),
    }),
    overlays: [
      Box({
        className: 'sidebar-centermodules-scrollgradient-bottom',
      }),
    ],
  });
  const mainContent = Stack({
    children: {
      list: jobList,
      empty: Box({
        vpack: 'center',
        hpack: 'center',
        children: [
          Label({
            label: 'No jobs found',
            className: 'txt-large',
          }),
        ],
      }),
    },
    setup: (self) =>
      self.hook(
        JobService,
        (self) => {
          self.shown = JobService.jobs.length ? 'list' : 'empty';
        },
        'updated'
      ),
  });

  return Box({
    ...props,
    className: 'spacing-v-5',
    vertical: true,
    children: [mainContent],
  });
};
