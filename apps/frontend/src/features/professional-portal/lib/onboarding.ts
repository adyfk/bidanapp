import { OFFLINE_SERVICE_MODES } from '@/lib/availability-rules';
import type { OfflineServiceDeliveryMode, ServiceDeliveryMode } from '@/types/catalog';
import type {
  ProfessionalLifecycleReviewState,
  ProfessionalLifecycleStatus,
  ProfessionalManagedService,
  ProfessionalPortalState,
} from './contracts';

export const PROFESSIONAL_LIFECYCLE_STATUS_ORDER = [
  'draft',
  'ready_for_review',
  'submitted',
  'changes_requested',
  'verified',
  'published',
] as const;
export type ProfessionalOnboardingSectionKey = 'identity' | 'coverage' | 'services' | 'availability' | 'portfolio';
export type ProfessionalOnboardingPageState =
  | 'onboarding_empty'
  | 'onboarding_in_progress'
  | 'ready_for_review'
  | 'awaiting_admin_review'
  | 'changes_requested'
  | 'verified_pending_publish'
  | 'live';

export interface ProfessionalOnboardingTask {
  id: string;
  isComplete: boolean;
  isRequiredForSubmission: boolean;
  route: string;
  section: ProfessionalOnboardingSectionKey;
  title: string;
}

export interface ProfessionalOnboardingSection {
  blockingCount: number;
  completedCount: number;
  isComplete: boolean;
  key: ProfessionalOnboardingSectionKey;
  route: string;
  tasks: ProfessionalOnboardingTask[];
  totalCount: number;
}

export interface ProfessionalOnboardingState {
  blockingTaskCount: number;
  canSubmitForReview: boolean;
  completedTaskCount: number;
  completionPercent: number;
  highlightSection: ProfessionalOnboardingSectionKey | null;
  lifecycleStatus: ProfessionalLifecycleStatus;
  nextActionRoute: string | null;
  pageState: ProfessionalOnboardingPageState;
  sections: ProfessionalOnboardingSection[];
  totalTaskCount: number;
}

const ROUTES = {
  availability: '/for-professionals/dashboard/availability',
  coverage: '/for-professionals/dashboard/coverage',
  portfolio: '/for-professionals/dashboard/portfolio',
  profile: '/for-professionals/profile',
  services: '/for-professionals/dashboard/services',
} as const;

const hasText = (value: string | undefined | null) => Boolean(value?.trim());

const hasConfiguredActiveService = (serviceConfigurations: ProfessionalManagedService[]) =>
  serviceConfigurations.some(
    (service) => service.isActive && hasText(service.summary) && hasText(service.price) && hasText(service.duration),
  );

const hasFeaturedActiveService = (serviceConfigurations: ProfessionalManagedService[]) =>
  serviceConfigurations.some((service) => service.isActive && service.featured);

const offlineDeliveryModes: ServiceDeliveryMode[] = OFFLINE_SERVICE_MODES;

const isManagedServiceModeEnabled = (service: ProfessionalManagedService, mode: ServiceDeliveryMode) => {
  if (mode === 'online') {
    return service.serviceModes.online;
  }

  if (mode === 'home_visit') {
    return service.serviceModes.homeVisit;
  }

  return service.serviceModes.onsite;
};

const getActiveServiceModes = (serviceConfigurations: ProfessionalManagedService[]) =>
  (['online', 'home_visit', 'onsite'] as const).filter((mode) =>
    serviceConfigurations.some((service) => service.isActive && isManagedServiceModeEnabled(service, mode)),
  );

const hasOfflineAvailabilityConfigured = (
  portalState: ProfessionalPortalState,
  activeServiceModes: ServiceDeliveryMode[],
) => {
  const activeOfflineModes = offlineDeliveryModes.filter((mode): mode is OfflineServiceDeliveryMode =>
    activeServiceModes.includes(mode),
  );

  return activeOfflineModes.every((mode) =>
    (portalState.availabilityRulesByMode?.[mode]?.weeklyHours || []).some((window) => window.isEnabled),
  );
};

const buildTasks = (portalState: ProfessionalPortalState): ProfessionalOnboardingTask[] => {
  const activeServiceModes = getActiveServiceModes(portalState.serviceConfigurations);
  const requiresHomeVisitRadius = activeServiceModes.includes('home_visit');
  const requiresOfflineSchedule = activeServiceModes.some((mode) => offlineDeliveryModes.includes(mode));
  const publicPortfolioCount = portalState.portfolioEntries.filter((entry) => entry.visibility === 'public').length;

  return [
    {
      id: 'identity-display-name',
      isComplete: hasText(portalState.displayName),
      isRequiredForSubmission: true,
      route: ROUTES.profile,
      section: 'identity',
      title: 'Nama profesional',
    },
    {
      id: 'identity-phone',
      isComplete: hasText(portalState.phone),
      isRequiredForSubmission: true,
      route: ROUTES.profile,
      section: 'identity',
      title: 'Nomor WhatsApp',
    },
    {
      id: 'identity-city',
      isComplete: hasText(portalState.city),
      isRequiredForSubmission: true,
      route: ROUTES.profile,
      section: 'identity',
      title: 'Kota domisili',
    },
    {
      id: 'identity-credential',
      isComplete: hasText(portalState.credentialNumber),
      isRequiredForSubmission: true,
      route: ROUTES.profile,
      section: 'identity',
      title: 'Nomor STR / SIP',
    },
    {
      id: 'identity-experience',
      isComplete: hasText(portalState.yearsExperience),
      isRequiredForSubmission: true,
      route: ROUTES.profile,
      section: 'identity',
      title: 'Lama pengalaman',
    },
    {
      id: 'identity-bio',
      isComplete: hasText(portalState.publicBio),
      isRequiredForSubmission: true,
      route: ROUTES.profile,
      section: 'identity',
      title: 'Bio publik',
    },
    {
      id: 'coverage-practice-label',
      isComplete: hasText(portalState.practiceLabel),
      isRequiredForSubmission: true,
      route: ROUTES.coverage,
      section: 'coverage',
      title: 'Label lokasi praktik',
    },
    {
      id: 'coverage-practice-address',
      isComplete: hasText(portalState.practiceAddress),
      isRequiredForSubmission: true,
      route: ROUTES.coverage,
      section: 'coverage',
      title: 'Alamat praktik',
    },
    {
      id: 'coverage-area-selection',
      isComplete: portalState.coverageAreaIds.length > 0,
      isRequiredForSubmission: true,
      route: ROUTES.coverage,
      section: 'coverage',
      title: 'Area jangkauan',
    },
    {
      id: 'coverage-response-time',
      isComplete: hasText(portalState.responseTimeGoal),
      isRequiredForSubmission: true,
      route: ROUTES.coverage,
      section: 'coverage',
      title: 'Target waktu respons',
    },
    {
      id: 'coverage-home-visit-radius',
      isComplete: !requiresHomeVisitRadius || portalState.homeVisitRadiusKm > 0,
      isRequiredForSubmission: requiresHomeVisitRadius,
      route: ROUTES.coverage,
      section: 'coverage',
      title: 'Radius kunjungan rumah',
    },
    {
      id: 'services-active-service',
      isComplete: hasConfiguredActiveService(portalState.serviceConfigurations),
      isRequiredForSubmission: true,
      route: ROUTES.services,
      section: 'services',
      title: 'Minimal satu layanan aktif yang sudah terisi',
    },
    {
      id: 'services-active-mode',
      isComplete: activeServiceModes.length > 0,
      isRequiredForSubmission: true,
      route: ROUTES.services,
      section: 'services',
      title: 'Minimal satu mode layanan aktif',
    },
    {
      id: 'availability-offline-schedule',
      isComplete: !requiresOfflineSchedule || hasOfflineAvailabilityConfigured(portalState, activeServiceModes),
      isRequiredForSubmission: requiresOfflineSchedule,
      route: ROUTES.availability,
      section: 'availability',
      title: 'Jam booking offline umum',
    },
    {
      id: 'services-featured-service',
      isComplete: hasFeaturedActiveService(portalState.serviceConfigurations),
      isRequiredForSubmission: true,
      route: ROUTES.services,
      section: 'services',
      title: 'Layanan unggulan',
    },
    {
      id: 'portfolio-public-entry',
      isComplete: publicPortfolioCount > 0,
      isRequiredForSubmission: true,
      route: ROUTES.portfolio,
      section: 'portfolio',
      title: 'Minimal satu portofolio publik',
    },
    {
      id: 'portfolio-gallery',
      isComplete: portalState.galleryItems.length > 0,
      isRequiredForSubmission: false,
      route: ROUTES.portfolio,
      section: 'portfolio',
      title: 'Galeri profil',
    },
  ];
};

const sectionRouteMap: Record<ProfessionalOnboardingSectionKey, string> = {
  availability: ROUTES.availability,
  coverage: ROUTES.coverage,
  identity: ROUTES.profile,
  portfolio: ROUTES.portfolio,
  services: ROUTES.services,
};

const buildSections = (tasks: ProfessionalOnboardingTask[]): ProfessionalOnboardingSection[] =>
  (['identity', 'coverage', 'services', 'availability', 'portfolio'] as const).map((sectionKey) => {
    const sectionTasks = tasks.filter((task) => task.section === sectionKey);

    return {
      blockingCount: sectionTasks.filter((task) => task.isRequiredForSubmission && !task.isComplete).length,
      completedCount: sectionTasks.filter((task) => task.isComplete).length,
      isComplete: sectionTasks.every((task) => task.isComplete || !task.isRequiredForSubmission),
      key: sectionKey,
      route: sectionRouteMap[sectionKey],
      tasks: sectionTasks,
      totalCount: sectionTasks.length,
    };
  });

const resolveLifecycleStatus = (
  reviewState: ProfessionalLifecycleReviewState | null | undefined,
  blockingTaskCount: number,
): ProfessionalLifecycleStatus => {
  if (
    reviewState?.status === 'submitted' ||
    reviewState?.status === 'changes_requested' ||
    reviewState?.status === 'verified' ||
    reviewState?.status === 'published'
  ) {
    return reviewState.status;
  }

  return blockingTaskCount === 0 ? 'ready_for_review' : 'draft';
};

const resolvePageState = (
  lifecycleStatus: ProfessionalLifecycleStatus,
  completedTaskCount: number,
): ProfessionalOnboardingPageState => {
  if (lifecycleStatus === 'published') {
    return 'live';
  }

  if (lifecycleStatus === 'verified') {
    return 'verified_pending_publish';
  }

  if (lifecycleStatus === 'submitted') {
    return 'awaiting_admin_review';
  }

  if (lifecycleStatus === 'changes_requested') {
    return 'changes_requested';
  }

  if (lifecycleStatus === 'ready_for_review') {
    return 'ready_for_review';
  }

  return completedTaskCount === 0 ? 'onboarding_empty' : 'onboarding_in_progress';
};

export const createProfessionalOnboardingDraft = (
  portalState: ProfessionalPortalState,
  overrides: Partial<ProfessionalPortalState> = {},
): ProfessionalPortalState => ({
  ...portalState,
  acceptingNewClients: false,
  activityStories: [],
  autoApproveInstantBookings: false,
  coverageAreaIds: [],
  credentials: [],
  galleryItems: [],
  homeVisitRadiusKm: 0,
  availabilityRulesByMode: undefined,
  portfolioEntries: [],
  practiceAddress: '',
  practiceLabel: '',
  publicBio: '',
  requestBoard: [],
  responseTimeGoal: '',
  serviceConfigurations: portalState.serviceConfigurations.map((service) => ({
    ...service,
    featured: false,
    isActive: false,
    source: 'template',
  })),
  yearsExperience: '',
  ...overrides,
});

export const deriveProfessionalOnboardingState = (
  portalState: ProfessionalPortalState,
  reviewState?: ProfessionalLifecycleReviewState | null,
): ProfessionalOnboardingState => {
  const tasks = buildTasks(portalState);
  const sections = buildSections(tasks);
  const blockingTaskCount = tasks.filter((task) => task.isRequiredForSubmission && !task.isComplete).length;
  const completedTaskCount = tasks.filter((task) => task.isComplete).length;
  const totalTaskCount = tasks.length;
  const lifecycleStatus = resolveLifecycleStatus(reviewState, blockingTaskCount);
  const highlightSection = sections.find((section) => section.blockingCount > 0)?.key || null;
  const nextActionRoute =
    tasks.find((task) => task.isRequiredForSubmission && !task.isComplete)?.route ||
    sections.find((section) => section.blockingCount > 0)?.route ||
    null;

  return {
    blockingTaskCount,
    canSubmitForReview: lifecycleStatus === 'ready_for_review',
    completedTaskCount,
    completionPercent: totalTaskCount === 0 ? 0 : Math.round((completedTaskCount / totalTaskCount) * 100),
    highlightSection,
    lifecycleStatus,
    nextActionRoute,
    pageState: resolvePageState(lifecycleStatus, completedTaskCount),
    sections,
    totalTaskCount,
  };
};

export const PROFESSIONAL_LIFECYCLE_REVIEW_STATE_MOCKS: Record<string, ProfessionalLifecycleReviewState> = {
  awaitingAdminReview: {
    status: 'submitted',
    submittedAt: '2026-03-17T09:00:00+07:00',
  },
  changesRequested: {
    adminNote: 'Lengkapi area jangkauan, pilih layanan unggulan, dan tambahkan 1 portofolio publik.',
    reviewedAt: '2026-03-17T13:30:00+07:00',
    reviewerName: 'Admin BidanCare',
    status: 'changes_requested',
    submittedAt: '2026-03-17T09:00:00+07:00',
  },
  draft: {
    status: 'draft',
  },
  published: {
    publishedAt: '2026-03-18T09:30:00+07:00',
    reviewedAt: '2026-03-17T16:15:00+07:00',
    reviewerName: 'Admin BidanCare',
    status: 'published',
    submittedAt: '2026-03-17T09:00:00+07:00',
  },
  readyForReview: {
    status: 'ready_for_review',
  },
  verifiedPendingPublish: {
    reviewedAt: '2026-03-17T16:15:00+07:00',
    reviewerName: 'Admin BidanCare',
    status: 'verified',
    submittedAt: '2026-03-17T09:00:00+07:00',
  },
};
