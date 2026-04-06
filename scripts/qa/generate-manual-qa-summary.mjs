import { constants } from 'node:fs';
import { access, copyFile, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCoverageAtlas,
  buildJourneyCoverageAudit,
  buildJourneyJournals,
  caseOrder,
  enrichManualQaCases,
  journeyAudienceOrder,
  loadSeedQaSummary,
  summarizeEntityRefs,
  surfaceLabels,
  surfaceOrder,
} from './manual-qa-atlas.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const frontendDir = resolve(repoRoot, 'apps/frontend');
const evidenceResultsDir = resolve(frontendDir, 'allure-results');
const summaryDir = resolve(frontendDir, 'manual-qa-summary');
const summaryAssetsDir = resolve(summaryDir, 'assets');

const ensureExists = async (targetPath) => {
  try {
    await access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96) || 'artifact';

const formatDuration = (start, stop) => {
  if (typeof start !== 'number' || typeof stop !== 'number' || stop < start) {
    return 'n/a';
  }

  const durationMs = stop - start;

  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  return `${(durationMs / 1000).toFixed(1)} s`;
};

const readProperties = (contents) => {
  const properties = {};

  for (const line of contents.split('\n')) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    if (key) {
      properties[key] = value;
    }
  }

  return properties;
};

const collectStepArtifacts = (steps = [], ancestry = []) => {
  const artifacts = [];

  for (const step of steps) {
    const currentAncestry = [...ancestry, step.name];
    const routeStepName = [...currentAncestry].reverse().find((name) => name.startsWith('visit '));
    const route = routeStepName ? routeStepName.slice('visit '.length) : null;

    for (const attachment of step.attachments ?? []) {
      artifacts.push({
        ...attachment,
        route,
        stepName: step.name,
      });
    }

    artifacts.push(...collectStepArtifacts(step.steps ?? [], currentAncestry));
  }

  return artifacts;
};

const deriveCaseTitle = (name, caseId) => {
  const prefix = `[manual-qa] ${caseId} `;

  if (name.startsWith(prefix)) {
    return name.slice(prefix.length).trim();
  }

  return name.trim();
};

const copyAttachment = async (source, caseId, label) => {
  const sourcePath = resolve(evidenceResultsDir, source);
  const extension = extname(source) || extname(label) || '';
  const targetFileName = `${slugify(caseId)}-${slugify(label || basename(source, extension))}-${source}${extension && source.endsWith(extension) ? '' : extension}`;
  const targetPath = resolve(summaryAssetsDir, targetFileName);

  await copyFile(sourcePath, targetPath);

  return {
    absolutePath: targetPath,
    relativePath: `./assets/${targetFileName}`,
  };
};

const loadRunEnvironment = async () => {
  const propertiesPath = resolve(evidenceResultsDir, 'environment.properties');

  if (!(await ensureExists(propertiesPath))) {
    return {};
  }

  const contents = await readFile(propertiesPath, 'utf8');
  return readProperties(contents);
};

const readManualQaCases = async () => {
  const entries = await readdir(evidenceResultsDir);
  const resultFiles = entries.filter((entry) => entry.endsWith('-result.json')).sort();
  const cases = [];

  for (const resultFile of resultFiles) {
    const resultPath = resolve(evidenceResultsDir, resultFile);
    const result = JSON.parse(await readFile(resultPath, 'utf8'));
    const stepArtifacts = collectStepArtifacts(result.steps ?? []);
    const combinedAttachments = [...(result.attachments ?? []), ...stepArtifacts];
    const metadataAttachment = combinedAttachments.find((attachment) => attachment.name === 'manual-qa-case.json');

    if (!metadataAttachment?.source) {
      continue;
    }

    const metadataPath = resolve(evidenceResultsDir, metadataAttachment.source);
    const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));

    if (!metadata?.id) {
      continue;
    }

    const screenshotAttachments = stepArtifacts.filter((attachment) => attachment.type === 'image/png');
    const traceAttachment = combinedAttachments.find(
      (attachment) => attachment.type === 'application/vnd.allure.playwright-trace',
    );
    const copiedMetadata = await copyAttachment(metadataAttachment.source, metadata.id, 'manual-qa-case');
    const screenshots = [];

    for (const attachment of screenshotAttachments) {
      if (!attachment.source) {
        continue;
      }

      const copiedAttachment = await copyAttachment(
        attachment.source,
        metadata.id,
        attachment.name || attachment.route || 'screenshot',
      );
      screenshots.push({
        caption: attachment.name || attachment.route || 'Screenshot',
        path: copiedAttachment.relativePath,
        route: attachment.route,
      });
    }

    const trace = traceAttachment?.source
      ? await copyAttachment(traceAttachment.source, metadata.id, traceAttachment.name || 'trace')
      : null;

    cases.push({
      caseId: metadata.id,
      duration: formatDuration(result.start, result.stop),
      metadata,
      metadataPath: copiedMetadata.relativePath,
      startedAt: typeof result.start === 'number' ? new Date(result.start).toISOString() : null,
      status: result.status || 'unknown',
      screenshots,
      title: deriveCaseTitle(result.name || metadata.id, metadata.id),
      tracePath: trace?.relativePath ?? null,
    });
  }

  cases.sort((left, right) => {
    const leftIndex = caseOrder.get(left.caseId) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = caseOrder.get(right.caseId) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });

  return cases;
};

const renderSurfaceNavigation = (surfaces) =>
  surfaces
    .map(
      (surface) => `
        <a class="surface-link" href="#surface-${escapeHtml(surface)}">
          <span>${escapeHtml(surfaceLabels[surface] ?? surface)}</span>
          <strong>${surfacesById.get(surface)?.length ?? 0}</strong>
        </a>
      `,
    )
    .join('');

const renderTagChips = (tags = [], className = '') =>
  tags.map((tag) => `<span class="chip ${escapeHtml(className)}">${escapeHtml(tag)}</span>`).join('');

const renderBulletList = (items = []) => {
  if (items.length === 0) {
    return '<p class="empty-state">No extra checklist details were attached to this case.</p>';
  }

  return `
    <ul class="detail-list">
      ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
    </ul>
  `;
};

const renderReferenceList = (references = []) => {
  if (references.length === 0) {
    return '<p class="empty-state">No seeded reference entities were attached to this case.</p>';
  }

  return `
    <ul class="detail-list detail-list-compact">
      ${summarizeEntityRefs(references)
        .map((reference) => `<li>${escapeHtml(reference)}</li>`)
        .join('')}
    </ul>
  `;
};

const renderStatusPills = (statusCounts = {}) =>
  Object.entries(statusCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([status, count]) =>
        `<span class="chip status-inline status-inline-${escapeHtml(status)}">${escapeHtml(status)} <strong>${count}</strong></span>`,
    )
    .join('');

const renderRouteList = (routes = []) => {
  if (routes.length === 0) {
    return '<p class="empty-state">Tidak ada route yang tercatat.</p>';
  }

  return `
    <ul class="compact-list">
      ${routes.map((route) => `<li><code>${escapeHtml(route)}</code></li>`).join('')}
    </ul>
  `;
};

const renderCaseLinkList = (cases = []) => {
  if (cases.length === 0) {
    return '<p class="empty-state">Tidak ada case yang terhubung.</p>';
  }

  return `
    <ul class="compact-list">
      ${cases
        .map(
          (qaCase) =>
            `<li><a href="#case-${escapeHtml(qaCase.caseId)}">${escapeHtml(qaCase.caseId)}</a> - ${escapeHtml(qaCase.seedTitleId ?? qaCase.title)}</li>`,
        )
        .join('')}
    </ul>
  `;
};

const humanizeRouteLabel = (route = '') => {
  const segments = route.split('/').filter(Boolean);
  const rawLabel = segments.length === 0 ? 'Landing' : segments[segments.length - 1];

  return rawLabel.replace(/[-_]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
};

const reviewStateLabels = {
  changes_requested: 'perlu revisi',
  draft: 'draft onboarding',
  published: 'published',
  ready_for_review: 'siap review',
  submitted: 'submitted',
  verified: 'verified',
};

const adminFocusLabels = {
  catalog: 'Admin katalog',
  ops: 'Admin ops',
  reviews: 'Admin review',
  support: 'Admin support',
};

const getScenarioRecord = (qaCase) =>
  qaCase && typeof qaCase.scenario === 'object' && qaCase.scenario !== null ? qaCase.scenario : {};

const getCaseDisplayName = (qaCase, fallback = 'User') => {
  const scenario = getScenarioRecord(qaCase);
  return scenario.displayName ?? qaCase?.metadata?.persona ?? fallback;
};

const getJourneyActorLabel = (journey, qaCase) => {
  const scenario = getScenarioRecord(qaCase);

  if (journey.audience === 'admin') {
    return adminFocusLabels[scenario.focusArea] ?? 'Admin';
  }

  if (journey.audience === 'customer') {
    return scenario.displayName ? `Customer ${scenario.displayName}` : 'Customer';
  }

  if (journey.audience === 'professional') {
    return scenario.displayName ? `Profesional ${scenario.displayName}` : 'Profesional';
  }

  return 'Visitor';
};

const buildStoryboardNarrative = (screen, phase, journey) => {
  const qaCase = screen.sourceCase;
  const scenario = getScenarioRecord(qaCase);
  const actor = getJourneyActorLabel(journey, qaCase);
  const displayName = getCaseDisplayName(qaCase, actor);
  const reviewState = reviewStateLabels[scenario.reviewStatus] ?? scenario.reviewStatus ?? '';
  const fallback = {
    category: 'Flow',
    proofPoint: phase.expected?.[0] ?? 'Pastikan layar ini tetap terasa konsisten dengan flow bisnis di fase ini.',
    summary: phase.summary,
    title: `${actor} membuka ${humanizeRouteLabel(screen.route)}`,
  };

  switch (screen.route) {
    case '/id':
      return {
        category: 'Masuk',
        proofPoint: 'Switch bahasa, copy onboarding, dan CTA awal harus rapi sebelum user lanjut menjelajah.',
        summary:
          'Landing Indonesia menjadi titik masuk utama saat visitor mulai memahami produk dan menyiapkan langkah berikutnya.',
        title: `${actor} masuk lewat entry Indonesia`,
      };
    case '/en':
      return {
        category: 'Masuk',
        proofPoint: 'Versi bahasa Inggris harus setara dengan entry Indonesia dan tidak memecah flow onboarding.',
        summary:
          'Visitor melihat entry berbahasa Inggris untuk memastikan locale switching tetap aman di layar pertama.',
        title: `${actor} berpindah ke entry Inggris`,
      };
    case '/id/home':
      return {
        category: 'Discovery',
        proofPoint: 'Hero, CTA, dan section discovery harus ter-hydrate penuh tanpa fallback state yang aneh.',
        summary:
          'Beranda publik memperkenalkan value proposition, shortcut kategori, dan pintu masuk ke katalog layanan.',
        title: `${actor} melihat beranda publik`,
      };
    case '/id/explore':
      return {
        category: 'Discovery',
        proofPoint: 'Kartu profesional dan layanan acuan harus konsisten dengan seed backend yang sama.',
        summary:
          'Halaman explore membantu user membandingkan opsi layanan dan profesional sebelum memilih flow yang tepat.',
        title: `${actor} menjelajah halaman explore`,
      };
    case '/id/services':
      return {
        category: 'Discovery',
        proofPoint: 'Daftar layanan harus terasa hidup, mudah dipindai, dan selaras dengan mode layanan yang di-seed.',
        summary: 'Katalog layanan publik menjadi tempat user memvalidasi apakah layanan yang dicari memang tersedia.',
        title: `${actor} membuka katalog layanan`,
      };
    case '/id/p/clara-wijaya':
      return {
        category: 'Trust',
        proofPoint: 'Trust badge, layanan unggulan, dan CTA booking harus membuat keputusan user terasa aman.',
        summary: 'Profil Clara Wijaya memperlihatkan kualitas profesional yang siap dipesan lewat surface publik.',
        title: `${actor} menilai profil Clara Wijaya`,
      };
    case '/id/s/konsultasi-laktasi':
      return {
        category: 'Intent',
        proofPoint:
          'Mode layanan, booking flow, dan jalur ke profesional harus saling mendukung tanpa copy yang bentrok.',
        summary:
          'Detail layanan Konsultasi Laktasi membantu user memastikan layanan ini memang cocok sebelum lanjut order.',
        title: `${actor} membaca detail layanan Konsultasi Laktasi`,
      };
    case '/id/profile':
      return {
        category: 'Akun',
        proofPoint: 'Data identitas, preferensi, dan state session harus langsung sinkron setelah login.',
        summary: 'Layar profil memastikan akun customer yang sedang dipakai memang pulih dari backend seed yang benar.',
        title: `${displayName} membuka profil customer`,
      };
    case '/id/notifications':
      return {
        category: 'Monitoring',
        proofPoint: 'Badge unread dan urutan notifikasi harus sejalan dengan konteks appointment yang sedang diuji.',
        summary: 'Halaman notifikasi memperlihatkan apakah alert operasional masih menunggu perhatian customer.',
        title: `${displayName} meninjau notifikasi appointment`,
      };
    case '/id/appointments':
      if (screen.caseId === 'CUS-02') {
        return {
          category: 'Monitoring',
          proofPoint: 'State requested harus dominan dan next step ke approval profesional harus terbaca jelas.',
          summary: 'Customer melihat daftar order yang masih menunggu tindak lanjut dari pihak profesional.',
          title: `${displayName} melihat daftar appointment requested`,
        };
      }

      if (screen.caseId === 'CUS-03') {
        return {
          category: 'History',
          proofPoint: 'Riwayat completed dan cancelled harus tetap mudah dipahami walau flow sudah tertutup.',
          summary: 'Layar ini menjadi pusat riwayat order untuk memahami journey yang sudah selesai atau dibatalkan.',
          title: `${displayName} membuka riwayat appointment`,
        };
      }

      return {
        category: 'Monitoring',
        proofPoint: 'Appointment aktif, lampau, dan pembanding harus tetap rapi dalam satu daftar customer.',
        summary: 'Daftar appointment menolong customer memilih order yang sedang berjalan untuk dipantau lebih lanjut.',
        title: `${displayName} melihat daftar appointment aktif`,
      };
    case '/id/appointments/apt-005':
      return {
        category: 'Appointment',
        proofPoint: 'Status layanan berjalan, jadwal, dan CTA lanjutan harus tetap koheren untuk order aktif.',
        summary:
          'Detail appointment aktif menjadi pusat referensi saat customer mengecek progres order yang sedang berlangsung.',
        title: `${displayName} membuka detail appointment aktif`,
      };
    case '/id/activity/apt-005':
      return {
        category: 'Aktivitas',
        proofPoint: 'Riwayat chat seed dan aktivitas order harus muncul utuh agar komunikasi terasa berlanjut.',
        summary: 'Screen activity memperlihatkan percakapan dan jejak kerja sama antara customer dan profesional.',
        title: `${displayName} memantau chat dan aktivitas layanan`,
      };
    case '/id/appointments/apt-004':
      return {
        category: 'Appointment',
        proofPoint:
          'Order pembanding tetap harus terbaca jelas agar customer tidak kehilangan konteks antar appointment.',
        summary:
          'Detail appointment pembanding dipakai untuk memastikan lebih dari satu journey bisa dibuka tanpa konflik UI.',
        title: `${displayName} membuka appointment pembanding`,
      };
    case '/id/appointments/seed-qa-ibu-nadia-requested':
      return {
        category: 'Requested',
        proofPoint:
          'Copy requested, langkah berikutnya, dan ekspektasi approval harus sepenuhnya cocok dengan backend state.',
        summary:
          'Detail order requested membantu customer memahami bahwa permintaan layanan sudah masuk tetapi belum disetujui.',
        title: `${displayName} melihat detail order requested`,
      };
    case '/id/appointments/seed-qa-mr-hendra-completed':
      return {
        category: 'History',
        proofPoint: 'Timeline selesai, hasil layanan, dan status akhir harus tetap solid setelah refresh.',
        summary: 'Appointment completed menjadi bukti bahwa journey selesai masih bisa dibaca kembali dengan tenang.',
        title: `${displayName} membaca detail order completed`,
      };
    case '/id/appointments/seed-qa-mr-hendra-cancelled':
      return {
        category: 'History',
        proofPoint: 'Alasan batal dan timeline penutupan harus jelas agar customer paham kenapa order tidak lanjut.',
        summary: 'Appointment cancelled memastikan status penutupan order punya narasi yang tetap rapi dan informatif.',
        title: `${displayName} membaca detail order cancelled`,
      };
    case '/id/for-professionals/dashboard':
      return {
        category: 'Portal',
        proofPoint: 'Status review, warning kesiapan, dan hydration portal harus terbaca dalam beberapa detik pertama.',
        summary: `Dashboard utama memperlihatkan posisi akun profesional saat ini${reviewState ? `, yaitu ${reviewState}` : ''}.`,
        title: `${displayName} membuka dashboard profesional${reviewState ? ` (${reviewState})` : ''}`,
      };
    case '/id/for-professionals/dashboard/services':
      return {
        category: 'Portal',
        proofPoint:
          scenario.servicesReady === false
            ? 'Layanan kosong dan prompt onboarding harus tetap terlihat jelas.'
            : 'Konfigurasi layanan harus siap dibaca dan tidak kehilangan state setelah refresh.',
        summary:
          scenario.servicesReady === false
            ? 'Profesional melihat area layanan yang masih belum lengkap sehingga onboarding gap terlihat nyata.'
            : 'Area layanan menunjukkan apakah konfigurasi jasa sudah cukup siap untuk review atau publish.',
        title: `${displayName} mengecek konfigurasi layanan`,
      };
    case '/id/for-professionals/dashboard/coverage':
      return {
        category: 'Portal',
        proofPoint:
          scenario.coverageReady === false
            ? 'Area cakupan kosong harus tetap ditandai sebagai gap onboarding.'
            : 'Cakupan layanan yang siap harus bisa dibaca dan diubah tanpa regressi visual.',
        summary:
          scenario.coverageReady === false
            ? 'Screen coverage menunjukkan bahwa area layanan masih belum lengkap dan akun belum siap maju.'
            : 'Screen coverage memperlihatkan area operasi profesional yang akan memengaruhi visibilitas layanan.',
        title: `${displayName} meninjau area cakupan layanan`,
      };
    case '/id/for-professionals/dashboard/overview':
      return {
        category: 'Review',
        proofPoint: 'Gate review, warning, dan aksi yang boleh atau tidak boleh dilakukan harus terasa tegas.',
        summary:
          'Overview review membantu profesional memahami apakah akun sedang siap review, submitted, atau masih tertahan.',
        title: `${displayName} membaca status review portal`,
      };
    case '/id/for-professionals/dashboard/portfolio':
      return {
        category: 'Review',
        proofPoint: 'Perubahan portofolio harus terasa sebagai bagian dari flow revisi sebelum resubmit.',
        summary: 'Portofolio menjadi layar bukti saat profesional memperbaiki materi yang diminta admin.',
        title: `${displayName} memperbarui portofolio revisi`,
      };
    case '/id/for-professionals/dashboard/requests':
      return {
        category: 'Portal',
        proofPoint: 'Permintaan masuk dan konteks pelayanan harus tetap sinkron dengan status akun profesional.',
        summary:
          'Layar requests memperlihatkan apakah profesional yang sudah live siap menerima atau meninjau permintaan customer.',
        title: `${displayName} memantau permintaan layanan`,
      };
    case '/id/for-professionals/dashboard/trust':
      return {
        category: 'Review',
        proofPoint:
          'Outcome verified atau published harus mudah dibaca dan meyakinkan profesional untuk langkah berikutnya.',
        summary:
          'Surface trust mengikat status review, sinyal kualitas, dan kesiapan akun menuju publish atau live operation.',
        title: `${displayName} menilai trust dan outcome review`,
      };
    case '/admin/support':
      return {
        category: 'Ops',
        proofPoint: 'Ticket urgent, high, dan normal harus langsung terbaca sebagai prioritas yang berbeda.',
        summary: 'Support desk menjadi command center untuk memantau kasus customer yang membutuhkan respon cepat.',
        title: `${actor} membuka support desk`,
      };
    case '/admin/professionals':
      return {
        category: 'Review',
        proofPoint: 'Antrian submitted dan changes requested harus cukup jelas untuk memandu keputusan admin.',
        summary: 'Console profesional dipakai admin untuk memeriksa status review dan mengambil keputusan moderation.',
        title: `${actor} meninjau antrian review profesional`,
      };
    case '/admin/customers':
      return {
        category: 'Ops',
        proofPoint: 'Baris customer dan konteks order terhubung harus tetap sinkron di layar operasional.',
        summary: 'Modul customer membantu admin ops memetakan siapa yang terkait dengan isu layanan tertentu.',
        title: `${actor} membuka modul customer`,
      };
    case '/admin/appointments':
      return {
        category: 'Ops',
        proofPoint:
          'Status booking, pembayaran, dan fulfillment harus mudah dipindai sebagai konteks operasional harian.',
        summary:
          'Modul appointment menjadi pusat kontrol admin saat meninjau order yang perlu intervensi atau tindak lanjut.',
        title: `${actor} memantau modul appointment`,
      };
    case '/admin/services':
      return {
        category: 'Katalog',
        proofPoint: 'Edit tabel level baris harus tetap terlihat aman dan tidak merusak konteks katalog.',
        summary: 'Tabel layanan dipakai admin katalog untuk mengelola service yang muncul ke surface publik.',
        title: `${actor} mengelola tabel layanan`,
      };
    case '/admin/studio':
      return {
        category: 'Katalog',
        proofPoint: 'Studio harus terasa sebagai area editing yang terhubung ke katalog publik, bukan layar terpisah.',
        summary: 'Studio membantu admin menyelaraskan konten dan detail katalog sebelum user publik melihat hasilnya.',
        title: `${actor} membuka studio katalog`,
      };
    default:
      return fallback;
  }
};

const buildPhaseStoryboardScreens = (phase, journey) => {
  const caseIndex = new Map(phase.caseIds.map((caseId, index) => [caseId, index]));
  const routeIndex = new Map(phase.routes.map((route, index) => [route, index]));
  const caseById = new Map(journey.cases.map((qaCase) => [qaCase.caseId, qaCase]));
  const caseTitleById = new Map(
    journey.cases.map((qaCase) => [qaCase.caseId, qaCase.seedTitleId ?? qaCase.title ?? qaCase.caseId]),
  );

  return journey.screenshots
    .filter((screenshot) => {
      const matchesCase = phase.caseIds.length === 0 ? true : phase.caseIds.includes(screenshot.caseId);
      const matchesRoute = phase.routes.length === 0 ? true : phase.routes.includes(screenshot.route);
      return matchesCase && matchesRoute;
    })
    .sort((left, right) => {
      const leftCaseIndex = caseIndex.get(left.caseId) ?? Number.MAX_SAFE_INTEGER;
      const rightCaseIndex = caseIndex.get(right.caseId) ?? Number.MAX_SAFE_INTEGER;

      if (leftCaseIndex !== rightCaseIndex) {
        return leftCaseIndex - rightCaseIndex;
      }

      const leftRouteIndex = routeIndex.get(left.route) ?? Number.MAX_SAFE_INTEGER;
      const rightRouteIndex = routeIndex.get(right.route) ?? Number.MAX_SAFE_INTEGER;

      if (leftRouteIndex !== rightRouteIndex) {
        return leftRouteIndex - rightRouteIndex;
      }

      return `${left.caption}`.localeCompare(`${right.caption}`);
    })
    .map((screenshot, index) => ({
      ...screenshot,
      caseTitle: caseTitleById.get(screenshot.caseId) ?? screenshot.caseId,
      sourceCase: caseById.get(screenshot.caseId),
      routeLabel: humanizeRouteLabel(screenshot.route),
      screenIndex: index + 1,
    }));
};

const renderPhaseStoryboard = (phase, journey) => {
  const screens = buildPhaseStoryboardScreens(phase, journey);

  if (screens.length === 0) {
    return `
      <section class="journey-storyboard">
        <div class="journey-storyboard-header">
          <p class="detail-label">Storyboard layar</p>
          <span class="journey-phase-count">0 layar</span>
        </div>
        <p class="empty-state">Belum ada screenshot yang bisa dipetakan ke fase ini.</p>
      </section>
    `;
  }

  return `
    <section class="journey-storyboard">
      <div class="journey-storyboard-header">
        <p class="detail-label">Storyboard layar</p>
        <span class="journey-phase-count">${screens.length} layar</span>
      </div>
      <div class="storyboard-grid">
        ${screens
          .map((screen) => {
            const narrative = buildStoryboardNarrative(screen, phase, journey);

            return `
              <article class="storyboard-card">
                <a class="storyboard-media" href="${escapeHtml(screen.path)}" target="_blank" rel="noreferrer">
                  <img src="${escapeHtml(screen.path)}" alt="${escapeHtml(screen.caption)}" loading="lazy" />
                </a>
                <div class="storyboard-body">
                  <div class="storyboard-topline">
                    <div class="storyboard-chip-row">
                      <span class="storyboard-step">Layar ${screen.screenIndex}</span>
                      <span class="storyboard-category">${escapeHtml(narrative.category)}</span>
                    </div>
                    <span class="case-id">${escapeHtml(screen.caseId)}</span>
                  </div>
                  <h5>${escapeHtml(narrative.title)}</h5>
                  <p class="storyboard-copy">${escapeHtml(narrative.summary)}</p>
                  <p class="storyboard-proof">Yang harus terasa benar: ${escapeHtml(narrative.proofPoint)}</p>
                  <p class="storyboard-meta">Fase journal: ${escapeHtml(phase.title)}</p>
                  <p class="storyboard-meta">Route: <code>${escapeHtml(screen.route ?? 'n/a')}</code></p>
                  <p class="storyboard-meta">
                    Source case:
                    <a href="#case-${escapeHtml(screen.caseId)}">${escapeHtml(screen.caseTitle)}</a>
                  </p>
                </div>
              </article>
            `;
          })
          .join('')}
      </div>
    </section>
  `;
};

const renderJourneyPhase = (phase, index, journey) => `
  <article class="journey-phase">
    <div class="journey-phase-index">${index + 1}</div>
    <div class="journey-phase-body">
      <h4>${escapeHtml(phase.title)}</h4>
      <p class="journey-phase-copy">${escapeHtml(phase.summary)}</p>
      ${renderPhaseStoryboard(phase, journey)}
      <details class="phase-notes">
        <summary class="phase-notes-summary">
          <span>Checklist fase dan detail teknis</span>
          <span class="journey-phase-count">${escapeHtml(String(phase.evidenceCount))} bukti</span>
        </summary>
        <div class="journey-phase-grid">
          <section class="journey-phase-block">
            <p class="detail-label">Case pendukung</p>
            ${renderCaseLinkList(phase.cases)}
          </section>
          <section class="journey-phase-block">
            <p class="detail-label">Route yang dilewati</p>
            ${renderRouteList(phase.routes)}
          </section>
        </div>
        <section class="journey-phase-block journey-phase-block-wide">
          <p class="detail-label">Yang harus dicek</p>
          ${renderBulletList(phase.expected)}
        </section>
        <p class="journey-phase-meta">Total bukti layar di fase ini: ${escapeHtml(String(phase.evidenceCount))}</p>
      </details>
    </div>
  </article>
`;

const renderJourneyCard = (journey) => `
  <article class="journey-card" id="journey-${escapeHtml(journey.id)}">
    <div class="journey-card-head">
      <div class="journey-card-copy">
        <p class="eyebrow">${escapeHtml(journey.audience)} journal</p>
        <h3>${escapeHtml(journey.title)}</h3>
        <p class="journey-summary">${escapeHtml(journey.whyItMatters)}</p>
      </div>
      <div class="journey-summary-strip">
        <div class="journey-meta-card">
          <span class="detail-label">Persona</span>
          <strong>${escapeHtml(journey.persona)}</strong>
        </div>
        <div class="journey-meta-card">
          <span class="detail-label">Intent utama</span>
          <strong>${escapeHtml(journey.serviceLabel)}</strong>
        </div>
        <div class="journey-meta-card">
          <span class="detail-label">Outcome akhir</span>
          <strong>${escapeHtml(journey.outcome)}</strong>
        </div>
      </div>
      <div class="journey-inline-facts">
        <span class="chip">Langkah besar: <strong>${escapeHtml(String(journey.phases.length))}</strong></span>
        <span class="chip">Layar: <strong>${escapeHtml(String(journey.screenshots.length))}</strong></span>
        <span class="chip">Case: <strong>${escapeHtml(String(journey.caseCount))}</strong></span>
      </div>
    </div>
    <section class="journey-phase-list">
      <div class="journey-phase-header">
        <h4>Flow dari awal sampai akhir</h4>
        <span class="journey-phase-count">${journey.phases.length} langkah besar</span>
      </div>
      <div class="journey-phase-stack">
        ${journey.phases.map((phase, index) => renderJourneyPhase(phase, index, journey)).join('')}
      </div>
    </section>
    <details class="journey-notes">
      <summary class="journey-notes-summary">
        <div>
          <p class="eyebrow">QA Notes</p>
          <h4>Checklist, mapping case, dan referensi teknis</h4>
        </div>
        <span class="surface-count">Buka detail</span>
      </summary>
      <div class="journey-overview-grid">
        <section class="detail-block">
          <p class="detail-label">Tujuan QA</p>
          ${renderBulletList(journey.qaGoals)}
        </section>
        <section class="detail-block">
          <p class="detail-label">Case yang mengisi journal ini</p>
          ${renderCaseLinkList(journey.cases)}
        </section>
        <section class="detail-block">
          <p class="detail-label">Status run yang tercakup</p>
          <div class="chip-row">
            ${renderStatusPills(journey.statuses) || '<span class="empty-state">No status summary.</span>'}
          </div>
        </section>
        <section class="detail-block">
          <p class="detail-label">Fokus fitur</p>
          <div class="chip-row">
            ${renderTagChips(journey.tags, 'feature-chip') || '<span class="empty-state">No tags.</span>'}
          </div>
        </section>
        <section class="detail-block detail-block-wide">
          <p class="detail-label">Seluruh route end-to-end</p>
          ${renderRouteList(journey.routes)}
        </section>
        <section class="detail-block detail-block-wide">
          <p class="detail-label">Seed references</p>
          ${renderReferenceList(journey.references)}
        </section>
      </div>
    </details>
  </article>
`;

const renderJourneySection = (journeys = []) => {
  const audienceBuckets = new Map(journeyAudienceOrder.map((audience) => [audience, []]));
  const audienceDescriptions = {
    admin: 'Operasional dan support flow yang menjaga katalog, moderation, dan penyelesaian masalah.',
    customer: 'Cerita customer dari niat order, proses booking, sampai monitoring history dan hasil akhir layanan.',
    professional: 'Perjalanan professional mengelola profil, service, dan status review sampai siap menerima order.',
    public: 'Flow visitor sebelum login saat menjelajah layanan, profesional, dan entry point utama produk.',
  };

  for (const journey of journeys) {
    if (!audienceBuckets.has(journey.audience)) {
      audienceBuckets.set(journey.audience, []);
    }

    audienceBuckets.get(journey.audience).push(journey);
  }

  return [...audienceBuckets.entries()]
    .filter(([, groupedJourneys]) => groupedJourneys.length > 0)
    .map(
      ([audience, groupedJourneys]) => `
        <section class="journey-group" id="journey-group-${escapeHtml(audience)}">
          <div class="journey-group-header">
            <div>
              <p class="eyebrow">End-to-end journals</p>
              <h2>${escapeHtml(audience.charAt(0).toUpperCase() + audience.slice(1))} Journeys</h2>
              <p class="section-copy">${escapeHtml(audienceDescriptions[audience] ?? '')}</p>
            </div>
            <span class="surface-count">${groupedJourneys.length} journal${groupedJourneys.length === 1 ? '' : 's'}</span>
          </div>
          <div class="journey-grid">
            ${groupedJourneys.map((journey) => renderJourneyCard(journey)).join('')}
          </div>
        </section>
      `,
    )
    .join('');
};

const renderScreenshots = (screenshots = []) => {
  if (screenshots.length === 0) {
    return '<p class="empty-state">No screenshot attachments were found for this case.</p>';
  }

  return `
    <div class="shot-grid">
      ${screenshots
        .map(
          (screenshot) => `
            <figure class="shot-card">
              <a href="${escapeHtml(screenshot.path)}" target="_blank" rel="noreferrer">
                <img src="${escapeHtml(screenshot.path)}" alt="${escapeHtml(screenshot.caption)}" loading="lazy" />
              </a>
              <figcaption>
                <strong>${escapeHtml(screenshot.route ?? screenshot.caption)}</strong>
                <span>${escapeHtml(screenshot.caption)}</span>
              </figcaption>
            </figure>
          `,
        )
        .join('')}
    </div>
  `;
};

const renderCaseCard = (qaCase) => `
  <details class="case-card case-item" id="case-${escapeHtml(qaCase.caseId)}" data-case-id="${escapeHtml(qaCase.caseId)}" data-status="${escapeHtml(qaCase.status)}" data-surface="${escapeHtml(qaCase.metadata.surface ?? 'unknown')}">
    <summary class="case-summary">
      <div class="case-summary-main">
        <span class="case-id">${escapeHtml(qaCase.caseId)}</span>
        <div class="case-heading">
          <h3>${escapeHtml(qaCase.seedTitleId ?? qaCase.title)}</h3>
          ${
            qaCase.seedTitleId && qaCase.seedTitleEn
              ? `<p class="case-subtitle">${escapeHtml(qaCase.seedTitleEn)}</p>`
              : ''
          }
        </div>
      </div>
      <div class="case-summary-side">
        <span class="status-badge status-${escapeHtml(qaCase.status)}">${escapeHtml(qaCase.status)}</span>
        <span class="case-summary-meta">${escapeHtml(qaCase.metadata.surface ?? 'unknown')}</span>
      </div>
    </summary>
    <div class="case-body">
      <p class="case-meta">
        <span>Persona: ${escapeHtml(qaCase.metadata.persona ?? 'n/a')}</span>
        <span>Duration: ${escapeHtml(qaCase.duration)}</span>
        ${qaCase.metadata.reviewStatus ? `<span>Review status: ${escapeHtml(qaCase.metadata.reviewStatus)}</span>` : ''}
      </p>
      ${
        qaCase.login
          ? `<p class="case-meta"><span>Login route: ${escapeHtml(qaCase.login.route ?? 'n/a')}</span><span>Identifier: ${escapeHtml(qaCase.login.identifier ?? 'n/a')}</span></p>`
          : ''
      }
      <div class="case-content-grid">
        <section class="detail-block">
          <p class="detail-label">Fokus fitur</p>
          <div class="chip-row">
            ${renderTagChips(qaCase.tags, 'feature-chip') || '<span class="empty-state">No feature tags found.</span>'}
          </div>
        </section>
        <section class="detail-block">
          <p class="detail-label">Checklist case</p>
          ${renderBulletList(qaCase.checksId.length > 0 ? qaCase.checksId : qaCase.checksEn)}
        </section>
        <section class="detail-block">
          <p class="detail-label">Possibility yang dicakup</p>
          ${renderBulletList(qaCase.possibilities)}
        </section>
        <section class="detail-block">
          <p class="detail-label">Seed references</p>
          ${renderReferenceList(qaCase.sampleEntityRefs)}
        </section>
        <section class="detail-block detail-block-wide">
          <p class="detail-label">Routes covered</p>
          ${renderRouteList(qaCase.metadata.routes)}
        </section>
      </div>
      <div class="evidence-block">
        <div class="link-row">
          <a href="${escapeHtml(qaCase.metadataPath)}" target="_blank" rel="noreferrer">Metadata JSON</a>
          ${
            qaCase.tracePath
              ? `<a href="${escapeHtml(qaCase.tracePath)}" target="_blank" rel="noreferrer">Trace ZIP</a>`
              : ''
          }
        </div>
        <p class="detail-label">Screenshots</p>
        ${renderScreenshots(qaCase.screenshots)}
      </div>
    </div>
  </details>
`;

const renderSurfaceSection = (surface, qaCases) => `
  <details class="surface-section" id="surface-${escapeHtml(surface)}">
    <summary class="surface-summary">
      <div>
        <p class="eyebrow">${escapeHtml(surfaceLabels[surface] ?? surface)}</p>
        <h2>${escapeHtml(surfaceLabels[surface] ?? surface)} Case Library</h2>
      </div>
      <span class="surface-count">${qaCases.length} case${qaCases.length === 1 ? '' : 's'}</span>
    </summary>
    <div class="case-grid">
      ${qaCases.map((qaCase) => renderCaseCard(qaCase)).join('')}
    </div>
  </details>
`;

if (!(await ensureExists(evidenceResultsDir))) {
  console.error('No evidence results directory found at `apps/frontend/allure-results`.');
  console.error('Run `npm run test:e2e:frontend:evidence:seeded` first.');
  process.exit(1);
}

await mkdir(summaryAssetsDir, { recursive: true });

let seedSummary = {};

try {
  seedSummary = await loadSeedQaSummary(repoRoot);
} catch (error) {
  console.warn(
    `Could not load seeded QA summary for atlas data: ${error instanceof Error ? error.message : String(error)}`,
  );
}

const [runEnvironment, rawManualQaCases] = await Promise.all([loadRunEnvironment(), readManualQaCases()]);
const manualQaCases = enrichManualQaCases(rawManualQaCases, seedSummary);
const coverageAtlas = buildCoverageAtlas(seedSummary);
const journeyJournals = buildJourneyJournals(manualQaCases);
const journeyCoverageAudit = buildJourneyCoverageAudit(manualQaCases, journeyJournals);

if (manualQaCases.length === 0) {
  console.error('No manual QA cases were found in `apps/frontend/allure-results`.');
  console.error('Run a manual QA evidence pass first, then generate the summary again.');
  process.exit(1);
}

if (journeyCoverageAudit.uncoveredCaseIds.length > 0) {
  console.error(
    `Journey coverage is incomplete. Missing case IDs: ${journeyCoverageAudit.uncoveredCaseIds.join(', ')}`,
  );
  process.exit(1);
}

const surfacesById = new Map(surfaceOrder.map((surface) => [surface, []]));

for (const qaCase of manualQaCases) {
  const surface = qaCase.metadata.surface ?? 'unknown';

  if (!surfacesById.has(surface)) {
    surfacesById.set(surface, []);
  }

  surfacesById.get(surface).push(qaCase);
}

const countsByStatus = manualQaCases.reduce((counts, qaCase) => {
  counts[qaCase.status] = (counts[qaCase.status] ?? 0) + 1;
  return counts;
}, {});
const summaryManifest = {
  generatedAt: new Date().toISOString(),
  totals: {
    cases: manualQaCases.length,
    journeys: journeyJournals.length,
    statuses: countsByStatus,
  },
  atlas: coverageAtlas,
  coverageAudit: journeyCoverageAudit,
  environment: runEnvironment,
  journeys: journeyJournals.map((journey) => ({
    audience: journey.audience,
    caseCount: journey.caseCount,
    caseIds: journey.caseIds,
    id: journey.id,
    outcome: journey.outcome,
    persona: journey.persona,
    phases: journey.phases.map((phase) => ({
      caseIds: phase.caseIds,
      evidenceCount: phase.evidenceCount,
      expected: phase.expected,
      routes: phase.routes,
      summary: phase.summary,
      title: phase.title,
    })),
    qaGoals: journey.qaGoals,
    routes: journey.routes,
    serviceLabel: journey.serviceLabel,
    statuses: journey.statuses,
    tags: journey.tags,
    title: journey.title,
    whyItMatters: journey.whyItMatters,
  })),
  cases: manualQaCases.map((qaCase) => ({
    caseId: qaCase.caseId,
    checksEn: qaCase.checksEn,
    checksId: qaCase.checksId,
    duration: qaCase.duration,
    login: qaCase.login,
    metadata: qaCase.metadata,
    metadataPath: qaCase.metadataPath,
    possibilities: qaCase.possibilities,
    sampleEntityRefs: qaCase.sampleEntityRefs,
    scenario: qaCase.scenario,
    seedTitleEn: qaCase.seedTitleEn,
    seedTitleId: qaCase.seedTitleId,
    startedAt: qaCase.startedAt,
    status: qaCase.status,
    screenshots: qaCase.screenshots,
    tags: qaCase.tags,
    title: qaCase.title,
    tracePath: qaCase.tracePath,
  })),
};

const sectionsMarkup = [...surfacesById.entries()]
  .filter(([, qaCases]) => qaCases.length > 0)
  .map(([surface, qaCases]) => renderSurfaceSection(surface, qaCases))
  .join('');
const statusNames = Object.keys(countsByStatus).sort((left, right) => left.localeCompare(right));
const shouldRenderStatusFilters = statusNames.length > 1;
const totalStoryboardScreens = journeyJournals.reduce((total, journey) => total + journey.screenshots.length, 0);
const journeySectionMarkup = renderJourneySection(journeyJournals);
const topNavigationMarkup = journeyAudienceOrder
  .filter((audience) => journeyJournals.some((journey) => journey.audience === audience))
  .map(
    (audience) =>
      `<a class="surface-link" href="#journey-group-${escapeHtml(audience)}">${escapeHtml(audience.charAt(0).toUpperCase() + audience.slice(1))}</a>`,
  )
  .join('');

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>BidanApp Manual QA Summary</title>
    <style>
      :root {
        --bg: #eef2f7;
        --panel: #ffffff;
        --panel-muted: #f8fafc;
        --border: #e2e8f0;
        --text: #0f172a;
        --muted: #475569;
        --muted-soft: #64748b;
        --accent: #2563eb;
        --accent-soft: #dbeafe;
        --accent-strong: #1d4ed8;
        --passed: #166534;
        --passed-bg: #dcfce7;
        --failed: #b91c1c;
        --failed-bg: #fee2e2;
        --skipped: #92400e;
        --skipped-bg: #fef3c7;
        --shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        color: var(--text);
        background: var(--bg);
      }
      a {
        color: var(--accent);
      }
      .page {
        width: min(1240px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 24px 0 48px;
      }
      .hero, .toolbar, .surface-section, .journey-group, .case-library-header {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 16px;
        box-shadow: var(--shadow);
      }
      .hero {
        padding: 28px;
        display: grid;
        gap: 18px;
      }
      .eyebrow {
        margin: 0 0 8px;
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted-soft);
        font-weight: 600;
      }
      h1, h2, h3, p { margin: 0; }
      h1 {
        font-size: clamp(1.9rem, 3.1vw, 2.6rem);
        line-height: 1.1;
        max-width: 18ch;
      }
      .hero-copy {
        max-width: 56rem;
        color: var(--muted);
        line-height: 1.6;
        font-size: 1rem;
      }
      .hero-facts, .hero-links, .environment {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .hero-facts {
        align-items: center;
      }
      .env-pill, .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 10px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--panel-muted);
        color: var(--muted);
        font-size: 0.84rem;
      }
      .toolbar {
        margin-top: 16px;
        padding: 18px 20px;
        display: grid;
        gap: 14px;
        position: sticky;
        top: 12px;
        z-index: 8;
      }
      .journey-group {
        margin-top: 16px;
        padding: 22px;
        display: grid;
        gap: 18px;
      }
      .journey-group-header, .journey-phase-header {
        display: flex;
        flex-wrap: wrap;
        align-items: end;
        justify-content: space-between;
        gap: 12px;
      }
      .section-copy {
        max-width: 46rem;
        color: var(--muted);
        line-height: 1.6;
      }
      .journey-grid {
        display: grid;
        gap: 16px;
      }
      .journey-card {
        display: grid;
        gap: 18px;
        padding: 20px;
        border-radius: 14px;
        border: 1px solid var(--border);
        background: #fff;
      }
      .journey-card-head {
        display: grid;
        gap: 14px;
      }
      .journey-card-copy {
        display: grid;
        gap: 6px;
      }
      .journey-summary, .journey-phase-copy, .journey-phase-meta {
        color: var(--muted);
        line-height: 1.6;
      }
      .journey-summary-strip {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }
      .journey-inline-facts {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .journey-meta-grid, .journey-overview-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      .journey-meta-card {
        display: grid;
        gap: 6px;
        padding: 14px 16px;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: var(--panel-muted);
      }
      .journey-meta-card strong {
        font-size: 0.96rem;
        line-height: 1.5;
      }
      .journey-phase-list {
        display: grid;
        gap: 12px;
      }
      .journey-notes, .phase-notes {
        border: 1px solid var(--border);
        border-radius: 12px;
        background: var(--panel-muted);
      }
      .journey-notes-summary, .phase-notes-summary {
        list-style: none;
        cursor: pointer;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 16px;
      }
      .journey-notes-summary::-webkit-details-marker, .phase-notes-summary::-webkit-details-marker {
        display: none;
      }
      .journey-notes[open] .journey-notes-summary, .phase-notes[open] .phase-notes-summary {
        border-bottom: 1px solid var(--border);
      }
      .journey-notes .journey-overview-grid {
        padding: 16px;
      }
      .phase-notes .journey-phase-grid, .phase-notes .journey-phase-block-wide, .phase-notes .journey-phase-meta {
        margin: 0 16px 16px;
      }
      .journey-phase-stack {
        display: grid;
        gap: 12px;
      }
      .journey-phase {
        display: grid;
        gap: 12px;
        grid-template-columns: 40px minmax(0, 1fr);
        padding: 14px 16px;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: var(--panel-muted);
      }
      .journey-phase-index {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
        font-weight: 700;
      }
      .journey-phase-body {
        display: grid;
        gap: 10px;
      }
      .journey-storyboard {
        display: grid;
        gap: 12px;
      }
      .journey-storyboard-header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .storyboard-grid {
        display: grid;
        gap: 14px;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }
      .storyboard-card {
        overflow: hidden;
        border-radius: 14px;
        border: 1px solid var(--border);
        background: #fff;
        display: grid;
        min-width: 0;
      }
      .storyboard-media {
        display: block;
        background: #fff;
      }
      .storyboard-media img {
        display: block;
        width: 100%;
        aspect-ratio: 16 / 10;
        object-fit: cover;
        border-bottom: 1px solid var(--border);
      }
      .storyboard-body {
        display: grid;
        gap: 8px;
        padding: 14px 16px 16px;
      }
      .storyboard-topline {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .storyboard-chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .storyboard-step {
        display: inline-flex;
        align-items: center;
        padding: 6px 10px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent-strong);
        font-size: 0.82rem;
        font-weight: 600;
      }
      .storyboard-category {
        display: inline-flex;
        align-items: center;
        padding: 6px 10px;
        border-radius: 999px;
        background: #eef2ff;
        color: #3730a3;
        font-size: 0.82rem;
        font-weight: 600;
      }
      .storyboard-card h5 {
        margin: 0;
        font-size: 1rem;
        line-height: 1.4;
      }
      .storyboard-copy, .storyboard-meta {
        margin: 0;
        color: var(--muted);
        line-height: 1.55;
      }
      .storyboard-proof {
        margin: 0;
        color: var(--text);
        line-height: 1.55;
      }
      .journey-phase-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      .journey-phase-block {
        padding: 14px 16px;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: #fff;
        display: grid;
        gap: 8px;
      }
      .journey-phase-block-wide {
        margin-top: 2px;
      }
      .journey-phase h4, .journey-phase-list h4 {
        margin: 0;
        font-size: 1rem;
      }
      .journey-phase-count {
        color: var(--muted-soft);
        font-size: 0.92rem;
      }
      .detail-block {
        padding: 14px 16px;
        border-radius: 12px;
        background: var(--panel-muted);
        border: 1px solid var(--border);
        display: grid;
        gap: 8px;
      }
      .detail-label {
        margin: 0;
        color: var(--muted-soft);
        font-size: 0.82rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        font-weight: 600;
      }
      .toolbar-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        justify-content: space-between;
      }
      .surface-nav, .filter-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .surface-link, .filter-button {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: var(--panel-muted);
        color: var(--text);
        text-decoration: none;
        cursor: pointer;
        font-weight: 500;
      }
      .surface-link:hover, .filter-button:hover, .link-row a:hover {
        border-color: #cbd5e1;
        background: #fff;
      }
      .filter-button.is-active {
        background: var(--accent-soft);
        border-color: #bfdbfe;
        color: var(--accent);
      }
      .search-input {
        width: min(100%, 360px);
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: #fff;
        color: var(--text);
        font: inherit;
      }
      .case-library-header {
        margin-top: 16px;
        padding: 20px;
        display: grid;
        gap: 8px;
      }
      .surface-section {
        margin-top: 16px;
        padding: 0;
        overflow: hidden;
      }
      .surface-summary {
        list-style: none;
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        justify-content: space-between;
        align-items: center;
        padding: 18px 20px;
        cursor: pointer;
      }
      .surface-summary::-webkit-details-marker {
        display: none;
      }
      .surface-summary::after {
        content: '+';
        margin-left: auto;
        color: var(--accent-strong);
        font-size: 1.2rem;
        font-weight: 700;
      }
      .surface-section[open] .surface-summary {
        border-bottom: 1px solid var(--border);
      }
      .surface-section[open] .surface-summary::after {
        content: '-';
      }
      .surface-count {
        color: var(--muted);
      }
      .case-grid {
        display: grid;
        gap: 16px;
        padding: 20px;
      }
      .case-card {
        border-radius: 14px;
        background: #fff;
        border: 1px solid var(--border);
        overflow: hidden;
      }
      .case-summary {
        list-style: none;
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        justify-content: space-between;
        align-items: start;
        padding: 18px;
        cursor: pointer;
      }
      .case-summary::-webkit-details-marker {
        display: none;
      }
      .case-summary-main {
        display: grid;
        gap: 10px;
      }
      .case-summary-side {
        display: grid;
        gap: 8px;
        justify-items: end;
      }
      .case-summary-meta {
        color: var(--muted-soft);
        font-size: 0.88rem;
        text-transform: capitalize;
      }
      .case-body {
        display: grid;
        gap: 14px;
        padding: 0 18px 18px;
        border-top: 1px solid var(--border);
      }
      .case-heading {
        display: grid;
        gap: 4px;
      }
      .case-subtitle {
        color: var(--muted);
        font-size: 0.92rem;
      }
      .case-topline, .case-meta, .chip-row, .link-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .case-topline {
        justify-content: space-between;
      }
      .case-id {
        font-family: "SFMono-Regular", "Roboto Mono", "Menlo", monospace;
        font-size: 0.82rem;
        padding: 6px 10px;
        border-radius: 999px;
        background: var(--panel-muted);
        color: var(--muted);
      }
      .status-badge {
        padding: 6px 10px;
        border-radius: 999px;
        text-transform: capitalize;
        font-size: 0.82rem;
        border: 1px solid transparent;
        font-weight: 600;
      }
      .status-passed {
        background: var(--passed-bg);
        border-color: #bbf7d0;
        color: var(--passed);
      }
      .status-failed {
        background: var(--failed-bg);
        border-color: #fecaca;
        color: var(--failed);
      }
      .status-skipped {
        background: var(--skipped-bg);
        border-color: #fde68a;
        color: var(--skipped);
      }
      .case-card h3 {
        font-size: 1.2rem;
        line-height: 1.35;
      }
      .case-meta {
        color: var(--muted);
        font-size: 0.92rem;
      }
      .case-content-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      .compact-list {
        margin: 0;
        padding-left: 1.15rem;
        display: grid;
        gap: 6px;
        color: var(--muted);
        line-height: 1.55;
      }
      .compact-list code {
        color: var(--text);
        font-size: 0.92rem;
      }
      .detail-block-wide {
        grid-column: 1 / -1;
      }
      .feature-chip {
        background: #eff6ff;
        color: #1d4ed8;
        border-color: #bfdbfe;
      }
      .status-inline strong {
        color: inherit;
      }
      .status-inline-passed {
        background: var(--passed-bg);
        border-color: #bbf7d0;
        color: var(--passed);
      }
      .status-inline-failed {
        background: var(--failed-bg);
        border-color: #fecaca;
        color: var(--failed);
      }
      .status-inline-skipped {
        background: var(--skipped-bg);
        border-color: #fde68a;
        color: var(--skipped);
      }
      .detail-list {
        margin: 0;
        padding-left: 1.1rem;
        color: var(--muted);
        display: grid;
        gap: 8px;
        line-height: 1.55;
      }
      .detail-list-compact {
        gap: 6px;
        font-size: 0.94rem;
      }
      .link-row a {
        display: inline-flex;
        align-items: center;
        padding: 8px 10px;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: var(--panel-muted);
        color: var(--accent);
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 500;
      }
      .evidence-block {
        display: grid;
        gap: 12px;
        padding-top: 4px;
      }
      .shot-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      .shot-card {
        margin: 0;
        padding: 12px;
        border-radius: 12px;
        background: var(--panel-muted);
        border: 1px solid var(--border);
        display: grid;
        gap: 8px;
      }
      .shot-card a {
        display: block;
      }
      .shot-card img {
        display: block;
        width: 100%;
        aspect-ratio: 4 / 3;
        object-fit: cover;
        border-radius: 10px;
        border: 1px solid rgba(0, 0, 0, 0.06);
      }
      .shot-card figcaption {
        display: grid;
        gap: 4px;
        color: var(--muted);
        font-size: 0.88rem;
      }
      .empty-state {
        color: var(--muted-soft);
      }
      [hidden] {
        display: none !important;
      }
      html {
        scroll-behavior: smooth;
      }
      @media (min-width: 1040px) {
        .journey-grid {
          grid-template-columns: 1fr;
        }
        .case-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 720px) {
        .page {
          width: min(100vw - 20px, 1360px);
          padding-top: 16px;
        }
        .toolbar {
          position: static;
        }
        .hero, .toolbar, .surface-section, .journey-group, .case-library-header {
          border-radius: 14px;
        }
        .journey-phase {
          grid-template-columns: 1fr;
        }
        .surface-summary::after {
          margin-left: 0;
        }
        .case-summary-side {
          justify-items: start;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <div>
          <p class="eyebrow">BidanApp Storyboard</p>
          <h1>Manual QA storyboard for seeded end-to-end journeys.</h1>
        </div>
        <p class="hero-copy">
          Halaman ini difokuskan untuk membaca flow layar sejelas mungkin. Semua elemen yang tidak membantu memahami journey utama sudah disingkirkan dari halaman inti.
        </p>
        <div class="hero-facts">
          <span class="chip">Journeys <strong>${journeyJournals.length}</strong></span>
          <span class="chip">Cases <strong>${manualQaCases.length}</strong></span>
          <span class="chip">Storyboard Screens <strong>${totalStoryboardScreens}</strong></span>
          <span class="chip">Coverage <strong>${escapeHtml(journeyCoverageAudit.completeness)}</strong></span>
        </div>
        <div class="hero-links">
          ${topNavigationMarkup}
          <a class="surface-link" href="#case-library">Case Library</a>
        </div>
        <div class="environment">
          <span class="env-pill">Generated: ${escapeHtml(summaryManifest.generatedAt)}</span>
          ${runEnvironment.backendMode ? `<span class="env-pill">Backend: ${escapeHtml(runEnvironment.backendMode)}</span>` : ''}
        </div>
      </section>

      ${journeySectionMarkup}

      <section class="case-library-header" id="case-library">
        <p class="eyebrow">Case Library</p>
        <h2>Lampiran bukti per case saat butuh detail teknis.</h2>
        <p class="section-copy">
          Buka bagian ini hanya saat perlu trace, route, screenshot, atau metadata granular. Cerita utama tetap dibaca dari journey storyboard di atas.
        </p>
      </section>

      <section class="toolbar">
        <div class="toolbar-row">
          <div class="surface-nav">
            ${renderSurfaceNavigation(surfaceOrder.filter((surface) => (surfacesById.get(surface) ?? []).length > 0))}
          </div>
          <input class="search-input" id="case-search" type="search" placeholder="Search case id, persona, feature, or route" />
        </div>
        ${
          shouldRenderStatusFilters
            ? `
              <div class="toolbar-row">
                <div class="filter-actions" id="status-filters">
                  <button class="filter-button is-active" type="button" data-status-filter="all">All statuses</button>
                  ${statusNames
                    .map(
                      (status) =>
                        `<button class="filter-button" type="button" data-status-filter="${escapeHtml(status)}">${escapeHtml(status)}</button>`,
                    )
                    .join('')}
                </div>
              </div>
            `
            : ''
        }
      </section>

      ${sectionsMarkup}
    </main>
    <script>
      const cards = Array.from(document.querySelectorAll('.case-card'));
      const filterButtons = Array.from(document.querySelectorAll('[data-status-filter]'));
      const searchInput = document.getElementById('case-search');
      let activeStatus = 'all';

      const applyFilters = () => {
        const query = (searchInput?.value || '').trim().toLowerCase();

        for (const card of cards) {
          const matchesStatus = activeStatus === 'all' ? true : card.dataset.status === activeStatus;
          const haystack = [card.dataset.caseId, card.dataset.surface, card.textContent].join(' ').toLowerCase();
          const matchesQuery = !query || haystack.includes(query);
          const isVisible = matchesStatus && matchesQuery;
          card.hidden = !isVisible;
          if (isVisible && query) {
            card.open = true;
          }
        }

        for (const section of document.querySelectorAll('.surface-section')) {
          const hasVisibleCards = Array.from(section.querySelectorAll('.case-card')).some((card) => !card.hidden);
          section.hidden = !hasVisibleCards;
          if (hasVisibleCards && query) {
            section.open = true;
          }
        }
      };

      for (const button of filterButtons) {
        button.addEventListener('click', () => {
          activeStatus = button.dataset.statusFilter || 'all';
          for (const currentButton of filterButtons) {
            currentButton.classList.toggle('is-active', currentButton === button);
          }
          applyFilters();
        });
      }

      searchInput?.addEventListener('input', applyFilters);
      applyFilters();
    </script>
  </body>
</html>`;

await writeFile(resolve(summaryDir, 'index.html'), html, 'utf8');
await writeFile(resolve(summaryDir, 'manifest.json'), `${JSON.stringify(summaryManifest, null, 2)}\n`, 'utf8');

const summaryStats = await stat(resolve(summaryDir, 'index.html'));
console.log(`Manual QA summary generated at apps/frontend/manual-qa-summary/index.html (${summaryStats.size} bytes)`);
