import parse from './poParser.js';
export default function po2js(fileContents, options) {
  return parse(fileContents, options);
}