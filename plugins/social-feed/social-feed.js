/* MailDeck.js is the javascript code
   The name of the returned class will be `mailpile.plugins.maildeck`.
 */
return {
    load: function(e) {
        new_mailpile.plugins.maildeck.column_add('in:Inbox');
        new_mailpile.plugins.maildeck.column_add('in:New');
    },
    activity_setup: function(e) {

      $('.column-delete').on('click', function(){
          new_mailpile.plugins.maildeck.column_delete($(this).data('id'));
      });
    },
    makeid: function() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < 5; i++ ) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    },
    columns: {},
    column_add: function(search) {
        for (s in this.columns) {
            if (this.columns[s].search == search) {
                $("#" + s)
                    .animate( { opacity: 0.4 }, 300 )
                    .animate( { opacity: 1.0 }, 300 );
                return s;
            }
        }
        var id = "col" + new_mailpile.plugins.maildeck.makeid();

        // Add HTML Column
        var template_html = $('#template-maildeck-column-header').html();
        var header_html = _.template(template_html, { type: "Search:", search: search, id: id });
        $(".piledeck-column-container").append(header_html);

        this.columns[id] = {
            search:     search,
            lastresult: null,
            countdown:  5,
        };
        this.column_refresh(id);
        this.column_start_refresh(id);
        return id;
    },
    column_delete: function(id) {
        this.column_stop_refresh(id);
        delete this.columns[id];
        $("#" + id).remove();
    },
    refresh: function() {
        for (var id in this.columns) {
            this.refresh_column(id);
        }
    },
    column_refresh: function(id) {
        var col = this.columns[id];
        var self = this;
        mailpile.command(mailpile.api.search + "?q=" + col["search"], {}, "GET", function(data) {
            self.columns[id]["lastresult"] = data;
            self.column_render(id);
        });
    },
    column_render: function(id) {
        var result = this.columns[id].lastresult.result;
        var thread_ids = result.thread_ids.reverse();

        // Add HTML Item
        var template_html = $('#template-maildeck-column-item').html();

        for (mid in thread_ids) {
            mid = thread_ids[mid];
            var metadata = result.data.metadata[mid];
            var messages = result.data.messages[mid];

            if ($("#" + id + " #mid_" + mid).length) {
                // Do nothing...
            } else {
                var subject = metadata.subject.substr(0, 100);
                if (metadata.subject.length > 100) { 
                    subject += "...";
                }
                tagclasses = "";
                for (tid in metadata.tag_tids) {
                    tid = metadata.tag_tids[tid];
                    tagclasses += " in_" + result.data.tags[tid].slug;
                }
                
                var item_data = {
                  mid: mid,
                  classes: tagclasses,
                  from: metadata.from.fn + '&lt;' + metadata.from.email + '&gt;',
                  subject: subject
                }
 
                // Add HTML Item
                var item_html = _.template(template_html, item_data);
                $("#"+id + " .entries").prepend(item_html);
            }
        }
    },
    column_stop_refresh: function(id) {
        window.clearInterval(this.columns[id].refresh);
        this.columns[id].countdown = 5;
    },
    column_start_refresh: function(id) {
        var self = this;
        window.setInterval(function() { 
            if (self.columns[id].countdown == 0) {
                self.column_refresh(id); 
                self.columns[id].countdown = 5;
            } else {
                self.columns[id].countdown--;
            }
            $("#" + id + " .refresh").html(self.columns[id].countdown);
        }, 1000);
    },
    runsearch: function() {
        this.column_add($('#search-query').val());
        $('#search-query').val("");
        return false;
    }
};
