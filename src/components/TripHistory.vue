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

  // add "browser": { "fs": false, "node-fetch": false, "string_decoder": false, "crypto": false, "util": false },
  // to node_modules/@tensorflow-models/speech-commands/package.json after devDependencies.
  import tf from '@tensorflow/tfjs';
  import { create } from '@tensorflow-models/speech-commands';

  import annyang from "../annyang.min";

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

    mounted: async function () {
      console.info(tf);
      const recognizer = create(
        "BROWSER_FFT", // fourier transform type, not useful to change
        undefined, // speech commands vocabulary feature, not useful for your models
        `${location.href}/audio/model.json`,
        `${location.href}/audio/metadata.json`
      );

      // Check that model and metadata are loaded via HTTPS requests.
      await recognizer.ensureModelLoaded();

      annyang!.addCommands({
        'greeting': () => {
          this.$data.info.push("Start");
          setTimeout(recognizerMethod, 800);
        }
      });

      let recognizerMethod = () => {
        recognizer.listen(async (result): Promise<void> => {
          let results = result.scores;
          if (results[1] > 0.87) {
            this.$data.info.push("Hello");
            
            await recognizer.stopListening();
            setTimeout(() => {annyang!.start({ autoRestart: false, continuous: false });}, 800);
          }
        }, {
          includeSpectrogram: false, // in case listen should return result.spectrogram
          probabilityThreshold: 0.75,
          invokeCallbackOnNoiseAndUnknown: false,
          overlapFactor: 0.75 // probably want between 0.5 and 0.75. More info in README
        });
      };

      recognizerMethod();
    },

    methods: {

    },
  })
  export default class TripHistory extends Vue {}
</script>
