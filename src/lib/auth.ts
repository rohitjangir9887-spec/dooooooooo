export function handleGitHubLogin(onWarning?: () => void) {
  const origin = window.location.origin;
  window.location.href = `/api/auth/github/login?origin=${encodeURIComponent(origin)}`;
}
