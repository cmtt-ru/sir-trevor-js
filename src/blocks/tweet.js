"use strict";

var _ = require('../lodash');
var $ = require('jquery');
var utils = require('../utils');

var Block = require('../block');

var tweet_template = _.template([
  "<blockquote class='twitter-tweet' align='center' <% if (!media) { %> data-cards=\"hidden\" <% } %> <% if (!conversation) { %> data-conversation=\"none\" <% } %>>",
  "<p><%= text %></p>",
  "&mdash; <%= user.name %> (@<%= user.screen_name %>)",
  "<a href='<%= status_url %>' data-datetime='<%= created_at %>'><%= created_at %></a>",
  "</blockquote>",
  '<script src="//platform.twitter.com/widgets.js" charset="utf-8"></script>'
].join("\n"));

module.exports = Block.extend({

  type: "tweet",
  droppable: true,
  pastable: true,
  fetchable: true,

  drop_options: {
    re_render_on_reorder: true
  },

  contentFetched: false,

  blockOptions: [{name:'Media',options:[{text: 'Hide', value: false}, {text: 'Show', value: true, default: true}]},{name:'Conversation', options:[{text:'Hide', value:false, default: true}, {text:'Show', value:true}]}],

  title: function(){ return i18n.t('blocks:tweet:title'); },
  title_drop: function(){ return i18n.t('blocks:tweet:drop'); },

  fetchUrl: function(tweetID) {
    return "/tweets/?tweet_id=" + tweetID;
  },

  icon_name: 'twitter',

  loadData: function(data) {
    if (_.isUndefined(data.status_url)) { data.status_url = ''; }
    this.$inner.find('iframe').remove();
    this.$inner.find('script').remove();
    console.log(data);
    if (!data.media) { data.media = false; }
    if (!data.conversation) { data.conversation = false; }
    this.$inner.prepend(tweet_template(data));
    if (data.id) {
      this.contentFetched = true;
    }
  },

  onContentPasted: function(event){
    // Content pasted. Delegate to the drop parse method
    var input = $(event.target),
      val = input.val();

    // Pass this to the same handler as onDrop
    this.handleTwitterDropPaste(val);
  },

  handleTwitterDropPaste: function(url){
    if (!this.validTweetUrl(url)) {
      utils.log("Invalid Tweet URL");
      return;
    }

    // Twitter status
    var tweetID = url.match(/[^\/]+$/);
    if (!_.isEmpty(tweetID)) {
      this.loading();
      tweetID = tweetID[0];

      var ajaxOptions = {
        url: this.fetchUrl(tweetID),
        dataType: "json"
      };

      this.fetch(ajaxOptions, this.onTweetSuccess, this.onTweetFail);
    }
  },

  validTweetUrl: function(url) {
    return (utils.isURI(url) &&
    url.indexOf("twitter") !== -1 &&
    url.indexOf("status") !== -1);
  },

  onTweetSuccess: function(data) {
    // Parse the twitter object into something a bit slimmer..
    var obj = {
      user: {
        profile_image_url: data.user.profile_image_url,
        profile_image_url_https: data.user.profile_image_url_https,
        screen_name: data.user.screen_name,
        name: data.user.name
      },
      id: data.id_str,
      text: data.text,
      created_at: data.created_at,
      entities: data.entities,
      status_url: "https://twitter.com/" + data.user.screen_name + "/status/" + data.id_str
    };

    this.setAndLoadData(obj);
    this.ready();
  },

  onTweetFail: function() {
    this.addMessage(i18n.t("blocks:tweet:fetch_error"));
    this.ready();
  },

  onDrop: function(transferData){
    var url = transferData.getData('text/plain');
    this.handleTwitterDropPaste(url);
  },

  onBlockRender: function(){
    this.$option.filter('input').on('change',$.proxy(function(){
      var obj = this._getData();
      var opts = this._serializeData();
      obj.media = opts.media;
      obj.conversation = opts.conversation;
      this.loadData(obj);
    },this));
  },

  validations: ['tweetValidation'],

  tweetValidation: function() {
    if (!this.contentFetched) {
      var field = this.$('[type="text"]');
      this.setError(field, i18n.t("errors:block_empty",
        { name: i18n.t("blocks:tweet:title") }));
      return false;
    }
    return true;
  }
});