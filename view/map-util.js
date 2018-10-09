
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
}

var MinecraftMapUtil = function () {

    this.getJSON = function (url, success, fail, nocache) {
        if (nocache)
            url += ('?time=' + new Date().getTime());
        let data = null;
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200) {
                    try {
                        data = JSON.parse(xmlhttp.responseText);
                    } catch (e) {
                        console.log(e);
                    }
                    console.debug(data);
                    if (success && data)
                        success(data);                   
                } else {
                    console.log(xmlhttp);
                    if (fail)
                        fail(xmlhttp.responseText);                        
                }
            }
        }
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    };

    this.CRS = function (options) {
        let scale = 1;      /**  = `real length` / `pixel length`  **/
        let offset = L.latLng(0, 0);    /** pixel offset **/
        let tileSize = 256;
        let picSize = 256;
        let maxZoom = 0;
        if (options['scale'])
            scale = options.scale;
        if (options['offset'])
            offset = options.offset;
        if (options['tileSize'])
            tileSize = options.tileSize;
        if (options['picSize'])
            picSize = options.picSize;
        if (options['maxZoom'])
            maxZoom = options.maxZoom;
        let r = Math.pow(2, maxZoom) / tileSize * picSize;
        return L.extend({}, L.CRS.Simple, {
            projection: L.Projection.LonLat,
            transformation: new L.Transformation(1 / (r * scale), -offset.lng / r, 1 / (r * scale), -offset.lat / r),
        });
    }

    this.TileLayer = function (url, options) {
        return new this._TileLayer(url, options);
    }

    this._TileLayer = L.TileLayer.extend({
        url: 'localhost:8080',
        options: {
            type: 'day',
            world: 'v2',
            attribution: '',
            maxZoom: 5,
            tileSize: 256
        },
        initialize: function (url, options) {
            if (url !== undefined)
                this.url = getAbsURL(url);
            L.Util.setOptions(this, options);
        },
        getTileUrl: function (coords) {
            return this.url + '/' + this.options.type + '/' + this.options.world + '/' + coords.z + '/' + coords.x + ',' + coords.y + '.png'
        },
        getAttribution: function () {
            return this.options.attribution;
        }
    });

    this.MenuControl = function (options) {
        return new this._MenuControl(options);
    }

    this._MenuControl = L.Control.extend({
        options: {
            position: 'topright',
            items: {}
        },
        initialize: function (options) {
            L.Util.setOptions(this, options);
        },
        onAdd: function (map) {
            this._container = L.DomUtil.create('div', 'leaflet-control-container leaflet-bar');
            let head = L.DomUtil.create('strong', 'menu-head', this._container);
            head.innerHTML = 'MENU';
            for (let item in this.options.items) {
                let dom = L.DomUtil.create('div', 'menu-item', this._container);
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
		onAdd: function (map) {
			let className = 'leaflet-control-scale',
				container = L.DomUtil.create('div', className),
				options = this.options;
			this._addScales(options, className + '-line', container);
			map.on(options.updateWhenIdle ? 'moveend' : 'move', this.update, this);
			map.whenReady(this.update, this);
			return container;
		},

		onRemove: function (map) {
			map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this.update, this);
		},

		_addScales: function (options, className, container) {
			if (options.standard) {
				this._bScale = L.DomUtil.create('div', className, container);
			}
			if (options.chunk) {
				this._cScale = L.DomUtil.create('div', className, container);
			}
		},//

		update: function () {
			let map = this._map,
				y = map.getSize().y / 2;
			let maxMeters = map.distance(map.containerPointToLatLng([0, y]), map.containerPointToLatLng([this.options.maxWidth, y]));
			let ratio = this.options.maxWidth / maxMeters;
			if (this.options.standard) {
				let dist = this.getRoundNum(maxMeters);
				this.updateScale(this._bScale, dist.v * dist.e, 'block', ratio);
			}
			if (this.options.chunk) {
				let dist = this.getRoundNum(maxMeters / 16);
				this.updateScale(this._cScale, dist.v * dist.e, 'chunk', ratio * 16);
			}
		},

		updateScale: function (scale, dist, unit, ratio) {
			scale.style.width = Math.round(dist * ratio) + 'px';
			scale.innerHTML = dist + ' ' + unit;
		},

		getRoundNum: function (num) {
			let pow10 = Math.pow(10, (Math.floor(num) + '').length - 1),
				d = num / pow10;
			d = d >= 10 ? 10 :
				d >= 5 ? 5 :
				d >= 2 ? 2 : 1;
			return {e:pow10 ,v: d};
		}
	});
	
	this.ScaleControl = function(options) {
		return new this._ScaleControl(options);
	}


}