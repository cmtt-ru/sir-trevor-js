SirTrevor.Blocks.VideoExtended = SirTrevor.Blocks.Video.extend({

  type: "video_extended",

  providers: {
      vimeo: {
        regex: /(?:http[s]?:\/\/)?(?:www.)?vimeo\.co(?:.+(?:\/)([^\/].*)+$)/,
        html: "<iframe src=\"<%= protocol %>//player.vimeo.com/video/<%= remote_id %>?title=0&byline=0\" width=\"580\" height=\"320\" frameborder=\"0\"></iframe>"
      },
      youtube: {
        regex: /^.*(?:(?:youtu\.be\/)|(?:youtube\.com)\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*)/,
        html: "<iframe src=\"<%= protocol %>//www.youtube.com/embed/<%= remote_id %>\" width=\"580\" height=\"320\" frameborder=\"0\" allowfullscreen></iframe>"
      },
      coub: {
        regex: /https?:\/\/coub\.com\/view\/([^\/\?\&]+)/,
        html: "<iframe src=\"https://coub.com/embed/<%= remote_id %>\" width=\"580\" height=\"320\" frameborder=\"0\" allowfullscreen></iframe>"
      },
      vine: {
        regex: /https?:\/\/vine\.co\/v\/([^\/\?\&]+)/,
        html: "<iframe src=\"https://vine.co/v/<%= remote_id %>/embed/simple/\" width=\"580\" height=\"320\" frameborder=\"0\" allowfullscreen></iframe>"
      },
      vk: {
        regex: /https?:\/\/vk\.com\/.*(?:video)([-_0-9]+)/,
        html: "<iframe src=\"https://tjournal.ru/proxy/video/<%= remote_id %>\" width=\"580\" height=\"320\" frameborder=\"0\" allowfullscreen></iframe>"
      }
    },

});