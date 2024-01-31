import compile from './poCompiler.js';
export default function js2po(table, options) {
  return compile(table, options);
}