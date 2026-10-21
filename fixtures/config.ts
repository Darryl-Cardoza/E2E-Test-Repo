function pathFromEnv(name: string, fallback: string): string {
  const value = process.env[name] || fallback;
  return value.startsWith('/') ? value : `/${value}`;
}

export const appConfig = {
  apiUrl: (process.env.API_URL || 'http://localhost:5000/api').replace(/\/$/, ''),
  registerPath: pathFromEnv('REGISTER_PATH', '/register'),
  loginPath: pathFromEnv('LOGIN_PATH', '/login'),
  dashboardPath: pathFromEnv('DASHBOARD_PATH', '/dashboard'),
};

export function uniqueEmail(): string {
  return `northstar-e2e-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@example.test`;
}
