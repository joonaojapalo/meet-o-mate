define(['jquery', 'handlebars', 'underscore', 'backbone', 'marionette', 'backbone.modelbinder', 'bootstrap',
	'text!templates/time.handlebars', 'text!templates/timing.handlebars'
	], function($, Handlebars, _, Backbone, Marionette, ModelBinder, Bootstrap,
		TimeTemplate, TimingTemplate
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
			if (! parseInt(this.get('bip'))) {
				this.set('bip', null);
			}
		},
		initialize: function() {
			if (this.collection) {
//				this.on('change:status', this.collection.sort);
			}
		},
	});

	var Times = Backbone.Collection.extend({
		model: Time,
		url: '/times',
		comparator: function(a, b) {
			var isFix = function(x) {
					return (x.get('status') == 'fixed')?1:0;
				},
				sa = isFix(a),
				sb = isFix(b);
			console.log('cmp');
			return (sa - sb) - (sb - sa);
		}
	});

	var TimeView = Marionette.ItemView.extend({
		template: TimeTemplate,
		triggers: {
			'click button': 'time:fix'
		},
		templateHelpers: function() {
			var d = new Date(this.model.get('ts') * 1000);
			return {
				ts_formatted: d.toLocaleTimeString(),
				fixed: (this.model.get('status') == 'fixed')
			}
		},
		modelEvents: {
			'change:status': 'onChangeStatus'
		},
		onChangeStatus: function(model, value) {
			if (value == 'fixed') {
				this.$('.panel-body').addClass('fix');
			} else {
				this.$('.panel-body').removeClass('fix');
			}
		},
		onRender: function() {
			var binder = new ModelBinder();
			binder.bind(this.model, this.el, { bip: '[name="bip"]'});
		},
		onTimeFix: function() {
			var bip = parseInt(this.$('[name="bip"]').val(), 10);
			this.model.set('bip',bip);
			this.model.save({}, {
				wait: true,
				success: function(model) {
					console.log("Fix commited", model.get('bip'));
				}
			});
		}
	});	

	var TimesView = Marionette.CollectionView.extend({
		childView: TimeView,

		el: '#view-times',

		initialize: function() {
			this.collection.on('sync', this.render);
		},

		filter: function (child, index, collection) {
			var open = (child.get('status') == 'open'),
				t = child.get('ts'),
				age = (Date.now() / 1000 - t);
			return open || (age < 120);
		}
	});


	var TimingView = Marionette.ItemView.extend({
		template: TimingTemplate,
		el: "#view-timing",

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
			var t = new Time({ts: time, bip: bip});
			this.collection.create(t, {
				wait: true,
				success: function() {
					var b = bip || '(open)',
						el;

					//log
					console.log("saved", b);

					// ui mark
					el = $('<span>').html(b).addClass('badge');
					view.$('.marks').append(el);
					el.fadeOut(3000);
					(function (el) {
					    setTimeout(function () {
					        el.remove();
					    }, 3000);
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
		setTimeout(function() {updateTimer($el, t);}, 1000);
	}


	var ClassView = Marionette.ItemView.extend({
		template: '<button class="btn btn-danger btn-lg">Lähetä</button> {{name}} <span class="timer pull-right"></span>',
		tagName: 'li',

		events: {
			'click button': 'setStartTime'
		},

		initialize: function() {
//			_.bindAll(this, 'updateTimer');
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
		el: '#view-classes',
		tagName: 'ul',
		childView: ClassView,
		initialize: function() {
			this.collection.on('sync', this.render);
		},
		onRender: function() {
			this.$el.addClass('list-group');
		}
	});


	var Finish = {
		times: new Times(),
		classes: new Classes()
	};


	return function() {
		var timesView = new TimesView({collection: Finish.times}),
			timingView = new TimingView({collection: Finish.times}),
			classesView = new ClassesView({collection: Finish.classes});

		Finish.classes.fetch();
		Finish.times.fetch();
		timingView.render();

		// tabs
		$('.nav-tabs').tab();
	};
});