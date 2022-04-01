<script>
import Chart from 'chart.js/auto'; // eslint-disable-line no-unused-vars
import { Bar } from 'vue-chartjs/legacy';

export default {
  extends: Bar,
  props: ["chartData", "options"],
  data: () => ({
  }),
  mounted () {
    // this.chartData is created in the mixin.
    // If you want to pass options please create a local options object
    this.renderChart(this.chartData, this.options)
  },
  watch: {
    chartData () {
      this.$data._chart.update()
    }
  }
}
</script>