import i18next2js from './i18next2js.js';
import compile from './poCompiler.js';
export default function i18next2po(locale, body) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var data = i18next2js(locale, body, options);
  return compile(data, options);
}