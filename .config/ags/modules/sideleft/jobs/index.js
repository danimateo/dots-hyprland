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
        className: 'txt-large',
      }),
    ],
  });
  const jobMicButton = ConfigToggle({
    vpack: 'center',
    expandWidget: true,
    desc: 'Toggle mic',
    name: 'Mic',
    initValue: JobService[`mic${job.jobIndex}`],
    onChange: (self, newValue) => {
      JobService[`mic${job.jobIndex}`] = newValue;
    },
    extraSetup: (self) =>
      self.hook(JobService, (self) => {
        self.enabled.value = JobService[`mic${job.jobIndex}`];
      }, 'values-updated'),
  });
  const jobBalanceButton = ConfigToggle({
    vpack: 'center',
    expandWidget: true,
    desc: 'Balance',
    name: 'Balance',
    initValue: JobService[`balance${job.jobIndex}`],
    onChange: (self, newValue) => {
      JobService[`balance${job.jobIndex}`] = newValue;
    },
    extraSetup: (self) =>
      self.hook(JobService, (self) => {
        self.enabled.value = JobService[`balance${job.jobIndex}`];
      }, 'values-updated'),
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
    JobService[`vol${jobIndex}`] = volume;
  });

  const jobVolumeSlider = Slider({
    drawValue: false,
    hpack: 'fill',
    className: 'sidebar-volmixer-stream-slider',
    value: JobService.bind(`vol${job.jobIndex}`),
    min: 0,
    max: 1,
    onChange: (self) => {
      debouncedSetVolume(job.jobIndex, self.value);
    },
  });
  return Box({
    className: 'sidebar-bluetooth-device spacing-h-10',
    vertical: true,
    children: [
      deviceStatus,
      Box({
        className: 'spacing-h-5 spacing-v-5',
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
        setup: (self) =>
          self.hook(JobService, self.attribute.updateJobs, 'updated').hook(
            App,
            (_self, windowName) => {
              windowName === 'sideleft' && JobService.triggerUpdate();
            },
            'window-toggled'
          ),
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
