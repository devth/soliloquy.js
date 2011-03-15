// **Soliloquy** is a jQuery plugin for aggregating posts from many data sources
//
//     Copyright (c) 2011 Trevor C. Hartman
//     Released under MIT License
//     http://github.com/devth/soliloquy


(function ($) {

  // Crockford's [supplant](http://javascript.crockford.com/remedial.html)
  String.prototype.supplant = function (o) { 
    return this.replace(/{([^{}]*)}/g,
      function (a, b) {
        var r = o[b];
        return typeof r === 'string' || typeof r === 'number' ? r : a;
      }
    );
  };

  // ## Soliloquy's public interface
  jQuery.fn.soliloquy = jQuery.fn.slq = function () {
    // Save a reference to the jQuery object to work on
    var jq = this;

    // Helper to build public interface for each `solo`.
    function soloInterface(soloName, solo){
      return function(options){
        var settings = prepareSettings(solo.options, options, solo.settings);
        apiCall(settings, jq);
        // Return the jQuery object to provide chaining
        return jq;
      };
    }

    var publicMethods = {};
    // Dynamically build public methods by looping through the solos data structure
    // and using the `soloInterface` helper to build a scope over each `solo`'s unique
    // `settings` object. 
    for (soloName in solos){
      var solo = solos[soloName];
      publicMethods[soloName] = soloInterface(soloName, solo);
    }


    return publicMethods;
  };


  // ## Helpers
  $.fn.extend({
    linkUrl: function () {
      var returning = [];
      var regexp = /((ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?)/gi;
      this.each(function () {
        returning.push(this.replace(regexp,"<a href=\"$1\">$1</a>"));
      });
      return $(returning);
    },
    linkUser: function () {
      var returning = [];
      var regexp = /[\@]+([A-Za-z0-9-_]+)/gi;
      this.each(function () {
        returning.push(this.replace(regexp,"<a href=\"http://twitter.com/$1\">@$1</a>"));
      });
      return $(returning);
    },
    linkHash: function () {
      var returning = [];
      var regexp = / [\#]+([A-Za-z0-9-_]+)/gi;
      this.each(function () {
        returning.push(this.replace(regexp, ' <a href="http://search.twitter.com/search?q=&tag=$1&lang=all">#$1</a>'));
      });
      return $(returning);
    }
  });
  function processPost(postText) {
    return $([ postText ]).linkUrl().linkUser().linkHash()[0];
  }
  function buildDateString(parsedDate, relative) {
    if (relative) return relativeTime(parsedDate);
    else {
      var localOffset = new Date().getTimezoneOffset() * 60000;
      var dateTime = new Date(parsedDate - localOffset);
      var minutes, hours, ampm;
      if ((dateTime.getHours()) > 12){
        hours = (dateTime.getHours()) - 12;
        ampm = "pm";
      } else {
        hours = (dateTime.getHours() == 0) ? 12 : dateTime.getHours();
        ampm = "am";
      }
      minutes = (dateTime.getMinutes().toString().length == 1) ? "0" + dateTime.getMinutes() : dateTime.getMinutes();
      return ((dateTime.getMonth() + 1) + "/" + (dateTime.getDate()) + "/" + dateTime.getFullYear() + 
              " at " + (hours) + ":" + minutes + ampm);
    }
  }
  function relativeTime(parsedDate) {
    var relativeTo = (arguments.length > 1) ? arguments[1] : new Date();
    var delta = parseInt((relativeTo.getTime() - parsedDate) / 1000);
    delta = delta + (relativeTo.getTimezoneOffset() * 60);

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
  function parseDateString(value) {
    
  }

  // ## API helpers

  // `prepareSettings` uses `jQuery.extend` to merge three settings objects in
  // increasing order of priority. 
  // 
  //   -  `optionsDefault` provides a default set
  //   -  `optionsOverride` holds settings the user optionally specified when consuming Soliloquy
  //   -  `settingsInternal` holds the non-overridable internal settings used to call the API,
  //   parse the data and render the output.
  function prepareSettings(optionsDefault, optionsOverride, settingsInternal){
    var settings = jQuery.extend({}, jQuery.fn.soliloquy.optionsGlobal, optionsDefault);
    settings = jQuery.extend({}, settings, optionsOverride);
    settings = jQuery.extend({}, settings, settingsInternal);
    return settings;
  }

  // `apiCall` handles API calls for every solo by acting on its `settings` object
  function apiCall(settings, jq) {
    // Populate the `api` string with dynamic values
    settings.api = settings.api.supplant(settings); 
    // Append callback for JSONP if not present
    if (settings.api.indexOf("callback") === -1) { settings.api += "&callback=?"; }
  
    // Retrive data from the API
    $.getJSON(settings.api, function (data) {
      // Act upon every object the user selected (even though this will almost always be one object)
      return jq.each(function () { 
        if (settings.dataHandler) { settings.dataHandler.call(this, data, settings, jq); }
        else { handleData(data, settings, jq); } 
      });
    });
  }
  function handleData(data, settings, jq){ // GENERIC
    $.each(data, function(i, item){
      $(jq).append(settings.postBuilder.call(this, item, settings));
    });
  }
  
    
  // # Post builders
  function buildTwitterPost(post, settings){
    var html = "<div class='twitter post'>";
    html += "<span class='screen-name'>" + "<img src=" + post.user['profile_image_url'] + "> " + post.user['screen_name'] + "</span> ";
    html += processPost(post.text);
    
    var values = post.created_at.split(" ");
    timeValue = values[1] + " " + values[2] + ", " + values[5] + " " + values[3];
    var parsedDate = Date.parse(timeValue);
    
    html += " <span class='created-at'>" + buildDateString(parsedDate, settings.relativeDates) + "</span>";
    html += "</div>";
    return html;
  }
  function buildLastfmPost(post, settings){
    var html = "<div class='lastfm post'>";
    if (settings) html += "<span class='screen-name'>" + settings.username + "</span> ";
    html += "<span class='lastfm_artist'>" + post.artist['#text'] + "</span> &ndash; ";
    html += "<span class='lastfm_track'>" + post.name + "</span>";

    var dateString = settings.labelListeningNow;
    if (post.date) {
      parsedDate = new Date(post.date['#text']);
      dateString = buildDateString(parsedDate, settings.relativeDates)
    }
    html += " <span class='created-at'>" +  dateString + "</span>";
    html += "</div>";
    return html;
  }
  function buildFacebookPost(post, settings) {
    
    // Parse date
    var rawDate = post.created_time;
    parsedDate = parseFacebookDate(rawDate);
    var dateString = buildDateString(parsedDate, settings.relativeDates);

    var thumbnail = "http://graph.facebook.com/" + post.from.id + "/picture";

    var html = '<div class="facebook post">';
    html += '<span class="thumbnail"><img src="' + thumbnail + '" alt="' + post.from.name + '" /></span>';
    html += '<div class="post_content">';
      html += '<span class="screen-name">' + post.from.name + '</span> ';
      if (post.type == "status"){
        html += processPost(post.message);
      } else if (post.type == "link"){
        if (post.message) html += '<span class="message">' + processPost(parseFacebookNewlines(post.message)) + '</span>';
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
      html += dateString + "</span>";


      if (post.comments && $.isArray(post.comments.data)){
        html += '<div class="comments">';
          $.each(post.comments.data, function(index, comment){
            
            var commenterThumb = "http://graph.facebook.com/" + comment.from.id + "/picture?type=square";

            html += '<div class="comment">';
              html += '<span class="picture">';
                html += '<img src="' + commenterThumb + '" />';
              html += '</span>';
              html += '<span class="comment-content">';
                html += '<span class="screen-name">' + comment.from.name + '</span> ';
                html += processPost(parseFacebookNewlines(comment.message));
              html += '</span>';
              html += ' <span class="created-at">' + dateString + "</span>";
          

            html += '</div>';
          });
        html += '</div>';
      }
      

    html += "</div>";
    html += '</div>';
    return html;
  }
  function parseFacebookNewlines(message){
    return message.replace(/\n/g, '<br>');
  }
  function parseFacebookDate(rawDate){
    var year = rawDate.substr(0,4);
    var month = rawDate.substr(5,2) - 1;
    var day = rawDate.substr(8,2);
    var hour = rawDate.substr(11,2);
    var minute = rawDate.substr(14,2);
    var second = rawDate.substr(17,2);
    return new Date(year, month, day, hour, minute, second);
  }


  // 
  // # Solos
  // Soliloquy uses a declarative data structure to hold each data source, or "solo". Each solo consists
  // of several properties that tell Soliloquy where to fetch data, how to parse it, and how to
  // render it into HTML. It provides an options interface to allow consumers of Soliloquy to
  // customize their API calls. For example, the twitter solo provides a "posts" property that allows
  // a user to specify how many twitter posts they'd like to retrieve.
  //
  // The declarative structure makes it quick and easy to add other APIs to Soliloquy. To contribute,
  // use the existing solos as an example, test, and send a pull request.
  //
  var solos = {};

  // ## Facebook
  solos["facebook"] = {
    settings: {
      api: 'https://graph.facebook.com/{username}/feed?limit={posts}',
      postBuilder: buildFacebookPost,
      dataHandler: function (data, settings, jq){
        $.each(data.data, function (i, item){
          $(jq).append(settings.postBuilder(item, settings));
        });
      }
    },
    options: {
    }
  };
  // ## Twitter
  solos["twitter"] = {
    settings: {
      api: 'http://twitter.com/status/user_timeline/{username}.json?count={posts}',
      postBuilder: buildTwitterPost
    },
    options: {
      username: '',
      posts: 10
    }
  };
  // ## Twitter lists
  solos["twitterList"] = {
    settings: {
      api: 'http://api.twitter.com/1/{username}/lists/{listname}/statuses.json?per_page={posts}',
      postBuilder: buildTwitterPost
    },
    options: {
      username: '',
      listname: ''
    }
  };
  // ## Last.fm
  solos["lastfm"] = {
    settings: {
      api: 'http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user={username}&api_key={apiKey}&limit={tracks}&format=json',
      postBuilder: buildLastfmPost,
      dataHandler: function handleLastfmData(data, settings, jq){
        $.each(data.recenttracks.track, function(i, item){
          $(jq).append(settings.postBuilder(item, settings));
        });
      }
    },
    options: {
      labelListeningNow: 'now playing',
      username: '',
      apiKey: ''
    }
  };


  // HELPERS

})(jQuery);
