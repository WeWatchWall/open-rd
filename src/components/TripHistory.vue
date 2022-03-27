<template>
  <v-container>
    <v-card
      elevation="2"
    >
      Test
    </v-card>
  </v-container>
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';

  import { AudioDataProvider } from "../audio/AudioDataProvider";
  import { Radix2FFT } from "../audio/Radix2FFT";

  @Component({
    name: 'TripHistory',

    data: () => ({
    }),

    mounted: async function () {
      // Based on: https://demo.scichart.com/javascript-audio-analyzer-fft-example
      const dataProvider = new AudioDataProvider();
      dataProvider.initAudio();

      const bufferSize = dataProvider.bufferSize;
      const sampleRate = dataProvider.sampleRate;

      const fft = new Radix2FFT(bufferSize);

      const hzPerDataPoint = sampleRate / bufferSize;
      const fftSize = fft.fftSize;

      setTimeout(() => {
        if (dataProvider.initialized === false) {
            return;
        }

        const audioData = dataProvider.next();

        // Perfrom FFT
        const fftData = fft.run(audioData!.yData);

        // X axis.
        console.log(`hzPerDataPoint: ${hzPerDataPoint}, fftSize: ${fftSize}`);
        console.log(JSON.stringify(fftData)); // Fourier transform. 
      }, 2000);
    },

    methods: {

    },
  })
  export default class TripHistory extends Vue {}
</script>
