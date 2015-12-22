SirTrevor.Blocks.Gallery = SirTrevor.Blocks.Image.extend({
  type: "gallery",
  title: function() { return i18n.t('blocks:gallery:title'); },
  title_drop: function() { return i18n.t('blocks:gallery:drop'); },

  droppable: true,
  pastable: true,
  uploadable: true,

  icon_name: 'image',

  upload_options: {
    html: [
      '<div class="st-block__upload-container">',
      '<input type="file" type="st-file-upload" multiple>',
      '<button class="st-upload-btn"><%= i18n.t("general:upload") %></button>',
      '</div>'
    ].join('\n')
  },

  blockOptions: [{name:'Background',options:[{text: 'dr', value: 'dark'},{text: 'lt', value: 'light'},{text: 'no', value: false, default: true}]},{name:'Border',options:[{text:'yes',value:true},{text:'no',value:false,default: true}]}],

  fetchUrl: function(type) {
    if (type === 'instagram') {
      return "/club/fetchImageInstagram";
    }
    else {
      return "/club/fetchImage";
    }
  },

  loadData: function(data){
    if (data.files.length > 0) {
      data.files.forEach($.proxy(function(file){
        var $i = $('<div>', { class: 'st-gallery-item', 'data-url': file.url, 'data-bigurl': file.bigUrl, 'data-width': file.width,'data-height': file.height });
        $i.append('<img src="' + file.url +'">');
        $i.append('<a class="st-block-ui-btn st-block-ui-btn--delete st-icon"></a>');
        $i.find('a').click(function(e){
          $i.remove();
        });
        this.$editor.append($i).sortable();
      }, this));
      this.notEmptyUpload = true; // allow validation
    }
  },

  addImage: function(data, beforeUpload){
    // Create our image tag
    var url;

    if (!data.file[0]) { url = data.file.url } else { url = data.file[0].url }

    var $i = $('<img>', { src: url, class: 'st-gallery-item', 'data-url': data.file.url, 'data-bigurl': data.file.bigUrl, 'data-width': data.file.width,'data-height': data.file.height });
    this.$editor.append($i).show().sortable();
    if (!beforeUpload && url) {
      this.notEmptyUpload = true; // allow validation
    }
  },

  onBlockRender: function(){
    this.$inputs.show();
    this.$inputs.find('button').bind('click', function(ev){ ev.preventDefault(); });
    this.$inputs.find('input[type=file]').on('change', $.proxy(function(ev){
      this.onDrop(ev.currentTarget);
    }, this)).prop('accept','image/*');
  },

  onContentPasted: function(event){
    var input = $(event.target),
      url = input.val(),
      type = '';

    if (/^https?:\/\/(www.)?instagr(\.am|am\.com)\/p\/[a-zA-Z0-9-_]+/.test(url)) {
      type = 'instagram';
    };

    this.$inputs.find('input').prop('disabled', true);
    this.$inputs.find('button').prop('disabled', true);

    this.loading();

    $.post(this.fetchUrl(type), {url: url}, $.proxy(function(data){
      if (data.error){
        this.addMessage(i18n.t('blocks:gallery:upload_error'));
      }
      else {
        input.val('');
        this.$inputs.find('input').prop('disabled', false);
        this.$inputs.find('button').prop('disabled', false);
        this.notEmptyUpload = true;
        this.addImage(data, true);
        this.ready();
      }
    }, this));
  },


  onDrop: function(transferData) {
    var urlAPI = (typeof URL !== "undefined") ? URL : (typeof webkitURL !== "undefined") ? webkitURL : null,
      fileCount = transferData.files.length;

    var i = 0;

    this.$inputs.find('input').prop('disabled', true);
    this.$inputs.find('button').prop('disabled', true);

    // Chain uploads
    function next() {
      if (i < fileCount) {
        var file = transferData.files[i];
        ++i;
        if (/image/.test(file.type)) {
          this.loading();
          // Show this image on here

          this.uploader(
            file,
            function (data) {
              this.addImage(data, true);
              this.notEmptyUpload = true;
              boundNext();
            },
            function (error) {
              this.addMessage(i18n.t('blocks:gallery:upload_error'));
              this.ready();
            }
          );
        }
      }
      else {
        // All done
        this.$inputs.find('input').prop('disabled', false);
        this.$inputs.find('button').prop('disabled', false);
        this.ready();
      }
    }

    var boundNext = next.bind(this);
    boundNext();
  },

  _serializeData: function() {

    var data = {};

    /* Simple to start. Add conditions later */
    if (this.hasTextBlock()) {
      data.text = this.getTextBlockHTML();
      data.format = 'html';
    }

    // Add any inputs to the data attr
    if (this.$(':input').not('.st-paste-block').length > 0) {
      this.$(':input').each(function(index,input){
        if (input.getAttribute('name')) {
          var value = input.value;
          if (value === 'true') { value = true; }
          if (value === 'false') { value = false; }
          data[input.getAttribute('name')] = value;
        }
      });
    }

    $('.st-block__editor .st-gallery-item').each(function(){
      var img = $(this);
      data.files = data.files || [];
      data.files.push({url: img.attr('data-url'), bigUrl:img.attr('data-bigurl'), width:img.attr('data-width'), height:img.attr('data-height')});
    });

    return data;
  }

});
