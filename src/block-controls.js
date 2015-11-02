"use strict";

/*
 * SirTrevor Block Controls
 * --
 * Gives an interface for adding new Sir Trevor blocks.
 */

var _ = require('./lodash');
var $ = require('jquery');
var utils = require('./utils');

var Blocks = require('./blocks');
var BlockControl = require('./block-control');
var EventBus = require('./event-bus');

var BlockControls = function(available_types, mediator) {
  this.available_types = available_types || [];
  this.mediator = mediator;

  this._ensureElement();
  this._bindFunctions();
  this._bindMediatedEvents();

  this.initialize();
};

Object.assign(BlockControls.prototype, require('./function-bind'), require('./mediated-events'), require('./renderable'), require('./events'), {

  bound: ['handleControlButtonClick', 'setLimitCounters', 'updateLimitCounter'],
  block_controls: null,

  className: "st-block-controls",
  eventNamespace: 'block-controls',

  mediatedEvents: {
    'render': 'renderInContainer',
    'show': 'show',
    'hide': 'hide',
    'setControlsLimits' : 'setLimitCounters'
  },

  initialize: function() {
    for(var block_type in this.available_types) {
      if (Blocks.hasOwnProperty(block_type)) {
        var block_control = new BlockControl(block_type);
        if (block_control.can_be_rendered) {
          this.$el.append(block_control.render().$el);
        }
      }
    }

    this.mediator.trigger('block:getLimitCounters');

    this.$el.delegate('.st-block-control', 'click', this.handleControlButtonClick);
    this.mediator.on('block-controls:show', this.renderInContainer);
    this.mediator.on('block-control:updateLimitCounter',this.updateLimitCounter);
  },

  show: function() {
    this.$el.addClass('st-block-controls--active');

    EventBus.trigger('block:controls:shown');
  },

  hide: function(notMoveToEnd) {
    this.removeCurrentContainer();
    this.$el.removeClass('st-block-controls--active');

    EventBus.trigger('block:controls:hidden');
    if (!notMoveToEnd) { this.mediator.trigger('block:showBlockControlsOnBottom'); }
  },

  handleControlButtonClick: function(e) {
    e.stopPropagation();

    this.mediator.trigger('block:create', $(e.currentTarget).attr('data-type'));
  },

  renderInContainer: function(container) {
    this.removeCurrentContainer();

    container.append(this.$el.detach());
    container.addClass('with-st-controls');

    this.currentContainer = container;
    this.show();
  },

  removeCurrentContainer: function() {
    if (!_.isUndefined(this.currentContainer)) {
      this.currentContainer.removeClass("with-st-controls");
      this.currentContainer = undefined;
    }
  },
  
  setLimitCounters: function(groupLimit, typeLimit) {
    for(var block_type in this.available_types) {
      if (Blocks.hasOwnProperty(block_type)) {
        var block_type_c = utils.toType(block_type);
        if (!_.isUndefined(typeLimit[block_type])) { // Set limits data for type limits
          this.$el.find('a[data-type="' + block_type_c + '"]').attr('data-limit',typeLimit[block_type]);
        }

        if (!_.isUndefined(groupLimit) && groupLimit.types.indexOf(block_type) > -1) {
          this.$el.find('a[data-type="' + block_type_c + '"]').attr('data-limit',groupLimit.limit);
        }

      }
    }
  },

  updateLimitCounter: function(type, increase) {
    var block_type_control = this.$el.find('a[data-type="' + utils.toType(type) + '"]');
    var counter = block_type_control.attr('data-limit');
    if (counter) {
      if (increase) {
        counter++;
      }
      else {
        counter--;
      }
      block_type_control.attr('data-limit', counter);
    }
  }
});

module.exports = BlockControls;
