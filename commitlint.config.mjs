export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 100],
    'type-enum': [
      2,
      'always',
      ['build', 'chore', 'ci', 'docs', 'feat', 'fix', 'ops', 'perf', 'refactor', 'release', 'revert', 'style', 'test'],
    ],
    // allow either lowercase or sentence case subjects so small capitalization
    // differences don't block useful commits (e.g. "feat: Implement ...").
    // This keeps some structure while being practical for contributors.
    'subject-case': [2, 'always', ['lower-case', 'sentence-case']],
  },
};
