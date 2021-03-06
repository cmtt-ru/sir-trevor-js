"use strict";

var _ = require('./lodash');
var utils = require('./utils');
var config = require('./config');

var EventBus = require('./event-bus');
var Blocks = require('./blocks');

var BLOCK_OPTION_KEYS = ['convertToMarkdown', 'convertFromMarkdown',
  'formatBar'];

var BlockManager = function(options, editorInstance, mediator) {
  this.options = options;
  this.blockOptions = BLOCK_OPTION_KEYS.reduce(function(acc, key) {
    acc[key] = options[key];
    return acc;
  }, {});
  this.instance_scope = editorInstance;
  this.mediator = mediator;

  this.blocks = [];
  this.blockCounts = {};
  this.blockTypes = {};

  this._setBlocksTypes();
  this._setRequired();
  this._bindMediatedEvents();

  this.initialize();
};

Object.assign(BlockManager.prototype, require('./function-bind'), require('./mediated-events'), require('./events'), {

  eventNamespace: 'block',

  mediatedEvents: {
    'create': 'createBlock',
    'remove': 'removeBlock',
    'rerender': 'rerenderBlock'
  },

  initialize: function() {
    this.mediator.on('block:removeCover', this._removeCover.bind(this));
    this.mediator.on('block:removeAddBtns', this._removeAddBtns.bind(this));
    this.mediator.on('block:getLimitCounters', this._sendControlLimits.bind(this));
  },

  createBlock: function(type, data) {
    type = utils.classify(type);

    // Run validations
    if (!this.canCreateBlock(type)) { return; }

    var block = new Blocks[type](data, this.instance_scope, this.mediator,
                                 this.blockOptions);
    this.blocks.push(block);

    this._incrementBlockTypeCount(type);
    this.mediator.trigger('block:render', block);

    this.triggerBlockCountUpdate();
    this.mediator.trigger('block:limitReached', this.blockLimitReached());
    this.mediator.trigger('block:showBlockControlsOnBottom');

    this._updateControlLimits(type,false);

    EventBus.trigger(data ? "block:create:existing" : "block:create:new", block);
    utils.log("Block created of type " + type);
  },

  removeBlock: function(blockID) {
    var block = this.findBlockById(blockID),
    type = utils.classify(block.type);

    this.mediator.trigger('block-controls:reset');
    this.blocks = this.blocks.filter(function(item) {
      return (item.blockID !== block.blockID);
    });

    this._decrementBlockTypeCount(type);
    this.triggerBlockCountUpdate();
    this.mediator.trigger('block:limitReached', this.blockLimitReached());

    this._updateControlLimits(type,true);

    EventBus.trigger("block:remove");
  },

  rerenderBlock: function(blockID) {
    var block = this.findBlockById(blockID);
    if (!_.isUndefined(block) && !block.isEmpty() &&
        block.drop_options.re_render_on_reorder) {
      block.beforeLoadingData();
    }
  },

  triggerBlockCountUpdate: function() {
    this.mediator.trigger('block:countUpdate', this.blocks.length);
  },

  canCreateBlock: function(type) {
    if(this.blockLimitReached()) {
      utils.log("Cannot add any more blocks. Limit reached.");
      return false;
    }

    if (!this.isBlockTypeAvailable(type)) {
      utils.log("Block type not available " + type);
      return false;
    }

    // Can we have another one of these blocks?
    if (!this.canAddBlockType(type)) {
      utils.log("Block Limit reached for type " + type);
      return false;
    }

    if (this._isBlockGroupLimitReached(type)) {
      utils.log("Group Block Limit reached for type " + type);
      return false;
    }

    return true;
  },

  validateBlockTypesExist: function(shouldValidate) {
    if (config.skipValidation || !shouldValidate) { return false; }

    (this.required || []).forEach(function(type, index) {
      if (!this.isBlockTypeAvailable(type)) { return; }

      if (this._getBlockTypeCount(type) === 0) {
        utils.log("Failed validation on required block type " + type);
        this.mediator.trigger('errors:add',
                              { text: i18n.t("errors:type_missing", { type: type }) });

      } else {
        var blocks = this.getBlocksByType(type).filter(function(b) {
          return !b.isEmpty();
        });

        if (blocks.length > 0) { return false; }

        var block_name = i18n.t("blocks:"+ utils.toType(type)+":title");

        this.mediator.trigger('errors:add', {
          text: i18n.t("errors:required_type_empty", {type: block_name})
        });

        utils.log("A required block type " + type + " is empty");
      }
    }, this);
  },

  findBlockById: function(blockID) {
    return this.blocks.find(function(b) {
      return b.blockID === blockID;
    });
  },

  getBlocksByType: function(type) {
    return this.blocks.filter(function(b) {
      return utils.classify(b.type) === type;
    });
  },

  getBlocksByIDs: function(block_ids) {
    return this.blocks.filter(function(b) {
      return block_ids.includes(b.blockID);
    });
  },

  blockLimitReached: function() {
    return (this.options.blockLimit !== 0 && this.blocks.length >= this.options.blockLimit);
  },

  isBlockTypeAvailable: function(t) {
    return !_.isUndefined(this.blockTypes[t]);
  },

  canAddBlockType: function(type) {
    var block_type_limit = this._getBlockTypeLimit(type);
    return !(block_type_limit !== null && this._getBlockTypeCount(type) >= block_type_limit);
  },

  _setBlocksTypes: function() {
    this.blockTypes = utils.flatten(
      _.isUndefined(this.options.blockTypes) ?
      Blocks : this.options.blockTypes);
  },

  _setRequired: function() {
    this.required = false;

    if (Array.isArray(this.options.required) && !_.isEmpty(this.options.required)) {
      this.required = this.options.required;
    }
  },

  _incrementBlockTypeCount: function(type) {
    this.blockCounts[type] = (_.isUndefined(this.blockCounts[type])) ? 1 : this.blockCounts[type] + 1;
  },

  _decrementBlockTypeCount: function(type) {
    this.blockCounts[type] = (_.isUndefined(this.blockCounts[type])) ? 1 : this.blockCounts[type] - 1;
  },

  _getBlockTypeCount: function(type) {
    return (_.isUndefined(this.blockCounts[type])) ? 0 : this.blockCounts[type];
  },

  _blockLimitReached: function() {
    return (this.options.blockLimit !== 0 && this.blocks.length >= this.options.blockLimit);
  },

  _getBlockTypeLimit: function(t) {
    if (!this.isBlockTypeAvailable(t)) { return null; }
    return parseInt((_.isUndefined(this.options.blockTypeLimits[t])) ? null : this.options.blockTypeLimits[t], 10);
  },

  _removeCover: function(t, id) {
    this.getBlocksByType(utils.classify(t)).forEach(function(block){
      if (block.blockID !== id) {
        block.isCover = false;
        block.$set_cover_ui.html( i18n.t('blocks:image:set_cover') );
      }
      else {
        var label = '';
        if (block.isCover){
          label = i18n.t('blocks:image:cover');
        }
        else {
          label = i18n.t('blocks:image:set_cover');
        }
        block.$set_cover_ui.html(label);
      }
      block.$coverInput.val(block.isCover);
    });
  },

  _removeAddBtns: function() {
    var fixedBlocks = this._countFixedBlocks();
    if (fixedBlocks > 1) {
      for (var i = 1; i < this.blocks.length; i++) {
        if (!this.blocks[i].$el.hasClass('st-block--not-fixed')){
          this.blocks[i-1].$el.addClass('st-block--remove-add');
          this.blocks[i-1].$el.dropArea().unbind('drop');
        }
      }
    }
  },

  _countFixedBlocks: function () {
    var total = 0;
    this.blocks.forEach(function(el){
      if (!el.movable) {
        total++;
      }
    });
    return total;
  },

  _isBlockGroupLimitReached: function(t) {
    if (_.isUndefined(this.options.blockGroupLimit)) { return false; }
    var limits = this.options.blockGroupLimit;
    var totalGroupCount = 0;
    if (limits.types.indexOf(t) > -1) {
      limits.types.forEach(function(type){
        totalGroupCount += this._getBlockTypeCount(type);
      }, this);
      if (totalGroupCount >= limits.limit) { return true; }
    }
    return false;
  },

  _sendControlLimits: function () {
    this.mediator.trigger('block-controls:setControlsLimits',this.options.blockGroupLimit, this.options.blockTypeLimits);
  },

  _updateControlLimits: function(type, increase) {
    this.mediator.trigger('block-control:updateLimitCounter', type, increase);
    if (!_.isUndefined(this.options.blockGroupLimit)) {
      var limits = this.options.blockGroupLimit;
      if (limits.types.indexOf(type) > -1) {
        limits.types.forEach(function(t){
          if (t !== type){
            this.mediator.trigger('block-control:updateLimitCounter', t, increase);
          }
        }, this);
      }
    }
  }

});

module.exports = BlockManager;

