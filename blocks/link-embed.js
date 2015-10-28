SirTrevor.Blocks.LinkEmbed =  (function(){

    return SirTrevor.Block.extend({

        type: "link_embed",
        title: function() { return i18n.t('blocks:link_embed:title'); },
        pastable: true,
        droppable: true,
        fetchable: true,
        deletable: false,
        movable: false,
        icon_name: 'link',
        drop_options: { re_render_on_reorder: true },
        lastURL: null,
        lastEmbed: null,
        toolbarEnabled: false,

        fetchUrl: function(url) {
            return '/helper/ogtags?url=' + url;
        },

        loadData: function(data){
            this.$editor.html($('<div>', { style: "background-image: url(" + data.image + ")" })).show();
            this.$editor.append($('<b>').html(data.title));
            this.$editor.append($('<u>').html(data.url));
            this.$editor.append($('<p>').html(data.description));
        },

        onContentPasted: function(event){
            var input = $(event.target),
                val = input.val();
            this.handleDropPaste(val);
        },

        handleDropPaste: function(url){
            this.loading();

            var ajaxOptions = {
                url: this.fetchUrl(url),
                dataType: "json"
            };

            lastEmbed = null;
            lastURL = url;

            this.fetch(ajaxOptions, this.onSuccess, this.onFail);
        },

        onSuccess: function(data) {
            lastEmbed = data.html;
            this.setAndLoadData(data);
            this.ready();
            lastURL = null;
        },

        onFail: function() {
            this.addMessage(i18n.t("blocks:instagram:fetch_error"));
            this.ready();
        },

        onDrop: function(transferData){
            var url = transferData.getData('text/plain');
            this.handleDropPaste(url);
        }

    });

})();