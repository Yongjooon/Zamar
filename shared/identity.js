export const LOGIN_ID_PATTERN = /^[a-z0-9](?!.*\.\.)[a-z0-9._-]{1,38}[a-z0-9_-]$/;
export const MIN_PASSWORD_LENGTH = 6;

export function normalizeLoginId(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function accountEmail(loginId) {
  return loginId + '@zamar.invalid';
}

export function isPasswordValid(value) {
  return typeof value === 'string' && value.length >= MIN_PASSWORD_LENGTH && value.length <= 128;
}
