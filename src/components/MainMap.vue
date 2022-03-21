<template>
  <v-container>
    <!-- TODO: Expensive button. -->
    <v-btn
      color="primary"
      elevation="0"
      fab
      small
      fixed
      top
      right
      style='top:0.3em; z-index:99;'
    >
      <v-icon>mdi-dots-vertical</v-icon>
    </v-btn>

    <v-card
      elevation="2"
    >
      <div id="map" class="map" tabindex="0" style="height: 70vh; width: 100%"></div>
    </v-card>
  </v-container>
</template>

<script>
  import 'ol/ol.css';
  import Map from 'ol/Map';
  import {Vector as VectorSource} from 'ol/source';
  import {Vector as VectorLayer} from 'ol/layer';
  import View from 'ol/View';

  import OSMXML from 'ol/format/OSMXML';
  import {bbox as bboxStrategy} from 'ol/loadingstrategy';
  import {transformExtent} from 'ol/proj';

  import Geolocation from 'ol/Geolocation';
  import Point from 'ol/geom/Point';
  import Feature from 'ol/Feature';
  import {Circle as CircleStyle, Fill, Stroke, Style, Text} from 'ol/style';

  export default {
    name: 'MainMap',

    data: () => ({
      map: null,
      geolocation: null,
      positionFeature: null
    }),

    mounted: async function () {
      
      const styles = {
        'highway': {
          'service': new Style({
            stroke: new Stroke({
              color: 'blue',
              width: 2,
            }),
            text: new Text({
              font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
              placement: 'line',
              textBaseline: 'ideographic',
              fill: new Fill({
                color: 'blue',
              }),
            }),
          }),
          '.*': new Style({
            stroke: new Stroke({
              color: 'red',
              width: 3,
            }),
            text: new Text({
              font: 'bold 16px "Open Sans", "Arial Unicode MS", "sans-serif"',
              placement: 'line',
              textBaseline: 'ideographic',
              fill: new Fill({
                color: 'red',
              }),
            }),
          }),
        },
      };

      const vectorSource = new VectorSource({
        format: new OSMXML(),
        loader: function (extent, resolution, projection, success, failure) {
          const epsg4326Extent = transformExtent(extent, projection, 'EPSG:4326');
          const client = new XMLHttpRequest();
          client.open('POST', 'https://overpass-api.de/api/interpreter');
          client.addEventListener('load', function () {
            
            const features = new OSMXML().readFeatures(client.responseText, {
              featureProjection: map.getView().getProjection(),
            });
            vectorSource.addFeatures(features);
            success(features);
          });
          client.addEventListener('error', failure);
          const query =
            '(way["highway"](' +
            epsg4326Extent[1] +
            ',' +
            Math.max(epsg4326Extent[0], -180) +
            ',' +
            epsg4326Extent[3] +
            ',' +
            Math.min(epsg4326Extent[2], 180) +
            '););out body;>;out skel qt;';
          
          client.send(query);
        },
        strategy: bboxStrategy,
      });

      const vector = new VectorLayer({
        declutter: true,
        source: vectorSource,
        style: function (feature) {
          for (const key in styles) {
            const value = feature.get(key);
            if (value !== undefined) {
              for (const regexp in styles[key]) {
                if (new RegExp(regexp).test(value)) {
                  let style = styles[key][regexp];
                  style.getText().setText(feature.get('name')); 
                  return style;
                }
              }
            }
          }
          return null;
        },
      });

      let map = new Map({
        layers: [vector],
        target: 'map',
        view: new View({
          center: [0, 0],
          zoom: 17,
          minZoom: 15,
        }),
      });
      this.map = map;

      let view = this.map.getView();

      var geolocation = new Geolocation({
        // enableHighAccuracy must be set to true to have the heading value.
        trackingOptions: {
          enableHighAccuracy: true,
        },
        projection: view.getProjection(),
      });
      this.geolocation = geolocation;

      var positionFeature = new Feature();
      positionFeature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 6,
            fill: new Fill({
              color: '#3399CC',
            }),
            stroke: new Stroke({
              color: '#fff',
              width: 2,
            }),
          }),
        })
      );

      const accuracyFeature = new Feature();
      geolocation.on('change:accuracyGeometry', function () {
        accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
      });

      geolocation.on('change:position', function () {
        const coordinates = geolocation.getPosition();
        positionFeature.setGeometry(coordinates ? new Point(coordinates) : null);
        view.setCenter(coordinates);

        // TODO: Notifications
        // var mp3_url = 'https://media.geeksforgeeks.org/wp-content/uploads/20190531135120/beep.mp3';
        // (new Audio(mp3_url)).play();
      });

      // handle geolocation error.
      geolocation.on('error', function () {
        // TODO
      });

      new VectorLayer({
        map: map,
        source: new VectorSource({
          features: [accuracyFeature, positionFeature],
        }),
      });

      geolocation.setTracking(true);
    },

    methods: {

    },
  }
</script>
