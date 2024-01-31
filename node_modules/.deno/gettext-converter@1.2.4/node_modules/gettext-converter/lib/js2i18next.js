// inspired by https://github.com/i18next/i18next-gettext-converter/blob/master/src/lib/gettext2json.js
import { getPlurals } from './options.js'
import cldrConv from './cldrConv.js'
const FORMS = ['zero', 'one', 'two', 'few', 'many', 'other']

const isFuzzy = (translation) => !!translation.comments && translation.comments.flag === 'fuzzy'

const toArrayIfNeeded = (value, { splitNewLine }) => value.indexOf('\n') > -1 && splitNewLine ? value.split('\n') : value

const emptyOrObject = (key, value, options) => {
  if (options.skipUntranslated && !value) {
    // empty string or other falsey
    return {}
  }

  return {
    [key]: toArrayIfNeeded(value, options)
  }
}

const getI18nextPluralExtension = (ext, i) => {
  if (ext && ext.numbers && ext.numbers.length === 2) return i === 0 ? '' : '_plural'
  return `_${i}`
}

const getGettextValues = (value, locale, targetKey, options) => {
  const values = value.msgstr
  const plurals = getPlurals(options)
  const isPlural = !!value.msgid_plural

  if (!isPlural) return emptyOrObject(targetKey, values[0], options)

  const ext = plurals[locale.toLowerCase()] || plurals[locale.split(/_|-/)[0].toLowerCase()] || plurals.dev
  const gettextValues = {}

  for (let i = 0; i < values.length; i += 1) {
    let pluralSuffix = getI18nextPluralExtension(ext, i)
    if (options.compatibilityJSON === 'v4') {
      const cldrRule = cldrConv[locale] || cldrConv[locale.split(/-|_/)[0]]
      if (cldrRule && cldrRule.toCldr[pluralSuffix] !== undefined && FORMS[cldrRule.toCldr[pluralSuffix]]) {
        pluralSuffix = `_${FORMS[cldrRule.toCldr[pluralSuffix]]}`
      }
    }
    const pkey = targetKey + pluralSuffix
    Object.assign(gettextValues, emptyOrObject(pkey, values[i], options))
  }

  return gettextValues
}

export default function (js, options = {}) {
  const data = JSON.parse(JSON.stringify(js.translations))
  if (options.keyasareference) {
    const keys = []
    Object.keys(data).forEach((ctx) => {
      Object.keys(data[ctx]).forEach((key) => {
        if (data[ctx][key].comments && data[ctx][key].comments.reference) {
          data[ctx][key].comments.reference.split(/\r?\n|\r/).forEach((id) => {
            const x = data[ctx][key]
            data[ctx][id] = x

            if (
              options.skipUntranslated &&
              ((x.msgstr.length === 1 && !x.msgstr[0]) || isFuzzy(x))
            ) {
              return
            }

            if (x.msgstr[0] === '') x.msgstr[0] = x.msgid
            for (let i = 1; i < x.msgstr.length; i += 1) {
              if (x.msgstr[i] === '') x.msgstr[i] = x.msgid_plural
            }
            x.msgid = id
            if (id !== key) keys.push([ctx, key])
          })
        }
      })
    })
    keys.forEach((a) => {
      const c = a[0]
      const k = a[1]
      delete data[c][k]
    })
  }

  const json = {}
  const separator = options.keyseparator || '##'
  const ctxSeparator = options.ctxSeparator || '_'
  const locale = options.locale || (js.headers && js.headers.Language) || 'en'

  Object.keys(data).forEach((m) => {
    const context = data[m]
    Object.keys(context).forEach((key) => {
      let targetKey = key
      let appendTo = json

      if (key.length === 0) {
        // delete if msgid is empty.
        // this might be the header.
        delete context[key]
        return
      }

      if (options.skipUntranslated && isFuzzy(context[key])) {
        delete context[key]
        return
      }

      if (key.indexOf(separator) > -1) {
        const keys = key.split(separator)
        let x = 0

        while (keys[x] !== undefined && keys[x] !== null) {
          if (x < keys.length - 1) {
            appendTo[keys[x]] = appendTo[keys[x]] || {}
            appendTo = appendTo[keys[x]]
          } else {
            targetKey = keys[x]
          }
          x += 1
        }
      }

      if (m !== '' && !options.ignoreCtx) targetKey = `${targetKey}${ctxSeparator}${m}`

      if (options.persistMsgIdPlural) {
        // eslint-disable-next-line camelcase
        const _context$key = context[key]
        const msgid = _context$key.msgid
        // eslint-disable-next-line camelcase
        const msgid_plural = _context$key.msgid_plural
        // eslint-disable-next-line camelcase
        if (msgid_plural && msgid !== msgid_plural) targetKey = `${msgid}|#|${msgid_plural}`
      }

      const newValues = getGettextValues(context[key], locale, targetKey, options)
      Object.assign(appendTo, newValues)
    })
  })
  return json
}
