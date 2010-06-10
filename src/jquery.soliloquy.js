/*jslint indent: 2 */
/*
Soliloquy - a jQuery plugin for aggregating posts from many data sources
Copyright (c) 2010 Trevor C. Hartman
Released under MIT License
http://github.com/devth/soliloquy
*/

(function ($)
{
  
  String.prototype.supplant = function (o) { // Crockford's supplant from http://javascript.crockford.com/remedial.html
    return this.replace(/{([^{}]*)}/g,
      function (a, b) {
        var r = o[b];
        return typeof r === 'string' || typeof r === 'number' ? r : a;
      }
    );
  };

  jQuery.fn.soliloquy = function ()
  {
    var $this = $(this);
    var jq = this;
    
    // API functions
    var twitter = function ( username, options ) {
      var settings = jQuery.extend({}, jQuery.fn.soliloquy.options_twitter, options);
      settings = jQuery.extend( {}, settings_twitter, settings );
      settings.api = settings.api.supplant({ username: username, posts: settings.posts });
      
      api_call( settings );
    };
    
    var twitter_list = function ( username, listname, options ) {
      var settings = jQuery.extend({}, jQuery.fn.soliloquy.options_twitter_list, options);
      settings = jQuery.extend({}, settings_twitter_list, settings);
      settings.api = settings.api.supplant({ username: username, listname: listname, posts: settings.posts });

      api_call( settings );
    };
    
    // TODO:REFACTOR
    var lastfm = function ( options ) {
      var settings = jQuery.extend({}, jQuery.fn.soliloquy.options_lastfm, options);
      var api_lastfm = 'http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user='+settings.username+'&api_key='+settings.api_key+'&limit='+settings.tracks+'&format=json&callback=?';
      $.getJSON(api_lastfm, function(data) {
        return jq.each(function () {
          $.each(data.recenttracks.track, function(i, item){
            $(jq).append( buildLastFmPost( item, settings ));
          });
        });
      });
    };
    
    // API HELPER
    function api_call( settings ) {
      $.getJSON( settings.api, function (data) {
        return jq.each(function () {
          $.each(data, function(i, item){
            $(jq).append( settings.post_builder.call( this, item, settings ));
          });
        });
      });
    }
    
    // EXPOSE API CALLS
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
    
    html += " <span class='created-at'>" + relative_time( parsed_date ) + "</span>";
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
      date_string = relative_time( parsed_date )
    }
    html += " <span class='created-at'>" +  date_string + "</span>";
    html += "</div>";
    return html;
  }



  // DEFAULTS
  
  // PUBLIC
  jQuery.fn.soliloquy.options_twitter = {
    posts: 10,
    username: "devth"
  };
  jQuery.fn.soliloquy.options_twitter_list = jQuery.extend({}, jQuery.fn.soliloquy.options_twitter, {
    username: "rails",
    listname: "core"
  });
  jQuery.fn.soliloquy.options_lastfm = {
    tracks: 10,
    username: 'trevorhartman',
    api_key: '930dbe080df156eb81444b27a63d948b',
    label_listening_now: 'Now Playing'
  }
  
  // INTERNAL
  var settings_twitter = {
    api: "http://twitter.com/status/user_timeline/{username}.json?count={posts}&callback=?",
    post_builder: buildTwitterPost
  };
  var settings_twitter_list = {
    api: "http://api.twitter.com/1/{username}/lists/{listname}/statuses.json?per_page={posts}&callback=?",
    post_builder: buildTwitterPost
  };
  var settings_lastfm = {
    api: 'http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user={username}&api_key={api_key}&limit={tracks}&format=json&callback=?',
    post_builder: buildLastFmPost
  };
  
})(jQuery);
