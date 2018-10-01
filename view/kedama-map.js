// JavaScript source code

 function format01(mark) {
	return '<div>\
				<div>' + mark.title + '</div>\
				<div>' + Math.round(mark.x) + ' , ' + Math.round(mark.z) + '</div>\
			</div>';
};

function format02(latlng) {
	return 'Pointer: ' + Math.round(latlng.lng) + ',' + Math.round(latlng.lat)
}

function format03(latlng) {
	return '<div>' + Math.round(latlng.lng) + ',' + Math.round(latlng.lat) + '</div>';
}

function KedamaMap() {
	
	/** properties **/
	this.map = null;							//	leaflet map
	this.data = { attribution:"", marks:[]};	//	json data
	this.showMarkers = false;	//	L.markers & whether to show it
	this.layerMarker = null;
	this.layerMap = null;
	this.icons = [];							//	L.icons from icon pictures
	this.keyPressed = new Array(256);
	this.onClickCallbacks = {};
	
	/** methods **/
	
	this.getJSON = function(url, callback, nocache) {
		if(nocache)
			url += ('?time=' + new Date().getTime());
		let that = this;
		let xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if(xmlhttp.readyState == 4) {
				if(xmlhttp.status == 200) {
					try {
						that.data = JSON.parse(xmlhttp.responseText);
						console.debug(that.data);
						if(callback)
							callback(that.data);
					} catch(e) {
						console.log(e);
					}
				} else {
					console.log(xmlhttp)
					if(callback)
						callback(that.data);
				}
			}
		}
		xmlhttp.open("GET", url, true);
		xmlhttp.send();
	};
	
	
	/*
	this.Dialog = L.Control.extend({
		options: {
			position: 'topleft',
			htmlElement: L.DomUtil.create('div', 'dialog-body')
		},
		
		initialize: function(options) {
			L.Util.setOptions(this, options);
		},
		onAdd: function(map) {
			this._container = L.DomUtil.create('div', 'dialog leaflet-control-container leaflet-bar leaflet-top', this.map._container);
			this._close = L.DomUtil.create('input', 'close leaflet-right', this._container);
			this._close.value = 'X';
			this._close.type = 'button';
			let closeDom = L.DomUtil.create('div', 'close-occupation', this._container)
			closeDom.innerHTML = '&zwnj;'
			let that = this;
			L.DomEvent.addListener(this._close, 'click', function() {
				that.remove();
			});
			this._container.appendChild(this.options.htmlElement);
			return this._container;
		},
		onRemove: function(map) {
		}
	});
	*/
	
	this.MenuControl = L.Control.extend({
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
			for(let item in this.options.items) {
				let dom = L.DomUtil.create('div', 'menu-item', this._container);
				dom.innerHTML = item;
				L.DomEvent.addListener(dom, 'click', this.options.items[item]);
			}
			return this._container;
		}
	});
	
	this.CRS = function (edgeWid, origin) {
		/**
		 * @param <float>edgeWid	: real length of one edge of the image
		 * @param <L.Point>origin	: pixel position of the Origin; matlab std.(x+,y+ = left,down)
		 */
		if (edgeWid == undefined)
			edgeWid = 1;
		if (origin == undefined)
			origin = L.point(0.5, 0.5);
		else
			origin = origin.divideBy(edgeWid);
		return L.extend({}, L.CRS.Simple, {
			projection: L.Projection.LonLat,
			transformation: new L.Transformation(256 / edgeWid, 256 * origin.x, 256 / edgeWid, 256 * origin.y),
			scale: function (zoom) {
				return Math.pow(2, zoom);
			},
			zoom: function (scale) {
				return Math.log(scale) / Math.LN2;
			},
			distance: function (latlng1, latlng2) {
				let dx = latlng2.lng - latlng1.lng;
				let dy = latlng2.lat - latlng1.lat;
				return Math.sqrt(dx * dx + dy * dy);
			},
			infinite: true
		});
	};
	
	this.loadIcon = function() {
		this.icons.push(
			L.icon({
				iconUrl: 'marker-icon-1x.png',
				iconSize: [14.5, 23], // size of the icon
				iconAnchor: [7.25, 22.5], // point of the icon which will correspond to marker's location
				popupAnchor: [0, -18] // point from which the popup should open relative to the iconAnchor
			})
		);
		for(let i = 1; i <= 16; ++i) {
			this.icons.push(
				L.icon({
					iconUrl: 'banner_icon_' + i + '.png',
					iconSize: [16, 24], // size of the icon
					iconAnchor: [8.5, 23], // point of the icon which will correspond to marker's location
					popupAnchor: [0, -16] // point from which the popup should open relative to the iconAnchor
				})
			);
		}
		return this.icons;
	};
	
	this.init = function(id, scale) {
		let that = this;
		this.map = L.map(id, {
			renderer: L.canvas({ padding: 0.01 }),
			crs: this.CRS(scale),
			zoomSnap: 0.05,
			zoomDelta: 0.25,
			closePopupOnClick: true
		})
		.setView([0,0], 2)
		.on('click', function(event) {
			for(let property in that.onClickCallbacks) {
				let callback = that.onClickCallbacks[property];
				if(callback)
					callback(event);
			}
		});
		let marker = L.marker([0, 0]);
		this.layerMarker = L.layerGroup([marker]).addTo(this.map);
		marker.remove();
		document.getElementById(id).onkeydown = function(e) {
			e = e || event;
　　 　 	that.keyPressed[e.keyCode] = e;
			console.debug('[down] ', e.key);
		}
		document.getElementById(id).onkeyup = function(e) {
			e = e || event;
　　 　 	that.keyPressed[e.keyCode] = null;
			console.debug('[up  ] ', e.key);
		}
	};
	
	this.registerMap = function(pathFormat) {
		this.layerMap = L.tileLayer(pathFormat, {
			attribution: this.data.attribution,
			maxZoom: 5,
			id: 'v2'
		}).addTo(this.map);
		L.control.scale({
			maxWidth: 100
		}).addTo(this.map);
	};
	
	this.registerPointerShow = function(id) {
		this.map.on('mousemove', function (event) {
			document.getElementById(id).innerText = format02(event.latlng);
		});
	};
	
	this.registerMenu = function(items) {
		new this.MenuControl({items: items}).addTo(this.map);
	};
	
	this.registerMarks = function() {
		let key = 16; //keyCode of 'shift'
		let marks = this.data.marks;
		let that = this;
		for (let i = 0; i < marks.length; ++i) {
			let mark = marks[i];
			let icon = (mark.icon === undefined) ? this.icons[0] : this.icons[mark.icon]; 
			this.layerMarker.addLayer(
				L.marker([mark.z, mark.x], { icon: icon })
				 .bindPopup(format01(mark))
			);
			this.showMarkers = true;
		}
		
		this.onClickCallbacks.showMarks = function(event) {
			if(that.keyPressed[key]) {
				if(that.showMarkers) {
					that.showMarkers = false;
					that.layerMarker.remove();
				} else {
					that.showMarkers = true;
					that.layerMarker.addTo(that.map);
				}
			}
		};
	};

	this.registerUserMarks = function() {
		let key = 18;
		let that = this;
		this.onClickCallbacks.userMarkers = function(event) {
			if(that.keyPressed[key]) {
				let mark = L.marker(event.latlng, { icon: that.icons[0] })
					 .bindPopup(format03(event.latlng));
				mark.on('click', function() {
					if(that.keyPressed[key]) {
						mark.remove();
						that.keyPressed[key] = null;
					}
				});
				that.layerMarker.addLayer(mark);
			}
		}
	};
	
	/** API **/
	
	/**
	 *	`map.setView(<number:x>,<number:z>)`
	 *	move to position(x,z)
	 */
	this.setView = function(x, z) {
		this.map.setView([z, x], this.map.getMaxZoom());
	};
	
	/**
	 *	`map.getStaticMarks()`
	 *	get an array of static marks in form of `[{title:$title, x:$x, z:$z},...]` 
	 */
	this.getStaticMarks = function() {
		let res = [];
		let markers = this.data.marks;
		for(let i = 0; i < markers.length; ++i) {
			let mark = markers[i];
			res.push({
				title: mark.title,
				x: mark.x,
				z: mark.z
			});
		}
		return res;
	};
	
	/**
	 *	`map.getUserMarks()`
	 *	get an array of user marks in form of `[{title:$index, x:$x, z:$z},...]`
	 */
	this.getUserMarks = function() {
		let res = [];
		let markers = this.markers.user;
		for(let i = 0; i < markers.length; ++i) {
			let latlng = markers[i].getLatLng();
			res.push({
				title: i.toString(),
				x: latlng.lng,
				z: latlng.lat
			});
		}
		return res;
	};

	/**
	 *	`map.searchMarks(<string:keyword>)`
	 *	search the static mark list for marks whose title contain keyword
	 */
	this.searchMarks = function(keyword) {
		let res = [];
		let staticMarkers = this.getStaticMarks();
		for(let i = 0;i < staticMarkers.length; i++) {
			if(staticMarkers[i].title.indexOf(keyword) != -1) {
				res.push({
					name: staticMarkers[i].title,
					x: staticMarkers[i].x,
					z: staticMarkers[i].z
				});
			}
		}
		return res;
	};
	
	/**
	 *	`map.setMark(<number:x>,<number:z>,<optional string:title>,<optional int:icon>)`
	 *	set a mark at position(x,z)
	 */
	this.setMark = function(x, z, title, icon) {
		let key = 18;
		let that = this;
		let mark = L.marker([z, x], { icon: this.icons[icon | 0] })
		.bindPopup(format01({x:x, z:z, title: title}))
		.on('click', function() {
			if(that.keyPressed[key]) {
				mark.remove();
				that.keyPressed[key] = null;
			}
		});
		this.layerMarker.addLayer(mark);
	};
	
	/**
	 *	`new map.Dialog(<optional HTMLElement:htmlElement>,<optional string:title>)`
	 *	create an Dialog with a close button to display HTMLElement
	 */
	this.dialog = function(htmlElement, title) {
		if(!title)
			title = 'Dialog'
		let _container = L.DomUtil.create('div', 'leaflet-control-container leaflet-bar leaflet-top dialog', this.map._container);
		let _close = L.DomUtil.create('input', 'close leaflet-right', _container);
		_close.value = 'X';
		_close.type = 'button';
		let closeDom = L.DomUtil.create('div', 'close-occupation', _container)
		closeDom.innerHTML = title;
		L.DomEvent.addListener(_close, 'click', function() {
			L.DomUtil.remove(_container);
		});
		if(!htmlElement)
			htmlElement = L.DomUtil.create('div', 'dialog-body');
		_container.appendChild(htmlElement);
		return _container;
	}
}

window.onload = function () {
	
	var tip = '\
	+ / - / 鼠标滚轮: 缩放\n\
	Shift+左        : 显示/隐藏标记点\n\
	Alt+左          : 放置/取消放置标记点\n\
	左(点击标记点)  : 显示/隐藏提示';
	
	
	map = new KedamaMap();
	map.loadIcon();
	map.init('map', 9600/(630-13)*640);
	map.registerMenu({
		"Help": function() {
			alert(tip);
		},
		"Search": function() {
			//alert('还没做完(～o￣3￣)～\n(不会在dom上叠dom)');
			var keyword = prompt('标记点名称: ','keyword');
			if(keyword != '') {
				var res = map.searchMarks(keyword);
				var mes = '搜索结果:\n';
				for(let i = 0;i < res.length; i++) {
					res[i].index = i;
					mes += JSON.stringify(res[i]) + '\n';
				}
				mes += '-----------------\n';
				mes += '选择跳转索引:\n';
				let ind = prompt(mes, '');
				if(ind) {
					try {
						ind = Number(ind);
						let r = res[ind];
						map.setView(r.x, r.z);
					} catch(e) {
						console.debug(e);
					}
				}
			}
			else {
				alert('关键词不能为空');
			}
		},
		"About": function() {
			map.dialog();
		}
	})
	map.getJSON('../data/v2/v2.json', function() {
		map.registerMap('../data/{id}/part-{z}-{x}-{y}.png');
		map.registerMarks();
		map.registerPointerShow('debug');
		map.registerUserMarks();
	}, true);
	

}




