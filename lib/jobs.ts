import data from '@/data/jobs.json';
import type { Job } from './types';

// Dibaca di server (Server Component). Data berasal dari file lokal, tanpa database.
export function getJobs(): Job[] {
  return data as unknown as Job[];
}
