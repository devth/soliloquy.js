# Soliloquy
Soliloquy is a jQuery plugin that aggregates posts from various data sources and outputs them as structured HTML. It makes no assumptions about your design or formatting preferences and defaults to a minimalistic layout that's ready to be styled using CSS.

## Demo
For a working demo, visit the [project page](http://devth.github.com/soliloquy/)

## Solos
A `solo` is a data source accessed via an API. Soliloquy's goal is to support many solos and make it
extremely quick and easy to add additional solos.

To facilitate this, AJAX data retrieval is abstracted away as much as possible, leaving the absolute necessary pieces to be described for each module.

* Options -- `jQuery.fn.soliloquy.options_[name]` -- public options to be used as defaults when a user doesn't override them in the API call.
* Settings -- `jQuery.fn.soliloquy.settings_[name]` -- internal settings that include properties such as the external API url and the local function to parse the data and create the HTML.

The abstracted architecture makes it simple to add new data sources as they come along. See the source for examples.

Soliloquy currently supports the following solos:

* Twitter `twitter(username, options)`
* Twitter Lists `twitter_list(username, listname, options)`
* Last.fm plays `lastfm(username, api_key, options)`
* Facebook wall feeds `facebook(options)`

## Barebones

    <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
      "http://www.w3.org/TR/html4/loose.dtd"> 
    <html> 
      <head> 
        <title>Barebones - Soliloquy</title> 
        <meta http-equiv="Content-Type" Content="text/html; charset=UTF-8" /> 
        <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.js" type="text/javascript" charset="utf-8"></script> 
        <script src="js/jquery.soliloquy.js" type="text/javascript" charset="utf-8"></script> 
        <script type="text/javascript" charset="utf-8"> 
          $(function()
          {  
            $('.feed').soliloquy().facebook( { username: 'CriterionCollection', posts: 8, relative_dates: false } );
            $('.feed').soliloquy().twitter( 'devth', { posts: 5, relative_dates: false } );
            $('.feed').soliloquy().twitter_list( 'rails', 'core', { posts: 2 } );
            $('.feed').soliloquy().lastfm( 'trevorhartman', '####', { relative_dates: false });
          });
        </script> 
      </head> 
      <body> 
        <div class="feed"></div> 
      </body> 
    </html> 



## Contributing
Fork the project, add a module and send a pull request.

## License
Copyright (c) 2010 Trevor C. Hartman<br>
Released under the [MIT License](http://github.com/devth/soliloquy/blob/master/LICENSE)
