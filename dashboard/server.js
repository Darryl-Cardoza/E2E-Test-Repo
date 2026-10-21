const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
try {
  process.loadEnvFile(path.join(root, '.env'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const publicDir = path.join(__dirname, 'public');
const reportDir = path.join(root, 'playwright-report');
const port = Number(process.env.DASHBOARD_PORT || 4173);
const host = '127.0.0.1';
const maxOutputChars = 30_000;

let run = { running: false, output: '', exitCode: null, startedAt: null, finishedAt: null };

function json(response, status, value) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify(value));
}

function appendOutput(chunk) {
  run.output = (run.output + chunk.toString()).slice(-maxOutputChars);
}

function startTests(response) {
  if (run.running) return json(response, 409, { error: 'A test run is already in progress.' });

  run = { running: true, output: '', exitCode: null, startedAt: new Date().toISOString(), finishedAt: null };
  try {
    const cli = path.join(root, 'node_modules', '@playwright', 'test', 'cli.js');
    const child = spawn(process.execPath, [cli, 'test'], {
      cwd: root,
      env: { ...process.env, CI: process.env.CI || '' },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', appendOutput);
    child.stderr.on('data', appendOutput);
    child.on('error', (error) => {
      appendOutput(`\nCould not start Playwright: ${error.message}\n`);
      run.running = false;
      run.exitCode = -1;
      run.finishedAt = new Date().toISOString();
    });
    child.on('close', (code) => {
      run.running = false;
      run.exitCode = code;
      run.finishedAt = new Date().toISOString();
    });
  } catch (error) {
    run.running = false;
    run.exitCode = -1;
    run.finishedAt = new Date().toISOString();
    appendOutput(`\nCould not start Playwright: ${error.message}\n`);
  }

  json(response, 202, { started: true });
}

function serveFile(response, filePath) {
  const types = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
    '.woff': 'font/woff', '.woff2': 'font/woff2',
  };
  fs.readFile(filePath, (error, data) => {
    if (error) return json(response, 404, { error: 'Not found' });
    response.writeHead(200, { 'content-type': types[path.extname(filePath)] || 'application/octet-stream' });
    response.end(data);
  });
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${host}:${port}`);

  if (request.method === 'GET' && url.pathname === '/api/status') {
    return json(response, 200, { ...run, reportAvailable: fs.existsSync(path.join(reportDir, 'index.html')) });
  }

  if (request.method === 'POST' && url.pathname === '/api/run') {
    const origin = request.headers.origin;
    if (origin && origin !== `http://${host}:${port}`) return json(response, 403, { error: 'Requests must come from this local dashboard.' });
    return startTests(response);
  }

  if (request.method === 'GET' && (url.pathname === '/report' || url.pathname === '/report/')) {
    const index = path.join(reportDir, 'index.html');
    if (!fs.existsSync(index)) return json(response, 404, { error: 'No report yet. Run the tests first.' });
    if (url.pathname === '/report') {
      response.writeHead(302, { location: '/report/' });
      return response.end();
    }
    return serveFile(response, index);
  }

  if (request.method === 'GET' && url.pathname.startsWith('/report/')) {
    const relative = decodeURIComponent(url.pathname.slice('/report/'.length));
    const filePath = path.resolve(reportDir, relative);
    if (!filePath.startsWith(`${reportDir}${path.sep}`)) return json(response, 403, { error: 'Forbidden' });
    return serveFile(response, filePath);
  }

  if (request.method === 'GET') {
    const requested = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const filePath = path.resolve(publicDir, requested);
    if (!filePath.startsWith(`${publicDir}${path.sep}`)) return json(response, 403, { error: 'Forbidden' });
    return serveFile(response, filePath);
  }

  json(response, 405, { error: 'Method not allowed' });
});

server.listen(port, host, () => {
  console.log(`E2E dashboard: http://${host}:${port}`);
  console.log('Keep this terminal open while using the dashboard.');
});
