const button = document.querySelector('#run-button');
const statusPill = document.querySelector('#status-pill');
const statusText = document.querySelector('#status-text');
const output = document.querySelector('#output');
const outputCount = document.querySelector('#output-count');
const runTime = document.querySelector('#run-time');
const reportLink = document.querySelector('#report-link');
const progressBar = document.querySelector('#progress-bar');

function formatTime(value) {
  if (!value) return 'No runs yet';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function render(state) {
  const status = state.running ? 'running' : state.exitCode === null ? 'idle' : state.exitCode === 0 ? 'passed' : 'failed';
  statusPill.className = `status-pill ${status}`;
  statusText.textContent = status === 'running' ? 'Running' : status === 'passed' ? 'Passed' : status === 'failed' ? 'Failed' : 'Ready';
  button.disabled = state.running;
  button.innerHTML = state.running ? '<span class="play-icon">◌</span> Tests running…' : '<span class="play-icon">▶</span> Run tests';
  progressBar.className = state.running ? 'active' : state.exitCode !== null ? 'done' : '';
  output.textContent = state.output || (state.running ? 'Starting Playwright…' : 'Waiting for the first run.');
  output.scrollTop = output.scrollHeight;
  const lines = state.output ? state.output.trimEnd().split('\n').length : 0;
  outputCount.textContent = `${lines} line${lines === 1 ? '' : 's'}`;
  runTime.textContent = state.running ? `Started ${formatTime(state.startedAt)}` : state.finishedAt ? `Finished ${formatTime(state.finishedAt)}` : 'No runs yet';
  reportLink.classList.toggle('hidden', !state.reportAvailable);
}

async function refresh() {
  try {
    const response = await fetch('/api/status', { cache: 'no-store' });
    render(await response.json());
  } catch {
    statusText.textContent = 'Dashboard disconnected';
  }
}

button.addEventListener('click', async () => {
  button.disabled = true;
  try {
    const response = await fetch('/api/run', { method: 'POST' });
    if (!response.ok) {
      const error = await response.json();
      window.alert(error.error || 'Could not start the test run.');
    }
  } catch {
    window.alert('Could not connect to the local test runner.');
  }
  await refresh();
});

refresh();
setInterval(refresh, 1000);
