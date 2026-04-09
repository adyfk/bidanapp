import {
  createViewerAuthSession,
  createViewerSMSChallenge,
  deleteViewerAuthSession,
  fetchViewerAuthSession,
  fetchViewerSessions,
  logoutOtherViewerSessions,
  registerViewerAuthAccount,
  requestViewerPasswordReset,
  resetViewerPassword,
  revokeViewerSession,
  updateViewerCustomerProfile,
  type ViewerAuthChallenge,
  type ViewerAuthCreateChallengeInput,
  type ViewerAuthCreateSessionInput,
  type ViewerAuthForgotPasswordInput,
  type ViewerAuthRecoveryRequest,
  type ViewerAuthRegisterInput,
  type ViewerAuthResetPasswordInput,
  type ViewerAuthVerifyChallengeInput,
  type ViewerCustomerProfileUpdateInput,
  type ViewerDeviceSession,
  type ViewerSession,
  type ViewerSessionList,
  type ViewerSessionMutationResult,
  verifyViewerAuthChallenge,
} from '@marketplace/sdk';

export interface ViewerAuthController {
  createChallenge: typeof createViewerSMSChallenge;
  createSession: typeof createViewerAuthSession;
  deleteSession: typeof deleteViewerAuthSession;
  fetchSession: typeof fetchViewerAuthSession;
  fetchSessions: typeof fetchViewerSessions;
  logoutOtherSessions: typeof logoutOtherViewerSessions;
  registerAccount: typeof registerViewerAuthAccount;
  requestPasswordReset: typeof requestViewerPasswordReset;
  resetPassword: typeof resetViewerPassword;
  revokeSession: typeof revokeViewerSession;
  updateCustomerProfile: typeof updateViewerCustomerProfile;
  verifyChallenge: typeof verifyViewerAuthChallenge;
}

export function validateLogin(form: { password: string; phone: string }) {
  if (!form.phone.trim()) {
    return 'Nomor ponsel wajib diisi.';
  }
  if (!form.password.trim()) {
    return 'Password wajib diisi.';
  }
  return '';
}

export function validateRegister(form: { city: string; displayName: string; password: string; phone: string }) {
  if (!form.displayName.trim()) {
    return 'Nama lengkap wajib diisi.';
  }
  if (!form.phone.trim()) {
    return 'Nomor ponsel wajib diisi.';
  }
  if (!form.password.trim()) {
    return 'Password wajib diisi.';
  }
  if (!/\d/.test(form.password) || !/[A-Z]/.test(form.password) || form.password.length < 8) {
    return 'Gunakan password minimal 8 karakter, dengan huruf besar dan angka.';
  }
  return '';
}

export function validateRecoveryStart(form: { phone: string }) {
  if (!form.phone.trim()) {
    return 'Masukkan nomor ponsel yang terdaftar.';
  }
  return '';
}

export function validateRecoveryFinish(form: { challengeId: string; code: string; newPassword: string }) {
  if (!form.challengeId.trim()) {
    return 'Challenge ID belum tersedia. Kirim OTP lebih dulu.';
  }
  if (!form.code.trim()) {
    return 'Kode OTP wajib diisi.';
  }
  if (!form.newPassword.trim()) {
    return 'Password baru wajib diisi.';
  }
  if (!/\d/.test(form.newPassword) || !/[A-Z]/.test(form.newPassword) || form.newPassword.length < 8) {
    return 'Gunakan password minimal 8 karakter, dengan huruf besar dan angka.';
  }
  return '';
}

export function translateViewerAuthMessage(message: string) {
  const normalized = message.trim().toLowerCase();
  const translations: Record<string, string> = {
    'database connection is required': 'Layanan akun sedang menyiapkan koneksi. Coba lagi sebentar.',
    'failed to create viewer auth session': 'Login belum berhasil. Coba lagi sebentar.',
    'failed to register viewer auth account': 'Pendaftaran akun belum berhasil. Coba lagi sebentar.',
    'failed to request viewer password reset': 'Permintaan reset password belum berhasil. Coba lagi sebentar.',
    'failed to reset viewer password': 'Password baru belum berhasil disimpan. Coba lagi.',
    'invalid phone or password': 'Nomor ponsel atau kata sandi tidak cocok.',
    'invalid viewer challenge code': 'Kode OTP tidak sesuai. Periksa lagi lalu coba ulang.',
    'invalid viewer credentials': 'Nomor ponsel atau kata sandi tidak cocok.',
    'sms delivery is temporarily unavailable': 'Pengiriman SMS sedang terganggu. Coba lagi sebentar.',
    'viewer challenge already consumed': 'Kode OTP ini sudah dipakai. Minta kode baru.',
    'viewer challenge expired': 'Kode OTP sudah kedaluwarsa. Kirim ulang OTP baru.',
    'viewer challenge max attempts reached': 'Percobaan OTP melebihi batas. Kirim ulang kode baru.',
    'viewer challenge not found': 'Permintaan reset tidak ditemukan lagi. Mulai ulang dari awal.',
    'viewer display name is required': 'Nama lengkap wajib diisi.',
    'viewer password does not meet security requirements':
      'Gunakan password minimal 8 karakter, dengan huruf besar dan angka.',
    'viewer phone is already in use': 'Nomor ponsel ini sudah terdaftar. Silakan masuk.',
    'viewer phone is required': 'Nomor ponsel wajib diisi.',
  };

  return translations[normalized] || message;
}

export function createViewerAuthController(): ViewerAuthController {
  return {
    createChallenge: createViewerSMSChallenge,
    createSession: createViewerAuthSession,
    deleteSession: deleteViewerAuthSession,
    fetchSession: fetchViewerAuthSession,
    fetchSessions: fetchViewerSessions,
    logoutOtherSessions: logoutOtherViewerSessions,
    registerAccount: registerViewerAuthAccount,
    requestPasswordReset: requestViewerPasswordReset,
    resetPassword: resetViewerPassword,
    revokeSession: revokeViewerSession,
    updateCustomerProfile: updateViewerCustomerProfile,
    verifyChallenge: verifyViewerAuthChallenge,
  };
}

export type {
  ViewerAuthChallenge,
  ViewerAuthCreateChallengeInput,
  ViewerAuthCreateSessionInput,
  ViewerAuthForgotPasswordInput,
  ViewerAuthRecoveryRequest,
  ViewerAuthRegisterInput,
  ViewerAuthResetPasswordInput,
  ViewerAuthVerifyChallengeInput,
  ViewerCustomerProfileUpdateInput,
  ViewerDeviceSession,
  ViewerSession,
  ViewerSessionList,
  ViewerSessionMutationResult,
};
export {
  createViewerAuthSession,
  createViewerSMSChallenge,
  deleteViewerAuthSession,
  fetchViewerAuthSession,
  fetchViewerSessions,
  logoutOtherViewerSessions,
  registerViewerAuthAccount,
  requestViewerPasswordReset,
  resetViewerPassword,
  revokeViewerSession,
  updateViewerCustomerProfile,
  verifyViewerAuthChallenge,
};
