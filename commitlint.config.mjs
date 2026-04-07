import conventionalConfig from '@commitlint/config-conventional';

const allowedTypes = [
  'build',
  'chore',
  'ci',
  'docs',
  'feat',
  'fix',
  'ops',
  'perf',
  'refactor',
  'release',
  'revert',
  'style',
  'test',
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildPrefixPattern = (types) =>
  new RegExp(`^(?:${types.map(escapeRegex).join('|')})(?:\\([^)\\r\\n]+\\))?(?:!)?:\\s+.+$`);

const conventionalTypeEnum = conventionalConfig.prompt?.questions?.type?.enum ?? {};

export default {
  parserPreset: conventionalConfig.parserPreset,
  plugins: [
    {
      rules: {
        'prefix-only': (parsed, when = 'always', value = allowedTypes) => {
          const header = parsed.header?.trim() ?? '';
          const types = Array.isArray(value) && value.length > 0 ? value : allowedTypes;
          const isValid = buildPrefixPattern(types).test(header);

          return [
            when === 'always' ? isValid : !isValid,
            `header must start with an allowed prefix: ${types.join(', ')} (for example: "feat: ...")`,
          ];
        },
      },
    },
  ],
  prompt: {
    ...conventionalConfig.prompt,
    questions: {
      ...conventionalConfig.prompt?.questions,
      type: {
        ...conventionalConfig.prompt?.questions?.type,
        enum: {
          ...conventionalTypeEnum,
          ops: {
            description: 'Operational workflow or internal support/admin flow changes',
            title: 'Operations',
            emoji: '🧭',
          },
          release: {
            description: 'Release preparation or release metadata changes',
            title: 'Releases',
            emoji: '🚢',
          },
        },
      },
      subject: {
        ...conventionalConfig.prompt?.questions?.subject,
        description: 'Write the message freely after the prefix. Only the prefix format is enforced.',
      },
    },
  },
  rules: {
    'prefix-only': [2, 'always', allowedTypes],
  },
};
