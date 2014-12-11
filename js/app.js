(function() {
    // todo: subreddit adding logic is in two places
    // when first loading them from local storage 
    // and when adding a new one
    // move it to a single function


    // get reddits saved in localstorage
    // and add them to array to iterate later
    var reddits_in_localstorage = [];
    var app_name = "rlt_subreddits";

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
                console.log(subreddits_to_add[i]);

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

	        console.log(JSON.stringify(localstorage_subreddits));

	        localStorage.setItem(app_name, JSON.stringify(localstorage_subreddits));
        }


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
        console.log(eventObject);
        var $button = $(eventObject.data.subreddit_button);

        var subreddit = $button.siblings("input").val();
        var subreddit_url = "http://www.reddit.com/r/" + subreddit + "/new.json";
        $button.parent().siblings().html("");

        $.get(subreddit_url, function(subreddit_page) {
                var posts = subreddit_page.data.children;
                var listing_html = "<ul class='subreddit-listing-list'>";
                var posts_html = [];

                for (var i = 0; i < posts.length; i++) {
                    var post_data = posts[i].data;

                    posts_html.push({
                        permalink: post_data.permalink,
                        title: post_data.title
                    });

                }

                $.get('templates/subreddit-posts-template.mst', function(template) {
                    var rendered = Mustache.render(template, {
                        posts: posts_html
                    });

                    $button.parent().parent().siblings().find(".subreddit-listing").html(rendered);
                });

            })
            .fail(function(data) {
                alert("Error: Could not load subreddit '" + subreddit + "'");
            });
    }

    function add_subreddit_to_dom(subreddit) {
    	// todo: do subreddit adding logic here
    }

}());