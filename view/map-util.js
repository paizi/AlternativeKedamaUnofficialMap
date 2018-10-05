
const getAbsURL = function (url) {
    let p = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;
    if (!url.match(p)) {
        let urlp = url.split('/');
        let locp = window.location.pathname.split('/');
        let i = locp.length - 1;
        if (locp[i].indexOf('.') >= 0)
            --i;
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
        for (let j = 0; j < i; ++j)
            url += ('/' + locp[j]);
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
        let scale = 1;		/**  = `real length` / `pixel length`  **/
        let offset = L.latLng(0, 0);	/** pixel offset **/
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

	this.MarkerLayer = function (markerList, options) {
	    let layer;
	    if (markerList) {
	        layer = L.layerGroup(markerList, options);
	    } else {
	        let marker = L.marker([0, 0]);
	        layer = L.layerGroup([marker], options);
	        marker.remove();
	    }
	    return layer;
	}

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
}