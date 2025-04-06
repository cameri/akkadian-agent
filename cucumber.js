module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: ['tests/features/steps/common.ts', 'tests/features/steps/*.steps.ts'],
    paths: ['tests/features/*.feature'],
    format: ['@cucumber/pretty-formatter'],
  },
};
