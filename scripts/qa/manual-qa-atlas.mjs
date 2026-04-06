import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

export const manualQaCaseIds = [
  'PUB-01',
  'PUB-02',
  'PUB-03',
  'PUB-04',
  'CUS-01',
  'CUS-02',
  'CUS-03',
  'PRO-01',
  'PRO-02',
  'PRO-03',
  'PRO-04',
  'PRO-05',
  'PRO-06',
  'ADM-01',
  'ADM-02',
  'ADM-03',
  'ADM-04',
];

export const caseOrder = new Map(manualQaCaseIds.map((caseId, index) => [caseId, index]));

export const surfaceOrder = ['public', 'customer', 'professional', 'admin'];

export const surfaceLabels = {
  admin: 'Admin',
  customer: 'Customer',
  professional: 'Professional',
  public: 'Public',
};

export const journeyAudienceOrder = ['public', 'customer', 'professional', 'admin'];

const countValues = (values = []) =>
  values.reduce((counts, value) => {
    if (!value) {
      return counts;
    }

    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});

const titleCase = (value = '') =>
  String(value)
    .split(/[_-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const uniqueSorted = (values = []) =>
  [...new Set(values.filter(Boolean))].sort((left, right) => String(left).localeCompare(String(right)));

const dedupeBy = (items = [], keyBuilder) => {
  const seen = new Set();
  const deduped = [];

  for (const item of items) {
    const key = keyBuilder(item);

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(item);
  }

  return deduped;
};

const formatBooleanState = (value) => (value ? 'yes' : 'no');

const describeEntityRef = (reference = {}) => {
  const details = [];

  if (reference.id) {
    details.push(reference.id);
  }

  if (reference.slug) {
    details.push(reference.slug);
  }

  if (reference.appointmentStatus) {
    details.push(`status ${reference.appointmentStatus}`);
  }

  if (reference.reviewStatus) {
    details.push(`review ${reference.reviewStatus}`);
  }

  if (reference.mode) {
    details.push(`mode ${reference.mode}`);
  }

  if (reference.bookingFlow) {
    details.push(`flow ${reference.bookingFlow}`);
  }

  if (reference.route) {
    details.push(reference.route);
  }

  const label = reference.label || titleCase(reference.kind || 'reference');
  return details.length > 0 ? `${label} - ${details.join(' | ')}` : label;
};

const buildPossibilityHighlights = (seedCase, scenario) => {
  const possibilities = [];
  const references = seedCase?.sampleEntityRefs ?? [];
  const referencedModes = uniqueSorted(references.map((reference) => reference.mode));
  const referencedBookingFlows = uniqueSorted(references.map((reference) => reference.bookingFlow));
  const referencedReviewStates = uniqueSorted(references.map((reference) => reference.reviewStatus));

  if (seedCase?.login?.identifier && seedCase?.login?.route) {
    possibilities.push(
      `Entry uses ${seedCase.login.identifierType} ${seedCase.login.identifier} from ${seedCase.login.route}.`,
    );
  }

  if (seedCase?.tags?.includes('locale')) {
    possibilities.push('Locale switching is part of the seeded flow between Indonesian and English entry points.');
  }

  if (referencedModes.length > 0) {
    possibilities.push(`Service or appointment modes touched: ${referencedModes.join(', ')}.`);
  }

  if (referencedBookingFlows.length > 0) {
    possibilities.push(`Booking flow branches touched: ${referencedBookingFlows.join(', ')}.`);
  }

  if (scenario?.appointmentStatuses?.length > 0) {
    possibilities.push(`Appointment lifecycle states in scope: ${scenario.appointmentStatuses.join(', ')}.`);
  }

  if (typeof scenario?.readNotificationCount === 'number') {
    possibilities.push(`Seeded notifications pre-read before the run: ${scenario.readNotificationCount}.`);
  }

  if (scenario?.reviewStatus) {
    possibilities.push(`Professional review state under test: ${scenario.reviewStatus}.`);
  } else if (referencedReviewStates.length > 0) {
    possibilities.push(`Referenced visibility or review states: ${referencedReviewStates.join(', ')}.`);
  }

  if (typeof scenario?.coverageReady === 'boolean') {
    possibilities.push(`Coverage configuration ready: ${formatBooleanState(scenario.coverageReady)}.`);
  }

  if (typeof scenario?.servicesReady === 'boolean') {
    possibilities.push(`Service configuration ready: ${formatBooleanState(scenario.servicesReady)}.`);
  }

  if (typeof scenario?.hasFeaturedService === 'boolean') {
    possibilities.push(`Featured service already selected: ${formatBooleanState(scenario.hasFeaturedService)}.`);
  }

  if (scenario?.focusArea) {
    possibilities.push(`Admin focus area for this case: ${scenario.focusArea}.`);
  }

  return possibilities;
};

const findScenarioForCase = (seedCase, scenarioMaps) => {
  if (!seedCase?.personaRole) {
    return null;
  }

  if (seedCase.personaRole === 'customer') {
    return scenarioMaps.customerById.get(seedCase.personaId) ?? null;
  }

  if (seedCase.personaRole === 'professional') {
    return scenarioMaps.professionalById.get(seedCase.personaId) ?? null;
  }

  if (seedCase.personaRole === 'admin') {
    return scenarioMaps.adminById.get(seedCase.personaId) ?? null;
  }

  return null;
};

export const loadSeedQaSummary = async (repoRoot) => {
  const { stdout } = await execFileAsync(npmCommand, ['--silent', 'run', 'qa:manual:summary'], {
    cwd: repoRoot,
    maxBuffer: 10 * 1024 * 1024,
  });

  return JSON.parse(stdout);
};

export const buildCoverageAtlas = (seedSummary = {}) => ({
  appointmentStatusCounts: seedSummary.appointmentStatusCounts ?? {},
  coveredCities: seedSummary.coveredCities ?? [],
  featureTagCounts: countValues((seedSummary.manualQaCases ?? []).flatMap((qaCase) => qaCase.tags ?? [])),
  portalReviewStatusCounts: seedSummary.portalReviewStatusCounts ?? {},
  supportedAppointmentModes: seedSummary.supportedAppointmentModes ?? [],
  supportedBookingFlows: seedSummary.supportedBookingFlows ?? [],
  supportedServiceModes: seedSummary.supportedServiceModes ?? [],
});

export const enrichManualQaCases = (qaCases = [], seedSummary = {}) => {
  const catalogById = new Map((seedSummary.manualQaCases ?? []).map((qaCase) => [qaCase.id, qaCase]));
  const scenarioMaps = {
    adminById: new Map((seedSummary.adminScenarios ?? []).map((scenario) => [scenario.adminId, scenario])),
    customerById: new Map((seedSummary.customerScenarios ?? []).map((scenario) => [scenario.consumerId, scenario])),
    professionalById: new Map(
      (seedSummary.professionalScenarios ?? []).map((scenario) => [scenario.professionalId, scenario]),
    ),
  };

  return [...qaCases]
    .map((qaCase) => {
      const seedCase = catalogById.get(qaCase.caseId) ?? null;
      const scenario = findScenarioForCase(seedCase, scenarioMaps);

      return {
        ...qaCase,
        checksEn: seedCase?.checksEn ?? [],
        checksId: seedCase?.checksId ?? [],
        login: seedCase?.login ?? null,
        possibilities: buildPossibilityHighlights(seedCase, scenario),
        sampleEntityRefs: seedCase?.sampleEntityRefs ?? [],
        scenario,
        seedTitleEn: seedCase?.titleEn ?? qaCase.title,
        seedTitleId: seedCase?.titleId ?? null,
        tags: seedCase?.tags ?? [],
        title: seedCase?.titleEn ?? qaCase.title,
      };
    })
    .sort((left, right) => {
      const leftIndex = caseOrder.get(left.caseId) ?? Number.MAX_SAFE_INTEGER;
      const rightIndex = caseOrder.get(right.caseId) ?? Number.MAX_SAFE_INTEGER;
      return leftIndex - rightIndex;
    });
};

export const summarizeEntityRefs = (references = []) => references.map((reference) => describeEntityRef(reference));

const journeyBlueprints = [
  {
    audience: 'public',
    id: 'JRN-PUB-DISCOVERY',
    outcome:
      'Visitor bisa masuk, pindah locale, menemukan layanan, lalu sampai ke detail profesional yang siap dipesan.',
    persona: 'Visitor publik',
    serviceLabel: 'Discovery publik',
    title: 'Visitor menjelajah layanan dan profesional sebelum login',
    whyItMatters:
      'Journal ini memastikan funnel public discovery tetap utuh walaupun belum ada login customer. Ini penting karena semua order selalu dimulai dari kepercayaan pada layanan dan profesional publik.',
    caseIds: ['PUB-01', 'PUB-02', 'PUB-03', 'PUB-04'],
    qaGoals: [
      'Pastikan onboarding entry dan locale switch tidak rusak.',
      'Pastikan katalog layanan dan profesional tetap hidup dari backend seed.',
      'Pastikan visitor bisa berpindah dari service detail ke profesional yang kompatibel tanpa dead-end.',
    ],
    phases: [
      {
        title: 'Masuk dari locale entry',
        summary: 'Visitor membuka `/id` dan `/en` untuk memastikan entry, copy, dan context area seed tetap sehat.',
        expected: [
          'Locale switch berjalan bersih.',
          'Onboarding tidak menampilkan wording development.',
          'Context visitor seed tetap deterministik.',
        ],
        caseIds: ['PUB-01'],
      },
      {
        title: 'Menjelajah katalog publik',
        summary:
          'Visitor masuk ke home, explore, dan services untuk melihat layanan serta profesional yang bisa dipilih.',
        expected: [
          'Katalog publik hydrate dari backend.',
          'Card layanan dan profesional konsisten di seluruh surface discovery.',
          'CTA discovery tidak menyesatkan user.',
        ],
        caseIds: ['PUB-02'],
      },
      {
        title: 'Validasi trust dan route ke profesional',
        summary:
          'Visitor membuka detail profesional published dan detail layanan untuk memastikan trust, service fit, dan route lanjutannya benar.',
        expected: [
          'Detail profesional published terasa live.',
          'Service detail tetap lanjut ke profesional yang tepat.',
          'Trust, badge, dan CTA konsisten antara dua layar itu.',
        ],
        caseIds: ['PUB-03', 'PUB-04'],
      },
    ],
  },
  {
    audience: 'customer',
    id: 'JRN-CUS-ORDER-LAKTASI',
    outcome: 'Customer berhasil masuk dari discovery publik ke appointment aktif dan chat yang masih berjalan.',
    persona: 'Visitor -> Alya Rahma',
    serviceLabel: 'Konsultasi Laktasi',
    title: 'Customer mau order Konsultasi Laktasi dari awal sampai appointment aktif',
    whyItMatters:
      'Ini adalah journal happy path paling penting untuk QA karena menjahit discovery publik, trust ke profesional published, login customer, appointment aktif, sampai chat.',
    caseIds: ['PUB-01', 'PUB-02', 'PUB-03', 'PUB-04', 'CUS-01'],
    qaGoals: [
      'Pastikan funnel public -> auth -> appointment tidak putus.',
      'Pastikan service dan profesional yang dipilih tetap konsisten sampai customer masuk ke flow terlindungi.',
      'Pastikan appointment aktif dan chat seed masih bisa dibaca tanpa kehilangan context.',
    ],
    phases: [
      {
        title: 'Masuk sebagai visitor dan menemukan layanan',
        summary:
          'User masuk dari locale entry, melihat home/explore/services, lalu menemukan layanan Konsultasi Laktasi di katalog publik.',
        expected: [
          'Switch locale tetap bersih.',
          'Katalog publik hydrate dari backend seed.',
          'Card layanan dan CTA discovery tetap konsisten.',
        ],
        caseIds: ['PUB-01', 'PUB-02'],
      },
      {
        title: 'Validasi trust dan memilih profesional',
        summary:
          'User membuka detail profesional Clara Wijaya dan service detail Konsultasi Laktasi untuk memastikan trust, mode, dan CTA menuju flow booking benar.',
        expected: [
          'Profesional published tampil sebagai listing live.',
          'Service-first route tetap lanjut ke profesional yang kompatibel.',
          'Trust, badge, dan entry booking tidak saling bertentangan.',
        ],
        caseIds: ['PUB-03', 'PUB-04'],
      },
      {
        title: 'Masuk sebagai customer lalu monitor order aktif',
        summary:
          'Customer login sebagai Alya Rahma, membuka profile, notifications, appointments, activity, dan chat seed untuk memantau order yang sedang berjalan.',
        expected: [
          'Session customer langsung hydrate.',
          'State notifikasi terbaca dan belum terbaca tetap masuk akal.',
          'Appointment aktif dan chat history muncul sebelum kirim pesan baru.',
        ],
        caseIds: ['CUS-01'],
      },
    ],
  },
  {
    audience: 'customer',
    id: 'JRN-CUS-REQUEST-HOME-VISIT',
    outcome: 'Customer berhasil masuk ke state requested dan tahu apa yang harus menunggu berikutnya.',
    persona: 'Visitor -> Nadia Prameswari',
    serviceLabel: 'Home visit request',
    title: 'Customer mau request layanan lalu menunggu approval profesional',
    whyItMatters:
      'Journal ini mewakili branch request flow, unread notification, dan profile persistence sesudah customer sudah membuat permintaan tapi belum diproses.',
    caseIds: ['PUB-04', 'CUS-02'],
    qaGoals: [
      'Pastikan flow request berbeda jelas dari instant booking.',
      'Pastikan unread badge dan request-state card tetap sinkron dengan backend.',
      'Pastikan update profil customer tidak merusak state appointment yang sedang menunggu.',
    ],
    phases: [
      {
        title: 'Masuk dari halaman service dan niat order',
        summary:
          'User datang dari detail layanan dan diarahkan ke flow profesional yang sesuai untuk melanjutkan order.',
        expected: [
          'Route dari halaman service tidak memotong validasi mode atau profesional.',
          'Customer tetap paham bahwa ia sedang masuk ke flow request layanan.',
        ],
        caseIds: ['PUB-04'],
      },
      {
        title: 'Login customer dan melihat state requested',
        summary:
          'Nadia login, melihat unread notifications, lalu membuka appointment requested untuk memahami langkah berikutnya.',
        expected: [
          'Badge unread masih terlihat karena belum ada notifikasi yang dipre-read.',
          'Card requested, next-step copy, dan detail status selaras dengan backend.',
          'Perubahan profil tetap tersimpan setelah refresh.',
        ],
        caseIds: ['CUS-02'],
      },
    ],
  },
  {
    audience: 'customer',
    id: 'JRN-CUS-HISTORY-REBOOK',
    outcome:
      'Customer bisa meninjau order selesai atau dibatalkan, lalu kembali membandingkan layanan untuk order berikutnya.',
    persona: 'Hendra Saputra',
    serviceLabel: 'History and re-entry',
    title: 'Customer meninjau completed dan cancelled journey lalu siap order ulang',
    whyItMatters:
      'QA butuh journal ini untuk memastikan history yang sudah selesai tidak rusak, dan customer masih bisa kembali ke discovery atau profesional detail tanpa kehilangan context.',
    caseIds: ['PUB-02', 'PUB-03', 'CUS-03'],
    qaGoals: [
      'Pastikan history completed dan cancelled bisa dibaca jelas.',
      'Pastikan user tetap bisa kembali ke layar layanan dan profesional untuk re-entry.',
      'Pastikan favorit dan context lokasi tidak hilang saat berpindah layar.',
    ],
    phases: [
      {
        title: 'Masuk kembali lewat discovery dan trust surface',
        summary:
          'Customer membuka ulang layanan publik dan profesional published sebagai titik re-entry sebelum memutuskan order berikutnya.',
        expected: [
          'Discovery surface tetap stabil untuk customer returning.',
          'Detail profesional published masih bisa dipakai sebagai referensi order ulang.',
        ],
        caseIds: ['PUB-02', 'PUB-03'],
      },
      {
        title: 'Membaca history journey yang sudah selesai',
        summary:
          'Hendra membuka appointment completed dan cancelled untuk membaca timeline, outcome, dan context resolusi.',
        expected: [
          'Timeline journey tertutup tetap koheren.',
          'Status completed dan cancelled punya copy yang jelas.',
          'Customer masih bisa berpindah ke halaman layanan atau profesional sebagai langkah berikutnya.',
        ],
        caseIds: ['CUS-03'],
      },
    ],
  },
  {
    audience: 'professional',
    id: 'JRN-PRO-LIFECYCLE',
    outcome: 'Profesional bergerak dari draft, review admin, revisi, verified, sampai live di katalog.',
    persona: 'Alex Ben -> Dimas Pratama -> Omeya Sen -> Rani Hartati -> Martha Teria -> Clara Wijaya',
    serviceLabel: 'Professional lifecycle',
    title: 'Perjalanan profesional dari draft sampai published',
    whyItMatters:
      'Journal ini memberi QA satu view utuh untuk seluruh lifecycle portal profesional, bukan hanya snapshot status yang berdiri sendiri.',
    caseIds: ['PRO-05', 'PRO-06', 'PRO-02', 'PRO-03', 'PRO-04', 'PRO-01'],
    qaGoals: [
      'Pastikan blocker onboarding terlihat pada draft.',
      'Pastikan state ready_for_review, submitted, changes_requested, verified, dan published punya perilaku berbeda.',
      'Pastikan ketika status akhirnya published, surface publik ikut merefleksikan hasilnya.',
    ],
    phases: [
      {
        title: 'Draft dan gap onboarding',
        summary: 'Profesional baru masih punya layanan kosong, coverage belum lengkap, dan belum siap live.',
        expected: [
          'Prompt onboarding tetap terlihat.',
          'Service dan coverage yang belum siap tidak disamarkan seolah lengkap.',
        ],
        caseIds: ['PRO-05'],
      },
      {
        title: 'Siap review dan menunggu admin',
        summary: 'Profesional sudah cukup lengkap untuk diajukan, lalu masuk ke antrian review admin.',
        expected: [
          'Warning pre-review dan syarat featured service tetap jelas.',
          'State submitted bersifat read-only sampai admin memberi keputusan.',
        ],
        caseIds: ['PRO-06', 'PRO-02'],
      },
      {
        title: 'Revisi, verified, lalu live',
        summary:
          'Admin meminta revisi, profesional memperbaiki, lalu status diverifikasi dan akhirnya profile bisa hidup di katalog.',
        expected: [
          'Feedback admin terlihat dan bisa ditindaklanjuti.',
          'Status verified berbeda dari published.',
          'Saat published, public surface benar-benar ikut hidup.',
        ],
        caseIds: ['PRO-03', 'PRO-04', 'PRO-01'],
      },
    ],
  },
  {
    audience: 'admin',
    id: 'JRN-ADM-OPERATIONS',
    outcome: 'Admin menjaga support, review profesional, operasi booking, dan katalog tetap sinkron.',
    persona: 'Naya -> Rani -> Dimas -> Vina',
    serviceLabel: 'Admin operations',
    title: 'Perjalanan admin menjaga support, review, dan operasi tetap sehat',
    whyItMatters:
      'Journal ini menjahit empat modul admin utama supaya QA bisa membaca admin sebagai satu operasi utuh, bukan empat halaman yang terpisah.',
    caseIds: ['ADM-01', 'ADM-02', 'ADM-03', 'ADM-04'],
    qaGoals: [
      'Pastikan support desk, review queue, customer/appointment ops, dan catalog/studio tetap sinkron.',
      'Pastikan admin screen hydrate dari backend state, bukan browser-owned cache yang stale.',
      'Pastikan mutasi aman level admin tetap terlihat ke surface terkait.',
    ],
    phases: [
      {
        title: 'Support desk dan review profesional',
        summary:
          'Admin membaca tiket support lintas urgensi, lalu masuk ke review profesional untuk menangani lifecycle akun yang belum live.',
        expected: [
          'Tiket urgent, high, dan normal tampil bersama context-nya.',
          'Queue review profesional tetap stabil setelah refresh.',
        ],
        caseIds: ['ADM-01', 'ADM-02'],
      },
      {
        title: 'Operasi booking, customer, dan katalog',
        summary:
          'Admin memeriksa modul customer dan appointment, lalu memastikan tabel layanan dan studio tetap sinkron dengan backend.',
        expected: [
          'Customer dan appointment modules selaras.',
          'Mutasi tabel aman tetap persisten.',
          'Surface publik terkait bisa ikut merefleksikan perubahan backend.',
        ],
        caseIds: ['ADM-03', 'ADM-04'],
      },
    ],
  },
];

export const buildJourneyJournals = (manualQaCases = []) => {
  const casesById = new Map(manualQaCases.map((qaCase) => [qaCase.caseId, qaCase]));

  return journeyBlueprints
    .map((journey) => {
      const relatedCases = journey.caseIds.map((caseId) => casesById.get(caseId)).filter(Boolean);
      const phases = journey.phases
        .map((phase) => {
          const phaseCases = phase.caseIds.map((caseId) => casesById.get(caseId)).filter(Boolean);

          return {
            ...phase,
            cases: phaseCases,
            evidenceCount: phaseCases.reduce((total, qaCase) => total + (qaCase.screenshots?.length ?? 0), 0),
            routes: uniqueSorted(phaseCases.flatMap((qaCase) => qaCase.metadata.routes ?? [])),
          };
        })
        .filter((phase) => phase.cases.length > 0);

      const references = dedupeBy(
        relatedCases.flatMap((qaCase) => qaCase.sampleEntityRefs ?? []),
        (reference) => JSON.stringify(reference),
      );
      const screenshots = dedupeBy(
        relatedCases.flatMap((qaCase) =>
          (qaCase.screenshots ?? []).slice(0, 2).map((screenshot) => ({
            ...screenshot,
            caseId: qaCase.caseId,
            caseTitle: qaCase.seedTitleId ?? qaCase.title,
          })),
        ),
        (screenshot) => `${screenshot.caseId}:${screenshot.path}`,
      ).slice(0, 8);

      return {
        ...journey,
        caseCount: relatedCases.length,
        cases: relatedCases,
        phases,
        references,
        routes: uniqueSorted(relatedCases.flatMap((qaCase) => qaCase.metadata.routes ?? [])),
        screenshots,
        statuses: countValues(relatedCases.map((qaCase) => qaCase.status)),
        tags: uniqueSorted(relatedCases.flatMap((qaCase) => qaCase.tags ?? [])),
      };
    })
    .filter((journey) => journey.cases.length > 0)
    .sort((left, right) => {
      const audienceIndex = journeyAudienceOrder.indexOf(left.audience) - journeyAudienceOrder.indexOf(right.audience);

      if (audienceIndex !== 0) {
        return audienceIndex;
      }

      return left.title.localeCompare(right.title);
    });
};

export const buildJourneyCoverageAudit = (manualQaCases = [], journeyJournals = []) => {
  const journeysByCaseId = new Map();

  for (const qaCase of manualQaCases) {
    journeysByCaseId.set(qaCase.caseId, []);
  }

  for (const journey of journeyJournals) {
    for (const qaCase of journey.cases ?? []) {
      if (!journeysByCaseId.has(qaCase.caseId)) {
        journeysByCaseId.set(qaCase.caseId, []);
      }

      journeysByCaseId.get(qaCase.caseId).push({
        audience: journey.audience,
        id: journey.id,
        title: journey.title,
      });
    }
  }

  const coverageByCase = manualQaCases.map((qaCase) => {
    const journeys = journeysByCaseId.get(qaCase.caseId) ?? [];

    return {
      caseId: qaCase.caseId,
      journeyCount: journeys.length,
      journeys,
      routes: qaCase.metadata.routes ?? [],
      screenshots: qaCase.screenshots?.length ?? 0,
      status: qaCase.status,
      surface: qaCase.metadata.surface ?? 'unknown',
      title: qaCase.seedTitleId ?? qaCase.title,
    };
  });

  const uncoveredCaseIds = coverageByCase
    .filter((entry) => entry.journeyCount === 0)
    .map((entry) => entry.caseId)
    .sort((left, right) => left.localeCompare(right));
  const multiplyCoveredCaseIds = coverageByCase
    .filter((entry) => entry.journeyCount > 1)
    .map((entry) => entry.caseId)
    .sort((left, right) => left.localeCompare(right));
  const coverageBySurface = Object.fromEntries(
    uniqueSorted(coverageByCase.map((entry) => entry.surface)).map((surface) => {
      const surfaceEntries = coverageByCase.filter((entry) => entry.surface === surface);
      const covered = surfaceEntries.filter((entry) => entry.journeyCount > 0).length;

      return [
        surface,
        {
          covered,
          total: surfaceEntries.length,
        },
      ];
    }),
  );

  return {
    audienceCounts: countValues(journeyJournals.map((journey) => journey.audience)),
    completeness: uncoveredCaseIds.length === 0 ? 'complete' : 'incomplete',
    coverageByCase,
    coverageBySurface,
    coveredCases: coverageByCase.filter((entry) => entry.journeyCount > 0).length,
    multiplyCoveredCaseIds,
    totalCases: manualQaCases.length,
    totalJourneys: journeyJournals.length,
    uncoveredCaseIds,
  };
};
