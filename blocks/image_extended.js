SirTrevor.Blocks.ImageExtended = SirTrevor.Blocks.Image.extend({
    type: "image_extended",
    title: function() { return i18n.t('blocks:image:title'); },

    droppable: true,
    uploadable: true,

    icon_name: 'image',


    loadData: function(data){
        // Create our image tag
        this.$editor.html($('<img>', { src: function () { if (!data.file[0]) { return data.file.url } else { return data.file[0].url } }})).show();
        this.$editor.append($('<input>', {type: 'text', class: 'st-input-string js-caption-input', name: 'caption', placeholder: i18n.t('blocks:image:caption'), style: '', value: data.caption}));
    },

    onBlockRender: function(){
        /* Setup the upload button */
        this.$inputs.find('button').bind('click', function(ev){ ev.preventDefault(); });
        this.$inputs.find('input').on('change', $.proxy(function(ev){
            this.onDrop(ev.currentTarget);
        }, this)).prop('accept','image/*');

        this.isCover = false;

        this.$set_cover_ui = $('<a class="st-block-ui-btn st-block-ui-image-cover">' + i18n.t('blocks:image:set_cover') + '</a>');
        this.$ui.append(this.$set_cover_ui);
        this.$set_cover_ui.bind('click', this.onCoverClicked.bind(this));

        this.$coverInput = $("<input name='cover' type='hidden' value='" + this.isCover + "'>");
        this.$el.append(this.$coverInput);
    },

    onCoverClicked: function(ev){
        ev.preventDefault();
        this.isCover = !this.isCover;
        this.mediator.trigger('block:removeCover', this.blockStorage.type, this.blockID);
    },

    onDrop: function(transferData){
        var file = transferData.files[0],
            urlAPI = (typeof URL !== "undefined") ? URL : (typeof webkitURL !== "undefined") ? webkitURL : null;

        // Handle one upload at a time
        if (/image/.test(file.type)) {
            this.loading();
            // Show this image on here
            this.$inputs.hide();
            this.loadData({file: {url: urlAPI.createObjectURL(file)}});

            this.uploader(
                file,
                function(data) {
                    this.setData(data);
                    this.ready();
                },
                function(error){
                    this.addMessage(i18n.t('blocks:image:upload_error'));
                    this.ready();
                }
            );
        }
    }

});