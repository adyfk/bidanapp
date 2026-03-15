const fs = require('node:fs');
const path = require('node:path');

const sha = process.env.GITHUB_SHA || 'local';
const shortSha = sha.slice(0, 7);
const refName = process.env.GITHUB_REF_NAME || '';
const refType = process.env.GITHUB_REF_TYPE || '';
const serverUrl = process.env.GITHUB_SERVER_URL || '';
const repository = process.env.GITHUB_REPOSITORY || '';
const source = serverUrl && repository ? `${serverUrl}/${repository}` : '';
const created = new Date().toISOString();

const isReleaseTag = refType === 'tag' && /^v\d+\.\d+\.\d+$/.test(refName);
const appVersion = isReleaseTag ? refName : `main-${shortSha}`;
const imageTag = isReleaseTag ? refName : `main-${shortSha}`;

const metadata = {
  appVersion,
  created,
  imageTag,
  ociCreated: created,
  ociRevision: sha,
  ociSource: source,
  ociVersion: appVersion,
};

fs.mkdirSync(path.join(process.cwd(), '.artifacts'), { recursive: true });
fs.writeFileSync(
  path.join(process.cwd(), '.artifacts', 'build-metadata.json'),
  `${JSON.stringify(metadata, null, 2)}\n`,
);

for (const [key, value] of Object.entries({
  APP_VERSION: metadata.appVersion,
  IMAGE_TAG: metadata.imageTag,
  OCI_CREATED: metadata.ociCreated,
  OCI_REVISION: metadata.ociRevision,
  OCI_SOURCE: metadata.ociSource,
  OCI_VERSION: metadata.ociVersion,
})) {
  process.stdout.write(`${key}=${value}\n`);
}
