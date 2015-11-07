"use strict";

var BlockClear = function() {
  this._ensureElement();
  this._bindFunctions();
};

Object.assign(BlockClear.prototype, require('./function-bind'), require('./renderable'), {

  tagName: 'a',
  className: 'st-block-ui-btn st-block-ui-btn--delete st-icon',

  attributes: {
    html: 'clear',
    'data-icon': 'bin'
  }

});

module.exports = BlockClear;
