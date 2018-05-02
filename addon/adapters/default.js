/**
 * Copyright 2015, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

import EmberObject, { set, computed } from '@ember/object';
import { getOwner } from '@ember/application';
import Translation from '../models/translation';

const DefaultTranslationAdapter = EmberObject.extend({
  _cache: null,

  /** @private **/
  locales: computed(() => []),

  /** @private **/
  init() {
    this._super();
    this._cache = new Map();
  },

  /** @private **/
  findModel(localeName) {
    let model = this._cache.get(localeName);

    if (!model) {
      model = getOwner(this).lookup(`translation:${localeName}`);

      if (model) {
        this.register(localeName, model);
      }
    }

    return model;
  },

  /** @private **/
  localeFactory(localeName) {
    let owner = getOwner(this);
    let lookupName = `translation:${localeName}`;
    let model = owner.lookup(lookupName);

    if (model) {
      return model;
    }

    let Klass;
    if (owner.hasRegistration('model:ember-intl-translation')) {
      Klass = owner.factoryFor('model:ember-intl-translation').class;
    } else {
      Klass = Translation;
    }

    const ModelKlass = Klass.extend();
    Object.defineProperty(ModelKlass.proto(), 'localeName', {
      writable: false,
      enumerable: true,
      value: localeName
    });

    owner.register(lookupName, ModelKlass);
    model = owner.lookup(lookupName);
    this.register(localeName, model);

    return model;
  },

  /** @private **/
  register(localeName, model) {
    if (this._cache.has(localeName)) {
      return;
    }

    this._cache.set(localeName, model);
    set(this, 'locales', [...this._cache.keys()]);
  },

  /** @private **/
  has(localeName, translationKey) {
    const model = this.findModel(localeName);

    return model && model.has(translationKey);
  },

  /** @private **/
  lookup(localeNames, translationKey) {
    for (let i = 0; i < localeNames.length; i++) {
      const localeName = localeNames[i];
      const model = this.findModel(localeName);

      if (model && model.has(translationKey)) {
        return model.getValue(translationKey);
      }
    }
  },

  /** @private **/
  translationsFor(localeName) {
    return this.localeFactory(localeName);
  },

  /** @private **/
  findTranslationByKey(localeNames, translationKey) {
    return this.lookup(localeNames, translationKey);
  }
});

export default DefaultTranslationAdapter;
