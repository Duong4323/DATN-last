'use strict';

var _defineProperty = require('@babel/runtime/helpers/defineProperty');
var _classCallCheck = require('@babel/runtime/helpers/classCallCheck');
var _createClass = require('@babel/runtime/helpers/createClass');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _defineProperty__default = /*#__PURE__*/_interopDefaultLegacy(_defineProperty);
var _classCallCheck__default = /*#__PURE__*/_interopDefaultLegacy(_classCallCheck);
var _createClass__default = /*#__PURE__*/_interopDefaultLegacy(_createClass);

function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty__default["default"](e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
/* eslint-disable max-classes-per-file */
var Storage = /*#__PURE__*/function () {
  function Storage(options) {
    _classCallCheck__default["default"](this, Storage);
    this.store = options.store;
  }
  _createClass__default["default"](Storage, [{
    key: "setItem",
    value: function setItem(key, value) {
      if (this.store) {
        try {
          this.store.setItem(key, value);
        } catch (e) {
          // f.log('failed to set value for key "' + key + '" to localStorage.');
        }
      }
    }
  }, {
    key: "getItem",
    value: function getItem(key, value) {
      if (this.store) {
        try {
          return this.store.getItem(key, value);
        } catch (e) {
          // f.log('failed to get value for key "' + key + '" from localStorage.');
        }
      }
      return undefined;
    }
  }]);
  return Storage;
}();
function getDefaults() {
  var store = null;
  try {
    store = window.localStorage;
  } catch (e) {
    if (typeof window !== 'undefined') {
      console.log('Failed to load local storage.', e);
    }
  }
  return {
    prefix: 'i18next_res_',
    expirationTime: 7 * 24 * 60 * 60 * 1000,
    defaultVersion: undefined,
    versions: {},
    store: store
  };
}
var Cache = /*#__PURE__*/function () {
  function Cache(services) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    _classCallCheck__default["default"](this, Cache);
    this.init(services, options);
    this.type = 'backend';
  }
  _createClass__default["default"](Cache, [{
    key: "init",
    value: function init(services) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      this.services = services;
      this.options = _objectSpread(_objectSpread(_objectSpread({}, getDefaults()), this.options), options);
      this.storage = new Storage(this.options);
    }
  }, {
    key: "read",
    value: function read(language, namespace, callback) {
      var nowMS = Date.now();
      if (!this.storage.store) {
        return callback(null, null);
      }
      var local = this.storage.getItem("".concat(this.options.prefix).concat(language, "-").concat(namespace));
      if (local) {
        local = JSON.parse(local);
        var version = this.getVersion(language);
        if (
        // expiration field is mandatory, and should not be expired
        local.i18nStamp && local.i18nStamp + this.options.expirationTime > nowMS &&
        // there should be no language version set, or if it is, it should match the one in translation
        version === local.i18nVersion) {
          var i18nStamp = local.i18nStamp;
          delete local.i18nVersion;
          delete local.i18nStamp;
          return callback(null, local, i18nStamp);
        }
      }
      return callback(null, null);
    }
  }, {
    key: "save",
    value: function save(language, namespace, data) {
      if (this.storage.store) {
        data.i18nStamp = Date.now();

        // language version (if set)
        var version = this.getVersion(language);
        if (version) {
          data.i18nVersion = version;
        }

        // save
        this.storage.setItem("".concat(this.options.prefix).concat(language, "-").concat(namespace), JSON.stringify(data));
      }
    }
  }, {
    key: "getVersion",
    value: function getVersion(language) {
      return this.options.versions[language] || this.options.defaultVersion;
    }
  }]);
  return Cache;
}();
Cache.type = 'backend';

module.exports = Cache;
