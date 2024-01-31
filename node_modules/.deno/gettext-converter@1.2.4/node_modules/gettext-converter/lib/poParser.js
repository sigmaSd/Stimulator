// inspired by https://github.com/smhg/gettext-parser/blob/master/lib/poparser.js
import encoding from 'encoding'
import { HEADERS, formatCharset } from './shared.js'

const states = {
  none: 0x01,
  comments: 0x02,
  key: 0x03,
  string: 0x04
}

const types = {
  comments: 0x01,
  key: 0x02,
  string: 0x03
}

const symbols = {
  quotes: /["']/,
  comments: /#/,
  whitespace: /\s/,
  key: /[\w\-[\]]/,
  keyNames: /^(?:msgctxt|msgid(?:_plural)?|msgstr(?:\[\d+])?)$/
}

const toString = (buf, charset) => encoding.convert(buf, 'utf-8', charset).toString('utf-8')

/**
 * Parses a header string into an object of key-value pairs
 *
 * @param {String} str Header string
 * @return {Object} An object of key-value pairs
 */
const parseHeader = (str = '') => {
  return str.split('\n')
    .reduce((headers, line) => {
      const parts = line.split(':')
      let key = (parts.shift() || '').trim()

      if (key) {
        const value = parts.join(':').trim()
        key = HEADERS.get(key.toLowerCase()) || key
        headers[key] = value
      }

      return headers
    }, {})
}

const handleCharset = (buf = '', defaultCharset) => {
  const str = buf.toString()
  let pos
  let headers = ''
  let match
  let charset = defaultCharset

  if ((pos = str.search(/^\s*msgid/im)) >= 0) {
    pos = pos + str.substr(pos + 5).search(/^\s*(msgid|msgctxt)/im)
    headers = str.substr(0, pos >= 0 ? pos + 5 : str.length)
  }

  if ((match = headers.match(/[; ]charset\s*=\s*([\w-]+)(?:[\s;]|\\n)*"\s*$/mi))) {
    charset = formatCharset(match[1], defaultCharset)
  }

  if (charset === 'utf-8') {
    return { fileContents: str, charset }
  }

  return { fileContents: toString(buf), charset }
}

/**
 * Token parser. Parsed state can be found from lex
 *
 * @param {String} chunk String
 */
const lexer = (chunk) => {
  const lex = []
  let node = {}
  let state = states.none
  let lineNumber = 1
  let escaped = false
  let chr

  for (let i = 0, len = chunk.length; i < len; i++) {
    chr = chunk.charAt(i)

    if (chr === '\n') lineNumber += 1

    switch (state) {
      case states.none:
        if (chr.match(symbols.quotes)) {
          node = {
            type: types.string,
            value: '',
            quote: chr
          }
          lex.push(node)
          state = states.string
        } else if (chr.match(symbols.comments)) {
          node = {
            type: types.comments,
            value: ''
          }
          lex.push(node)
          state = states.comments
        } else if (!chr.match(symbols.whitespace)) {
          node = {
            type: types.key,
            value: chr
          }
          lex.push(node)
          state = states.key
        }
        break
      case states.comments:
        if (chr === '\n') {
          state = states.none
        } else if (chr !== '\r') {
          node.value += chr
        }
        break
      case states.string:
        if (escaped) {
          switch (chr) {
            case 't':
              node.value += '\t'
              break
            case 'n':
              node.value += '\n'
              break
            case 'r':
              node.value += '\r'
              break
            default:
              node.value += chr
          }
          escaped = false
        } else {
          if (chr === node.quote) {
            state = states.none
          } else if (chr === '\\') {
            escaped = true
            break
          } else {
            node.value += chr
          }
          escaped = false
        }
        break
      case states.key:
        if (!chr.match(symbols.key)) {
          if (!node.value.match(symbols.keyNames)) {
            const err = new SyntaxError(`Error parsing PO data: Invalid key name "${node.value}" at line ${lineNumber}. This can be caused by an unescaped quote character in a msgid or msgstr value.`)
            err.lineNumber = lineNumber
            throw err
          }
          state = states.none
          i--
        } else {
          node.value += chr
        }
        break
    }
  }

  return lex
}

/**
 * Join multi line strings
 *
 * @param {Object} tokens Parsed tokens
 * @return {Object} Parsed tokens, with multi line strings joined into one
 */
const joinStringValues = (tokens) => {
  const response = []
  let lastNode

  for (let i = 0, len = tokens.length; i < len; i++) {
    if (lastNode && tokens[i].type === types.string && lastNode.type === types.string) {
      lastNode.value += tokens[i].value
    } else if (lastNode && tokens[i].type === types.comments && lastNode.type === types.comments) {
      lastNode.value += '\n' + tokens[i].value
    } else {
      response.push(tokens[i])
      lastNode = tokens[i]
    }
  }

  return response
}

/**
 * Parse comments into separate comment blocks
 *
 * @param {Object} tokens Parsed tokens
 */
const parseComments = (tokens) => {
  // parse comments
  tokens.forEach(node => {
    let comment
    let lines

    if (node && node.type === types.comments) {
      comment = {
        translator: [],
        extracted: [],
        reference: [],
        flag: [],
        previous: []
      }

      lines = (node.value || '').split(/\n/)

      lines.forEach(line => {
        switch (line.charAt(0) || '') {
          case ':':
            comment.reference.push(line.substr(1).trim())
            break
          case '.':
            comment.extracted.push(line.substr(1).replace(/^\s+/, ''))
            break
          case ',':
            comment.flag.push(line.substr(1).replace(/^\s+/, ''))
            break
          case '|':
            comment.previous.push(line.substr(1).replace(/^\s+/, ''))
            break
          default:
            comment.translator.push(line.replace(/^\s+/, ''))
        }
      })

      node.value = {}

      Object.keys(comment).forEach(key => {
        if (comment[key] && comment[key].length) {
          node.value[key] = comment[key].join('\n')
        }
      })
    }
  })
}

/**
 * Join gettext keys with values
 *
 * @param {Object} tokens Parsed tokens
 * @return {Object} Tokens
 */
const handleKeys = (tokens) => {
  const response = []
  let lastNode

  for (let i = 0, len = tokens.length; i < len; i++) {
    if (tokens[i].type === types.key) {
      lastNode = { key: tokens[i].value }
      if (i && tokens[i - 1].type === types.comments) {
        lastNode.comments = tokens[i - 1].value
      }
      lastNode.value = ''
      response.push(lastNode)
    } else if (tokens[i].type === types.string && lastNode) {
      lastNode.value += tokens[i].value
    }
  }

  return response
}

/**
 * Separate different values into individual translation objects
 *
 * @param {Object} tokens Parsed tokens
 * @return {Object} Tokens
 */
const handleValues = (tokens) => {
  const response = []
  let lastNode
  let curContext
  let curComments

  for (let i = 0, len = tokens.length; i < len; i++) {
    if (tokens[i].key.toLowerCase() === 'msgctxt') {
      curContext = tokens[i].value
      curComments = tokens[i].comments
    } else if (tokens[i].key.toLowerCase() === 'msgid') {
      lastNode = {
        msgid: tokens[i].value
      }

      if (curContext) lastNode.msgctxt = curContext

      if (curComments) lastNode.comments = curComments

      if (tokens[i].comments && !lastNode.comments) lastNode.comments = tokens[i].comments

      curContext = false
      curComments = false
      response.push(lastNode)
    } else if (tokens[i].key.toLowerCase() === 'msgid_plural') {
      if (lastNode) lastNode.msgid_plural = tokens[i].value

      if (tokens[i].comments && !lastNode.comments) lastNode.comments = tokens[i].comments

      curContext = false
      curComments = false
    } else if (tokens[i].key.substr(0, 6).toLowerCase() === 'msgstr') {
      if (lastNode) lastNode.msgstr = (lastNode.msgstr || []).concat(tokens[i].value)

      if (tokens[i].comments && !lastNode.comments) lastNode.comments = tokens[i].comments

      curContext = false
      curComments = false
    }
  }

  return response
}

/**
 * Compose a translation table from tokens object
 *
 * @param {Object} tokens Parsed tokens
 * @return {Object} Translation table
 */
const normalize = (tokens, charset) => {
  const table = {
    charset,
    headers: undefined,
    translations: {}
  }
  let msgctxt

  for (let i = 0, len = tokens.length; i < len; i++) {
    msgctxt = tokens[i].msgctxt || ''

    if (!table.translations[msgctxt]) table.translations[msgctxt] = {}

    if (!table.headers && !msgctxt && !tokens[i].msgid) {
      table.headers = parseHeader(tokens[i].msgstr[0])
    }

    table.translations[msgctxt][tokens[i].msgid] = tokens[i]
  }

  return table
}

/**
* Converts parsed tokens to a translation table
*
* @param {Object} tokens Parsed tokens
* @param {String} [charset] charset to use
* @returns {Object} Translation table
*/
const finalize = (tokens, charset) => {
  let data = joinStringValues(tokens)

  parseComments(data)

  data = handleKeys(data)
  data = handleValues(data)

  return normalize(data, charset)
}

/**
 * Creates a PO parser object. If PO object is a string,
 * UTF-8 will be used as the charset
 *
 * @constructor
 * @param {Buffer|String} fileContents PO object
 * @param {String} [defaultCharset] Default charset to use
 * @return {Object} Translation table
 */
export default function (fileContents, options = {}) {
  if (typeof options === 'string') {
    options = { charset: options }
  }
  options.charset = options.charset || 'iso-8859-1'

  if (typeof fileContents === 'string') {
    options.charset = 'utf-8'
  } else {
    const ret = handleCharset(fileContents)
    options.charset = ret.charset
    fileContents = ret.fileContents
  }
  const lex = lexer(fileContents)
  return finalize(lex, options.charset)
}
