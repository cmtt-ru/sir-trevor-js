"use strict";

var BlockOptions = function() {
  this._ensureElement();
  this._bindFunctions();
};

Object.assign(BlockOptions.prototype, require('./function-bind'), require('./renderable'), {

  tagName: 'a',
  className: 'st-block-ui-btn st-block-ui-btn--options st-icon',

  attributes: {
    html: 'options',
    'data-icon': 'add'
  }

});

module.exports = BlockOptions;
