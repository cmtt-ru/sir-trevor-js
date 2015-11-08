"use strict";

var _ = require('./lodash');
var $ = require('jquery');

var ScribeInterface = require('./scribe-interface');

var config = require('./config');
var utils = require('./utils');
var BlockMixins = require('./block_mixins');

var SimpleBlock = require('./simple-block');
var BlockReorder = require('./block-reorder');
var BlockDeletion = require('./block-deletion');
var BlockClear = require('./block-clear');
var BlockOptions = require('./block-options');
var BlockPositioner = require('./block-positioner');
var EventBus = require('./event-bus');

var Spinner = require('spin.js');

var Block = function(data, instance_id, mediator, options) {
  SimpleBlock.apply(this, arguments);
};

Block.prototype = Object.create(SimpleBlock.prototype);
Block.prototype.constructor = Block;

var delete_template = [
  "<div class='st-block__ui-delete-controls'>",
  "<label class='st-block__delete-label'>",
  "<%= i18n.t('general:delete') %>",
  "</label>",
  "<a class='st-block-ui-btn st-block-ui-btn--confirm-delete st-icon' data-icon='tick'></a>",
  "<a class='st-block-ui-btn st-block-ui-btn--deny-delete st-icon' data-icon='close'></a>",
  "</div>"
].join("\n");

var clear_template = [
  "<div class='st-block__ui-delete-controls'>",
  "<label class='st-block__delete-label'>",
  "<%= i18n.t('general:delete') %>",
  "</label>",
  "<a class='st-block-ui-btn st-block-ui-btn--confirm-delete st-icon' data-icon='tick'></a>",
  "<a class='st-block-ui-btn st-block-ui-btn--deny-delete st-icon' data-icon='close'></a>",
  "</div>"
].join("\n");

var options_basic_template = [
  "<div class='st-block__ui-options-controls'>",
  "<% for (var i = 0; i < data.length; i++) { %>",
  "<div class='st-block__ui-options-controls-group' data-option='<%= data[i].slug %>'>",
  "<label class='st-block__options-label'>",
  //"<%= i18n.t('general:options') %>",
  "<%= data[i].label %>",
  "</label>",
  "<% for (var j = 0; j < data[i].options.length; j++) { %>",
  "<% data[i].options[j].icon ? iconClass = ' st-icon' : iconClass = '' %>",
  "<a class='st-block-ui-btn st-block-ui-btn--confirm-options <%= iconClass %>' data-icon='<%= data[i].options[j].icon %>' data-value='<%= data[i].options[j].value %>' data-name='<%= data[i].slug %>'><%= data[i].options[j].label %></a>",
  "<% } %>",
  "</div>",
  "<% } %>",
  "<div class='st-block__ui-options-controls-group'>",
  "<label class='st-block__options-label'>&nbsp;</label>",
  "<a class='st-block-ui-btn st-block-ui-btn--deny-options st-icon' data-icon='close'></a>",
  "</div>",
  "</div>"
].join("\n");

Object.assign(Block.prototype, SimpleBlock.fn, require('./block-validations'), {

  bound: [
    "_handleContentPaste", "_onFocus", "_onBlur", "onDrop", "onDeleteClick", "onOptionsClick",
    "clearInsertedStyles", "getSelectionForFormatter", "onBlockRender",
  ],

  className: 'st-block st-icon--add',

  attributes: function() {
    return Object.assign(SimpleBlock.fn.attributes.call(this), {
      'data-icon-after' : "add"
    });
  },

  icon_name: 'default',

  validationFailMsg: function() {
    return i18n.t('errors:validation_fail', { type: this.title });
  },

  editorHTML: '<div class="st-block__editor"></div>',

  toolbarEnabled: true,

  availableMixins: ['droppable', 'pastable', 'uploadable', 'fetchable',
    'ajaxable', 'controllable', 'multi_editable', 'deletable', 'movable'],

  droppable: false,
  pastable: false,
  uploadable: false,
  fetchable: false,
  ajaxable: false,
  multi_editable: false,
  deletable: true,
  movable: true,

  // Array for special block options, selected from UI and serialized from hidden input. {icon: 'icon', value: 'value', default: true}
  // blockOptions: [],

  drop_options: {},
  paste_options: {},
  upload_options: {},

  options_template: '',

  formattable: true,

  _previousSelection: '',

  initialize: function() {},

  toMarkdown: function(markdown){ return markdown; },
  toHTML: function(html){ return html; },

  withMixin: function(mixin) {
    if (!_.isObject(mixin)) { return; }

    var initializeMethod = "initialize" + mixin.mixinName;

    if (_.isUndefined(this[initializeMethod])) {
      Object.assign(this, mixin);
      this[initializeMethod]();
    }
  },

  render: function() {
    this.beforeBlockRender();
    this._setBlockInner();

    this.$editor = this.$inner.children().first();

    this.mixinsRequireInputs = false;
    this.availableMixins.forEach(function(mixin) {
      if (this[mixin]) {
        var blockMixin = BlockMixins[utils.classify(mixin)];
        if (!_.isUndefined(blockMixin.requireInputs) && blockMixin.requireInputs) {
          this.mixinsRequireInputs = true;
        }
      }
    }, this);

    if(this.mixinsRequireInputs) {
      var input_html = $("<div>", { 'class': 'st-block__inputs' });
      this.$inner.append(input_html);
      this.$inputs = input_html;
    }

    if (this.hasTextBlock()) { this._initTextBlocks(); }

    this.availableMixins.forEach(function(mixin) {
      if (this[mixin]) {
        this.withMixin(BlockMixins[utils.classify(mixin)]);
      }
    }, this);

    if (this.formattable) { this._initFormatting(); }

    this._blockPrepare();

    return this;
  },

  remove: function() {
    if (this.ajaxable) {
      this.resolveAllInQueue();
    }

    this.$el.remove();
  },

  loading: function() {
    if(!_.isUndefined(this.spinner)) { this.ready(); }

    this.spinner = new Spinner(config.defaults.spinner);
    this.spinner.spin(this.$el[0]);

    this.$el.addClass('st--is-loading');
  },

  ready: function() {
    this.$el.removeClass('st--is-loading');
    if (!_.isUndefined(this.spinner)) {
      this.spinner.stop();
      delete this.spinner;
    }
  },

  /* Generic _serializeData implementation to serialize the block into a plain object.
   * Can be overwritten, although hopefully this will cover most situations.
   * If you want to get the data of your block use block.getBlockData()
   */
  _serializeData: function() {
    utils.log("toData for " + this.blockID);

    var data = {};

    /* Simple to start. Add conditions later */
    if (this.hasTextBlock()) {
      data.text = this.getTextBlockHTML();
      data.format = 'html';
    }

    // Add any inputs to the data attr
    if (this.$(':input').not('.st-paste-block').length > 0) {
      this.$(':input').each(function(index,input){
        if (input.getAttribute('name')) {
          data[input.getAttribute('name')] = input.value;
        }
      });
    }

    return data;
  },

  /* Generic implementation to tell us when the block is active */
  focus: function() {
    this.getTextBlock().focus();
  },

  blur: function() {
    this.getTextBlock().blur();
  },

  onFocus: function() {
    this.getTextBlock().bind('focus', this._onFocus);
  },

  onBlur: function() {
    this.getTextBlock().bind('blur', this._onBlur);
  },

  /*
   * Event handlers
   */

  _onFocus: function() {
    this.trigger('blockFocus', this.$el);
  },

  _onBlur: function() {},

  onBlockRender: function() {
    this.focus();
  },

  onDrop: function(dataTransferObj) {},

  onDeleteClick: function(ev) {
    ev.preventDefault();

    var onDeleteConfirm = function(e) {
      e.preventDefault();
      this.mediator.trigger('block:remove', this.blockID);
      this.remove();
    };

    var onDeleteDeny = function(e) {
      e.preventDefault();
      this.$el.removeClass('st-block--delete-active');
      this.$ui.show();
      $delete_el.remove();
    };

    if (this.isEmpty()) {
      onDeleteConfirm.call(this, new Event('click'));
      return;
    }

    this.$inner.append(_.template(delete_template));
    this.$ui.hide();
    this.$el.addClass('st-block--delete-active');

    var $delete_el = this.$inner.find('.st-block__ui-delete-controls');

    this.$inner.on('click', '.st-block-ui-btn--confirm-delete',
                   onDeleteConfirm.bind(this))
                   .on('click', '.st-block-ui-btn--deny-delete',
                       onDeleteDeny.bind(this));
  },

  onClearClick : function(ev) {
    ev.preventDefault();

    var onClearConfirm = function(e) {
      e.preventDefault();
      //this.mediator.trigger('block:render', this);
      this.$editor.hide();
      this.$inputs.find('input').val('');
      this.$inputs.show();
      if ($clear_el) {
        $clear_el.remove();
      }
      this.$el.removeClass('st-block--delete-active');
      this.mediator.trigger('block:showBlockControlsOnBottom');
    };

    var onClearDeny = function(e) {
      e.preventDefault();
      this.$el.removeClass('st-block--delete-active');
      $clear_el.remove();
    };

    if (this.isEmpty()) {
      onClearConfirm.call(this, new Event('click'));
      return;
    }

    this.$inner.append(_.template(clear_template));
    this.$el.addClass('st-block--delete-active');

    var $clear_el = this.$inner.find('.st-block__ui-delete-controls');

    this.$inner.on('click', '.st-block-ui-btn--confirm-delete',
        onClearConfirm.bind(this))
        .on('click', '.st-block-ui-btn--deny-delete',
        onClearDeny.bind(this));
  },

  onOptionsClick: function(ev) {
    ev.preventDefault();

    var onOptionsConfirm = function(e) {
      e.preventDefault();
      var value = $(e.target).attr('data-value');
      var inputName = $(e.target).attr('data-name');

      // Set value
      this.$option.filter('[name=' + inputName + ']').val(value);

      // Update class
      this.setOptionClass(inputName, value);

      this.$el.removeClass('st-block--options-active');
      this.$ui.show();
      $options_el.remove();
    };

    var onOptionsDeny = function(e) {
      e.preventDefault();
      this.$el.removeClass('st-block--options-active');
      this.$ui.show();
      $options_el.remove();
    };

    if (this.isEmpty()) {
      onOptionsConfirm.call(this, new Event('click'));
      return;
    }

    this.$inner.append(_.template(this.options_template));

    // set active btns
    this.$option.filter('input').each($.proxy(function(key, input){
      var group = $(input).attr('name');
      var value = $(input).val();
      this.$inner.find('[data-option="' + group +'"] [data-value="' + value + '"]').addClass('st-block-ui-btn--selected');
    }, this));
    
    this.$ui.hide();
    this.$el.addClass('st-block--options-active');

    var $options_el = this.$inner.find('.st-block__ui-options-controls');

    this.$inner.on('click', '.st-block-ui-btn--confirm-options',
        onOptionsConfirm.bind(this))
        .on('click', '.st-block-ui-btn--deny-options',
        onOptionsDeny.bind(this));
  },

  setOptionClass: function (optionName, value) {
    var clearClass = new RegExp("\\s\\bblock-option-" + optionName + "-\\w+\\b","g");

    this.$el.attr(
        'class',
        this.$el.attr('class').replace(clearClass, '')
    );
    this.$el.addClass('block-option-' + optionName + '-' + value);
  },

  beforeLoadingData: function() {
    this.loading();

    if(this.mixinsRequireInputs) {
      this.$editor.show();
      this.$inputs.hide();
    }

    SimpleBlock.fn.beforeLoadingData.call(this);

    this.loadOptions(this._getData());

    this.ready();
  },

  loadOptions: function(data) { // load options from data
    if (_.isUndefined(this.$option)) { return; }
    this.$option.filter('input').each($.proxy(function(key, val){
      var name = $(val).attr('name');
      if (_.isUndefined(data[name])) {
        var default_val;
        this.blockOptions.some(function(option_group){
          if (option_group.slug === name) {
            option_group.options.some(function(option){
              if (option.default) {
                default_val = option.value;
                return true;
              }
            });
            return true;
          }
        });
        if (default_val) {
          $(val).val(default_val); // set data
          this.setOptionClass(name, default_val); // set class
        }
      }
      else {
        $(val).val(data[name]); // set data
        this.setOptionClass(name, data[name]); // set class
      }
    }, this));
  },

  execTextBlockCommand: function(cmdName) {
    if (_.isUndefined(this._scribe)) {
      throw "No Scribe instance found to send a command to";
    }

    return ScribeInterface.execTextBlockCommand(this._scribe, cmdName);
  },

  queryTextBlockCommandState: function(cmdName) {
    if (_.isUndefined(this._scribe)) {
      throw "No Scribe instance found to query command";
    }

    return ScribeInterface.queryTextBlockCommandState(this._scribe, cmdName);
  },

  _handleContentPaste: function(ev) {
    setTimeout(this.onContentPasted.bind(this, ev, $(ev.currentTarget)), 0);
  },

  _getBlockClass: function() {
    return 'st-block--' + this.className;
  },

  /*
   * Init functions for adding functionality
   */

  _initUIComponents: function() {
    if (this.movable) {
      var positioner = new BlockPositioner(this.$el, this.mediator);


      this._withUIComponent(positioner, '.st-block-ui-btn--reorder',
          positioner.toggle);

      this._withUIComponent(new BlockReorder(this.$el, this.mediator));
    }
    else {
      this.mediator.trigger('block:removeFirstAdd');
      this.mediator.trigger('block:removeAddBtns');

      this.$el.dropArea() // terrible function from block-reorder to handle drop areas
          .bind('drop', $.proxy(function(ev) {
            ev.preventDefault();

            var dropped_on = this.$el,
                item_id = ev.originalEvent.dataTransfer.getData("text/plain"),
                block = $('#' + item_id);

            if (!_.isUndefined(item_id) && !_.isEmpty(block) &&
                dropped_on.attr('id') !== item_id &&
                dropped_on.attr('data-instance') === block.attr('data-instance')
            ) {
              dropped_on.after(block);
            }
            this.mediator.trigger("block:rerender", item_id);
            EventBus.trigger("block:reorder:dropped", item_id);
          }, this));
    }

    if (this.deletable) {
      this._withUIComponent(new BlockDeletion(), '.st-block-ui-btn--delete', this.onDeleteClick.bind(this));
    }

    if (this.clearable) {
      this._withUIComponent(new BlockClear(), '.st-block-ui-btn--delete', this.onClearClick.bind(this));
    }

    if (this.blockOptions && this.blockOptions.length) {
      this._initOptionsUI();
      this._withUIComponent(new BlockOptions(), '.st-block-ui-btn--options',
          this.onOptionsClick);
    }

    this.onFocus();
    this.onBlur();
  },

  _initOptionsUI: function() {
    this.$option = $();
    this.blockOptions.forEach($.proxy(function(option_group){
      var defaultOption = false;
      option_group.slug = utils.toSlug(option_group.name);
      option_group.label = i18n.t('options:' + option_group.slug +':_label');
      if (!option_group.label) { option_group.label = option_group.name }
      option_group.options.forEach(function(option){
        if (option.default) { defaultOption = option.value; }
        option.label = i18n.t('options:' + option_group.slug +':' + option.value);
        if (!option.label) { option.label = option.text}
        if (_.isUndefined(option.text)) { option.text = ''; }
      });
      this.$option = this.$option.add("<input name='" + option_group.slug + "' type='hidden' value='" + defaultOption + "'>");
      this.setOptionClass(option_group.slug, defaultOption);
      this.$el.append(this.$option);
    }, this));
    this.options_template = _.template(options_basic_template)({data: this.blockOptions});
  },

  _initFormatting: function() {

    // Enable formatting keyboard input
    var block = this;

    if (!this.options.formatBar) {
      return;
    }

    this.options.formatBar.commands.forEach(function(cmd) {
      if (_.isUndefined(cmd.keyCode)) {
        return;
      }

      var ctrlDown = false;

      block.$el
        .on('keyup','.st-text-block', function(ev) {
          if(ev.which === 17 || ev.which === 224 || ev.which === 91) {
            ctrlDown = false;
          }
        })
        .on('keydown','.st-text-block', {formatter: cmd}, function(ev) {
          if(ev.which === 17 || ev.which === 224 || ev.which === 91) {
            ctrlDown = true;
          }

          if(ev.which === ev.data.formatter.keyCode && ctrlDown) {
            ev.preventDefault();
            block.execTextBlockCommand(ev.data.formatter.cmd);
          }
        });
    });
  },

  _initTextBlocks: function() {
    this.getTextBlock()
        .bind('keyup', this.getSelectionForFormatter)
        .bind('mouseup', this.getSelectionForFormatter)
        .bind('DOMNodeInserted', this.clearInsertedStyles);

    var textBlock = this.getTextBlock().get(0);
    if (!_.isUndefined(textBlock) && _.isUndefined(this._scribe)) {

      var configureScribe =
        _.isFunction(this.configureScribe) ? this.configureScribe.bind(this) : null;
      this._scribe = ScribeInterface.initScribeInstance(
        textBlock, this.scribeOptions, configureScribe
      );
    }
  },

  getSelectionForFormatter: function() {
    var block = this;
    setTimeout(function() {
      var selection = window.getSelection(),
          selectionStr = selection.toString().trim(),
          en = 'formatter:' + ((selectionStr === '') ? 'hide' : 'position');

      block.mediator.trigger(en, block);
      EventBus.trigger(en, block);
    }, 1);
  },

  clearInsertedStyles: function(e) {
    var target = e.target;
    target.removeAttribute('style'); // Hacky fix for Chrome.
  },

  hasTextBlock: function() {
    return this.getTextBlock().length > 0;
  },

  getTextBlock: function() {
    if (_.isUndefined(this.text_block)) {
      this.text_block = this.$('.st-text-block');
    }

    return this.text_block;
  },

  getTextBlockHTML: function() {
    return this._scribe.getContent();
  },

  setTextBlockHTML: function(html) {
    return this._scribe.setContent(html);
  },

  isEmpty: function() {
    return _.isEmpty(this.getBlockData());
  }

});

Block.extend = require('./helpers/extend'); // Allow our Block to be extended.

module.exports = Block;
