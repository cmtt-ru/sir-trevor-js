"use strict";

/*
  Heading Block
*/

var Block = require('../block');
var stToHTML = require('../to-html');

var _ = require('../lodash');

module.exports = Block.extend({

  type: 'heading',

  title: function(){ return i18n.t('blocks:heading:title'); },

  editorHTML: '<h2 class="st-required st-text-block st-text-block--heading" contenteditable="true" data-st-name="<%= title %>"></h2>',

  scribeOptions: { 
    allowBlockElements: false,
    tags: {
      p: false
    }
  },

  icon_name: 'heading',

  loadData: function(data){
    if (this.options.convertFromMarkdown && data.format !== "html") {
      this.setTextBlockHTML(stToHTML(data.text, this.type));
    } else {
      this.setTextBlockHTML(data.text);
    }
  },

  beforeBlockRender: function() {
    this.editorHTML = _.template(this.editorHTML, {title: i18n.t('blocks:heading:title')});
  }
});
