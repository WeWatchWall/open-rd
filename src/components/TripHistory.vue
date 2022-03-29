<template>
  <v-container>
    <v-card
      elevation="2"
    >
      <div style="height:10vh;">
        Info: {{info}},
        <p></p>
        Letters : {{letters}}
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
  import calculateCorrelation from "calculate-correlation";

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
      letters: [],
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

        // let rawPoi = poi;
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

        let correlations: number[] = [];
        filters.map((value:any) => {
          correlations.push(calculateCorrelation(average, value.filter));
        });
        
        let correlationIndex = Math.max(...correlations);

        if(correlationIndex > 0.3) { 
          correlationIndex = correlations.indexOf(correlationIndex);
          // this.$data.letters.push(filters[correlationIndex].name);
        }
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

  const filters = [
    {
      name: "J",
      filter: [36.309, 33.91, 31.511, 28.302, 25.093, 21.883, 18.674, 15.465, 18.336, 21.207, 24.078, 26.949, 29.821, 32.692, 32.172, 31.653, 27.304, 22.956, 18.607, 19.946, 21.286, 22.625, 19.01, 15.395, 18.758, 22.121, 25.483, 28.846, 23.353, 17.859, 12.366, 11.608, 10.851, 10.093, 9.336],
    },
    {
      name: "A",
      filter: [37.59, 36.29, 34.989, 32.948, 30.906, 28.865, 26.824, 20.756, 14.688, 13.657, 12.626, 11.595, 10.564, 9.534, 11.462, 13.39, 15.318, 12.468, 9.618, 6.768, 7.167, 7.566, 7.965, 8.364, 8.763, 9.162, 9.561, 9.96, 10.359, 9.508, 8.656, 7.805, 6.954, 6.103, 5.252],
    },
    {
      name: "R",
      filter: [41.055, 40.89, 40.724, 35.998, 31.271, 26.544, 24.402, 22.26, 20.118, 17.975, 15.833, 13.691, 11.549, 13.574, 15.6, 17.625, 19.651, 16.713, 13.775, 10.837, 7.899, 7.991, 8.083, 8.175, 8.267, 8.36, 8.452, 8.544, 8.636, 8.728, 8.82, 8.913, 9.005, 9.097, 9.189],
    },
    {
      name: "V",
      filter: [37.612, 32.733, 27.853, 23.258, 18.663, 20.019, 21.375, 22.732, 19.637, 16.542, 13.447, 10.352, 13.136, 15.919, 18.703, 21.486, 18.34, 15.194, 12.049, 14.189, 16.329, 18.469, 15.487, 12.505, 9.523, 11.227, 12.93, 14.634, 16.337, 14.306, 12.274, 10.243, 8.211, 9.524, 10.837],
    },
    {
      name: "I",
      filter: [34.768, 29.788, 24.808, 19.267, 13.726, 8.184, 7.879, 7.574, 7.27, 6.965, 6.66, 6.355, 6.05, 8.307, 10.563, 12.82, 15.077, 12.444, 9.811, 7.178, 4.545, 4.484, 4.424, 4.363, 4.303, 4.243, 4.182, 4.122, 4.061, 4.001, 3.94, 3.88, 3.82, 3.759, 3.699],
    },
    {
      name: "S",
      filter: [15.033, 14.165, 13.296, 12.782, 12.268, 11.753, 11.239, 10.725, 10.211, 9.697, 9.182, 8.668, 8.154, 13.45, 18.746, 24.043, 29.339, 30.227, 31.115, 32.003, 32.891, 33.779, 34.668, 31.574, 28.48, 25.386, 25.179, 24.971, 24.764, 24.557, 19.31, 14.064, 14.531, 14.999, 15.466],
    }
  ];
</script>
