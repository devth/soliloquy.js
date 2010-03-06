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
				$(element).append( buildPost( item ) );
			});
		});
	
		// $(this).html("<b>" + username + "!" + settings.posts + "</b>");
	
		return this;
	};

	function buildPost( post )
	{
		var html = "<div>";
		html += post.text;
		html += "</div>";
		return html;
	}


	// DEFAULTS
	jQuery.fn.soliloquy.defaults = {
		posts: 10
	};
	
	
})(jQuery);