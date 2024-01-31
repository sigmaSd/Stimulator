var sets = [{
  lngs: ['ach', 'ak', 'am', 'arn', 'gun', 'ln', 'mfe', 'mg', 'mi', 'oc', 'pt', 'pt-BR', 'tg', 'ti', 'tr', 'uz', 'wa'],
  toCldr: {
    '': 1,
    _plural: 5
  },
  fromCldr: {
    1: '',
    5: '_plural'
  }
}, {
  lngs: ['br'],
  toCldr: {
    '': 1,
    _plural: 1
  },
  fromCldr: {
    1: '_plural',
    2: '_plural',
    3: '_plural',
    5: '_plural'
  }
}, {
  lngs: ['fil', 'tl'],
  toCldr: {
    '': 1,
    _plural: 5
  },
  fromCldr: {
    1: '_plural',
    5: '_plural'
  }
}, {
  lngs: ['af', 'an', 'ast', 'az', 'bg', 'bn', 'ca', 'da', 'de', 'dev', 'el', 'en', 'eo', 'es', 'et', 'eu', 'fi', 'fo', 'fur', 'fy', 'gl', 'gu', 'ha', 'hi', 'hu', 'hy', 'ia', 'it', 'kk', 'kn', 'ku', 'lb', 'mai', 'ml', 'mn', 'mr', 'nah', 'nap', 'nb', 'ne', 'nl', 'nn', 'no', 'nso', 'pa', 'pap', 'pms', 'ps', 'pt-PT', 'rm', 'sco', 'si', 'so', 'son', 'sq', 'sv', 'sw', 'ta', 'te', 'tk', 'ur'],
  toCldr: {
    _plural: 5,
    '': 1
  },
  fromCldr: {
    1: '',
    5: '_plural'
  }
}, {
  lngs: ['se'],
  toCldr: {
    _plural: 2,
    '': 1
  },
  fromCldr: {
    1: '',
    2: '_plural',
    5: '_plural'
  }
}, {
  lngs: ['yo'],
  toCldr: {
    _plural: 5,
    '': 5
  },
  fromCldr: {
    5: ''
  }
}, {
  lngs: ['ay', 'bo', 'id', 'ja', 'jbo', 'km', 'ko', 'lo', 'ms', 'sah', 'su', 'th', 'tt', 'vi', 'wo', 'zh'],
  toCldr: {
    _0: 5
  },
  fromCldr: {
    5: '_0'
  }
}, {
  lngs: ['cgg', 'ka', 'ky', 'ug'],
  toCldr: {
    _0: 1
  },
  fromCldr: {
    1: '_0',
    5: '_0'
  }
}, {
  lngs: ['fa'],
  toCldr: {
    _0: 5
  },
  fromCldr: {
    1: '_0',
    5: '_0'
  }
}, {
  lngs: ['be', 'cnr', 'ru', 'uk'],
  toCldr: {
    _2: 4,
    _0: 1,
    _1: 3
  },
  fromCldr: {
    1: '_0',
    3: '_1',
    4: '_2'
  }
}, {
  lngs: ['bs', 'hr', 'sr'],
  toCldr: {
    _2: 5,
    _0: 1,
    _1: 3
  },
  fromCldr: {
    1: '_0',
    3: '_1',
    5: '_2'
  }
}, {
  lngs: ['dz'],
  toCldr: {
    _2: 5,
    _0: 5,
    _1: 5
  },
  fromCldr: {
    5: '_1'
  }
}, {
  lngs: ['ar'],
  toCldr: {
    _0: 0,
    _1: 1,
    _2: 2,
    _3: 3,
    _4: 4,
    _5: 5
  },
  fromCldr: {
    0: '_0',
    1: '_1',
    2: '_2',
    3: '_3',
    4: '_4',
    5: '_5'
  }
}, {
  lngs: ['cs', 'sk'],
  toCldr: {
    _2: 5,
    _0: 1,
    _1: 3
  },
  fromCldr: {
    1: '_0',
    3: '_1',
    5: '_2'
  }
}, {
  lngs: ['csb', 'pl'],
  toCldr: {
    _2: 4,
    _0: 1,
    _1: 3
  },
  fromCldr: {
    1: '_0',
    3: '_1',
    4: '_2'
  }
}, {
  lngs: ['cy'],
  toCldr: {
    _2: 4,
    _0: 1,
    _1: 2,
    _3: 5
  },
  fromCldr: {
    0: '_2',
    1: '_0',
    2: '_1',
    3: '_2',
    4: '_2',
    5: '_3'
  }
}, {
  lngs: ['fr'],
  toCldr: {
    '': 1,
    _plural: 5
  },
  fromCldr: {
    1: '',
    5: '_plural'
  }
}, {
  lngs: ['ga'],
  toCldr: {
    _2: 3,
    _0: 1,
    _1: 2,
    _3: 4,
    _4: 5
  },
  fromCldr: {
    1: '_0',
    2: '_1',
    3: '_2',
    4: '_3',
    5: '_4'
  }
}, {
  lngs: ['gd'],
  toCldr: {
    _3: 5,
    _0: 1,
    _1: 2,
    _2: 3
  },
  fromCldr: {
    1: '_0',
    2: '_1',
    3: '_2',
    5: '_3'
  }
}, {
  lngs: ['is'],
  toCldr: {
    _plural: 5,
    '': 1
  },
  fromCldr: {
    1: '',
    5: '_plural'
  }
}, {
  lngs: ['jv'],
  toCldr: {
    _0: 5,
    _1: 5
  },
  fromCldr: {
    5: '_1'
  }
}, {
  lngs: ['kw'],
  toCldr: {
    _3: 5,
    _0: 1,
    _1: 2,
    _2: 5
  },
  fromCldr: {
    1: '_0',
    2: '_1',
    5: '_2'
  }
}, {
  lngs: ['lt'],
  toCldr: {
    _2: 5,
    _0: 1,
    _1: 3
  },
  fromCldr: {
    1: '_0',
    3: '_1',
    5: '_2'
  }
}, {
  lngs: ['lv'],
  toCldr: {
    _2: 0,
    _0: 1,
    _1: 0
  },
  fromCldr: {
    0: '_1',
    1: '_0',
    5: '_1'
  }
}, {
  lngs: ['mk'],
  toCldr: {
    _plural: 5,
    '': 1
  },
  fromCldr: {
    1: '',
    5: '_plural'
  }
}, {
  lngs: ['mnk'],
  toCldr: {
    _0: 0,
    _1: 1,
    _2: 5
  },
  fromCldr: {
    0: '_0',
    1: '_1',
    5: '_2'
  }
}, {
  lngs: ['mt'],
  toCldr: {
    _1: 3,
    _0: 1,
    _2: 4,
    _3: 5
  },
  fromCldr: {
    1: '_0',
    3: '_1',
    4: '_2',
    5: '_3'
  }
}, {
  lngs: ['or'],
  toCldr: {
    _1: 5,
    _0: 1
  },
  fromCldr: {
    1: '_0',
    5: '_1'
  }
}, {
  lngs: ['ro'],
  toCldr: {
    _1: 3,
    _0: 1,
    _2: 5
  },
  fromCldr: {
    1: '_0',
    3: '_1',
    5: '_2'
  }
}, {
  lngs: ['sl'],
  toCldr: {
    _0: 5,
    _1: 1,
    _2: 2,
    _3: 3
  },
  fromCldr: {
    1: '_1',
    2: '_2',
    3: '_3',
    5: '_0'
  }
}, {
  lngs: ['he'],
  toCldr: {
    _3: 5,
    _0: 1,
    _1: 2,
    _2: 4
  },
  fromCldr: {
    1: '_0',
    2: '_1',
    4: '_2',
    5: '_3'
  }
}];
var rules = {};
sets.forEach(function (set) {
  set.lngs.forEach(function (l) {
    rules[l] = {
      toCldr: set.toCldr,
      fromCldr: set.fromCldr
    };
  });
});
export default rules;