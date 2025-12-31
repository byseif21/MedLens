export const getTraditionalLoginErrorMessage = ({ err, status, detail }) => {
  const textDetail = typeof detail === 'string' ? detail : '';

  if (err?.name === 'TypeError' && /failed to fetch/i.test(err?.message || '')) {
    return 'Cannot reach the server. Check that the backend is running and the API URL is correct.';
  }

  if (status === 400 || status === 401) {
    return 'Invalid email or password. Please try again.';
  }

  if (status === 500) {
    if (/getaddrinfo failed/i.test(textDetail) || /name or service not known/i.test(textDetail)) {
      return 'Login service is temporarily unavailable. Please try again later.';
    }
    return 'Server error while logging in. Please try again later.';
  }

  if (textDetail) {
    return 'Login failed. Please check your credentials and try again.';
  }

  return 'Login failed. Please try again.';
};

export const getSafeLoginErrorMessage = (rawMessage, fallbackMessage) => {
  if (!rawMessage || typeof rawMessage !== 'string') return fallbackMessage;
  if (/getaddrinfo failed/i.test(rawMessage)) return 'Login service is temporarily unavailable.';
  if (/\[errno\s*\d+\]/i.test(rawMessage)) return 'Login service is temporarily unavailable.';
  return rawMessage;
};
