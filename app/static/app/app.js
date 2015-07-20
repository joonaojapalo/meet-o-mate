define(['jquery', 'handlebars', 'underscore', 'backbone', 'marionette', 'backbone.modelbinder',
	'text!templates/add-runner.handlebars',
	'text!templates/runner.handlebars',
	'text!templates/runners.handlebars'
	], function($, Handlebars, _, Backbone, Marionette, ModelBinder,
		addRunnerTemplate, runnerTemplate, runnersTemplate
	) {
	'use strict';


	// use Handlebars templating
	Marionette.Renderer.render = function(template, data) {
		var template = Handlebars.compile(template);
		return template(data);
	};


	var Runner = Backbone.Model.extend({
		idAttribute: 'bip',
		urlRoot: '/runners'
	});


	var Runners = Backbone.Collection.extend({
		model: Runner,
		url: '/runners'
	});

	// var Classes
	var RunnerView = Marionette.ItemView.extend({
		template: runnerTemplate,
		tagName: 'li',

		templateHelpers: function() {
			return {

			}
		},

		events: {
			'click button': 'edit'
		},

		initialize: function() {
			_.bindAll(this, 'edit');
		},

		onRender: function() {
			this.$el.addClass('list-group-item');
		},

		edit: function() {
			console.log('edit', this.model.get('firstname'));
			this.model.collection.trigger('edit', this.model);
		}
	});


	var RunnersView = Marionette.CollectionView.extend({
		tagName: 'ul',
		childView:RunnerView,

		initialize: function() {
			this.collection.on('sync', this.render);
		},

		onRender: function() {
			this.$el.addClass('list-group');
		}
	});


	var AddRunnerView = Marionette.ItemView.extend({
		template: addRunnerTemplate,

		ui: {
			bip: '[name="bip"]',
			firstname: '[name="firstname"]',
			lastname: '[name="lastname"]',
			club: '[name="club"]',
			class_name: '[name="class_name"]'
		},

		triggers: {
			'click .btn-success': 'submit'
		},

		templateHelpers: function() {
			var classes = ["N", "M", "M kunto", "N kunto", "P15", "T15", "T13", "P13", "P11", "T11"],
				objs = _.map(classes, function(x){ return { class_name: x }; });
			return {
				classes: objs,
				statusOptions: [
					{
						value: 'new',
						text: 'Uusi'
					},
					{
						value: 'ok',
						text: 'Ok'
					},
					{
						value: 'dnf',
						text: 'Kesk.'
					},
					{
						value: 'dq',
						text: 'Hyl.'
					},
					{
						value: 'dns',
						text: 'Ei läht.'
					},
				]
			}
		},

		collectionEvents: {
			'edit': 'edit'
		},

		initialize: function() {
			_.bindAll(this, 'setEditable', 'initNewModel', 'edit');
			this.model = this.model || this.initNewModel();
		},

		edit: function(model) {
			this.model = model;
			this.setEditable(model);
		},

		initNewModel: function() {
			return new Runner({ class_name: 'M', status: 'new'});
		},

		setEditable: function(model) {
			var binder = new ModelBinder(),
				bindings = {
					bip: '[name="bip"]',
					firstname: '[name="firstname"]',
					lastname: '[name="lastname"]',
					club: '[name="club"]',
					class_name: '[name="class_name"]',
					status: '[name="status"]'
				};
			binder.bind(model, this.$el, bindings);
		},

		onRender: function() {
			this.setEditable(this.model);
		},

		onSubmit: function(e) {
			var view = this,
				inCollection = (this.model.collection)?true:false;

			this.model.once('sync', function() {
				view.model = view.initNewModel();
				view.setEditable(view.model);
			});

			this.model.save({}, {
				wait: true,
				success: function(model) {
					if (!inCollection) {
						view.collection.add(model);
					}
				}
			});
		}
	});


	function App() {

		var runners = new Runners(),
			runnersView = new RunnersView({
				collection: runners,
				el: '#view-runners'
			}),
			addRunnerView = new AddRunnerView({
				collection: runners,
				el: '#view-addrunner'
			});


		addRunnerView.render();

		// kick the app!
		runners.fetch();
		console.log('App started.');
	}

	return App;
});
