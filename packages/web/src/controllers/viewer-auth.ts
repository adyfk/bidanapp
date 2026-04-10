import {
  translateViewerAuthMessage,
  validateLogin,
  validateRecoveryFinish,
  validateRecoveryStart,
  validateRegister,
} from '@marketplace/marketplace-core/viewer-auth';
import { computeLocalHostRedirect } from '../lib/local-host-redirect';

export function redirectToTarget(target?: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.href = target || '/';
}

export function getFriendlyAuthError(error: unknown, preferredOrigin = '') {
  if (typeof window !== 'undefined') {
    const redirectUrl = computeLocalHostRedirect(window.location.href, preferredOrigin);
    if (redirectUrl) {
      const preferredUrl = new URL(redirectUrl);
      return `Buka halaman ini lewat ${preferredUrl.origin}. Login lokal memakai domain .lvh.me agar cookie akun dan CORS sinkron.`;
    }
  }

  if (error instanceof Error) {
    if (/failed to fetch/i.test(error.message)) {
      return 'Koneksi belum berhasil. Pastikan server lokal aktif lalu buka aplikasi dari domain .lvh.me yang benar.';
    }
    return translateViewerAuthMessage(error.message);
  }

  return 'Permintaan akun belum bisa diproses. Coba lagi sebentar.';
}

export { validateLogin, validateRecoveryFinish, validateRecoveryStart, validateRegister };
