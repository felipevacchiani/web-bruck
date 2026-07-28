import nextConfig from 'eslint-config-next'

const config = [
  ...nextConfig,
  { ignores: ['.next/**', 'node_modules/**'] },
  {
    // React Compiler readiness rules, new in eslint-config-next 16 (this
    // project doesn't use the Compiler). Real findings, not enabled by
    // default at runtime — downgraded to warn so CI isn't blocked by a
    // wave of new findings from the Next 14→16 upgrade; see docs/PENDIENTES.md.
    rules: {
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
    },
  },
]

export default config
