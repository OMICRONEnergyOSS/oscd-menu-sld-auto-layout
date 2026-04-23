const filteredLogs = ['in dev mode', 'scheduled an update'];

export default /** @type {import("@web/test-runner").TestRunnerConfig} */ ({
  files: 'dist/**/*.spec.js',
  nodeResolve: {
    exportConditions: ['browser', 'development'],
  },
  filterBrowserLogs(log) {
    for (const arg of log.args) {
      if (typeof arg === 'string' && filteredLogs.some(text => arg.includes(text))) {
        return false;
      }
    }

    return true;
  },
  concurrentBrowsers: 2,
  concurrency: 1,
});