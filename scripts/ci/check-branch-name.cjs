const fs = require('node:fs');

const allowedPattern = /^(build|chore|ci|docs|feat|fix|ops|perf|refactor|revert|test)\/\d+-[a-z0-9]+(?:-[a-z0-9]+)*$/;

const branchName =
  process.env.BRANCH_NAME ||
  process.env.GITHUB_HEAD_REF ||
  readEventPayload()?.pull_request?.head?.ref ||
  process.env.GITHUB_REF_NAME ||
  '';

if (!branchName) {
  console.error('Branch name is required. Set BRANCH_NAME or run inside Forgejo Actions.');
  process.exit(1);
}

if (!allowedPattern.test(branchName)) {
  console.error(
    `Invalid branch name "${branchName}". Expected <type>/<issue-number>-<slug>, for example feat/128-chat-persistence.`,
  );
  process.exit(1);
}

console.log(`Branch name valid: ${branchName}`);

function readEventPayload() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(eventPath, 'utf8'));
}
