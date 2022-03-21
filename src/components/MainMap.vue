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
  import {OSM, Vector as VectorSource} from 'ol/source';
  import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
  import View from 'ol/View';

  import Geolocation from 'ol/Geolocation';
  import Point from 'ol/geom/Point';
  import Feature from 'ol/Feature';
  import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';

  export default {
    name: 'MainMap',

    data: () => ({
      map: null,
      geolocation: null,
      positionFeature: null
    }),

    mounted: async function () {

      let map = new Map({
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
        ],
        target: 'map',
        view: new View({
          center: [0, 0],
          zoom: 17,
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
