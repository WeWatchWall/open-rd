<template>
  <v-app>
    <v-app-bar
      app
      color="primary"
      dark
      dense
      elevation="4"
      z-index="1089"
    >
      <div class="d-flex align-center">
        <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      </div>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      absolute
      style="position:fixed; top:0; left:0; overflow-y:scroll;"
    >
      <v-list
        nav
        dense
      >
        <v-list-item-group
          v-model="page"
        >
          <v-list-item>
            <v-spacer></v-spacer>
          </v-list-item>  
        
          <v-subheader>
            <v-icon>mdi-cellphone-marker</v-icon>  
            Open Rd.
          </v-subheader>

          <v-expansion-panels>
            <v-list-item>
              <v-list-item-title>
                <v-icon>mdi-map</v-icon>
                Map
              </v-list-item-title>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>
                <v-icon>mdi-history</v-icon>
                History
              </v-list-item-title>
            </v-list-item>

            <v-expansion-panel>
              <v-expansion-panel-header>
                Analytics
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-list-item>
                  <v-list-item-title>Today</v-list-item-title>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Location</v-list-item-title>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Notifications</v-list-item-title>
                </v-list-item>
              </v-expansion-panel-content>
            </v-expansion-panel>

            <v-expansion-panel>
              <v-expansion-panel-header>
                Settings
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-list-item>
                  <v-list-item-title>General</v-list-item-title>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Vehicles</v-list-item-title>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Drivers</v-list-item-title>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Routes</v-list-item-title>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Notifications</v-list-item-title>
                </v-list-item>
              </v-expansion-panel-content>
            </v-expansion-panel>

            <v-expansion-panel>
              <v-expansion-panel-header>
                Info
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-list-item>
                  <v-list-item-title>System</v-list-item-title>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>License</v-list-item-title>
                </v-list-item>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <div v-if="page==1">
        <MainMap/>
      </div>
      <div v-if="page==2">
        <VoiceInterface/>
      </div>
      <div v-if="page==4">
        <LicenseISC/>
      </div>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import MainMap from './components/MainMap.vue';
import VoiceInterface from './components/VoiceInterface.vue';
import LicenseISC from './components/LicenseISC.vue';

@Component({
  name: 'App',

  components: {
    MainMap,
    VoiceInterface,
    LicenseISC
  },

  data: () => ({
    drawer: false,
    page: 2,
  }),

  watch: {
    page () {
      this.$data.drawer = false

      // TODO
      console.log(this.$data.page);
    },
  },
})
export default class App extends Vue {}
</script>


