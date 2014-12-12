(function() {

    'use strict';

    // to add:

        // refresh all reddit views every n minutes
        // and show new the posts that were added in that time
        // with a different style, also user who added?

        // pagination

        // sorting within a subreddit list (e.g. by ups, comments, username)

        // search suggestions to subreddit name input field

        // add queryparameter to share reddits with friends e.g. ?reddits=aww,funny,all
        // this is added but adding the reddits based on them is not yet

        // add a spinner to show when loading data

        // in open all hrefs only open links with safe domains

        // in open all hrefs add treshold how much points/comments to have to open
        // maybe also add a filter on how many points/comments to have to show in list

    // to fix:

        // calling the same kind of $.get in many places
        // move this to a single function 

        // subreddits sometimes appear
        // on page load even when they were deleted first

        // subreddit adding logic is in two places
        // when first loading them from local storage 
        // and when adding a new one
        // move it to a single function

    //var safe_domains = ['reddit.com', 'imgur.com']; todo: only open these domains in open all
    var reddit_base_url = 'http://www.reddit.com/';
    var subreddit_base_url = 'http://www.reddit.com/r/';
    // used as localstorage variable
    var app_name = 'rw_subreddits'; 
    var subreddits_row = $('#subreddits-row');

    var subreddit_template = 'templates/subreddit-template.mst';
    var posts_template = 'templates/subreddit-posts-template.mst';

    var subreddits_to_save = [];

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

    $('#refresh-all-reddits').click(function(){
        refresh_all_reddits();
    });

    $('.get-reddit').each(function(i, btn) {
        btn.click(function(){
            alert('yat');
        });
    });

    $('#reddit-loader-thing').on('click', '.get-reddit', function(event) {
        // lol
        refresh_subreddit($('#subreddit-listing-'+$(event.currentTarget).attr('data-subreddit')).parents().eq(0).find('table'));
    });

    $('.get-reddit').click(function(){
        alert('yay');
        refresh_subreddit($(this).attr('data-subreddit'));
    });

    function localstorage_clear()
    {
        if(localStorage.getItem(app_name))
            localStorage.removeItem(app_name);
    }

    function localstorage_save()
    {
        localStorage.setItem(app_name, JSON.stringify(subreddits_to_save));
    }

    function localstorage_get()
    {
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
       console.log('subr',subreddit);
        $(subreddit).remove();
        render_posts_template($(subreddit).attr('data-subreddit'));
        
    }

    // todo: fix ordering, now reddits get added
    // in the order they finish loading with get
    function add_subreddit_to_dom(subreddit) 
    {
        $.get(get_url_to_subreddit_json(subreddit), function(subreddit_json) {
            $.get(subreddit_template, function(template) {
                var rendered = Mustache.render(template, {
                    subreddit: subreddit
                });

                $(subreddits_row).append(rendered);
            })
            .done(function(){
                render_posts_template(subreddit);
            });
        });
    }

    function render_posts_template(subreddit)
    {
        var subreddit_json = get_url_to_subreddit_json(subreddit);

        $.get(get_url_to_subreddit_json(subreddit), function(subreddit_json) {
            $.get(posts_template, function(template) {
             var rendered = Mustache.render(template, {
                subreddit: subreddit,
                posts: subreddit_data_from_json(subreddit_json)
            });

             $('#subreddit-listing-'+subreddit).append(rendered);
         })
        });

        $.get(posts_template, function(template) {

            var rendered = Mustache.render(template, {
                subreddit: subreddit,
                posts: subreddit_data_from_json(subreddit_json)
            });

            var subreddit_listing = '#subreddit-listing-'+subreddit;

            $(subreddit_listing).append(rendered);
        });
    }

    function add_subreddits_to_dom(subreddits)
    {
        $.each(subreddits, function(i, subreddit) {
            add_subreddit_to_dom(subreddit);
        });
    }

    function subreddit_data_from_json(subreddit_json)
    {
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
    function get_url_to_subreddit_json(subreddit_name /*,type*/)
    {
        var json_file = arguments.length == 2 ? '/top.json?t=' + arguments[1] : '/hot.json';
        return subreddit_base_url + subreddit_name + json_file;
    }

    /*

    var reddits_in_localstorage = [];
    var app_name = 'rlt_subreddits';
    var get_imgur_links = localStorage.getItem('rlt_imgur');

    if (get_imgur_links) 
        $('#get-imgur-links').attr('checked', true);

    if (localStorage.getItem(app_name) != null) {
        var reddits_to_get_from_localstorage = JSON.parse(localStorage.getItem(app_name));

        for (var i = 0; i < reddits_to_get_from_localstorage.length; i++) {
            reddits_in_localstorage.push(reddits_to_get_from_localstorage[i]);
        }

    }

    // load initial reddits
    $('document').ready(function(event) {
        $('#reddit-to-add').focus();

        $.get('templates/subreddit-template.mst', function(template) {
            var subreddits_to_add = reddits_in_localstorage || []; // load from variable or set to empty array if empty variable

            for (var i = 0; i < subreddits_to_add.length; i++) {
                var rendered_subreddit = Mustache.render(template, {
                    subreddit: subreddits_to_add[i]
                });
                $('.current-reddits').append(rendered_subreddit);

                var get_subreddit_button = '#get-subreddit-' + subreddits_to_add[i];

                $(get_subreddit_button).click({
                    subreddit_button: get_subreddit_button
                }, get_subreddit);

                // todo: init subreddits loaded from localstorage also
                ////console.log(subreddits_to_add[i]);

                // also load reddits on page init
                // todo: weird way to call this method, maybe need fix?
                get_subreddit({
                    data: {
                        subreddit_button: '#get-subreddit-' + subreddits_to_add[i]
                    }
                });
            }
        });
});

    // todo: move all click handling here?
    $('#reddit-loader-thing').click(function(event) {
    	var is_remove_single = event.target.id.match(/remove-(\w+)$/);

    	// matches remove-{subreddit} but not remove-all-subreddits
        if (is_remove_single) {
	        // subreddit name is in is_remove_single[1] matching group
	        $('#subreddit-' + is_remove_single[1]).remove();

	        	      	// todo remove single item from localstorage
	        // currently removing last item from array 
	        // need to remove the targeted subreddit
	        var localstorage_subreddits = JSON.parse(localStorage.getItem(app_name));

	        for (var i = 0; i < localstorage_subreddits.length; i++) {
	        	if(is_remove_single[1]==localstorage_subreddits[i])
	        		localstorage_subreddits.splice(i, 1);
	        }

	        ////console.log(JSON.stringify(localstorage_subreddits));

	        localStorage.setItem(app_name, JSON.stringify(localstorage_subreddits));
        }

        var is_open_all_posts = event.target.id.match(/open-all-posts-(\w+)/);

        if (is_open_all_posts) {
            if (!confirm('Are you sure? This will open a lot of tabs.')) 
                return;

            //console.log('open posts for', is_open_all_posts[1]);
            var target = '#subreddit-listing-' + is_open_all_posts[1];
            console.log(target);
            var subreddit_posts_listing = $(target);

            var posts = subreddit_posts_listing.children().find('a.permalink');

            posts.each(function(idx, el) {
                window.open(posts[idx].href, '_blank');
            });

        }

        var is_get_imgur_links = /get-imgur-links/.test(event.target.id);

        if (is_get_imgur_links) {
            var is_true = $('#'+event.target.id).is(':checked');

            if (is_true) 
                localStorage.setItem('rlt_imgur', is_true);
            else
                localStorage.removeItem('rlt_imgur');
        }

        

    });

    // todo: do sorting for single subreddits and all subreddits here
    $('#reddit-loader-thing').change(function(event) {
        var list_to_sort = $(event.target).attr('data-subreddit-listing');
        sort_single_subreddit(list_to_sort, event.target.value);
    });


    // add a section for a new subreddit
    $('#add-reddit').click(function(event) {
        var reddit_to_add = $('#reddit-to-add').val();

        $.get('templates/subreddit-template.mst', function(template) {
            var rendered = Mustache.render(template, {
                subreddit: reddit_to_add
            });

            $('.current-reddits').append(rendered);

            var added_subreddit_button = '#get-subreddit-' + reddit_to_add;

            $(added_subreddit_button).click({
                subreddit_button: added_subreddit_button
            }, get_subreddit);

            get_subreddit({
                data: {
                    subreddit_button: added_subreddit_button
                }
            });

            // add to global scope and save to local storage
            reddits_in_localstorage.push(reddit_to_add);
            localStorage.setItem(app_name, JSON.stringify(reddits_in_localstorage));
        });

    });

    $('#remove-all-reddits').click(function(event) {
        if (!confirm('Are you sure?'))
            return;

        var subreddits_to_remove = $('.subreddit-section');

        for (var i = 0; i < subreddits_to_remove.length; i++) {
            // remove from dom
            $(subreddits_to_remove[i]).remove();
            // remove from local storage
            localStorage.removeItem(app_name);
        }
    });

    $('#refresh-all-reddits').click(function(event) {
        // todo: get new json and render again here
    });

    // gets posts for a subreddit
    // NOTE: it gets its argument from passed in event object!
    function get_subreddit(eventObject) {
        // todo: fix this whole mess
        // using the same $.get calls twice... :(
            if (arguments.length == 2) {
                var subreddit = arguments[0];
                var $list_to_sort = $('#subreddit-listing-'+arguments[0]);

                $.get('http://www.reddit.com/r/'+arguments[0]+'/top.json?t='+arguments[1], function(subreddit_posts) {

                   var posts = subreddit_posts.data.children;
                   var posts_html = [];

                   for (var i = 0; i < posts.length; i++) {
                    console.log(posts[i])
                    posts_html.push({
                        permalink: posts[i].data.url,
                        title: posts[i].data.title,
                        num_comments: posts[i].data.num_comments,
                        ups: posts[i].data.ups,
                        link_to_comments: reddit_domain + post_data.permalink + '/comments/'
                    });
                    console.log(posts[i].data.url);
                }


                $.get('templates/subreddit-posts-template.mst', function(template) {
                    console.log('subr:', subreddit, 'posts html:',posts_html);

                    var rendered = Mustache.render(template, {
                        subreddit: subreddit,
                        posts: posts_html
                    });


                    var target = '#subreddit-listing-' + subreddit;
                    $(target).html(rendered);


                });

                console.log(subreddit_posts.data.children);

            }).fail(function(error){
                console.log('error', error);
            });

            console.log(arguments);

            return;
        }

      //  console.log(eventObject);
      var $button = $(eventObject.data.subreddit_button);
      var subreddit = $button[0].getAttribute('data-subreddit');

        // hot.json = newest posts
        // top.json = best subs (use ?t=hour,day,week,month,year,all parameter here)

        var subreddit_url = 'http://www.reddit.com/r/' + subreddit + '/hot.json';
        $button.parent().siblings().html('');

        $.get(subreddit_url, function(subreddit_page) {
            var posts = subreddit_page.data.children;
            var listing_html = '<ul class='subreddit-listing-list'>';
            var posts_html = [];
            var reddit_domain = 'http://reddit.com';

            for (var i = 0; i < posts.length; i++) {
                var post_data = posts[i].data;

                console.log('post', post_data);

                var post_html = {
                     permalink: reddit_domain + post_data.permalink,
                     title: post_data.title,
                     author: post_data.author,
                     link_to_user: reddit_domain + '/u/' + post_data.author + '/submitted',
                     num_comments: post_data.num_comments,
                     ups: post_data.ups,
                     link_to_comments: reddit_domain + post_data.permalink + '/comments/'
                };

                if (get_imgur_links) {
                    // post_data.url points directly to outside links (e.g. imgur)
                    post_html.permalink = post_data.url;
                } 

                posts_html.push(post_html);
            }

            $.get('templates/subreddit-posts-template.mst', function(template) {

                var rendered = Mustache.render(template, {
                    subreddit: subreddit,
                    posts: posts_html
                });

                //console.log(posts_html);
                //console.log(rendered);

                $button.parent().parent().siblings().find('.subreddit-listing').html(rendered);
            });

        })
.fail(function(data) {
    alert('Error: Could not load subreddit '' + subreddit + ''');
});
}

function add_subreddit_to_dom(subreddit) {
    	// todo: move subreddit adding logic here
    }

    function sort_single_subreddit(subreddit_list, sort_by) {
        //console.log(sort_by);
        var subreddit = subreddit_list.match(/-(\w+)$/)[1];

        var sorted_jsons = {
            top_all_time: 'all',
            top_year: 'year',
            top_month: 'month',
            top_week: 'week',
            'new': 'hot' 
        };

        var sort_method = sorted_jsons[sort_by];
        var base_url = 'http://www.reddit.com/r/'+subreddit;
        var json_url = '';

        if (sort_method == 'hot') {
            json_url = base_url + '/hot.json';
        } else {
            json_url = base_url + '/top.json?t='+sorted_jsons[sort_by];
        }

        get_subreddit(subreddit, sort_method);

          // hot.json = newest posts
        // top.json = best subs (use ?t=hour,day,week,month,year,all parameter here)
      //  $('#'+subreddit).html('');
  }

  function sort_all_subreddits(sort_by) {
    var subreddits = '';

    for (var i = 0; i < subreddits.length; i++) {
        sort_single_subreddit(subreddits[i], sort_by);
    }
}
*/
}());