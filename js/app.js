(function() {
    // todo first: subreddits sometimes appear
    // on page load even when they were deleted first

    // todo: subreddit adding logic is in two places
    // when first loading them from local storage 
    // and when adding a new one
    // move it to a single function


    // get reddits saved in localstorage
    // and add them to array to iterate later
    var reddits_in_localstorage = [];
    var app_name = "rlt_subreddits";
    var get_imgur_links = localStorage.getItem('rlt_imgur');

    if (get_imgur_links) 
        $("#get-imgur-links").attr("checked", true);

    if (localStorage.getItem(app_name) != null) {
        var reddits_to_get_from_localstorage = JSON.parse(localStorage.getItem(app_name));

        for (var i = 0; i < reddits_to_get_from_localstorage.length; i++) {
            reddits_in_localstorage.push(reddits_to_get_from_localstorage[i]);
        }

    }

    // load initial reddits
    $("document").ready(function(event) {
        $("#reddit-to-add").focus();

        $.get('templates/subreddit-template.mst', function(template) {
            //var subreddits_to_add = ["starcraft", "bjj", "gaming", "aww"]; // todo: load these from localstorage
            var subreddits_to_add = reddits_in_localstorage || []; // load from variable or set to empty array if empty variable

            for (var i = 0; i < subreddits_to_add.length; i++) {
                var rendered_subreddit = Mustache.render(template, {
                    subreddit: subreddits_to_add[i]
                });
                $(".current-reddits").append(rendered_subreddit);

                var get_subreddit_button = "#get-subreddit-" + subreddits_to_add[i];

                $(get_subreddit_button).click({
                    subreddit_button: get_subreddit_button
                }, get_subreddit);

                // todo: init subreddits loaded from localstorage also
                //console.log(subreddits_to_add[i]);

                // also load reddits on page init
                // todo: lol... fix this
                get_subreddit({
                    data: {
                        subreddit_button: "#get-subreddit-" + subreddits_to_add[i]
                    }
                });
            }
        });
});

    // todo: move all click handling here?
    $("#reddit-loader-thing").click(function(event) {
    	var is_remove_single = event.target.id.match(/remove-(\w+)$/);

    	// matches remove-{subreddit} but not remove-all-subreddits
        if (is_remove_single) {
	        // subreddit name is in is_remove_single[1] matching group
	        $("#subreddit-" + is_remove_single[1]).remove();

	        	      	// todo remove single item from localstorage
	        // currently removing last item from array 
	        // need to remove the targeted subreddit
	        var localstorage_subreddits = JSON.parse(localStorage.getItem(app_name));

	        for (var i = 0; i < localstorage_subreddits.length; i++) {
	        	if(is_remove_single[1]==localstorage_subreddits[i])
	        		localstorage_subreddits.splice(i, 1);
	        }

	        //console.log(JSON.stringify(localstorage_subreddits));

	        localStorage.setItem(app_name, JSON.stringify(localstorage_subreddits));
        }

        var is_open_all_posts = event.target.id.match(/open-all-posts-(\w+)/);

        if (is_open_all_posts) {
            if (!confirm("Are you sure? This will open a lot of tabs.")) 
                return;

            console.log("open posts for", is_open_all_posts[1]);
            var subreddit_posts_listing = $("#subreddit-listing-" + is_open_all_posts[1]);

            var posts = subreddit_posts_listing.children();

            posts.each(function(idx, el) {
                window.open(posts[idx].href, "_blank");
            });

        }

        var is_get_imgur_links = /get-imgur-links/.test(event.target.id);

        if (is_get_imgur_links) {
            var is_true = $("#"+event.target.id).is(":checked");

            if (is_true) 
                localStorage.setItem("rlt_imgur", is_true);
            else
                localStorage.removeItem("rlt_imgur");
        }

        

    });

    // todo: do sorting for single subreddits and all subreddits here
    $("#reddit-loader-thing").change(function(event) {
        var list_to_sort = $(event.target).attr('data-subreddit-listing');
        sort_single_subreddit(list_to_sort, event.target.value);
    });


    // add a section for a new subreddit
    $("#add-reddit").click(function(event) {
        var reddit_to_add = $("#reddit-to-add").val();

        $.get('templates/subreddit-template.mst', function(template) {
            var rendered = Mustache.render(template, {
                subreddit: reddit_to_add
            });

            $(".current-reddits").append(rendered);

            var added_subreddit_button = "#get-subreddit-" + reddit_to_add;

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

    $("#remove-all-reddits").click(function(event) {
        if (!confirm("Are you sure?"))
            return;

        var subreddits_to_remove = $(".subreddit-section");

        for (var i = 0; i < subreddits_to_remove.length; i++) {
            // remove from dom
            $(subreddits_to_remove[i]).remove();
            // remove from local storage
            localStorage.removeItem(app_name);
        }
    });

    $("#refresh-all-reddits").click(function(event) {
        // todo: get new json and render again here
    });

    // gets posts for a subreddit
    // NOTE: it gets its argument from passed in event object!
    function get_subreddit(eventObject) {
        // todo: fix this whole mess
        // using the same $.get calls twice... :(
            if (arguments.length == 2) {
                var subreddit = arguments[0];
                var $list_to_sort = $("#subreddit-listing-"+arguments[0]);

                $.get("http://www.reddit.com/r/"+arguments[0]+"/top.json?t="+arguments[1], function(subreddit_posts) {

                   var posts = subreddit_posts.data.children;
                   var posts_html = [];

                   for (var i = 0; i < posts.length; i++) {
                    console.log(posts[i])
                    posts_html.push({
                        permalink: posts[i].data.url,
                        title: posts[i].data.title,
                        num_comments: posts[i].data.num_comments,
                        ups: posts[i].data.ups
                    });
                    console.log(posts[i].data.url);
                }


                $.get('templates/subreddit-posts-template.mst', function(template) {
                    console.log("subr:", subreddit, "posts html:",posts_html);

                    var rendered = Mustache.render(template, {
                        subreddit: subreddit,
                        posts: posts_html
                    });


                    var target = "#subreddit-listing-" + subreddit;
                    $(target).html(rendered);


                });

                console.log(subreddit_posts.data.children);

            }).fail(function(error){
                console.log("error", error);
            });

            console.log(arguments);

            return;
        }

      //  console.log(eventObject);
      var $button = $(eventObject.data.subreddit_button);
      var subreddit = $button[0].getAttribute('data-subreddit');

        // hot.json = newest posts
        // top.json = best subs (use ?t=hour,day,week,month,year,all parameter here)

        var subreddit_url = "http://www.reddit.com/r/" + subreddit + "/hot.json";
        $button.parent().siblings().html("");

        $.get(subreddit_url, function(subreddit_page) {
            var posts = subreddit_page.data.children;
            var listing_html = "<ul class='subreddit-listing-list'>";
            var posts_html = [];
            var reddit_domain = "http://reddit.com";

            for (var i = 0; i < posts.length; i++) {
                var post_data = posts[i].data;

                console.log(post_data);

                var link_to_push = post_data.permalink;

                // todo: fix this mess...
                // no idea why, but it works:D
                if (get_imgur_links) {
                    // post_data.url points directly to outside links (e.g. imgur)

                    var to_push = {
                        permalink: post_data.url,
                        title: post_data.title,
                        num_comments: post_data.num_comments,
                        ups: post_data.ups
                    };


                    posts_html.push(to_push);

                    console.log("pushed", to_push);

                } else {
                    posts_html.push({
                        // need to add reddit.com since permalink is relative to reddit
                        permalink:  reddit_domain + post_data.permalink,
                        title: post_data.title,
                          num_comments: post_data.num_comments,
                        ups: post_data.ups
                    });
                }

            }

            $.get('templates/subreddit-posts-template.mst', function(template) {

                var rendered = Mustache.render(template, {
                    subreddit: subreddit,
                    posts: posts_html
                });

                console.log(posts_html);
                console.log(rendered);

                $button.parent().parent().siblings().find(".subreddit-listing").html(rendered);
            });

        })
.fail(function(data) {
    alert("Error: Could not load subreddit '" + subreddit + "'");
});
}

function add_subreddit_to_dom(subreddit) {
    	// todo: move subreddit adding logic here
    }

    function sort_single_subreddit(subreddit_list, sort_by) {
        console.log(sort_by);
        var subreddit = subreddit_list.match(/-(\w+)$/)[1];

        var sorted_jsons = {
            top_all_time: "all",
            top_year: "year",
            top_month: "month",
            top_week: "week",
            "new": "hot" 
        };

        var sort_method = sorted_jsons[sort_by];
        var base_url = "http://www.reddit.com/r/"+subreddit;
        var json_url = "";

        if (sort_method == "hot") {
            json_url = base_url + "/hot.json";
        } else {
            json_url = base_url + "/top.json?t="+sorted_jsons[sort_by];
        }

        get_subreddit(subreddit, sort_method);

          // hot.json = newest posts
        // top.json = best subs (use ?t=hour,day,week,month,year,all parameter here)
      //  $("#"+subreddit).html("");
  }

  function sort_all_subreddits(sort_by) {
    var subreddits = "";

    for (var i = 0; i < subreddits.length; i++) {
        sort_single_subreddit(subreddits[i], sort_by);
    }
}

}());