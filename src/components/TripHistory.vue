<template>
  <v-container>
    <v-card
      elevation="2"
    >
      <div style="height:10vh;">
        Info: {{info}}
      </div>
    </v-card>
  </v-container>
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';

  import BarChart from "./BarChart.vue";

  import ml5 from 'ml5';

  @Component({
    name: 'TripHistory',

    components: {
      BarChart
    },

    data: () => ({
      loaded: false,
      chartData1: null,
      chartData2: null,
      info: []
    }),

    // graphs
    // worker 
    //   async interface
    //   comm interface
    mounted: async function () {
      let classifier = await ml5.soundClassifier(`${location.href}/audio/model.json`);

      classifier.classify((error: any, results: any) => {
        if (error) { return; }

        if (results[0].label == "Jarvis" && results[0].confidence > 0.96) {
          this.$data.info.push("Hello");
        }
      });
    },

    methods: {

    },
  })
  export default class TripHistory extends Vue {}
</script>
