/*jslint indent: 2 */
/*
Soliloquy - a jQuery plugin for aggregating posts from many data sources
Copyright (c) 2010 Trevor C. Hartman
Released under MIT License
http://github.com/devth/soliloquy
*/

(function ($) {
  
  String.prototype.supplant = function (o) { // Crockford's supplant from http://javascript.crockford.com/remedial.html
    return this.replace(/{([^{}]*)}/g,
      function (a, b) {
        var r = o[b];
        return typeof r === 'string' || typeof r === 'number' ? r : a;
      }
    );
  };

  jQuery.fn.soliloquy = function () {
    var $this = $(this);
    var jq = this;
    
    // SOLOS
    var twitter = function (username, options) {
      var settings = prepare_settings(jQuery.fn.soliloquy.options_twitter, options, settings_twitter);
      settings.username = username;
      
      api_call(settings, jq);
    };

    var twitter_list = function (username, listname, options) {
      var settings = prepare_settings(jQuery.fn.soliloquy.options_twitter_list, options, settings_twitter_list);
      settings.username = username;
      settings.listname = listname;

      api_call(settings, jq);
    };
    
    var lastfm = function (username, api_key, options) {
      var settings = prepare_settings(jQuery.fn.soliloquy.options_lastfm, options, settings_lastfm);
      settings.username = username;
      settings.api_key = api_key;

      api_call(settings, jq);
    };
    var facebook = function (options){
      var settings = prepare_settings(jQuery.fn.soliloquy.options_facebook, options, settings_facebook);
      api_call(settings, jq);
    };
    
    // EXPOSE APIs
    return {
      twitter: twitter,
      twitter_list: twitter_list,
      lastfm: lastfm,
      facebook: facebook
    };
    
  };


  // HELPERS
  $.fn.extend({
    link_url: function () {
      var returning = [];
      var regexp = /((ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?)/gi;
      this.each(function () {
        returning.push(this.replace(regexp,"<a href=\"$1\">$1</a>"));
      });
      return $(returning);
    },
    link_user: function () {
      var returning = [];
      var regexp = /[\@]+([A-Za-z0-9-_]+)/gi;
      this.each(function () {
        returning.push(this.replace(regexp,"<a href=\"http://twitter.com/$1\">@$1</a>"));
      });
      return $(returning);
    },
    link_hash: function () {
      var returning = [];
      var regexp = / [\#]+([A-Za-z0-9-_]+)/gi;
      this.each(function () {
        returning.push(this.replace(regexp, ' <a href="http://search.twitter.com/search?q=&tag=$1&lang=all">#$1</a>'));
      });
      return $(returning);
    }
  });
  function process_post(postText) {
    return $([ postText ]).link_url().link_user().link_hash()[0];
  }
  function build_date_string(parsed_date, relative) {
    if (relative) return relative_time(parsed_date);
    else {
      var localOffset = new Date().getTimezoneOffset() * 60000;
      var date_time = new Date(parsed_date - localOffset);
      var minutes, hours, ampm;
      if ((date_time.getHours()) > 12){
        hours = (date_time.getHours()) - 12;
        ampm = "pm";
      } else {
        hours = (date_time.getHours() == 0) ? 12 : date_time.getHours();
        ampm = "am";
      }
      minutes = (date_time.getMinutes().toString().length == 1) ? "0" + date_time.getMinutes() : date_time.getMinutes();
      return ((date_time.getMonth() + 1) + "/" + (date_time.getDate()) + "/" + date_time.getFullYear() + 
              " at " + (hours) + ":" + minutes + ampm);
    }
  }
  function relative_time(parsed_date) {
    var relative_to = (arguments.length > 1) ? arguments[1] : new Date();
    var delta = parseInt((relative_to.getTime() - parsed_date) / 1000);
    delta = delta + (relative_to.getTimezoneOffset() * 60);

    var r = '';
    if (delta < 60) r = 'a minute ago';
    else if(delta < 120)  r = 'couple of minutes ago';
    else if(delta < (45*60)) r = (parseInt(delta / 60)).toString() + ' minutes ago';
    else if(delta < (90*60)) r = 'an hour ago';
    else if(delta < (24*60*60)) r = '' + (parseInt(delta / 3600)).toString() + ' hours ago';
    else if(delta < (48*60*60)) r = '1 day ago';
    else r = (parseInt(delta / 86400)).toString() + ' days ago';

    return r;
  }
  function parse_date_string(value) {
    
  }

  // API HELPER
  function prepare_settings(options_default, options_override, settings_internal){
    var settings = jQuery.extend({}, jQuery.fn.soliloquy.options_global, options_default);
    settings = jQuery.extend({}, settings, options_override);
    settings = jQuery.extend({}, settings, settings_internal);
    return settings;
  }
  function api_call(settings, jq) {
    settings.api = settings.api.supplant(settings); // POPULATE dynamic bits
  
    $.getJSON(settings.api, function (data) {
      return jq.each(function () { 
        if (settings.data_handler) settings.data_handler.call(this, data, settings, jq);
        else handle_data(data, settings, jq); 
      });
    });
  }
  function handle_data(data, settings, jq){ // GENERIC
    $.each(data, function(i, item){
      $(jq).append(settings.post_builder.call(this, item, settings));
    });
  }
  
    
  // POST BUILDERS
  function build_twitter_post(post, settings){
    var html = "<div class='twitter post'>";
    html += "<span class='screen-name'>" + post.user['screen_name'] + "</span> ";
    html += process_post(post.text);
    
    var values = post.created_at.split(" ");
    time_value = values[1] + " " + values[2] + ", " + values[5] + " " + values[3];
    var parsed_date = Date.parse(time_value);
    
    html += " <span class='created-at'>" + build_date_string(parsed_date, settings.relative_dates) + "</span>";
    html += "</div>";
    return html;
  }
  function build_lastfm_post(post, settings){
    var html = "<div class='lastfm post'>";
    if (settings) html += "<span class='screen-name'>" + settings.username + "</span> ";
    html += "<span class='lastfm_artist'>" + post.artist['#text'] + "</span> &ndash; ";
    html += "<span class='lastfm_track'>" + post.name + "</span>";

    var date_string = settings.label_listening_now;
    if (post.date) {
      parsed_date = new Date(post.date['#text']);
      date_string = build_date_string(parsed_date, settings.relative_dates)
    }
    html += " <span class='created-at'>" +  date_string + "</span>";
    html += "</div>";
    return html;
  }
  function build_facebook_post(post, settings) {
    
    // DATE
    var raw_date = post.created_time;

    parsed_date = parse_facebook_date(raw_date);

    var date_string = build_date_string(parsed_date, settings.relative_dates);

    var thumbnail = "http://graph.facebook.com/" + post.from.id + "/picture";

    var html = '<div class="facebook post">';
    html += '<span class="thumbnail"><img src="' + thumbnail + '" alt="' + post.from.name + '" /></span>';
    html += '<div class="post_content">';
      html += '<span class="screen-name">' + post.from.name + '</span> ';
      if (post.type == "status"){
        html += process_post(post.message);
      } else if (post.type == "link"){
        if (post.message) html += '<span class="message">' + process_post(parse_facebook_newlines(post.message)) + '</span>';
        if (post.picture){
          html += '<div class="link-picture"><a href="' + post.link + '"><img src="' + post.picture + '"></a></div>';
        }
        if (post.link && post.name) html += '<div class="link-content"><a href="' + post.link + '">' + post.name + '</a><span class="description">' + post.description + '</span></div>';
      } else if (post.type == "photo"){
        html += '<span class="photo">';
          if (post.message) html += post.message;
          html += '<span class="picture">';
            if (post.link) html += '<a href="' + post.link + '">';
            html += '<img src="' + post.picture + '">';
            if (post.link) html += '</a>';
          html += '</span>';
        html += '</span';
      }
      html += ' <span class="created-at">';
      if (post.icon) html += '<img src="' + post.icon + '" /> ';
      html += date_string + "</span>";


      if (post.comments && $.isArray(post.comments.data)){
        html += '<div class="comments">';
          $.each(post.comments.data, function(index, comment){
            
            var commenter_thumb = "http://graph.facebook.com/" + comment.from.id + "/picture?type=square";

            html += '<div class="comment">';
              html += '<span class="picture">';
                html += '<img src="' + commenter_thumb + '" />';
              html += '</span>';
              html += '<span class="comment-content">';
                html += '<span class="screen-name">' + comment.from.name + '</span> ';
                html += process_post(parse_facebook_newlines(comment.message));
              html += '</span>';
              html += ' <span class="created-at">' + date_string + "</span>";
          

            html += '</div>';
          });
        html += '</div>';
      }
      

    html += "</div>";
    html += '</div>';
    return html;
  }

  function parse_facebook_newlines(message){
    return message.replace(/\n/g, '<br>');
  }
  function parse_facebook_date(raw_date){
    var year = raw_date.substr(0,4);
    var month = raw_date.substr(5,2) - 1;
    var day = raw_date.substr(8,2);
    var hour = raw_date.substr(11,2);
    var minute = raw_date.substr(14,2);
    var second = raw_date.substr(17,2);
    return new Date(year, month, day, hour, minute, second);
  }


  // DECLARE SOLOS
  var solos = {};

  // FACEBOOK
  solos["facebook"] = {
    settings: {
      api: 'https://graph.facebook.com/{username}/feed?limit={posts}&callback=?',
      post_builder: build_facebook_post,
      data_handler: function (data, settings, jq){
        $.each(data.data, function (i, item){
          $(jq).append(settings.post_builder(item, settings));
        });
      }
    },
    options: {
    }
  };
  // TWITTER
  solos["twitter"] = {
    settings = {
      api: "http://twitter.com/status/user_timeline/{username}.json?count={posts}&callback=?",
      post_builder: build_twitter_post,
      username: ''
    },
    options: {
      posts: 10
    }
  };
  // TWITTER LISTS
  solos["twitter_list"] = {
    settings = {
      api: "http://api.twitter.com/1/{username}/lists/{listname}/statuses.json?per_page={posts}&callback=?",
      post_builder: build_twitter_post,
      username: '',
      listname: ''
    },
    options: {
    }
  };
  // LASTFM
  solos["last_fm"] = {
    settings_lastfm = {
      api: 'http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user={username}&api_key={api_key}&limit={tracks}&format=json&callback=?',
      post_builder: build_lastfm_post,
      username: '',
      api_key: '',
      data_handler: function handle_lastfm_data(data, settings, jq){
        $.each(data.recenttracks.track, function(i, item){
          $(jq).append(settings.post_builder(item, settings));
        });
      }
    },
    options: {
      label_listening_now: 'now playing'
    }
  };


  // DEFAULTS
  
  // PUBLIC
  jQuery.fn.soliloquy.options_global = {
    relative_dates: true,
    posts: 10
  };
  jQuery.fn.soliloquy.options_twitter = {
    posts: 10
  };
  jQuery.fn.soliloquy.options_twitter_list = jQuery.extend({}, jQuery.fn.soliloquy.options_twitter, {

  });
  jQuery.fn.soliloquy.options_lastfm = {
    tracks: 10,
    label_listening_now: 'now playing'
  }
  jQuery.fn.soliloquy.options_facebook = {
    username: ''
  }
  
  // INTERNAL
  var settings_twitter = {
    api: "http://twitter.com/status/user_timeline/{username}.json?count={posts}&callback=?",
    post_builder: build_twitter_post,
    username: ''
  };
  var settings_twitter_list = {
    api: "http://api.twitter.com/1/{username}/lists/{listname}/statuses.json?per_page={posts}&callback=?",
    post_builder: build_twitter_post,
    username: '',
    listname: ''
  };
  var settings_lastfm = {
    api: 'http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user={username}&api_key={api_key}&limit={tracks}&format=json&callback=?',
    post_builder: build_lastfm_post,
    username: '',
    api_key: '',
    data_handler: function handle_lastfm_data(data, settings, jq){
      $.each(data.recenttracks.track, function(i, item){
        $(jq).append(settings.post_builder(item, settings));
      });
    }
  };
  var settings_facebook = {
    api: 'https://graph.facebook.com/{username}/feed?limit={posts}&callback=?',
    post_builder: build_facebook_post,
    data_handler: function (data, settings, jq){
      $.each(data.data, function (i, item){
        $(jq).append(settings.post_builder(item, settings));
      });
    }
    
  }
  
})(jQuery);
