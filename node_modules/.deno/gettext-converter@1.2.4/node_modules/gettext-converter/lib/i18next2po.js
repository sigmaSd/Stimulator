// inspired by https://github.com/i18next/i18next-gettext-converter/blob/master/src/lib/json2gettext.js

import i18next2js from './i18next2js.js'
import compile from './poCompiler.js'

export default function i18next2po (locale, body, options = {}) {
  const data = i18next2js(locale, body, options)
  return compile(data, options)
}
