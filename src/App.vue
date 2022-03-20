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
    >
      <v-list
        nav
        dense
      >
        <v-list-item-group
          v-model="group"
        >
          <v-list-item>
            <v-spacer></v-spacer>
          </v-list-item>  
        
          <v-subheader>Open Rd.</v-subheader>

          <v-expansion-panels>
            <v-list-item>
              <v-list-item-title>Map</v-list-item-title>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>History</v-list-item-title>
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
      <HelloWorld/>
    </v-main>
  </v-app>
</template>

<script>
import HelloWorld from './components/HelloWorld';

export default {
  name: 'App',

  components: {
    HelloWorld,
  },

  data: () => ({
    drawer: false,
    group: 1,
  }),

  watch: {
    group () {
      this.drawer = false

      // TODO
      console.log(this.$data.group);
    },
  },

};
</script>
