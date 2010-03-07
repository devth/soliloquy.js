/*
Soliloquy - a jQuery plugin for aggregating posts from many data sources
Copyright (c) 2010 Trevor C. Hartman
Released under MIT License
http://github.com/devth/soliloquy
*/

(function($)
{

	jQuery.fn.soliloquy = function( username, options )
	{
		// SETUP SETTINGS
		var settings = jQuery.extend({}, jQuery.fn.soliloquy.defaults, options);
	
		var element = this;
	
		// RETRIEVE RESULTS
		var api_twitter = "http://twitter.com/status/user_timeline/"+username+".json?count=" + settings.posts + "&callback=?";
	
		$.getJSON(api_twitter, function(data)
		{
			$.each(data, function(i, item)
			{
				//alert( $(element).html() );
				$(element).append( buildTwitterPost( item ) );
			});
		});
	
		// $(this).html("<b>" + username + "!" + settings.posts + "</b>");
	
		return this;
	};

	function buildTwitterPost( post )
	{
		var html = "<div>";
		html += "<b>" + post.user['screen_name'] + "</b> ";
		html += post.text;
		html += " <span class='created-at'>" + relative_time(post.created_at) + "</span>";
		html += "</div>";
		return html;
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
		if (delta < 60)
		{
		  r = 'a minute ago';
		} else if(delta < 120) {
		  r = 'couple of minutes ago';
		} else if(delta < (45*60)) {
		  r = (parseInt(delta / 60)).toString() + ' minutes ago';
		} else if(delta < (90*60)) {
		  r = 'an hour ago';
		} else if(delta < (24*60*60)) {
		  r = '' + (parseInt(delta / 3600)).toString() + ' hours ago';
		} else if(delta < (48*60*60)) {
		  r = '1 day ago';
		} else {
		  r = (parseInt(delta / 86400)).toString() + ' days ago';
		}

		return r;
	}


	// DEFAULTS
	jQuery.fn.soliloquy.defaults = {
		posts: 10
	};
	
	
})(jQuery);