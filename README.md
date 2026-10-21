# E2E Tests

Separate Playwright project for the Auth Dashboard. Tests expect the app at `http://localhost:3000` and API at `http://localhost:5000/api` by default. See `.env.example` for overrides.

## Requirements

- Node.js 22 or newer
- The backend, frontend, and a disposable MongoDB database running locally

## Install and run

```sh
npm ci
npx playwright install chromium
npm test
```

## Run tests from the local dashboard

Start the dashboard from this repository:

```sh
npm run dashboard
```

Open `http://127.0.0.1:4173`, click **Run tests**, and wait for the results. When the run finishes, use **Open HTML report** to inspect the Playwright report. The dashboard reads `.env` for `BASE_URL`, `API_URL`, and route overrides, then passes those settings to Playwright. Keep the terminal running while using the dashboard; it only listens on your own machine.

To run against other URLs, set `BASE_URL` and `API_URL`. If the UI uses different routes, set `REGISTER_PATH`, `LOGIN_PATH`, and `DASHBOARD_PATH`. The UI page objects use accessible labels and buttons; align those locators with the actual frontend if its labels differ.

## Coverage

- Registration and duplicate registration
- Registration form validation
- Successful and failed login
- Protected dashboard redirect
- Authenticated profile and unauthenticated API access
- API health check

Each test that creates a user generates a unique `example.test` email. Run against a disposable database: the suite creates accounts and does not delete them.

## Application repository CI

The GitHub Actions workflow must live in the application repository because that repository owns the PR check. For your setup, copy `integration/application-workflow.example.yml` to `.github/workflows/e2e.yml` in the `E2E-Test-Project` application repository. The template assumes both repositories are under the same personal GitHub account and checks out the E2E repository named `E2E-Test-Repo`. Public E2E repositories can be checked out with the workflow token. For a private E2E repository, create an `E2E_REPO_TOKEN` secret in `E2E-Test-Project` with read-only access to the E2E repository. Then configure the `E2E Quality Gate` status check as required in the `E2E-Test-Project` branch rules.

The workflow is a starting template based on the implementation plan. Verify the app's package scripts, MongoDB configuration, and frontend API environment variable before relying on it. Use an unprivileged validation approach for fork pull requests; do not expose repository tokens or secrets to untrusted code. Pin actions and the E2E revision to reviewed commits before production use.

Playwright writes the HTML report to `playwright-report/`, JUnit XML and failure evidence to `test-results/`. CI uploads both directories as an artifact.
