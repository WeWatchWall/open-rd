<template>
  <v-container>
    <v-card
      elevation="2"
    >
      <div style="height:10vh;">
        Peaks: {{peaks}}
      </div>
      <bar-chart v-if="loaded" :chart-data="chartData" :options="chartOptions"></bar-chart>
    </v-card>
  </v-container>
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';

  import { AudioDataProvider } from "../signalProcessing/AudioDataProvider";
  import { Radix2FFT } from "../signalProcessing/Radix2FFT";

  import BarChart from "./BarChart.vue";
  import { ChartOptions } from "chart.js";

  import { CurveCalc } from "../signalProcessing/curve_calc";

  @Component({
    name: 'TripHistory',

    components: {
      BarChart
    },

    data: () => ({
      loaded: false,
      chartData: null,
      peaks: [],
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true
          }
        },
        scales: {
          x: {
            ticks: {
              // For a category axis, the val is the index so the lookup via getLabelForValue is needed
              callback: function(val, index) {
                // Hide every 2nd tick label
                return index % 5 === 0 ? this.getLabelForValue(Number.parseFloat(val.toString())) : '';
              },
            }
          },
          y: {
            max: 15,
            min: -10
          }
        },
        hover: {
          mode: 'nearest',
          intersect: true
        },
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

      const labels = Array(100).fill(0).map((_, idx) => (idx + 1) * (Math.round(hzPerDataPoint * 100))).slice(0, 35);

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
        let rawData = percentFftData.slice(0, 35);
        let average = CurveCalc.movingAvg(rawData, 3);
        average = CurveCalc.differential(average);

        average[0] = 0;
        average[1] = 0;
        average[2] = 0;

        this.$data.chartData = {
          labels: labels,
          datasets: [
            {
              backgroundColor: "blue",
              data: average
            }
          ]
        };

        this.$data.loaded = true;

        this.$data.peaks = CurveCalc.detectPeaks(average, 3, 10);
      }, 50);
    },

    methods: {

    },
  })
  export default class TripHistory extends Vue {}
</script>
