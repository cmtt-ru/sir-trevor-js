"use strict";

var _ = require('../lodash');
var utils = require('../utils');
var Block = require('../block');

module.exports = Block.extend({

  // more providers at https://gist.github.com/jeffling/a9629ae28e076785a14f
  providers: {
    vimeo: {
      regex: /(?:http[s]?:\/\/)?(?:www.)?vimeo\.co(?:.+(?:\/)([^\/].*)+$)/,
      html: "<iframe src=\"<%= protocol %>//player.vimeo.com/video/<%= remote_id %>?title=0&byline=0\" width=\"580\" height=\"320\" frameborder=\"0\"></iframe>"
    },
    youtube: {
      regex: /^.*(?:(?:youtu\.be\/)|(?:youtube\.com)\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*)/,
      html: "<iframe src=\"<%= protocol %>//www.youtube.com/embed/<%= remote_id %>\" width=\"580\" height=\"320\" frameborder=\"0\" allowfullscreen></iframe>"
    }
  },

  type: 'video',
  title: function() { return i18n.t('blocks:video:title'); },
  title_drop: function() { return i18n.t('blocks:video:drop'); },

  droppable: true,
  pastable: true,

  icon_name: 'video',
  contentFetched: false,

  loadData: function(data){
    if (!this.providers.hasOwnProperty(data.source)) { return; }

    var source = this.providers[data.source];

    var protocol = window.location.protocol === "file:" ? 
      "http:" : window.location.protocol;

    var aspectRatioClass = source.square ?
      'with-square-media' : 'with-sixteen-by-nine-media';

    var source_id = '';
    if (data.time) {
      source_id = data.remote_id + source.timestamp + data.time;
    }
    else {
      source_id = data.remote_id;
    }

    console.log('time', data.time, source_id);

    this.$editor
      .addClass('st-block__editor--' + aspectRatioClass)
      .html(_.template(source.html, {
        protocol: protocol,
        remote_id: source_id,
        width: this.$editor.width() // for videos like vine
      }));

    this.contentFetched = true;
  },

  onContentPasted: function(event){
    this.handleDropPaste(event.target.value);
  },

  matchVideoProvider: function(provider, index, url) {
    var match = provider.regex.exec(url);
    if(match == null || _.isUndefined(match[1])) { return {}; }

    console.log('match', match);

    var videoData = {
      source: index,
      remote_id: match[1]
    };

    if (!_.isUndefined(match[2])){
      videoData.time = match[2];
    }

    return videoData;
  },

  isValidVideoUrl: function(url) {
    if (!utils.isURI(url)) { return false; }
    var found = false;

    for(var key in this.providers) {
      if (!this.providers.hasOwnProperty(key)) { continue; }
      var provider = this.providers[key];
      var match = provider.regex.exec(url);
      if(match !== null && !_.isUndefined(match[1])) { found = true; }
    }
    return found;
  },

  handleDropPaste: function(url){
    if (!this.isValidVideoUrl(url)) { return; }

    for(var key in this.providers) {
      if (!this.providers.hasOwnProperty(key)) { continue; }
      var data = this.matchVideoProvider(this.providers[key], key, url);
      this.setAndLoadData(data);
      if (data.remote_id) {
        this.contentFetched = true;
      }
    }
  },

  onDrop: function(transferData){
    var url = transferData.getData('text/plain');
    this.handleDropPaste(url);
  },

  validations: ['videoValidation'],

  videoValidation: function() {
    if (!this.contentFetched) {
      var field = this.$('[type="text"]');
      this.setError(field, i18n.t("errors:block_empty",
          { name: i18n.t("blocks:video:title") }));
      return false;
    }
    return true;
  },

  onBlockRender: function () {
    var $providers = this.$inputs.append('<div class="st-video-providers"></div>');
    for (var provider in this.providers) {
      if (this.providers.hasOwnProperty(provider)){
        $providers.find('.st-video-providers').append('<div class="st-video-providers_el st-video-providers_el--' + provider + '"></div>');
      }
    }
  }

});

