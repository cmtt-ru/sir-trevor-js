"use strict";

var _ = require('../lodash');
var config = require('../config');
var utils = require('../utils');

module.exports = {

  mixinName: "Movable",

  initializeMovable: function() {

    this.$el.addClass('st-block--not-fixed');

  },

};
