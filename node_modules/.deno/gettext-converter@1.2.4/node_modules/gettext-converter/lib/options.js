import plurals from './plurals.js'

export const getPlurals = options => options.plurals || plurals

export const getSetLocaleAsLanguageHeader = options => typeof options.setLocaleAsLanguageHeader === 'boolean' ? options.setLocaleAsLanguageHeader : true
