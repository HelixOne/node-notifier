/**
 * Wrapper for the toaster (https://github.com/nels-o/toaster)
 */
var path = require('path'),
    notifier = path.resolve(__dirname, '../vendor/toaster/toast.exe'),
    utils = require('../lib/utils'),
    Balloon = require('./balloon'),
    cloneDeep = require('lodash.clonedeep');

var EventEmitter = require('events').EventEmitter;
var util = require('util');

var fallback = void 0;

module.exports = WindowsToaster;

function WindowsToaster (options) {
  options = cloneDeep(options || {});
  if (!(this instanceof WindowsToaster)) {
    return new WindowsToaster(options);
  }

  this.options = options;

  EventEmitter.call(this);
}
util.inherits(WindowsToaster, EventEmitter);

WindowsToaster.prototype.notify = function (options, callback) {
  options = cloneDeep(options || {});

  callback = callback || function () {};
  var actionJackedCallback = utils.actionJackerDecorator(this, options, callback, function (data) {
    var cleaned = data.toLowerCase().trim();
    if (cleaned === 'activated') {
      return 'click';
    }
    if (cleaned === 'timeout') {
      return 'timeout';
    }
    return false;
  });

  if (!options.message) {
    callback(new Error('Message is required.'));
    return this;
  }

  if (!utils.isWin8() && !!this.options.withFallback) {
    fallback = fallback || new Balloon(this.options);
    return fallback.notify(options, callback);
  }

  options = utils.mapToWin8(options);
  var argsList = utils.constructArgumentList(options, {
    wrapper: '',
    noEscape: true
  });

  var path = require('path');
  var appName = options.appName;
  if (!appName) {
	   appName = path.basename(process.execPath, '.exe');
  }
  var shortcutDir = options.shortcutDir || '';
  var appId = options.appId || (appName + '.appid');

  argsList.push('-i');
  argsList.push(appId);
  argsList.push('-l');
  argsList.push(process.execPath);
  argsList.push(path.join(process.env.APPDATA, '\\Microsoft\\Windows\\Start Menu\\Programs\\', shortcutDir, appName + '.lnk'));

  utils.fileCommand(this.options.customPath || notifier, argsList, actionJackedCallback);
  return this;
};
