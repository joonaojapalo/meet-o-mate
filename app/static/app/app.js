define([
    'jquery',
    'handlebars',
    'underscore',
    'backbone',
    'marionette',
    'backbone.modelbinder',
    'text!templates/add-runner.handlebars',
    'text!templates/runner.handlebars',
    'text!templates/runners.handlebars',
    'text!templates/register-layout.handlebars',
    'models/ping'
], function(
    $,
    Handlebars,
    _,
    Backbone,
    Marionette,
    ModelBinder,
    addRunnerTemplate,
    runnerTemplate,
    runnersTemplate,
    registerLayoutTemplate,
    Ping
) {
    'use strict';


    // use Handlebars templating
    Marionette.Renderer.render = function(template, data) {
        var template = Handlebars.compile(template);
        return template(data);
    };


    var Runner = Backbone.Model.extend({
        idAttribute: 'id',
        urlRoot: '/api/runners'
    });


    var Runners = Backbone.Collection.extend({
        model: Runner,

        url: '/api/runners',

        comparator: function(model) {
            return model.get("lastname").toLowerCase();
        },

        initialize: function(options) {
            var _this = this;

            // setup periodic update
            this.on("sync", function() {
                setTimeout(_this.fetch.bind(this), (options && options.refresh) || 30000);
            });

            this.on("add", this.addModel);
        },

        addModel: function(model, collection) {
            model.on("change:lastname", function() {
                collection.sort();
            });
        }
    });

    var Classes = Backbone.Collection.extend({
        url: '/classes',

        initialize: function(options) {
            var _this = this;

            // setup periodic update
            this.on("sync", function() {
                setTimeout(_this.fetch.bind(this), (options && options.refresh) || 60000);
            });
        }
    });

    var RunnerView = Marionette.ItemView.extend({
        template: runnerTemplate,
        tagName: 'li',
        className: 'list-group-item',

        events: {
            'click button': 'edit'
        },

        initialize: function(options) {
            _.bindAll(this, 'edit');
        },

        edit: function() {
            this.options.props.trigger("runner:edit", this.model);
        }
    });


    var NoRunnersView = Marionette.ItemView.extend({
        template: '<div class="well text-muted">Ei juoksijoita.</div>'
    });


    var RunnersView = Marionette.CollectionView.extend({

        tagName: 'ul',

        childView: RunnerView,

        childViewOptions: function() {
            return this.options
        },

        emptyView: NoRunnersView,

        initialize: function() {
            this.collection.on('sync', this.render);
        },

        onRender: function() {
            this.$el.addClass('list-group');
        }
    });


    var RunnersLayoutView = Marionette.LayoutView.extend({

        template: '<div id="view-runners"></div>',

        regions: {
            "runnerListRegion": "#view-runners"
        },

        onBeforeShow: function() {
            var options = _.extend(this.options, {
                collection: this.collection
            });

            this.runnerListRegion.show(new RunnersView(options));
        }
    });


    var AddRunnerView = Marionette.ItemView.extend({
        template: addRunnerTemplate,

        ui: {
            bip: '[name="bip"]',
            firstname: '[name="firstname"]',
            lastname: '[name="lastname"]',
            club: '[name="club"]',
            class_name: '[name="class_name"]',
            addButton: '[data-action="new"]'
        },

        triggers: {
            'click .btn-success': 'submit',
            "click @ui.addButton": "create"
        },

        templateHelpers: function() {
            return {
                classes: this.options.classes.toJSON(),
                statusOptions: [{
                    value: 'new',
                    text: 'Uusi'
                }, {
                    value: 'ok',
                    text: 'Ok'
                }, {
                    value: 'dnf',
                    text: 'Kesk.'
                }, {
                    value: 'dq',
                    text: 'Hyl.'
                }, {
                    value: 'dns',
                    text: 'Ei läht.'
                }, ]
            }
        },

        initialize: function(options) {

            _.bindAll(this, 'bindModel', 'createRunnerModel', 'editRunner');
            this.model = this.model || this.createRunnerModel();

            // edit action
            this.listenTo(options.props, "runner:edit", this.editRunner);

            // create binder
            this.modelBinder = new ModelBinder();
        },

        editRunner: function(model) {
            this.model = model;
            this.bindModel(model);
        },

        createRunnerModel: function() {
            return new Runner({
                class_name: this.options.classes.at(0).get("name"),
                status: 'new'
            });
        },

        bindModel: function(model) {
            var bindings = ModelBinder.createDefaultBindings(this.$el, "name");
            this.modelBinder.bind(model, this.$el, bindings);
        },

        onRender: function() {
            this.bindModel(this.model);
        },

        onCreate: function() {
            this.editRunner(this.createRunnerModel());
        },

        onSubmit: function(e) {
            var view = this;

            this.model.save({}, {
                wait: true,

                success: function(model) {
                    if (!model.collection) {
                        view.collection.add(model);
                    }

                    // empty view after creation
                    view.editRunner(view.createRunnerModel());
                }
            });
        }
    });


    /* root layout */
    var AppLayout = Marionette.LayoutView.extend({

        template: registerLayoutTemplate,

        regions: {
            "addRegion": "#view-addrunner",
            "runnersRegion": "#view-runners-layout"
        },

        onBeforeShow: function() {

            this.addRegion.show(new AddRunnerView(this.options));
            this.runnersRegion.show(new RunnersLayoutView(this.options));
        }
    });


    var App = function() {

        var runners = new Runners(),
            classes = new Classes(),
            rootViewRegion = new Marionette.Region({
                el: "#root"
            });

        // fetch data
        $.when(runners.fetch(), classes.fetch()).done(function() {

            // render app layout
            rootViewRegion.show(new AppLayout({
                props: new Backbone.Model(),
                collection: runners,
                classes: classes
            }));

            var ping = new Ping(),
            	body = $("body");
            ping.on("change:status", function(model, value) {
                body.removeClass((value == "ok") ? "ping-not-ok" : "ping-ok");
                body.addClass((value == "ok") ? "ping-ok" : "ping-not-ok");
            });

            // start ping
            ping.fetch();
        });
    }

    return App;
});