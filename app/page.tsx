import JobBoard from '@/components/JobBoard';
import { getJobs } from '@/lib/jobs';

export default function HomePage() {
  return <JobBoard initialJobs={getJobs()} />;
}
