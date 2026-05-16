import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { input: 'src/cli/index', name: 'index' }
  ],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true,
  },
})
