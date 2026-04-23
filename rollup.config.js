import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'oscd-menu-sld-auto-layout.ts',
  output: {
    sourcemap: true,
    format: 'es',
    dir: 'dist',
  },
  plugins: [typescript(), nodeResolve(), terser()],
};