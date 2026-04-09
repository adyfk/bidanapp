export type JourneyCategory = 'auth' | 'public' | 'customer' | 'professional' | 'admin' | 'support' | 'payments';

export type JourneyAttachmentKind = 'screenshot' | 'trace' | 'video' | 'json' | 'artifact';

export type JourneyStatus = 'passed' | 'failed' | 'skipped';

export type JourneyActor = 'visitor' | 'customer' | 'professional' | 'admin';

export type JourneyActionKind =
  | 'navigate'
  | 'verify'
  | 'submit'
  | 'mutate'
  | 'chat'
  | 'support'
  | 'payment'
  | 'review'
  | 'redirect';

export interface JourneyRunMeta {
  runId: string;
  createdAt: string;
  completedAt?: string;
  baseUrl: string;
  command: string;
  environment: 'ci' | 'local';
  artifactRoot: string;
  reportRoot: string;
  reportHref?: string;
}

export interface JourneySeedReference {
  actor: JourneyActor;
  credentialLabel: string;
  notes?: string;
}

export interface JourneyAttachment {
  kind: JourneyAttachmentKind;
  label: string;
  path: string;
  mimeType?: string;
}

export interface JourneyExpectation {
  summary: string;
  status: 'expected' | 'verified' | 'warning';
}

export interface JourneyStep {
  id: string;
  title: string;
  actionKind: JourneyActionKind;
  actionLabel?: string;
  description?: string;
  screenId: string;
  routeId: string;
  url: string;
  expectedResult: string;
  screenshotPath: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  offsetMsFromJourneyStart: number;
  viewport: {
    height: number;
    width: number;
  };
  status: JourneyStatus;
  assertions: string[];
  entityRefs: string[];
  attachments: JourneyAttachment[];
}

export interface JourneyNode {
  id: string;
  label: string;
  screenshotPath: string;
  stepIndex: number;
  title: string;
  url: string;
}

export interface JourneyEdge {
  id: string;
  from: string;
  to: string;
  actionLabel: string;
  expectedStateChange: string;
}

export interface JourneyUseCase {
  id: string;
  title: string;
  category: JourneyCategory;
  persona: JourneyActor;
  description?: string;
  sourceSpec: string;
  preconditions: string[];
  seed?: JourneySeedReference;
  status: JourneyStatus;
  steps: JourneyStep[];
  nodes: JourneyNode[];
  edges: JourneyEdge[];
  expectations: JourneyExpectation[];
  attachments: JourneyAttachment[];
  tracePath?: string;
  videoPath?: string;
}

export interface JourneyCoverageMatrix {
  admin: string[];
  auth: string[];
  customer: string[];
  payments: string[];
  professional: string[];
  public: string[];
  support: string[];
}

export interface JourneyManifest {
  meta: JourneyRunMeta;
  coverage: JourneyCoverageMatrix;
  useCases: JourneyUseCase[];
}
