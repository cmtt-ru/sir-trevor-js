SirTrevor.Blocks.Instagram = (function(){

    return SirTrevor.Block.extend({

        type: "instagram",
        title: function() { return i18n.t('blocks:instagram:title'); },
        title_drop: function() { return i18n.t('blocks:instagram:drop'); },
        pastable: true,
        droppable: true,
        fetchable: true,
        icon_name: 'image',
        drop_options: { re_render_on_reorder: true },
        lastURL: null,
        lastEmbed: null,
        contentFetched: false,

        fetchUrl: function(url) {
            return "https://api.instagram.com/oembed?callback=?&omitscript=1&url=" + url;
        },

        loadData: function(data){
            if ($.type(data.instagram_url) === 'undefined') { data.instagram_url = ''; }

            if (typeof lastEmbed !== 'undefined' && lastEmbed !== null) {
                this.$editor.html(lastEmbed);

                if (typeof instgrm !== 'undefined') {
                    instgrm.Embeds.process();
                }
            } else {
                this.handleInstagramDropPaste(data.instagram_url);
            }
        },

        onContentPasted: function(event){
            var input = $(event.target),
                val = input.val();
            this.handleInstagramDropPaste(val);
        },

        handleInstagramDropPaste: function(url){
            if (!this.validInstagramUrl(url)) {
                console.log("Invalid Instagram URL");
                return;
            }
            this.loading();
            url = url.replace('instagr.am', 'instagram.com');
            var ajaxOptions = {
                url: this.fetchUrl(url),
                dataType: "json"
            };
            this.lastEmbed = null;
            this.lastURL = url;

            this.fetch(ajaxOptions, this.onSuccess, this.onFail);
        },

        validInstagramUrl: function(url) {
            return (/^https?:\/\/(www.)?instagr(\.am|am\.com)\/p\/[a-zA-Z0-9-_]+/.test(url));
        },

        onSuccess: function(data) {
            lastEmbed = data.html;
            this.setAndLoadData({ instagram_url: this.lastURL });
            this.ready();
            this.lastURL = null;
            this.contentFetched = true;
        },

        onFail: function() {
            this.addMessage(i18n.t("blocks:instagram:fetch_error"));
            this.ready();
        },

        onDrop: function(transferData){
            var url = transferData.getData('text/plain');
            this.handleInstagramDropPaste(url);
        },

        validations: ['instagramValidation'],

        instagramValidation: function() {
            if (!this.contentFetched) {
                var field = this.$('[type="text"]');
                var errorLabel = '';
                if (i18n.t("blocks:instagram:empty_error")) {
                    errorLabel = i18n.t("blocks:instagram:empty_error");
                }
                else {
                    errorLabel = i18n.t("errors:block_empty", { name: i18n.t("blocks:instagram:title") });
                }
                this.setError(field, errorLabel);
                return false;
            }
            return true;
        },

    });

})();