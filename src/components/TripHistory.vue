<template>
  <v-container>
    <v-card
      elevation="2"
    >
      <div style="height:10vh;">
        Info: {{info}}
      </div>
      <bar-chart v-if="loaded" :chart-data="chartData1" :options="chartOptions1"></bar-chart>
      <bar-chart v-if="loaded" :chart-data="chartData2" :options="chartOptions2"></bar-chart>
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
      chartData1: null,
      chartData2: null,
      info: {},
      chartOptions1: chartOptions1,
      chartOptions2: chartOptions2
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

      var dateBackgroundNoiseReset = Date.now();
      var backgroundNoise: number[] = [];

      var isSnapshot = false;
      var noiseSnapshot: number[] = [];

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

        // Calculate background noise
        let now = Date.now();

        if (!backgroundNoise.length) { backgroundNoise = rawData; }
        if (!isSnapshot && dateBackgroundNoiseReset > 1000) { 
          noiseSnapshot = rawData;
          isSnapshot = true;
        }

        if (now - dateBackgroundNoiseReset > 6000) {
          dateBackgroundNoiseReset = now;
          backgroundNoise = noiseSnapshot;
          isSnapshot = false;
        } else {
          backgroundNoise = backgroundNoise.map(((value:any, index:any) => {
            noiseSnapshot[index] = Math.min(noiseSnapshot[index], rawData[index]);
            return Math.min(value, rawData[index]);
          }));
          rawData = rawData.map(((value:any, index:any) => {
            return value - backgroundNoise[index];
          }));
        }

        let average = CurveCalc.movingAvg(rawData, 3);
        let variance = 5;

        let puker = CurveCalc.poly_simplify(average.map((value:any, index:any) => {
          return [index * variance, value];
        }), 4); // variance - 1

        // Interpolate based on Puker.
        puker[0] = [0, rawData[0]];
        let poi = Array(35).fill(0);
        for (let index = 1; index < puker.length; index++) {
          const point = puker[index];
          const previous = puker[index - 1];
          const numIndices = ((point[0] - previous[0]) / variance) + 1;

          const interpolated = CurveCalc.interpolateArray([previous[1], point[1]], numIndices);
          for (let j = 0; j < interpolated.length; j++) {
            poi[previous[0] / variance + j] =  interpolated[j];        
          }
        }

        this.$data.chartData1 = {
          labels: labels,
          datasets: [
            {
              backgroundColor: "blue",
              data: average
            },
            {
              backgroundColor: "red",
              data: poi
            }
          ]
        };

        let diff = CurveCalc.differential(rawData);
        diff = CurveCalc.movingAvg(diff, 3);
        let diffVariance = 2;

        puker = CurveCalc.poly_simplify(diff.map((value:any, index:any) => {
          return [index * variance, value];
        }), 3); // diffVariance + 1
        poi = Array(35).fill(0);

        puker.map((value:any) => {
          if (value[1]) {
            poi[value[0] / variance] = value[1];
          }
        });

        this.$data.chartData2 = {
          labels: labels,
          datasets: [
            {
              backgroundColor: "blue",
              data: diff
            },
            {
              backgroundColor: "red",
              data: poi
            }
          ]
        };

        this.$data.loaded = true;

        this.$data.info = {
          variance: variance,
          diffVariance: diffVariance
        };
      }, 50);
    },

    methods: {

    },
  })
  export default class TripHistory extends Vue {}

  const chartOptions1: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0
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
            return index % 5 === 0 ? this.getLabelForValue(Number.parseFloat(val.toString())) : '';
          },
        }
      },
      y: {
        max: 45,
        min: 0
      }
    },
    hover: {
      mode: 'nearest',
      intersect: true
    },
  };
  
  const chartOptions2: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0
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
            return index % 5 === 0 ? this.getLabelForValue(Number.parseFloat(val.toString())) : '';
          },
        }
      },
      y: {
        max: 10,
        min: -10
      }
    },
    hover: {
      mode: 'nearest',
      intersect: true
    },
  };
</script>
