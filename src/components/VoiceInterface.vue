<template>
  <v-container>
    <v-dialog
      v-model="isShow"
      persistent
    >
      <v-card
        elevation="2"
        style="height:70vh;"
      >
        History: {{ history }}
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';

  import tf from '@tensorflow/tfjs';
  import { create } from '@tensorflow-models/speech-commands';

  import annyang from "../annyang.min";

  @Component({
    name: 'VoiceInterface',

    components: {
    },

    data: () => ({
      isShow: true,
      history: []
    }),

    mounted: async function () {
      console.info(tf);

      // Also responds to: *phone hits table*, diss, miss, tiss, fiss, stark, start, time, mime
      const recognizer = create(
        "BROWSER_FFT", // fourier transform type, not useful to change
        undefined, // speech commands vocabulary feature, not useful for your models
        `${location.href}/audio/model.json`,
        `${location.href}/audio/metadata.json`
      );

      // Check that model and metadata are loaded via HTTPS requests.
      await recognizer.ensureModelLoaded();

      annyang!.addCallback("result", (result: String) => {
          this.$data.history.push(result);
        }
      );
      
      annyang!.addCallback(
        "end", 
        () => {
          setTimeout(recognizerMethod, 800);
        }
      );

      let recognizerMethod = () => {
        recognizer.listen(async (result): Promise<void> => {
          let results = result.scores;
          if (results[1] > 0.87) {            
            await recognizer.stopListening();
            setTimeout(
              () => {
                this.$data.history.push("Hello");
                annyang!.start({ autoRestart: false, continuous: false });
              },
              800
            );
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
  export default class VoiceInterface extends Vue {}
</script>
