SirTrevor.Blocks.Rawhtml = (function(){

  return SirTrevor.Block.extend({

    type: "rawhtml",

    title: function() { return i18n.t('blocks:rawhtml:title'); },

    icon_name: 'image',

    editorHTML: function() {
      return '<label>' + i18n.t("blocks:rawhtml:label") + '<textarea name="raw" placeholder="' + i18n.t("blocks:rawhtml:placeholder") + '" class="st-input-string st-required js-wtrfall-input" type="text" /></label>';
    },

    loadData: function(data){
      this.$('.js-rawhtml-input').val(data.cite);
    }
  });


})();