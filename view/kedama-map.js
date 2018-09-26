// JavaScript source code
var mymap;

function useExtendData(ex, data) {
	if (ex) {
		data.marks = [];
		for (let i = 0; i < ex.length; ++i) {
			let e = ex[i];
			data.marks.push({
				name: e.title,
				pos:[e.x, e.z]
			});
		}
	}
}

window.onload = function () {
	


	L.CRS.kedamaMC = function (edgeWid, origin) {
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
	}

	function getJSON(url) {
		try {
			let xmlhttp = new XMLHttpRequest();
			xmlhttp.open('GET', url, false);
			xmlhttp.send();
			let txt = xmlhttp.responseText;
			return JSON.parse(txt);
		} catch (e) {
			console.log(e);
			return null;
		}
	}

//	$.getJSON('../data/v2/v2.json' + '?time=' + new Date().getTime(), function (data) {
//		if (markerData)
//			data.marks = markerData;
//		console.log(data);
//		init(data);
//	});

	let data = getJSON('../data/v2/v2.json' + '?time=' + new Date().getTime());
	if (markerData)
		data.marks = markerData;
	console.log(data);
	init(data);

	function simpleSearch(marks, titlep) {
		let res = new Array();
		marks.forEach(function (value) {
			if (value.title.indexOf(titlep) >= 0) {
				res.push(value);
			}
		});
		return res;
	}

	function init(data) {

		var icon = L.icon({
			iconUrl: 'marker-icon-1x.png',
			iconSize: [50 / 3, 82 / 3], // size of the icon
			iconAnchor: [24.5 / 3, 81 / 3], // point of the icon which will correspond to marker's location
			popupAnchor: [0, -71 / 3] // point from which the popup should open relative to the iconAnchor
		});

		var icon2 = L.icon({
			iconUrl: 'marker-icon-2x.png',
			iconSize: [50 / 3, 82 / 3],
			iconAnchor: [24.5 / 3, 81 / 3],
			popupAnchor: [0, -71 / 3]
		});

		mymap = L.map('map', {
			crs: L.CRS.kedamaMC(9600/(630-13)*640),
			zoomSnap: 0.05,
			zoomDelta: 0.25
		}).setView([0,0], 2);
		L.tileLayer('../data/{id}/part-{z}-{x}-{y}.png', {
			attribution: data.attribution,
			maxZoom: 5,
			id: 'v2'
		}).addTo(mymap);
		L.control.scale({
			maxWidth: 100
		}).addTo(mymap);
		if (data) {
			let marks = data.marks;
			if (marks) {
				for (let i = 0; i < marks.length; ++i) {
					let mark = marks[i];
					L.marker([mark.z, mark.x], { icon: icon })
					 .addTo(mymap)
					 .bindPopup(format01(mark));
				}
			}
		}
		mymap.on('mousemove', function (event) {
			document.getElementById("debug").innerText = format02(event.latlng);
		});
	};
	function format01(mark) {
		return '<div>\
					<div>' + mark.title + '</div>\
					<div>' + Math.round(mark.z) + ' , ' + Math.round(mark.x) + '</div>\
				</div>';
	}
	function format02(latlng) {
		return 'Pointer: ' + Math.round(latlng.lng) + ',' + Math.round(latlng.lat)
	}
}




