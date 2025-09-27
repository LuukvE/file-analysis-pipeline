import { jobs } from './db';

jobs.on('change', (job) => {
  console.log('job', job);
});
