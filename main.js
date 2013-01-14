define(function(require) {
var Backbone = require('backbone'),
	Mustache = require('mustache'),
	isotope = require('isotope'),
	ContentTemplate = require('text!streamhub-backbone/templates/Content.html'),
	ContentView = require('streamhub-backbone/views/ContentView'),
	sources = require('streamhub-backbone/const/sources'),
    _ = require('underscore');

var IsotopeView = Backbone.View.extend(
/** @lends IsotopeView.prototype */
{
	/**
	IsotopeView will render a Collection of Content as a tiled
	display using jQuery-Isotope
    @class IsotopeView
    @param {Collection} opts.collection - A Collection of Content (see models/Collection)
    @param {Object} opts.contentViewOptions - Options to be passed to any Content Views this instantiates
           This is useful for passing custom templates for Content
	@param {Object} opts.sources - An object to configure stuff on a per-source basis
	       Supports `twitter` and `rss` sub objects with the same opts as this root level
    @param {Object} opts.isotope - Options to be passed to isotope on instantiation
	
    @augments Backbone.View
    @requires backbone
    @requires mustache

    @todo allow passing custom contentView
    */
	initialize: function (opts) {
		this._contentViewOpts = opts.contentViewOptions || {};
		this._sourceOpts = opts.sources || {};
        this._isotopeOpts = opts.isotope || {};
        this.$el.addClass(this.className);
		this.render();
		// initialize isotope
		this.$el.isotope(_({
			itemSelector: '.hub-item',
			isAnimated: true,
		}).extend(this._isotopeOpts));
		this.collection.on('add', this._addItem, this);
	},
	tagName: "div",
	className: "hub-IsotopeView",
	events: {
	},
	/**
    Render the initial display of the Collection, including
    any initially set Content */
	render: function () {
		var self = this;
		this.collection.forEach(function(item) {
			self._insertItem(item, {})
		});
        this.$el.imagesLoaded(function () {
           self.$el.isotope('reLayout'); 
        });
	}
});

/**
Insert a new ContentView into the DOM
@param {Content} item - A Content model */
IsotopeView.prototype._insertItem = function (item, opts) {
	var self = this,
	    newItem = $(document.createElement('div')),
		json = item.toJSON();

	if ( ! json.author) {
        // TODO: These may be deletes... handle them.
        console.log("DefaultView: No author for Content, skipping");
        return;
    }

	// Annotate for source filtering
	newItem.attr('data-hub-source-id', item.get('sourceId'));

	function _getContentViewOpts (content) {
		var opts = {},
			configuredOpts = _(opts).extend(self._contentViewOpts),
			perSourceOpts;
		if (content.get('source')==sources.TWITTER) {
			return _(configuredOpts).extend(self._sourceOpts['twitter']||{});
		}
		if (content.get('source')==sources.RSS) {
			return _(configuredOpts).extend(self._sourceOpts['rss']||{});
		}
		return configuredOpts;
	}

	var cv = new ContentView(_.extend({
		model: item,
		el: newItem
	}, _getContentViewOpts(item)));

	newItem
	  .addClass('hub-item')
	  .attr('data-hub-contentId', json.id)

	this.$el.append(newItem);
	return newItem;
}

/**
Add Content to the IsotopeView
@param {Content} item - A Content model */
IsotopeView.prototype._addItem = function(item, opts) {
	var $newItem = this._insertItem(item, opts);
    if ($newItem) {
	    var that = this;
		$newItem.imagesLoaded(function () {
	        that.$el.isotope('insert', $newItem, true);
	    });
    }
};

return IsotopeView;
});
