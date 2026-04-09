const loopbackHosts = new Set(['127.0.0.1', '::1', '[::1]', 'localhost']);

function isPrivateIPv4Host(hostname: string) {
  if (/^10\./.test(hostname)) {
    return true;
  }

  if (/^192\.168\./.test(hostname)) {
    return true;
  }

  return /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);
}

export function isLocalPreviewHost(hostname: string) {
  const normalizedHost = hostname.trim().toLowerCase();
  if (!normalizedHost) {
    return false;
  }

  return loopbackHosts.has(normalizedHost) || isPrivateIPv4Host(normalizedHost);
}

export function computeLocalHostRedirect(currentUrl: string, preferredOrigin?: string | null) {
  if (!preferredOrigin) {
    return null;
  }

  const current = new URL(currentUrl);
  const target = new URL(preferredOrigin);

  if (!isLocalPreviewHost(current.hostname)) {
    return null;
  }

  if (current.hostname === target.hostname && current.port === target.port && current.protocol === target.protocol) {
    return null;
  }

  current.protocol = target.protocol;
  current.hostname = target.hostname;
  current.port = target.port;
  return current.toString();
}
