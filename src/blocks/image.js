"use strict";

var $ = require('jquery');
var Block = require('../block');

module.exports = Block.extend({

  type: "image",
  title: function() { return i18n.t('blocks:image:title'); },

  droppable: true,
  uploadable: true,

  icon_name: 'image',

  notEmptyUpload: false,

  loadData: function(data){
    // Create our image tag
    this.$editor.html($('<img>', { src: data.file.url }));
    if (data.file.url) {
      this.notEmptyUpload = true;
    }
  },

  onBlockRender: function(){
    /* Setup the upload button */
    this.$inputs.find('button').bind('click', function(ev){ ev.preventDefault(); });
    this.$inputs.find('input').on('change', (function(ev) {
      this.onDrop(ev.currentTarget);
    }).bind(this));
  },

  onDrop: function(transferData){
    var file = transferData.files[0],
        urlAPI = (typeof URL !== "undefined") ? URL : (typeof webkitURL !== "undefined") ? webkitURL : null;

    // Handle one upload at a time
    if (/image/.test(file.type)) {
      this.loading();
      // Show this image on here
      this.$inputs.hide();
      this.$editor.html($('<img>', { src: urlAPI.createObjectURL(file) })).show();

      this.uploader(
        file,
        function(data) {
          this.setData(data);
          this.ready();
          this.notEmptyUpload = true;
        },
        function(error) {
          this.addMessage(i18n.t('blocks:image:upload_error'));
          this.ready();
        }
      );
    }
  },

  validations: ['fileUploadValidation'],

  fileUploadValidation: function() {
    if (!this.notEmptyUpload) {
      var field = this.$('[type="file"]');
      this.setError(field, i18n.t("errors:block_empty",
          { name: i18n.t("blocks:image:title") }));
      return false;
    }
    return true;
  },
});
