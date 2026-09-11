export async function saveJobLocally(job) {
  const { jobwizz_jobs = [] } = await chrome.storage.local.get('jobwizz_jobs');
  
  const newJob = {
    ...job,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  
  jobwizz_jobs.push(newJob);
  await chrome.storage.local.set({ jobwizz_jobs });
  return newJob;
}

export async function getLocalJobs() {
  const { jobwizz_jobs = [] } = await chrome.storage.local.get('jobwizz_jobs');
  return jobwizz_jobs;
}

export async function deleteLocalJob(id) {
  const { jobwizz_jobs = [] } = await chrome.storage.local.get('jobwizz_jobs');
  const filtered = jobwizz_jobs.filter(j => j.id !== id);
  await chrome.storage.local.set({ jobwizz_jobs: filtered });
}

export async function clearLocalJobs() {
  await chrome.storage.local.remove('jobwizz_jobs');
}

export async function getJobCount() {
  const jobs = await getLocalJobs();
  return jobs.length;
}

export async function exportJobsAsJSON() {
  const jobs = await getLocalJobs();
  const blob = new Blob([JSON.stringify(jobs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `jobwizz_export_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
