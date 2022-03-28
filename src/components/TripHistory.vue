<template>
  <v-container>
    <v-card
      elevation="2"
      width="100vw"
    >
      <bar-chart v-if="loaded" :chart-data="chartData" :options="chartOptions"></bar-chart>
    </v-card>
  </v-container>
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';

  import { AudioDataProvider } from "../audio/AudioDataProvider";
  import { Radix2FFT } from "../audio/Radix2FFT";

  import BarChart from "./BarChart.vue";
  import { ChartOptions } from "chart.js";

  @Component({
    name: 'TripHistory',

    components: {
      BarChart
    },

    data: () => ({
      loaded: false,
      chartData: null,
      chartOptions: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1,
        animation: {
          duration: 1
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
          }
        },
        scales: {
          x: {
            ticks: {
              // For a category axis, the val is the index so the lookup via getLabelForValue is needed
              callback: function(val, index) {
                // Hide every 2nd tick label
                return index % 10 === 0 ? this.getLabelForValue(Number.parseFloat(val.toString())) : '';
              },
            }
          },
          y: {
            max: 50
          }
        }
      } as ChartOptions
    }),

    // graphs
    // worker 
    //   async interface
    //   comm interface
    mounted: async function () {
      const dataProvider = new AudioDataProvider();
      dataProvider.initAudio();

      const bufferSize = dataProvider.bufferSize;
      const sampleRate = dataProvider.sampleRate;

      const fft = new Radix2FFT(bufferSize);

      const hzPerDataPoint = sampleRate / bufferSize;
      // const fftSize = fft.fftSize;

      const labels = Array(100).fill(0).map((_, idx) => (idx + 1) * (Math.round(hzPerDataPoint * 100)));

      setInterval(() => {
        if (dataProvider.initialized === false) {
            return;
        }

        const audioData = dataProvider.next();

        // Perfrom FFT
        const fftData = fft.run(audioData!.yData);

        const percentFftData = [];
        let binCount = 1;
        let binAvg = 0;
        let binIndex = 0;
        
        for (let index = 0; index < fftData.length; index++) {
          const element = fftData[index];
          
          if (index > 0 && index % 10 === 0) {
            percentFftData.push(binAvg);
            binCount = 1;
            binAvg = 0;
            binIndex++;
          }

          if (binIndex > 99) { break; }

          binAvg = (binAvg * binCount + Math.abs(element)) / (binCount + 1);
          binCount++;
        }

        // X axis.
        // console.log(`hzPerDataPoint: ${hzPerDataPoint}, bufferSize: ${bufferSize}, fftSize: ${fftSize}`);
        // console.log(JSON.stringify(fftData)); // Fourier transform.

        this.$data.chartData = {
          labels: labels,
          datasets: [
            {
              backgroundColor: "blue",
              data: percentFftData
            }
          ]
        };

        this.$data.loaded = true;
      }, 50);
    },

    methods: {

    },
  })
  export default class TripHistory extends Vue {}
</script>
