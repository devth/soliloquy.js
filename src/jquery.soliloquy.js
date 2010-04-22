/*
Soliloquy - a jQuery plugin for aggregating posts from many data sources
Copyright (c) 2010 Trevor C. Hartman
Released under MIT License
http://github.com/devth/soliloquy
*/

(function($)
{

  jQuery.fn.soliloquy = function()
  {
    var $this = $(this);
    var jq = this;
    
    // API functions
    var twitter = function ( username, options ) {
      var settings = jQuery.extend({}, jQuery.fn.soliloquy.defaults_twitter, options);
      var api_twitter = "http://twitter.com/status/user_timeline/"+username+".json?count=" + settings.posts + "&callback=?";
      $.getJSON(api_twitter, function(data){
        return jq.each(function () {
          $.each(data, function(i, item){
            $(jq).append( buildTwitterPost( item ) );
          });
        });
      });
    };
    
    var twitter_list = function ( username, listname, options ) {
   		var settings = jQuery.extend({}, jQuery.fn.soliloquy.defaults_twitter, options);
   		var api_twitter = "http://api.twitter.com/1/"+username+"/lists/"+listname+"/statuses.json?per_page=" + settings.posts + "&callback=?";
   		$.getJSON(api_twitter, function(data){
        return jq.each(function () {
     			$.each(data, function(i, item){
     				$(jq).append( buildTwitterPost( item ) );
     		  });
     		});
      });
    };
    
    var lastfm = function ( options ) {
      var settings = jQuery.extend({}, jQuery.fn.soliloquy.defaults_lastfm, options);
      var api_lastfm = 'http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user='+settings.username+'&api_key='+settings.api_key+'&limit='+settings.tracks+'&format=json&callback=?';
      $.getJSON(api_lastfm, function(data){
        return jq.each(function () {
          $.each(data.recenttracks.track, function(i, item){
            $(jq).append( buildLastFmPost( item ));
          });
        });
      });
    };
    
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
  function relative_time(time_value)
  {
    var values = time_value.split(" ");
    time_value = values[1] + " " + values[2] + ", " + values[5] + " " + values[3];
    var parsed_date = Date.parse(time_value);
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
    
  // POST BUILDERS
  function buildTwitterPost( post )
  {
    var html = "<div class='twitter_post'>";
    html += "<span class='screen-name'>" + post.user['screen_name'] + "</span> ";
    html += processPost( post.text );
    html += " <span class='created-at'>" + relative_time(post.created_at) + "</span>";
    html += "</div>";
    return html;
  }
  function buildLastFmPost( post )
  {
    var html = "<div class='lastfm_post'>";
    html += post.artist['#text'] + " &ndash; ";
    html += post.name;
    html += "</div>";
    return html;
  }



  // DEFAULTS
  jQuery.fn.soliloquy.defaults_twitter = {
    posts: 10
  };
  
  jQuery.fn.soliloquy.defaults_lastfm = {
    tracks: 10,
    username: 'trevorhartman',
    api_key: '930dbe080df156eb81444b27a63d948b'
  }
  
  
})(jQuery);