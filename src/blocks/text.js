"use strict";

/*
  Text Block
*/

var Block = require('../block');
var stToHTML = require('../to-html');

var _ = require('../lodash');

module.exports = Block.extend({

  type: "text",

  title: function() { return i18n.t('blocks:text:title'); },

  editorHTML: '<div class="st-required st-text-block" contenteditable="true" data-st-name="<%= title %>" placeholder="<%= placeholder %>"></div>',

  scribeOptions: {
    allowBlockElements: true,
    tags: {
      p: true,
      br: false,
      b: true,
      i: true
    }
  },

  icon_name: 'text',

  loadData: function(data){
    if (this.options.convertFromMarkdown && data.format !== "html") {
      this.setTextBlockHTML(stToHTML(data.text, this.type));
    } else {
      this.setTextBlockHTML(data.text);
    }
  },

  beforeBlockRender: function() {
    this.editorHTML = _.template(this.editorHTML, {title: i18n.t('blocks:text:title'), placeholder: i18n.t('blocks:text:placeholder')});
  }
});
