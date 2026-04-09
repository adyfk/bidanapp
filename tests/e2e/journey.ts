import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  JourneyActionKind,
  JourneyAttachment,
  JourneyCategory,
  JourneyExpectation,
  JourneyNode,
  JourneySeedReference,
  JourneyStatus,
  JourneyUseCase,
} from '@marketplace/marketplace-core';
import { type Page, type TestInfo, type TestStepInfo, test } from '@playwright/test';

type BeginJourneyInput = {
  category: JourneyCategory;
  description?: string;
  id: string;
  preconditions: string[];
  persona?: JourneySeedReference['actor'];
  seed?: JourneySeedReference;
  title: string;
};

type CaptureJourneyStepInput = {
  actionKind?: JourneyActionKind;
  actionLabel?: string;
  assertions?: string[];
  description?: string;
  entityRefs?: string[];
  expectedResult: string;
  expectation?: JourneyExpectation;
  routeId?: string;
  screenId?: string;
  title: string;
};

type JourneyRuntime = {
  runId: string;
  runRoot: string;
};

type JourneySession = {
  startedAtMs: number;
  screenshotDir: string;
  testInfo: TestInfo;
  useCase: JourneyUseCase;
  useCaseDir: string;
};

const repoRoot = process.cwd();

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function toRepoRelative(filePath: string) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

function getJourneyRuntime(): JourneyRuntime {
  const runId = process.env.JOURNEY_RUN_ID ?? 'local-manual';
  const runRoot = process.env.JOURNEY_ARTIFACT_ROOT
    ? path.resolve(repoRoot, process.env.JOURNEY_ARTIFACT_ROOT)
    : path.join(repoRoot, 'artifacts', 'journeys', runId);

  return { runId, runRoot };
}

export async function beginJourney(testInfo: TestInfo, input: BeginJourneyInput): Promise<JourneySession> {
  const runtime = getJourneyRuntime();
  const useCaseDir = path.join(runtime.runRoot, input.id);
  const screenshotDir = path.join(useCaseDir, 'screenshots');
  const startedAtMs = Date.now();

  await ensureDir(screenshotDir);

  return {
    startedAtMs,
    screenshotDir,
    testInfo,
    useCase: {
      id: input.id,
      title: input.title,
      category: input.category,
      persona: input.persona ?? input.seed?.actor ?? 'visitor',
      description: input.description,
      sourceSpec: toRepoRelative(testInfo.file),
      preconditions: input.preconditions,
      seed: input.seed,
      status: 'passed',
      steps: [],
      nodes: [],
      edges: [],
      expectations: [],
      attachments: [],
    },
    useCaseDir,
  };
}

export async function captureJourneyStep(
  journey: JourneySession,
  page: Page,
  input: CaptureJourneyStepInput,
  action?: () => Promise<void>,
) {
  return test.step(input.title, async (testStep: TestStepInfo) => {
    const startedAtMs = Date.now();
    if (action) {
      await action();
    }

    const stepIndex = journey.useCase.steps.length + 1;
    const stepId = `${journey.useCase.id}-step-${String(stepIndex).padStart(2, '0')}`;
    const screenshotName = `${String(stepIndex).padStart(2, '0')}-${slugify(input.title)}.png`;
    const screenshotPath = path.join(journey.screenshotDir, screenshotName);

    await page.screenshot({ fullPage: true, path: screenshotPath });
    await testStep.attach(`${journey.useCase.id}-${stepIndex}-screenshot`, {
      contentType: 'image/png',
      path: screenshotPath,
    });
    const endedAtMs = Date.now();
    const viewport = page.viewportSize() ?? { height: 720, width: 1280 };

    const stepAttachments: JourneyAttachment[] = [
      {
        kind: 'screenshot',
        label: 'Step screenshot',
        mimeType: 'image/png',
        path: toRepoRelative(screenshotPath),
      },
    ];

    const step = {
      id: stepId,
      title: input.title,
      actionKind: input.actionKind ?? 'verify',
      actionLabel: input.actionLabel,
      description: input.description,
      screenId: input.screenId ?? input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      routeId: input.routeId ?? new URL(page.url()).pathname,
      url: page.url(),
      expectedResult: input.expectedResult,
      screenshotPath: toRepoRelative(screenshotPath),
      startedAt: new Date(startedAtMs).toISOString(),
      endedAt: new Date(endedAtMs).toISOString(),
      durationMs: endedAtMs - startedAtMs,
      offsetMsFromJourneyStart: startedAtMs - journey.startedAtMs,
      viewport,
      status: 'passed' satisfies JourneyStatus,
      assertions: input.assertions ?? [input.expectedResult],
      entityRefs: input.entityRefs ?? [],
      attachments: stepAttachments,
    };

    const node: JourneyNode = {
      id: stepId,
      label: input.title,
      screenshotPath: step.screenshotPath,
      stepIndex,
      title: input.title,
      url: step.url,
    };

    const previousNode = journey.useCase.nodes.at(-1);

    journey.useCase.steps.push(step);
    journey.useCase.nodes.push(node);
    if (previousNode) {
      journey.useCase.edges.push({
        id: `${previousNode.id}--${node.id}`,
        from: previousNode.id,
        to: node.id,
        actionLabel: input.actionLabel || input.title,
        expectedStateChange: input.expectedResult,
      });
    }
    if (input.expectation) {
      journey.useCase.expectations.push(input.expectation);
    }
  });
}

export async function completeJourney(
  journey: JourneySession,
  input: {
    status?: JourneyUseCase['status'];
  } = {},
) {
  journey.useCase.status = input.status ?? journey.useCase.status;

  const tracePath = journey.testInfo.outputPath('trace.zip');
  journey.useCase.tracePath = toRepoRelative(tracePath);
  journey.useCase.attachments.push({
    kind: 'trace',
    label: 'Playwright trace',
    mimeType: 'application/zip',
    path: journey.useCase.tracePath,
  });

  const videoPath = path.join(journey.testInfo.outputDir, 'video.webm');
  journey.useCase.videoPath = toRepoRelative(videoPath);
  journey.useCase.attachments.push({
    kind: 'video',
    label: 'Journey video',
    mimeType: 'video/webm',
    path: journey.useCase.videoPath,
  });

  const outputPath = path.join(journey.useCaseDir, 'journey.json');
  await fs.writeFile(outputPath, `${JSON.stringify(journey.useCase, null, 2)}\n`, 'utf8');
  await journey.testInfo.attach(`${journey.useCase.id}-manifest`, {
    body: Buffer.from(JSON.stringify(journey.useCase, null, 2)),
    contentType: 'application/json',
  });
}
