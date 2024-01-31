// inspired by https://github.com/smhg/gettext-parser/blob/master/lib/pocompiler.js
import contentType from 'content-type'
import encoding from 'encoding'
import { HEADERS, formatCharset, compareMsgid, foldLine, generateHeader } from './shared.js'

/**
 * Handles header values, replaces or adds (if needed) a charset property
 * @param {Object} table Translation table to be compiled
 */
const handleCharset = (table) => {
  const ct = contentType.parse(table.headers['Content-Type'] || 'text/plain')

  const charset = formatCharset(table.charset || ct.parameters.charset || 'utf-8')

  // clean up content-type charset independently using fallback if missing
  if (ct.parameters.charset) {
    ct.parameters.charset = formatCharset(ct.parameters.charset)
  }

  table.charset = charset
  table.headers['Content-Type'] = contentType.format(ct)
}

/**
 * Converts a comments object to a comment string. The comment object is
 * in the form of {translator:'', reference: '', extracted: '', flag: '', previous:''}
 *
 * @param {Object} comments A comments object
 * @return {String} A comment string for the PO file
 */
const drawComments = (comments) => {
  const lines = []
  const types = [{
    key: 'translator',
    prefix: '# '
  }, {
    key: 'reference',
    prefix: '#: '
  }, {
    key: 'extracted',
    prefix: '#. '
  }, {
    key: 'flag',
    prefix: '#, '
  }, {
    key: 'previous',
    prefix: '#| '
  }]

  types.forEach(type => {
    if (!comments[type.key]) return

    comments[type.key].split(/\r?\n|\r/).forEach(line => {
      lines.push(`${type.prefix}${line}`)
    })
  })

  return lines.join('\n')
}

/**
 * Escapes and joins a key and a value for the PO string
 *
 * @param {String} key Key name
 * @param {String} value Key value
 * @return {String} Joined and escaped key-value pair
 */
const addPOString = (key = '', value = '', options) => {
  key = key.toString()

  // escape newlines and quotes
  value = value.toString()
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\t/g, '\\t')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')

  let lines = [value]

  if (options.foldLength > 0) {
    lines = foldLine(value, options.foldLength)
  }

  if (lines.length < 2) {
    return `${key} "${lines.shift() || ''}"`
  }

  return `${key} ""\n"${lines.join('"\n"')}"`
}

/**
 * Builds a PO string for a single translation object
 *
 * @param {Object} block Translation object
 * @param {Object} [override] Properties of this object will override `block` properties
 * @return {String} Translation string for a single object
 */
const drawBlock = (block, override = {}, options) => {
  const response = []
  const msgctxt = override.msgctxt || block.msgctxt
  const msgid = override.msgid || block.msgid
  const msgidPlural = override.msgid_plural || block.msgid_plural
  const msgstr = [].concat(override.msgstr || block.msgstr)
  let comments = override.comments || block.comments

  // add comments
  if (comments && (comments = drawComments(comments))) {
    response.push(comments)
  }

  if (msgctxt) {
    response.push(addPOString('msgctxt', msgctxt, options))
  }

  response.push(addPOString('msgid', msgid || '', options))

  if (msgidPlural) {
    response.push(addPOString('msgid_plural', msgidPlural, options))

    msgstr.forEach((msgstr, i) => {
      response.push(addPOString(`msgstr[${i}]`, msgstr || '', options))
    })

    if (msgstr.length === 0) {
      response.push(addPOString('msgstr[0]', '', options))
    }
  } else {
    response.push(addPOString('msgstr', msgstr[0] || '', options))
  }

  return response.join('\n')
}

/**
 * Compiles translation object into a PO object
 *
 * @return {String} Compiled PO object
 */
const compile = (table, options) => {
  const headerBlock = (table.translations[''] && table.translations['']['']) || {}
  let response = []

  Object.keys(table.translations).forEach(msgctxt => {
    if (typeof table.translations[msgctxt] !== 'object') return

    Object.keys(table.translations[msgctxt]).forEach(msgid => {
      if (typeof table.translations[msgctxt][msgid] !== 'object') return
      if (msgctxt === '' && msgid === '') return

      response.push(table.translations[msgctxt][msgid])
    })
  })

  if (options.sort !== false) {
    if (typeof options.sort === 'function') {
      response = response.sort(options.sort)
    } else {
      response = response.sort(compareMsgid)
    }
  }

  response = response.map(r => drawBlock(r, {}, options))

  response.unshift(drawBlock(headerBlock, {
    msgstr: generateHeader(table.headers)
  }, options))

  if (table.charset === 'utf-8' || table.charset === 'ascii') {
    // return Buffer.from(response.join('\n\n'), 'utf-8')
    return response.join('\n\n')
  }

  return encoding.convert(response.join('\n\n'), table.charset).toString()
}

/**
 * Creates a PO compiler object.
 *
 * @constructor
 * @param {Object} table Translation table to be compiled
 */
export default function (table = {}, options = {}) {
  table.translations = table.translations || {}
  options.project = options.project || 'gettext-converter'

  let { headers = {} } = table

  headers = Object.keys(headers).reduce((result, key) => {
    const lowerKey = key.toLowerCase()

    if (HEADERS.has(lowerKey)) {
      result[HEADERS.get(lowerKey)] = headers[key]
    } else {
      result[key] = headers[key]
    }

    return result
  }, {})

  if (!headers[HEADERS.get('project-id-version')]) headers[HEADERS.get('project-id-version')] = options.project

  table.headers = headers

  if (!('foldLength' in options)) options.foldLength = 76

  if (!('sort' in options)) options.sort = false

  handleCharset(table)

  return compile(table, options)
}
