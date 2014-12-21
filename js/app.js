(function($, Mustache) {

    'use strict';

  /*  var ajax = (function() {
    //define default ajax call settings here
    var defaultSettings = {};

    function call(url, customSettings) {
        console.log(arguments);
        var settings = $.extend({}, defaultSettings, customSettings || {});
        settings.url = url;

        var $spinner = $('<i class="ajax-spinner fa fa-refresh fa-spin"></i>');
        $('body').append($spinner);

        settings.complete = (settings.complete) ? [settings.complete] : [];
        settings.complete.push(function() {
            $spinner.remove();
        });

        return $.ajax(settings);
    }

    return call;
}());

    // how to use:
    var customSettings = {
        beforeSend: function(){
            console.log("before send");
        },
        complete: function(){
            console.log("done with ajax req");
        }
    };
    ajax('http://www.reddit.com/r/all/hot.json', customSettings).done(function(subreddit_json) {
        console.log('ajax received', subreddit_json);
    });*/


    // set up spinning animation
    // to show when data is being loaded
    $.ajaxSetup({
        beforeSend: function() {
            $('#loading-modal').modal('show');
        },
        complete: function() {
            setTimeout(function(){
                $('#loading-modal').modal('hide');
            },1000);
        }
    });

    // update every 60 seconds
    // since according to this: http://www.reddit.com/r/redditdev/comments/2hka4a/how_often_does_the_reddit_front_page_or_any_page/
    // posts are pushed in every 30 seconds
    // tofix: after refresh it defaults to hot.json again
    setInterval(function() {
        refresh_all_reddits();
    }, 60000);

    //var safe_domains = ['reddit.com', 'imgur.com']; todo: only open these domains in open all
    var subreddit_base_url = 'http://www.reddit.com/r/';
    // used as localstorage variable
    var app_name = 'rw_subreddits';
    var subreddits_row = $('#subreddits-row');

    var subreddit_template = 'templates/subreddit-template.mst';
    var posts_template = 'templates/subreddit-posts-template.mst';
    var pagination_template = 'templates/pagination-template.mst';

    var subreddits_to_save = localstorage_get() || [];
    //var current_jsons = {};
    var set_to_refresh = null;

    var app_html = $('#reddit-watcher');//base element of app to watch for events

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
        if (set_to_refresh !== null)
            clearInterval(set_to_refresh);

        var selected_refresh_value = event.currentTarget.value;

        if (!parseInt(selected_refresh_value))
            return;

        // seconds to milliseconds
        var interval_to_set = event.currentTarget.value * 1000;

        set_to_refresh = setInterval(function() {
            refresh_all_reddits();
        }, interval_to_set);
    });

    $(app_html).on('click', '.get-reddit', function(event) {
        var subreddit_to_refresh = $(event.currentTarget).attr('data-subreddit');
        refresh_subreddit(subreddit_to_refresh);
    });

    $(app_html).on('click', '.open-all', function(event) {
        if (!confirm('Are you sure? This will open a lot of tabs.')) 
            return;

        var subreddit_listing_to_open = $(event.target).attr('data-subreddit') + '-listing';
        var posts_to_open = $('table#'+subreddit_listing_to_open).find('a.permalink');

        posts_to_open.each(function(i, post){
         window.open(post.href, '_blank');
     });
    });

    $(app_html).on('click', '.pagination', function(event) {

        var $pagination_button = $(event.target),
            pagination_dir = $pagination_button.attr('data-before') ? 'before' : 'after';

        var json_target = pagination_dir == 'before' ? $pagination_button.attr('data-before') : $pagination_button.attr('data-after');
        json_target = json_target.match(/-(\w+)/)[1];

        console.debug('click on', pagination_dir);

        console.debug(get_url_to_subreddit_json('all', 'hot', {after: json_target}));

    });



    function localstorage_clear() {
        if (localStorage.getItem(app_name))
            localStorage.removeItem(app_name);
    }

    function localstorage_save() {
        localStorage.setItem(app_name, JSON.stringify(subreddits_to_save));
    }

    function localstorage_get() {
        if (localStorage.getItem(app_name) !== null) 
            return JSON.parse(localStorage.getItem(app_name));

        return false;
    }

    function remove_all_reddits() {
        if (!confirm('Are you sure?'))
            return;

        $('.subreddit-section').each(function(i, section) {
            $(section).remove();
        });
    }

    /*function remove_subreddit(subreddit) {
        //todo
    }*/

    function refresh_all_reddits() {
        $('.subreddit-listing-list').each(function(i, listing) {
            refresh_subreddit($(listing).attr('data-subreddit'));
        });
    }

    // todo rewrite this to allow a second parameter
    // with sorting type to be passed in
    function refresh_subreddit(subreddit /*,type*/) {
        var sort_by_value = $('#'+subreddit+'-sort-by').val();
        var type = arguments[1] || sort_by_value;

        $('#'+subreddit+'-listing').remove();

        render_posts_template(subreddit, type);
    }

    // todo: fix ordering, now reddits get added
    // in the order they finish loading with get
    function add_subreddit_to_dom(subreddit) {
        //$.get(get_url_to_subreddit_json(subreddit), function(subreddit_json) {
            $.get(subreddit_template, function(template) {
                var rendered = Mustache.render(template, {
                    subreddit: subreddit
                });

                $(subreddits_row).append(rendered);
            })
            .done(function() {
                render_posts_template(subreddit);
            });
        //});
}

$(app_html).on('change', 'select.sort', function(event) {


        // todo: handle sorting of all reddits here
        var is_refresh_all_reddits = event.target.name == 'sort_all';

        if (is_refresh_all_reddits) {
            var sort_all_by = $(event.target).val();

            $('select').each(function(i, select) {
                $(select).val(sort_all_by);
            });

            refresh_all_reddits();
        }




        var subreddit = $(event.target).attr('data-subreddit');
        
        refresh_subreddit(subreddit, event.target.value);

    });

function render_posts_template(subreddit /*,type*/) {
    var type = arguments[1] || null;
     //   type='all';

     $.get(get_url_to_subreddit_json(subreddit,type), function(subreddit_json_url) {
        $.get(posts_template, function(template) {
            var subreddit_json = subreddit_data_from_json(subreddit_json_url);
            var pagination = subreddit_json.pagination;
            var posts = subreddit_json.posts;

            var rendered = Mustache.render(template, {
                subreddit: subreddit,
                posts: posts,
                pagination: pagination
            });

            $('#subreddit-listing-' + subreddit).append(rendered);

            if ($('#'+subreddit+'-pagination').length < 1) // only render if pagination doenst exist
                render_pagination(subreddit, pagination);

        });
    });

 }

 function render_pagination(subreddit, pagination) {
    $.get(pagination_template, function(template) {
     var rendered = Mustache.render(template, {
        subreddit: subreddit,
        before: pagination.before,
        after: pagination.after,
        disableBefore: pagination.before === '' ? 'disabled' : ''
    });

     $('#subreddit-listing-' + subreddit).after(rendered);
 });
}

function add_subreddits_to_dom(subreddits) {
    $.each(subreddits, function(i, subreddit) {
        add_subreddit_to_dom(subreddit);
    });
}

function subreddit_data_from_json(subreddit_json) {
    var posts = [];

    for (var i = 0; i < subreddit_json.data.children.length; i++) {
        var post = subreddit_json.data.children[i].data;

        posts.push({
            title: post.title,
            url: post.url,
            permalink: post.permalink,
            ups: post.ups,
            num_comments: post.num_comments,
            author: post.author
        });
    }

    return {
        posts: posts,
        pagination: {
            before: subreddit_json.data.before || '',
            after: subreddit_json.data.after || ''
        }
    };

}

    // return hot.json by default
    // or top.json with ordering if second argument given
    // todo add support for 'new' json also
    // default should be hot and 'new' should also be given as argument
    function get_url_to_subreddit_json(subreddit_name /* ,type, pagination */) {
        var has_sort_type = arguments[1];
        var has_pagination = arguments[2];
        var json_file = '';

        if (has_sort_type) {
             if (has_sort_type == 'new') {
                json_file = '/new.json?sort=new';
            }else{
               json_file = '/top.json?t=' + has_sort_type; 
            }
                
            
                
        } else {
             json_file = '/hot.json';/*?sort=new*/
        } 
           
        

        // not working
        if (has_pagination) {
                        if (has_pagination.before) 
                json_file += '&before=' + has_pagination.before;
            else
                json_file += '&after=' + has_pagination.after;
        } 


        console.debug('attempting to GET', subreddit_base_url + subreddit_name + json_file);
        return subreddit_base_url + subreddit_name + json_file;
    }

}(jQuery, Mustache));