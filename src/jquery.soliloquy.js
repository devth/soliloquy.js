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

  jQuery.fn.soliloquy = function (){
    var $this = $(this);
    var jq = this;
    
    // API MODULES
    var twitter = function ( username, options ) {
      var settings = prepare_settings( jQuery.fn.soliloquy.options_twitter, options, settings_twitter );
      settings.username = username;
      
      api_call( settings, jq );
    };
    
    var twitter_list = function ( username, listname, options ) {
      var settings = prepare_settings( jQuery.fn.soliloquy.options_twitter_list, options, settings_twitter_list );
      settings.username = username;
      settings.listname = listname;

      api_call( settings, jq );
    };
    
    var lastfm = function ( options ) {
      var settings = prepare_settings( jQuery.fn.soliloquy.options_lastfm, options, settings_lastfm );

      api_call( settings, jq );
    };
    
    // EXPOSE APIs
    return {
      twitter: twitter,
      twitter_list: twitter_list,
      lastfm: lastfm
    };
    
  };


  // HELPERS
  $.fn.extend({
    linkUrl: function() {
      var returning = [];
      var regexp = /((ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?)/gi;
      this.each(function() {
        returning.push(this.replace(regexp,"<a href=\"$1\">$1</a>"));
      });
      return $(returning);
    },
    linkUser: function() {
      var returning = [];
      var regexp = /[\@]+([A-Za-z0-9-_]+)/gi;
      this.each(function() {
        returning.push(this.replace(regexp,"<a href=\"http://twitter.com/$1\">@$1</a>"));
      });
      return $(returning);
    },
    linkHash: function() {
      var returning = [];
      var regexp = / [\#]+([A-Za-z0-9-_]+)/gi;
      this.each(function() {
        returning.push(this.replace(regexp, ' <a href="http://search.twitter.com/search?q=&tag=$1&lang=all">#$1</a>'));
      });
      return $(returning);
    }
  });
  function processPost( postText )
  {
    return $([ postText ]).linkUrl().linkUser().linkHash()[0];
  }
  function build_date_string( parsed_date, relative )
  {
    if ( relative ) return relative_time( parsed_date );
    else
    {
      var localOffset = new Date().getTimezoneOffset() * 60000;
      var date_time = new Date(parsed_date - localOffset);
      var minutes, hours, ampm;
      if ( (date_time.getHours()) > 12 ){
        hours = (date_time.getHours()) - 12;
        ampm = "pm";
      } else {
        hours = (date_time.getHours() == 0) ? 12 : date_time.getHours();
        ampm = "am";
      }
      minutes = (date_time.getMinutes().toString().length == 1) ? "0" + date_time.getMinutes() : date_time.getMinutes();
      return ((date_time.getMonth() + 1) + "/" + (date_time.getDate()) + "/" + date_time.getFullYear() + 
              " " + (hours) + ":" + minutes + ampm);
    }
  }
  function relative_time( parsed_date )
  {
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
  function parse_date_string( value )
  {
    
  }

  // API HELPER
  function prepare_settings( options_default, options_override, settings_internal ){
    var settings = jQuery.extend({}, jQuery.fn.soliloquy.options_global, options_default);
    settings = jQuery.extend({}, settings, options_override);
    settings = jQuery.extend({}, settings, settings_internal);
    return settings;
  }
  function api_call( settings, jq ) {
    settings.api = settings.api.supplant( settings ); // POPULATE dynamic bits
  
    $.getJSON( settings.api, function (data) {
      return jq.each( function(){ 
        if ( settings.data_handler ) settings.data_handler.call( this, data, settings, jq );
        else handle_data( data, settings, jq ); 
      });
    });
  }
  function handle_data(data, settings, jq){ // GENERIC
    $.each(data, function(i, item){
      $(jq).append( settings.post_builder.call( this, item, settings ));
    });
  }
  function handle_lastfm_data(data, settings, jq){
    $.each(data.recenttracks.track, function(i, item){
      $(jq).append( buildLastFmPost( item, settings ));
    });
  };
  
    
  // POST BUILDERS
  function buildTwitterPost( post, settings )
  {
    // console.log( post.created_at );
    var html = "<div class='twitter_post'>";
    html += "<span class='screen-name'>" + post.user['screen_name'] + "</span> ";
    html += processPost( post.text );
    
    var values = post.created_at.split(" ");
    time_value = values[1] + " " + values[2] + ", " + values[5] + " " + values[3];
    var parsed_date = Date.parse(time_value);
    
    html += " <span class='created-at'>" + build_date_string( parsed_date, settings.relative_dates ) + "</span>";
    html += "</div>";
    return html;
  }
  function buildLastFmPost( post, settings )
  {
    // console.log( post );
    var html = "<div class='lastfm_post'>";
    if ( settings ) html += "<span class='screen-name'>" + settings.username + "</span> ";
    html += "<span class='lastfm_artist'>" + post.artist['#text'] + "</span> &ndash; ";
    html += "<span class='lastfm_track'>" + post.name + "</span>";

    var date_string = settings.label_listening_now;
    if ( post.date )
    {
      parsed_date = new Date( post.date['#text'] );
      date_string = build_date_string( parsed_date, settings.relative_dates )
    }
    html += " <span class='created-at'>" +  date_string + "</span>";
    html += "</div>";
    return html;
  }



  // DEFAULTS
  
  // PUBLIC
  jQuery.fn.soliloquy.options_global = {
    relative_dates: true
  };
  jQuery.fn.soliloquy.options_twitter = {
    posts: 10
  };
  jQuery.fn.soliloquy.options_twitter_list = jQuery.extend({}, jQuery.fn.soliloquy.options_twitter, {

  });
  jQuery.fn.soliloquy.options_lastfm = {
    tracks: 10,
    username: 'trevorhartman',
    api_key: '930dbe080df156eb81444b27a63d948b',
    label_listening_now: 'now playing'
  }
  
  // INTERNAL
  var settings_twitter = {
    api: "http://twitter.com/status/user_timeline/{username}.json?count={posts}&callback=?",
    post_builder: buildTwitterPost,
    username: ''
  };
  var settings_twitter_list = {
    api: "http://api.twitter.com/1/{username}/lists/{listname}/statuses.json?per_page={posts}&callback=?",
    post_builder: buildTwitterPost,
    username: '',
    listname: ''
  };
  var settings_lastfm = {
    api: 'http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user={username}&api_key={api_key}&limit={tracks}&format=json&callback=?',
    post_builder: buildLastFmPost,
    data_handler: handle_lastfm_data
  };
  
})(jQuery);
