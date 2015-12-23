SirTrevor.Blocks.Wtrfall = (function(){

  return SirTrevor.Block.extend({

    type: "wtrfall",

    title: function() { return i18n.t('blocks:wtrfall:title'); },

    icon_name: 'image',

    editorHTML: function() {
      return '<label>' + i18n.t("blocks:wtrfall:label") + '<input maxlength="140" name="id" placeholder="' + i18n.t("blocks:wtrfall:placeholder") + '" class="st-input-string st-required js-wtrfall-input" type="text" /></label>';
    },

    loadData: function(data){
      this.$('.js-wtrfall-input').val(data.id);
    }
  });


})();