define(["backbone"], function (Backbone) {
    'use strict';

    var Ping = Backbone.Model.extend({
        url: "/ping",

        defaults: {
            status: "init",
            time: null
        },

        initialize: function() {
            this.on("sync error", this.ping);
            this.on("error", function(model) {
                model.set("status", "fail");
            });
        },

        ping: function(model) {
            setTimeout(model.fetch.bind(this), 3000);
        }
    });

    return Ping;
});
