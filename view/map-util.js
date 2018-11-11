/*
const getAbsURL = function (url) {
    let p = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;
    if (!url.match(p)) {
        let urlp = url.split('/');
        let loc = window.location.pathname;
        let locp = loc.split('/');
        let i = locp.length - 1;
        if (loc[loc.length - 1] != '/')
            --i;
        ++i;
        for (let j = 0; j < urlp.length; j++) {
            if (urlp[j] == '..') {
                --i;
                continue;
            }
            if (urlp[j] == '.') {
                continue;
            }
            locp[i++] = urlp[j];
        }
        url = window.location.protocol + '//' + window.location.host;
        for (let j = 0; j < i; ++j) {
            if(locp[j] == '')
                continue;
            url += ('/' + locp[j]);
        }
    }
    return url;
}*/



var MinecraftMapUtil = function() {

    this.getJSON = function(url, success, fail, nocache) {
        if(nocache)
            url += ('?time=' + new Date().getTime());
        var data = null;
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if(xmlhttp.readyState == 4) {
                if(xmlhttp.status == 200) {
                    try {
                        data = JSON.parse(xmlhttp.responseText);
                    } catch (e) {
                        console.log(e);
                    }
                    console.debug(data);
                    if(success && data)
                        success(data);                   
                } else {
                    console.log(xmlhttp);
                    if(fail)
                        fail(xmlhttp.responseText);                        
                }
            }
        }
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    };

    this.CRS = function(options) {
        var scale = 1;      /**  = `real length` / `pixel length`  **/
        var offset = L.latLng(0, 0);    /** pixel offset **/
        var tileSize = 256;
        var picSize = 256;
        var maxZoom = 0;
        if(options['scale'])
            scale = options.scale;
        if(options['offset'])
            offset = options.offset;
        if(options['tileSize'])
            tileSize = options.tileSize;
        if(options['picSize'])
            picSize = options.picSize;
        if(options['maxZoom'])
            maxZoom = options.maxZoom;
        var r = Math.pow(2, maxZoom) / tileSize * picSize;
        return L.extend({}, L.CRS.Simple, {
            projection: L.Projection.LonLat,
            transformation: new L.Transformation(1 / (r * scale), -offset.lng / r, 1 / (r * scale), -offset.lat / r),
        });
    };

    this.TileLayer = function(url, options) {
        return new this._TileLayer(url, options);
    };

    this._TileLayer = L.TileLayer.extend({
        initialize: function(url, options) {
            L.TileLayer.prototype.initialize.call(this, url, options);
        },
		getTileUrl: function(coords) {
			var url = L.TileLayer.prototype.getTileUrl.call(this, coords);
			console.log(url);
			return url;
		},
		onAdd: function(map) {
			L.TileLayer.prototype.onAdd.call(this, map);
			if(this.options['onAdd'])
				this.options.onAdd(map);
		},
		onRemove: function(map) {
			if(this.options['onRemove'])
				this.options.onRemove(map);
			L.TileLayer.prototype.onRemove.call(this, map);
		}
    });

    this.MenuControl = function(options) {
        return new this._MenuControl(options);
    };

    this._MenuControl = L.Control.extend({
        options: {
            position: 'topright',
            items: {}
        },
        initialize: function(options) {
            L.Util.setOptions(this, options);
        },
        onAdd: function(map) {
            this._container = L.DomUtil.create('div', 'leafvar-control-container leafvar-bar');
            var head = L.DomUtil.create('strong', 'menu-head', this._container);
            head.innerHTML = 'MENU';
            for (var item in this.options.items) {
                var dom = L.DomUtil.create('div', 'menu-item', this._container);
                dom.innerHTML = item;
                L.DomEvent.on(dom, 'click', this.options.items[item], {});
            }
            return this._container;
        }
    });
	
	this._ScaleControl = L.Control.extend({
		
		options: {
			position: 'bottomleft',
			maxWidth: 100,	//pixel
			standard: true,
			chunk: true,
			updateWhenIdle: false
		},
		onAdd: function(map) {
			var className = 'leaflet-control-scale',
				container = L.DomUtil.create('div', className),
				options = this.options;
			this._addScales(options, className + '-line', container);
			map.on(options.updateWhenIdle ? 'moveend' : 'move', this.update, this);
			map.whenReady(this.update, this);
			return container;
		},

		onRemove: function(map) {
			map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this.update, this);
		},

		_addScales: function(options, className, container) {
			if(options.standard) {
				this._bScale = L.DomUtil.create('div', className, container);
			}
			if(options.chunk) {
				this._cScale = L.DomUtil.create('div', className, container);
			}
		},//

		update: function() {
			var map = this._map,
				y = map.getSize().y / 2;
			var maxMeters = map.distance(map.containerPointToLatLng([0, y]), map.containerPointToLatLng([this.options.maxWidth, y]));
			var ratio = this.options.maxWidth / maxMeters;
			if(this.options.standard) {
				var dist = this.getRoundNum(maxMeters);
				this.updateScale(this._bScale, dist.v * dist.e, 'block', ratio);
			}
			if(this.options.chunk) {
				var dist = this.getRoundNum(maxMeters / 16);
				this.updateScale(this._cScale, dist.v * dist.e, 'chunk', ratio * 16);
			}
		},

		updateScale: function(scale, dist, unit, ratio) {
			scale.style.width = Math.round(dist * ratio) + 'px';
			scale.innerHTML = dist + ' ' + unit;
		},

		getRoundNum: function(num) {
			var pow10 = Math.pow(10, (Math.floor(num) + '').length - 1),
				d = num / pow10;
			d = d >= 10 ? 10 :
				d >= 5 ? 5 :
				d >= 2 ? 2 : 1;
			return {e:pow10 ,v: d};
		}
	});
	
	this.ScaleControl = function(options) {
		return new this._ScaleControl(options);
	};
	
	this.clipboard = function(str) {
		var input = document.createElement('input');
		document.body.appendChild(input);
		input.setAttribute('value', str);
		input.select();
		if (document.execCommand('copy')) {
			console.log('copy to clipboard: success `' + str + '`');
		}
		document.body.removeChild(input);
	};
	
	this.template = function(id, data) {
		return L.Util.template(document.getElementById(id).innerHTML, data);
	};
	
	this.popupFormatter = function(marker) {
		var html = '';
		if(marker.title)
			html += this.template('template-popup-01', {title: marker.title});
		html += this.template('template-popup-02',{x:marker.x, z:marker.z});
		if(marker.description)
			html += this.template('template-popup-03', {description: marker.description});
		return html;
	};
	
	this.pointerFormatter = function(latLng) {
		return this.template('template-pointer', {x: Math.round(latLng.lng), z: Math.round(latLng.lat)});
	}
}

var mapUtil = new MinecraftMapUtil();

var mapIcons = [];

var MinecraftMapGroup = function(map, mapURL, jsonURL, callbacks) {
	
	/**
	 *	@param map: 	<L.Map>
	 *
	 *	@param mapURL: 	<String> url to load map-tiles. in `path/to/{world}/{z}/{x},{y}.png`
	 *
	 *	@param jsonURL:	<String> url to load data-json. in `path/to/json/world.json`
	 *
	 *	@param callbacks:	<Array<Function>> callbacks  (all is optional)
	 *		includes:	onAdd(<MinecraftMapGroup> group): when baseLayer is added
	 *					onRemove(<MinecraftMapGroup> group): when baseLayer is removed
	 *					onloadJSON(<MinecraftMapGroup> group): when json is loaded
	 *					onFailLoadJSON(<String> error): when load json failed
	 */
	
	/** properties **/
	this.map = null;	//	leaflet map, to bind()
	this.data = {};	//	json data
	this.crs = null;
	this.baseLayer = null;	//	map tile
	this.dynamicLayers = {};	//	private layers, <Object-Map>
	
	
	this.onClickCallbacks = {}; //functions
	this.state = {};
	
	
	
	this.addToControlLayer = function(control) {
		for(var prop in this.dynamicLayers) {
			control.addOverlay(this.dynamicLayers[prop], prop);
			this.dynamicLayers[prop].addTo(control._map);
		}
	};
	
	this.removeFromControlLayer = function(control) {
		for(var prop in this.dynamicLayers)
			control.removeLayer(this.dynamicLayers[prop]);
	};
	
	this.setMapCRS = function(map) {
		map.options.crs = this.crs;
	}
	
	this.setMapOnClick = function(map) {
		var onclick = this.onClickCallbacks;
		this._onclick = function(event) {
			for(var prop in onclick) {
				var callback = onclick[prop];
				callback(event);
			}
		} 
		map.on('click', this._onclick);
	}
	
	this.removeMapOnClick = function(map) {
		map.off('click', this._onclick);
	}
	
	this.generateDataMarker = function() {
		var group = L.layerGroup();
		var markers = this.data.markers;
		for (var i = 0; i < markers.length; ++i) {
			var marker = markers[i];
			var options = {};
			if(marker.icon !== undefined)
				options.icon = mapIcons[marker.icon];
			group.addLayer(
				L.marker([marker.z, marker.x], options)
				 .bindPopup(mapUtil.popupFormatter(marker))
			);
		}
		return group;
	};
	
	this.generateUserMarker = function() {
		var group = L.layerGroup();
		var that = this;
		this.onClickCallbacks.setUserMarker = function(event) {
			if(that.state.mark === 2) {
				var marker = L.marker(event.latLng).bindPopup(
					mapUtil.popupFormatter({
						x: Math.round(event.latlng.lng),
						z: Math.round(event.latlng.lat)
					})
				);
				marker.on('click', function() {
					if(that.state.mark)
						group.removeLayer(marker);
				});
				group.addLayer(marker);
				marker.openPopup();
			}
			if(that.state.mark === 1) {
				that.state.mark = 2;
			}
		}
		return group;
	}
	
	
	
	this.onloadJSON = function(data) {
		var that = this;
		this.data = data;
		this.crs = mapUtil.CRS({
			scale: this.data.property.scale,
			offset: L.latLng(this.data.property.offsetZ, this.data.property.offsetX),
			tileSize: this.data.property.tileSize,
			picSize: this.data.property.picSize,
			maxZoom: this.data.property.maxZoom
		});
		this.baseLayer = mapUtil.TileLayer(mapURL, {
			world: this.data.property.world,
			attribution: this.data.attribution,
			tileSize: this.data.property.tileSize,
			maxZoom: this.data.property.maxZoom,
			onAdd: function(map) {
				map['minecraft-map-group'] = that;
				that.state = {};
				if(callbacks.onAdd)
					callbacks.onAdd(that);
			}, 
			onRemove: function(map) {
				if(callbacks.onRemove)
					callbacks.onRemove(that);
				map['minecraft-map-group'] = undefined;
			}
		});
		if(callbacks.onloadJSON)
			callbacks.onloadJSON(this);
	};
	
	this.failLoadJSON = function(error) {
		if(callbacks.onFailLoadJSON)
			callbacks.onFailLoadJSON(error);
	};
	
	var that = this;
	
	mapUtil.getJSON(
		jsonURL,
		function(data) {
			that.onloadJSON(data);
		},
		function(error) {
			that.failLoadJSON(data);
		},
		true
	);
}