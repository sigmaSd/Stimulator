[![travis](https://img.shields.io/travis/locize/gettext-converter.svg)](https://travis-ci.org/locize/gettext-converter) [![npm](https://img.shields.io/npm/v/gettext-converter.svg)](https://npmjs.org/package/gettext-converter)

## Download

The source is available for download from
[GitHub](https://github.com/locize/gettext-converter/archive/master.zip).
Alternatively, you can install using npm:

```sh
npm install --save gettext-converter
```

You can then `import` or `require()` gettext-converter as normal:

```js
import gettext from 'gettext-converter'
// or
const gettext = require('gettext-converter')

const js = gettext.po2js(po)
```

Or you can direclty `import` or `require()` its functions:

```js
import po2js from 'gettext-converter/po2js'
// or
const po2js = require('gettext-converter/cjs/po2js')
```

## Usage

```js

const po = `msgid ""
msgstr ""
"Project-Id-Version: gettext-converter\n"
"mime-version: 1.0\n"
"Content-Type: text/plain; charset=utf-8\n"
"Content-Transfer-Encoding: 8bit\n"
"Plural-Forms: nplurals=2; plural=(n != 1)\n"
"POT-Creation-Date: 2020-04-17T10:46:16.313Z\n"
"PO-Revision-Date: 2020-04-17T10:46:16.313Z\n"

msgid "my-key"
msgstr "myvalue"`

const js = {
  charset: 'utf-8',
  headers: {
    'Project-Id-Version': 'gettext-converter',
    'mime-version': '1.0',
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Transfer-Encoding': '8bit',
    'Plural-Forms': 'nplurals=2; plural=(n != 1)',
    'POT-Creation-Date': '2020-04-17T10:46:16.313Z',
    'PO-Revision-Date': '2020-04-17T10:46:16.313Z'
  },
  translations: {
  '': {
    '': {
      msgid: '',
      msgstr: [
        'Project-Id-Version: gettext-converter\n' +
          'mime-version: 1.0\n' +
          'Content-Type: text/plain; charset=utf-8\n' +
          'Content-Transfer-Encoding: 8bit\n' +
          'Plural-Forms: nplurals=2; plural=(n != 1)\n' +
          'POT-Creation-Date: 2020-04-17T10:46:16.313Z\n' +
          'PO-Revision-Date: 2020-04-17T10:46:16.313Z\n'
      ]
    },
    'my-key': { msgid: 'my-key', msgstr: [ 'myvalue' ] }
  }
}


import po2js from 'gettext-converter/po2js'
const res = po2js(po)
// res is like js

import js2po from 'gettext-converter/js2po'
const res = js2po(js)
// res is like po


const i18nextJs = { 'my-key': 'myvalue' }

import po2i18next from 'gettext-converter/po2i18next'
const res = po2i18next(po)
// res is like i18nextJs

import i18next2po from 'gettext-converter/i18next2po'
const res = i18next2po('en', i18nextJs)
// res is like po
```

### i18next json format v4 support

```javascript
const i18nextJs = {
  'key_one': 'a value',
  'key_other': 'some values'
}

import i18next2po from 'gettext-converter/i18next2po'
const res = i18next2po('en', i18nextJs, { compatibilityJSON: 'v4' })

import po2i18next from 'gettext-converter/po2i18next'
const res = po2i18next(po, { compatibilityJSON: 'v4' })
```