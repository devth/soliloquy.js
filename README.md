# Soliloquy
Soliloquy is a jQuery plugin that aggregates posts from various data sources ("solos")
and outputs them as structured HTML. It makes no assumptions about your design or formatting
preferences and defaults to a minimalistic layout that's ready to be styled with CSS.

[Read the annotated source.](http://devth.github.com/soliloquy/docs/jquery.soliloquy.html)

## Demo
See [project page](http://devth.github.com/soliloquy/)

## Usage

    <script type="text/javascript" charset="utf-8"> 
      $(function(){  
        $('.feed')
          .slq().facebook({ username: 'CriterionCollection', posts: 8, relative_dates: false } )
          .slq().twitter({username: 'devth', posts: 6, relative_dates: false })
          .slq().twitter_list({username: 'rails', listname: 'core', posts: 2 })
          .slq().last_fm({ username: 'trevorhartman', api_key: '930dbe080df156eb81444b27a63d948b', relative_dates: false });
      });
    </script> 
    <div class="feed"></div> 

## Solos
A `solo` is a data source accessed via an API. Soliloquy's goal is to support many solos and make it
extremely quick and easy to add additional solos. To facilitate this, AJAX data retrieval is abstracted away as much as possible, leaving the absolute necessary pieces to be described for each module. Each solo is comprised of:

* Options: public options allowing user to set required fields (e.g. `username` on `twitter`) and optional settings (e.g. `relative_dates: false`).
* Settings: internal settings that include properties such as the external API url and the local function to parse the data and create the HTML.

The soliloquy core then parses these objects and provides an interface for a user to call them. The abstracted architecture makes it simple to add new data sources as they come along. See the [solos section](https://github.com/devth/soliloquy/blob/master/src/jquery.soliloquy.js#L243-298) of the source for examples.

Soliloquy currently supports the following solos:

* Twitter `twitter(options)`
* Twitter Lists `twitter_list(options)`
* Last.fm plays `lastfm(options)`
* Facebook wall feeds `facebook(options)`

## Contributing
Fork the project, add/improve solos and send a pull request.

## License
Copyright (c) 2011 Trevor C. Hartman<br>
Released under the [MIT License](http://github.com/devth/soliloquy/blob/master/LICENSE)
