const fs = require('node:fs');

const body = process.env.PR_BODY ?? readEventPayload()?.pull_request?.body ?? '';

const issueReferencePattern = /\b(?:Closes|Refs)\s+#\d+\b/i;

if (!issueReferencePattern.test(body)) {
  console.error('Pull request body must contain `Closes #<issue>` or `Refs #<issue>`.');
  process.exit(1);
}

console.log('Pull request body contains a valid issue reference.');

function readEventPayload() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(eventPath, 'utf8'));
}
