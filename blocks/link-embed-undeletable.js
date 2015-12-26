SirTrevor.Blocks.LinkEmbedUndeletable = SirTrevor.Blocks.LinkEmbed.extend({
  type: "link_embed_undeletable",
  deletable: false,
  movable: false,
  toolbarEnabled: false,
  clearable: true,

  onClear: function() {
    this.contentFetched = false;
    this.$inputs.find('input').on('blur', $.proxy(function (e) {
      var url = $(e.target).val();
      if (url && !this.contentFetched) { this.handleDropPaste(url); }
    }, this) );
  }
});