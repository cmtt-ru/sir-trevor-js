"use strict";

var $ = require('jquery');
var _ = require('./lodash');
var config = require('./config');

var urlRegex = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;

var utils = {

  getInstance: function(identifier) {
    if (_.isUndefined(identifier)) {
      return config.instances[0];
    }

    if (_.isString(identifier)) {
      return config.instances.find(function(editor) {
        return editor.ID === identifier;
      });
    }

    return config.instances[identifier];
  },

  getInstanceBySelection: function() {
    return utils.getInstance(
      $(window.getSelection().anchorNode).
        parents('.st-block').data('instance'));
  },

  getBlockBySelection: function() {
    return utils.getInstanceBySelection().findBlockById(
      $(window.getSelection().anchorNode).parents('.st-block').get(0).id
    );
  },

  log: function() {
    if (!_.isUndefined(console) && config.debug) {
      console.log.apply(console, arguments);
    }
  },

  isURI : function(string) {
    return (urlRegex.test(string));
  },

  titleize: function(str){
    if (str === null) {
      return '';
    }
    str  = String(str).toLowerCase();
    return str.replace(/(?:^|\s|-)\S/g, function(c){ return c.toUpperCase(); });
  },

  classify: function(str){
    return utils.titleize(String(str).replace(/[\W_]/g, ' ')).replace(/\s/g, '');
  },

  capitalize : function(string) {
    return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
  },

  flatten: function(obj) {
    var x = {};
    (Array.isArray(obj) ? obj : Object.keys(obj)).forEach(function (i) {
      x[i] = true;
    });
    return x;
  },

  underscored: function(str){
    return str.trim().replace(/([a-z\d])([A-Z]+)/g, '$1_$2')
    .replace(/[-\s]+/g, '_').toLowerCase();
  },

  reverse: function(str) {
    return str.split("").reverse().join("");
  },

  toSlug: function(str) {
    return str
    .toLowerCase()
    .replace(/[^\w ]+/g,'')
    .replace(/ +/g,'-');
  },

  toType: function(str) {
    return str
        .replace(/([a-z])([A-Z])/,'$1 $2')
        .toLowerCase()
        .replace(/[^\w ]+/g,'')
        .replace(/ +/g,'_');
  }

};

module.exports = utils;
