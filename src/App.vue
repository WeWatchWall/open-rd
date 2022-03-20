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
          v-model="group1"
        >
          <v-list-item>
            <v-spacer></v-spacer>
          </v-list-item>

          
          <v-list-item>
            <v-list-item-title>Buzz</v-list-item-title>
          </v-list-item>
          
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-header>
                Category 1
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-list-item>
                  <v-list-item-title>Bar</v-list-item-title>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Fizz</v-list-item-title>
                </v-list-item>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-list-item-group>

        <v-list-item-group
          v-model="group2"
        >          
          <v-list-item>
            <v-list-item-title>Buzz 2</v-list-item-title>
          </v-list-item>
          
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-header>
                Category 2
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-list-item>
                  <v-list-item-title>Bar 2</v-list-item-title>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>Fizz 2</v-list-item-title>
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
    group1: null,
    group2: null,
  }),

  watch: {
    group1 () {
      this.drawer = false
    },
    group2 () {
      this.drawer = false
    },
  },

};
</script>
