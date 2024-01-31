# p-from-callback

[![Build Status][build-badge]][build]
[![npm package][npm-badge]][npm]
[![Coverage Status][coveralls-badge]][coveralls]

> Map node-style callback to a promise

## Install

```
$ npm install p-from-callback
```

## Features

* pure esm module
* typescript types
* supports multiple return values
* 100% test coverage

## Usage

```js
import { readFile } from 'node:fs';
import fromCallback from 'p-from-callback';

fromCallback(cb => readFile("foo.txt", cb)).then(buf => buf.toString('utf8'));
fromCallback(cb => cb(undefined, "foo", "bar"), true)
    .then([foo, bar] => foo === "foo" && bar === "bar");
```

## API

#### fromCallback\<R\>((cb: (err: any, res: R)): any): Promise\<R\>
#### fromCallback\<R\>((cb: (err: any, ...res: R[])): any, true): Promise\<R[]\>

Takes a callback resolver and returns a promise to the resolved value, or array of values when `multi = true`.

## License

See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).

[build-badge]: https://img.shields.io/github/actions/workflow/status/dotcore64/p-from-callback/test.yml?event=push&style=flat-square
[build]: https://github.com/dotcore64/p-from-callback/actions

[npm-badge]: https://img.shields.io/npm/v/p-from-callback.svg?style=flat-square
[npm]: https://www.npmjs.org/package/p-from-callback

[coveralls-badge]: https://img.shields.io/coveralls/dotcore64/p-from-callback/master.svg?style=flat-square
[coveralls]: https://coveralls.io/r/dotcore64/p-from-callback
