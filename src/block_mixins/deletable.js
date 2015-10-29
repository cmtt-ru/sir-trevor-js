"use strict";

var _ = require('../lodash');

var delete_template = [
  "<div class='st-block__ui-delete-controls'>",
  "<label class='st-block__delete-label'>",
  "<%= i18n.t('general:delete') %>",
  "</label>",
  "<a class='st-block-ui-btn st-block-ui-btn--confirm-delete st-icon' data-icon='tick'></a>",
  "<a class='st-block-ui-btn st-block-ui-btn--deny-delete st-icon' data-icon='close'></a>",
  "</div>"
].join("\n");

module.exports = {

  mixinName: "Deletable",

  initializeDeletable: function() {

    this.onDeleteClick = function(ev) {
      ev.preventDefault();

      var onDeleteConfirm = function(e) {
        e.preventDefault();
        this.mediator.trigger('block:remove', this.blockID);
        this.remove();
        this.mediator.trigger('block:showBlockControlsOnBottom');
      };

      var onDeleteDeny = function(e) {
        e.preventDefault();
        this.$el.removeClass('st-block--delete-active');
        $delete_el.remove();
      };

      if (this.isEmpty()) {
        onDeleteConfirm.call(this, new Event('click'));
        return;
      }

      this.$inner.append(_.template(delete_template));
      this.$el.addClass('st-block--delete-active');

      var $delete_el = this.$inner.find('.st-block__ui-delete-controls');

      this.$inner.on('click', '.st-block-ui-btn--confirm-delete',
          onDeleteConfirm.bind(this))
          .on('click', '.st-block-ui-btn--deny-delete',
          onDeleteDeny.bind(this));
    };

    //this.onDeleteClick = false;


  },

};
