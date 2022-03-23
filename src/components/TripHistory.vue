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
      const dataProvider = new AudioDataProvider();

      const bufferSize = dataProvider.bufferSize;
      // const sampleRate = dataProvider.sampleRate;

      // const fft =
      new Radix2FFT(bufferSize);
    },

    methods: {

    },
  })
  export default class TripHistory extends Vue {}
</script>
