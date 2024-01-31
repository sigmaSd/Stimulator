import plurals from './plurals.js';
export var getPlurals = function getPlurals(options) {
  return options.plurals || plurals;
};
export var getSetLocaleAsLanguageHeader = function getSetLocaleAsLanguageHeader(options) {
  return typeof options.setLocaleAsLanguageHeader === 'boolean' ? options.setLocaleAsLanguageHeader : true;
};