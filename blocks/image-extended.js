SirTrevor.Blocks.ImageExtended = SirTrevor.Blocks.Image.extend({
  type: "image_extended",
  title: function() { return i18n.t('blocks:image:title'); },
  title_drop: function() { return i18n.t('blocks:image:drop'); },

  droppable: true,
  pastable: true,
  uploadable: true,

  icon_name: 'image',

  isCover: false,

  blockOptions: [{name:'Background',options:[{text: 'dr', value: 'dark'},{text: 'lt', value: 'light'},{text: 'no', value: false, default: true}]},{name:'Border',options:[{text:'yes',value:true},{text:'no',value:false,default: true}]}],

  fetchUrl: function() {
    return "/club/fetchImage";
  },

  loadData: function(data, beforeUpload){
    // Create our image tag
    var url;
    if (!data.file[0]) { url = data.file.url } else { url = data.file[0].url }

    this.$editor.html($('<img>', { src: url })).show();
    if (!beforeUpload && url) {
      this.notEmptyUpload = true; // allow validation
    }
    if (data.cover) { this.isCover = true; }
    this.$editor.append($('<input>', {type: 'text', class: 'st-input-string js-caption-input', name: 'caption', placeholder: i18n.t('blocks:image:caption'), style: '', value: data.caption, onblur: 'this.placeholder = i18n.t("blocks:image:caption")', onfocus: 'this.placeholder = ""'}));
  },

  onBlockRender: function(){
    /* Setup the upload button */
    this.$inputs.find('button').bind('click', function(ev){ ev.preventDefault(); });
    this.$inputs.find('input[type=file]').on('change', $.proxy(function(ev){
      this.onDrop(ev.currentTarget);
    }, this)).prop('accept','image/*');

    this.$set_cover_ui = $('<a class="st-block-ui-btn st-block-ui-image-cover">' + (this.isCover ? i18n.t('blocks:image:cover') : i18n.t('blocks:image:set_cover')) + '</a>');
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

  onContentPasted: function(event){
    var input = $(event.target),
      val = input.val();
    $.post(this.fetchUrl(), {url: val}, $.proxy(function(data){
      if (data.error){
        this.addMessage(i18n.t('blocks:image:upload_error'));
      }
      else {
        this.ready();
        this.setData(data);
        this.notEmptyUpload = true;
        this.$inputs.hide();
        this.loadData(data, true);
      }
    }, this));
  },


  onDrop: function(transferData){
    var file = transferData.files[0],
      urlAPI = (typeof URL !== "undefined") ? URL : (typeof webkitURL !== "undefined") ? webkitURL : null;

    // Handle one upload at a time
    if (/image/.test(file.type)) {
      this.loading();
      // Show this image on here
      this.$inputs.hide();
      this.loadData({file: {url: urlAPI.createObjectURL(file)}}, true);

      this.uploader(
        file,
        function(data) {
          this.setData(data);
          this.ready();
          this.notEmptyUpload = true;
        },
        function(error){
          this.addMessage(i18n.t('blocks:image:upload_error'));
          this.ready();
        }
      );
    }
  }

});