import po2js from './po2js.js';
import js2i18next from './js2i18next.js';
export default function po2i18next(fileContents, options) {
  var js = po2js(fileContents, options);
  return js2i18next(js, options);
}