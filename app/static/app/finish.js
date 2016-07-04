define([
    'jquery',
    'handlebars',
    'underscore', 'backbone',
    'marionette',
    'backbone.modelbinder',
    'bootstrap',
    'text!templates/time.handlebars', 'text!templates/timing.handlebars',
    'models/ping'
], function(
    $,
    Handlebars,
    _, Backbone, Marionette, ModelBinder, Bootstrap,
    TimeTemplate,
    TimingTemplate,
    Ping
) {
    'use strict';

    // use Handlebars templating
    Marionette.Renderer.render = function(template, data) {
        var template = Handlebars.compile(template);
        return template(data);
    };



    var Time = Backbone.Model.extend({

        urlRoot: '/times',

        validate: function() {
            if (!parseInt(this.get('bip'))) {
                this.set('bip', null);
            }
        },

        isFixed: function() {
            return (this.get('status') == 'fixed');
        },

        isOpen: function() {
            return (this.get('status') == 'open');
        },

        newerThan: function(seconds) {
            return (Date.now() / 1000 - this.get("ts")) < seconds;
        }
    });


    var Times = Backbone.Collection.extend({

        model: Time,

        url: '/times',

        initialize: function(options) {
            var _this = this;

            // setup periodic update
            this.on("sync", function() {
                setTimeout(_this.fetch.bind(this), (options && options.refresh) || 6000);
            });
        },

        comparator: "ts"
    });


    var TimeView = Marionette.ItemView.extend({
        template: TimeTemplate,

        triggers: {
            'click button': 'time:fix'
        },

        ui: {
            panel: ".panel-body"
        },

        templateHelpers: function() {
            var d = new Date(this.model.get('ts') * 1000);

            return {
                ts_formatted: d.toLocaleTimeString(),
                fixed: this.model.isFixed()
            }
        },

        modelEvents: {
            'change:status': 'onChangeStatus'
        },

        initialize: function() {
            this.binder = new ModelBinder();
        },

        onChangeStatus: function(model, value) {
            if (model.isFixed()) {
                this.ui.panel.addClass('fix');
            } else {
                this.ui.panel.removeClass('fix');
            }

            this.options.onChange && this.options.onChange(this.model);
        },

        onRender: function() {
            this.binder.bind(this.model, this.el, {
                bip: '[name="bip"]',
                status: '[name="status"]'
            });

            this.onChangeStatus(this.model, this.model.get("status"));
        },

        onTimeFix: function() {
            var bip = parseInt(this.$('[name="bip"]').val(), 10);
            this.model.set('bip', bip);
            this.model.save({}, {
                wait: true,
                success: function(model) {
                    console.log("Fix commited", model.get('bip'));
                }
            });
        }
    });


    var NoTimesView = Marionette.ItemView.extend({
        template: '<div class="well text-muted">Ei aikoja.</div>'
    });

    var OpenTimesView = Marionette.CollectionView.extend({
        childView: TimeView,

        emptyView: NoTimesView,

        childOptions: function() {
            return {
                "onChange": this.onChange
            };
        },

        filter: function(child, index, collection) {
            return child.isOpen();
        },

        initialize: function () {
        	_.bindAll(this, "onChange");
        },

        onChange: function(model) {
            alert("foo"); // TODO
        }
    });

    var FixedTimesView = Marionette.CollectionView.extend({
        childView: TimeView,

        emptyView: NoTimesView,

        childOptions: {
            "onChange": function() {
                return this.onChange;
            }
        },

        filter: function(child, index, collection) {
            return child.isFixed() && child.newerThan(300);
        }
    });


    var TimingView = Marionette.ItemView.extend({
        template: TimingTemplate,

        triggers: {
            'click button': 'time:fix'
        },

        ui: {
            bip: '[name="bip"]'
        },

        onTimeFix: function() {
            var bip = parseInt(this.ui.bip.val()),
                time = Date.now() / 1000.0,
                view = this;

            console.log("Fix time " + time + " to: " + bip);
            this.collection.create({
                ts: time,
                bip: bip
            }, {
                wait: true,
                success: function(model) {
                    var b = '(open #' + model.get("id") + ' )',
                        el;

                    if (model.get("bip")) {
                        b = model.get("bip") + " #" + model.get("id");
                    }

                    // ui mark
                    el = $('<span>').html(b).addClass('label').addClass('label-info');
                    view.$('.marks').append(el);
                    el.fadeOut(5000);
                    (function(el) {
                        setTimeout(function() {
                            el.remove();
                        }, 5000);
                    }(el));
                }
            });

            this.ui.bip.val('');
        }
    });

    var Class = Backbone.Model.extend({
        idAttribute: 'name'
    });

    var Classes = Backbone.Collection.extend({
        url: '/classes',
        model: Class
    });

    function updateTimer($el, t) {
        var d = Date.now() / 1000.0 - t,
            secs = Math.floor(d % 60),
            mins = Math.floor(d / 60);

        function pad(n, width, z) {
            z = z || '0';
            n = n + '';
            return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
        }

        $el.html("" + mins + ":" + pad(secs, 2));
        setTimeout(function() {
            updateTimer($el, t);
        }, 1000);
    }


    var ClassView = Marionette.ItemView.extend({
        template: '<button class="btn btn-danger btn-lg">Lähetä</button> {{name}} <span class="timer pull-right"></span>',
        tagName: 'li',

        events: {
            'click button': 'setStartTime'
        },

        onRender: function() {
            var t = this.model.get('t_start');

            if (t) {
                updateTimer(this.$('.timer'), t);
            }

            this.$el.addClass('list-group-item');
        },

        setStartTime: function() {
            var t = Date.now() / 1000.0;
            console.log("set start time", this.model.get('name'), t);
            this.model.set('t_start', t);
            this.model.save();
        }
    });


    var ClassesView = Marionette.CollectionView.extend({
        tagName: 'ul',

        childView: ClassView,

        className: "list-group"
    });


    var App = function() {
        var times = new Times(),
            classes = new Classes(),
            regions = {
                timing: new Marionette.Region({
                    el: "#view-timing"
                }),
                classes: new Marionette.Region({
                    el: "#view-classes"
                }),
                openTimes: new Marionette.Region({
                    el: "#view-times"
                }),
                fixedTimes: new Marionette.Region({
                    el: "#view-fixed-times"
                })
            };



        $.when(classes.fetch(), times.fetch()).done(function() {

            regions.openTimes.show(new OpenTimesView({
                collection: times
            }));

            regions.fixedTimes.show(new FixedTimesView({
                collection: times
            }));

            regions.timing.show(new TimingView({
                collection: times
            }));

            regions.classes.show(new ClassesView({
                collection: classes
            }));

            // setup ping
            var ping = new Ping(),
                body = $("body");
            ping.on("change:status", function(model, value) {
                body.removeClass((value == "ok") ? "ping-not-ok" : "ping-ok");
                body.addClass((value == "ok") ? "ping-ok" : "ping-not-ok");
            });
        });

        // tabs
        $('.nav-tabs').tab();
    };

    return App;
});