SirTrevor.Blocks.LinkEmbed = (function(){

    return SirTrevor.Block.extend({

        type: "link_embed",
        title: function() { return i18n.t('blocks:link_embed:title'); },
        title_drop: function() { return i18n.t('blocks:link_embed:drop'); },
        pastable: true,
        droppable: true,
        fetchable: true,
        icon_name: 'link',
        drop_options: { re_render_on_reorder: true },
        contentFetched: false,

        fetchUrl: function(url) {
            return '/club/linkInfo?url=' + url;
        },

        loadData: function(data){
            this.$editor.html($('<div>', { style: "background-image: url(" + data.image + ")" })).show();
            this.$editor.append($('<b>').html(data.title));
            this.$editor.append($('<u>').html(data.url.replace(/http:\/\//g, "").replace(/https:\/\//g, "")).prepend($('<i>').addClass("stcustomicon-link")) );
            this.$editor.append($('<p>').html(data.description));
            if (data.url) {
                this.contentFetched = true;
            }
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

            this.fetch(ajaxOptions, this.onSuccess, this.onFail);
        },

        onSuccess: function(data) {
            this.setAndLoadData(data);
            this.ready();
            this.contentFetched = true;
        },

        onFail: function() {
            this.addMessage(i18n.t("blocks:link_embed:fetch_error"));
            this.ready();
        },

        onDrop: function(transferData){
            var url = transferData.getData('text/plain');
            this.handleDropPaste(url);
        },

        validations: ['linkValidation'],

        linkValidation: function() {
            if (!this.contentFetched) {
                var field = this.$('[type="text"]');
                var errorLabel = '';
                if (i18n.t("blocks:link_embed:empty_error")) {
                    errorLabel = i18n.t("blocks:link_embed:empty_error");
                }
                else {
                    errorLabel = i18n.t("errors:block_empty", { name: i18n.t("blocks:link_embed:title") });
                }
                this.setError(field, errorLabel);
                return false;
            }
            return true;
        },

        onBlockRender: function() {
            this.$inputs.find('input').on('blur', $.proxy(function (e) {
                var url = $(e.target).val()
                if (url) { this.handleDropPaste(url); }
            }, this) );
        }
    });
})();