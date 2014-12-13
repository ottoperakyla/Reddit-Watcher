(function() {

    'use strict';

    // set up spinning animation
    // to show when data is being loaded
    jQuery.ajaxSetup({
        beforeSend: function() {
            $('#loading-div').show();
        },
        complete: function() {
            $('#loading-div').hide();
        }
    });

    //var safe_domains = ['reddit.com', 'imgur.com']; todo: only open these domains in open all
    var reddit_base_url = 'http://www.reddit.com/';
    var subreddit_base_url = 'http://www.reddit.com/r/';
    // used as localstorage variable
    var app_name = 'rw_subreddits';
    var subreddits_row = $('#subreddits-row');

    var subreddit_template = 'templates/subreddit-template.mst';
    var posts_template = 'templates/subreddit-posts-template.mst';

    var subreddits_to_save = [];
    var set_to_refresh = null;

    // load reddits if they are defined in get parameter 'reddits'
    var subreddits_in_get = window.location.search.match(/\?reddits=([\w,]+)/);
    if (subreddits_in_get) {

        subreddits_in_get = subreddits_in_get[1].split(',');
        add_subreddits_to_dom(subreddits_in_get);

    } else if (localStorage.getItem(app_name)) {
        // no get parameter defined load from local storage if we have
        add_subreddits_to_dom(localstorage_get());
    }

    $('#add-reddit').click(function() {
        var subreddit_to_add = $('#reddit-to-add').val();
        add_subreddit_to_dom(subreddit_to_add);
        subreddits_to_save.push(subreddit_to_add);
        localstorage_save();
    });

    $('#remove-all-reddits').click(function() {
        remove_all_reddits();
        localstorage_clear();
    });

    $('#refresh-all-reddits').click(function() {
        refresh_all_reddits();
    });

    $('#refresh-once-in').change(function(event) {
        if (set_to_refresh != null)
            clearInterval(set_to_refresh);

        var selected_refresh_value = event.currentTarget.value;

        if (!parseInt(selected_refresh_value))
            return;

        var interval_to_set = event.currentTarget.value * 60 * 1000;

        set_to_refresh = setInterval(function() {
            refresh_all_reddits();
        }, 1000 /*interval_to_set*/ );
    });

    // todo: should be easier to get to tables!!!
    $('#reddit-loader-thing').on('click', '.get-reddit', function(event) {
        // lol
        refresh_subreddit($(event.currentTarget).attr('data-listing'));
    });

    //todo: fix this!
    $('#reddit-loader-thing').on('click', '.open-all', function(event) {
        $("table").eq(0).children().find(".permalink").each(function(i, post) {
            window.open(post.href, "_blank");
        });
        // lol
        //   var a = $(event.currentTarget).attr('data-subreddit');
        //   var t = $("#subreddit-listing-"+a).eq(0).find("table")[0];
        //  console.log($(t));
    });

    function localstorage_clear() {
        if (localStorage.getItem(app_name))
            localStorage.removeItem(app_name);
    }

    function localstorage_save() {
        localStorage.setItem(app_name, JSON.stringify(subreddits_to_save));
    }

    function localstorage_get() {
        return JSON.parse(localStorage.getItem(app_name));
    }

    function remove_all_reddits() {
        $('.subreddit-section').each(function(i, section) {
            $(section).remove();
        });
    }

    function refresh_all_reddits() {
        $('.subreddit-listing-list').each(function(i, listing) {
            refresh_subreddit(listing);
        });
    }

    function refresh_subreddit(subreddit) {

        // var temp = $(subreddit).attr('data-subreddit');
        // var temp = subreddit;
        // gonewild-listing
        $(subreddit).remove();
        render_posts_template($(subreddit).attr('data-subreddit'));
    }

    // todo: fix ordering, now reddits get added
    // in the order they finish loading with get
    function add_subreddit_to_dom(subreddit) {
        $.get(get_url_to_subreddit_json(subreddit), function(subreddit_json) {
            $.get(subreddit_template, function(template) {
                    var rendered = Mustache.render(template, {
                        subreddit: subreddit
                    });

                    $(subreddits_row).append(rendered);
                })
                .done(function() {
                    render_posts_template(subreddit);
                });
        });
    }

    function render_posts_template(subreddit) {
        var subreddit_json = get_url_to_subreddit_json(subreddit);

        $.get(get_url_to_subreddit_json(subreddit), function(subreddit_json) {
            $.get(posts_template, function(template) {
                var rendered = Mustache.render(template, {
                    subreddit: subreddit,
                    posts: subreddit_data_from_json(subreddit_json)
                });

                $('#subreddit-listing-' + subreddit).append(rendered);
            })
        });

        $.get(posts_template, function(template) {

            var rendered = Mustache.render(template, {
                subreddit: subreddit,
                posts: subreddit_data_from_json(subreddit_json)
            });

            var subreddit_listing = '#subreddit-listing-' + subreddit;

            $(subreddit_listing).append(rendered);
        });
    }

    function add_subreddits_to_dom(subreddits) {
        $.each(subreddits, function(i, subreddit) {
            add_subreddit_to_dom(subreddit);
        });
    }

    function subreddit_data_from_json(subreddit_json) {
        var subreddit_data = [];

        for (var i = 0; i < subreddit_json.data.children.length; i++) {
            var post = subreddit_json.data.children[i].data;

            subreddit_data.push({
                title: post.title,
                url: post.url,
                permalink: post.permalink,
                ups: post.ups,
                num_comments: post.num_comments,
                author: post.author
            });
        }

        return subreddit_data;
    }

    // return hot.json by default
    // or top.json if second argument is passed
    // also get type of ordeding from second argument
    function get_url_to_subreddit_json(subreddit_name /*,type*/ ) {
        var json_file = arguments.length == 2 ? '/top.json?t=' + arguments[1] : '/hot.json';
        return subreddit_base_url + subreddit_name + json_file;
    }

}());