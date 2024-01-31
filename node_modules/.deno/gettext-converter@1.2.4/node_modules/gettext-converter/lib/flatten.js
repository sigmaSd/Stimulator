// inspired by https://github.com/i18next/i18next-gettext-converter/blob/master/src/lib/flatten.js

import cldrConv from './cldrConv.js'
const FORMS = ['zero', 'one', 'two', 'few', 'many', 'other']

const regexIndexOf = (value, regex, startpos) => {
  const indexOf = value.substring(startpos || 0).search(regex)
  return indexOf >= 0 ? indexOf + (startpos || 0) : indexOf
}

export default function (input, {
  keyseparator = '##',
  ctxSeparator = '_',
  ignorePlurals,
  compatibilityJSON,
  language
} = {}, locale) {
  const flat = {}

  function handleOldFormat (appendTo, obj, parentKey) {
    Object.keys(obj || {}).forEach((m) => {
      let kv
      let key = parentKey
      let context = ''
      const value = obj[m]

      if (key.length > 0) {
        key = key + keyseparator + m
      } else {
        key = m
      } // get context if used

      let pluralIndex = key.indexOf('_plural')
      if (pluralIndex < 0) pluralIndex = regexIndexOf(key, /_\d+$/)
      let isPlural = pluralIndex > -1

      if (ignorePlurals) isPlural = false

      let number

      if (isPlural && key.indexOf('_plural') < 0) {
        number = parseInt(key.substring(pluralIndex + 1), 10)

        if (number === 1) isPlural = false

        key = key.substring(0, pluralIndex)
      } else if (key.indexOf('_plural') > -1) {
        number = 2
        key = key.substring(0, pluralIndex)
      }

      let ctxKey = key

      if (isPlural) {
        ctxKey = ctxKey.substring(0, pluralIndex)

        if (ctxKey.indexOf(ctxSeparator) > -1) {
          context = ctxKey.substring(ctxKey.lastIndexOf(ctxSeparator) + ctxSeparator.length, ctxKey.length)
        }
      } else if (key.indexOf(ctxSeparator) > -1) {
        context = ctxKey.substring(ctxKey.lastIndexOf(ctxSeparator) + ctxSeparator.length, ctxKey.length)
      } else {
        context = ''
      }

      if (context === key) context = ''
      if (context !== '') key = key.replace(ctxSeparator + context, '') // append or recurse

      let appendKey = key + context
      if (isPlural) appendKey = `${appendKey}_${number}`

      if (typeof value === 'string') {
        kv = {
          // id: key.replace(new RegExp(' ', 'g'), ''),
          key,
          value,
          isPlural,
          pluralNumber: isPlural ? number : 0,
          context
        }
        appendTo[appendKey] = kv
      } else if (Array.isArray(value)) {
        kv = {
          // id: key.replace(new RegExp(' ', 'g'), ''),
          key,
          value: value.join('\n'),
          isArray: true,
          isPlural,
          pluralNumber: isPlural ? number : 0,
          context
        }
        appendTo[appendKey] = kv
      } else {
        recurse(appendTo, value, key)
      }
    })
  }

  function handleNewFormat (appendTo, obj, parentKey) {
    Object.keys(obj).forEach((m) => {
      let kv
      let key = parentKey
      let context = ''
      const value = obj[m]

      if (key.length > 0) {
        key = key + keyseparator + m
      } else {
        key = m
      } // get context if used

      let pluralIndex = key.indexOf('_other')
      if (pluralIndex < 0) pluralIndex = regexIndexOf(key, new RegExp(`_(${FORMS.join('|')})$`))
      let isPlural = pluralIndex > -1

      const code = locale || language
      let cldrRule = cldrConv[code] || cldrConv[code.split(/-|_/)[0]]
      if (!cldrRule && locale && language) {
        cldrRule = cldrConv[language] || cldrConv[language.split(/-|_/)[0]]
      }
      if (!cldrRule) isPlural = false

      if (ignorePlurals) isPlural = false

      let form
      let number = 0
      if (isPlural && key.indexOf('_other') < 0) {
        form = key.substring(pluralIndex + 1)

        const oldSuffix = cldrRule.fromCldr[FORMS.indexOf(form)]
        if (!oldSuffix) {
          isPlural = false
        } else {
          number = parseInt(oldSuffix.substring(1), 10)
        }

        if (number === 1) isPlural = false

        key = key.substring(0, pluralIndex)
      } else if (key.indexOf('_other') > -1) {
        number = 2
        key = key.substring(0, pluralIndex)
        form = '_other'
      }

      let ctxKey = key

      if (isPlural) {
        ctxKey = ctxKey.substring(0, pluralIndex)

        if (ctxKey.indexOf(ctxSeparator) > -1) {
          context = ctxKey.substring(ctxKey.lastIndexOf(ctxSeparator) + ctxSeparator.length, ctxKey.length)
        }
      } else if (key.indexOf(ctxSeparator) > -1) {
        context = ctxKey.substring(ctxKey.lastIndexOf(ctxSeparator) + ctxSeparator.length, ctxKey.length)
      } else {
        context = ''
      }

      if (context === key) context = ''
      if (context !== '') key = key.replace(ctxSeparator + context, '') // append or recurse

      let appendKey = key + context
      if (isPlural) appendKey = `${appendKey}_${number}`

      if (typeof value === 'string') {
        kv = {
          // id: key.replace(new RegExp(' ', 'g'), ''),
          key,
          value,
          isPlural,
          pluralNumber: isPlural ? number : 0,
          context
        }
        appendTo[appendKey] = kv
      } else if (Array.isArray(value)) {
        kv = {
          // id: key.replace(new RegExp(' ', 'g'), ''),
          key,
          value: value.join('\n'),
          isArray: true,
          isPlural,
          pluralNumber: isPlural ? number : 0,
          context
        }
        appendTo[appendKey] = kv
      } else {
        recurse(appendTo, value, key)
      }
    })
  }

  function recurse (appendTo, obj, parentKey) {
    if (compatibilityJSON === 'v4') {
      handleNewFormat(appendTo, obj, parentKey)
    } else {
      handleOldFormat(appendTo, obj, parentKey)
    }
  }

  recurse(flat, input, '') // append plurals

  Object.keys(flat).forEach((m) => {
    const kv = flat[m]

    if (kv.isPlural) {
      if (!flat[kv.key + kv.context]) {
        flat[kv.key + kv.context] = {
          key: kv.key,
          context: kv.context
        }
      }

      const single = flat[kv.key + kv.context]

      if (single) {
        single.plurals = [...(single.plurals || []), kv]
        delete flat[m]
      }
    }
  })
  return flat
}
