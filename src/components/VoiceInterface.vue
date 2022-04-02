<template>
  <v-container>
    <v-dialog
      v-model="isShow"
      persistent
    >
      <v-card
        elevation="2"
        style="height:70vh; text-align: center;"
      >
        <v-icon size="60vmin" color="primary">mdi-microphone</v-icon>  
        <div size="5vh">{{ query }}</div>
        <div size="5vh">History: {{ history }}</div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';

  import StarkSpeech from "stark-speech";

  const starkSpeech = StarkSpeech.init(undefined, `${location.href}/audio`); 

  // TODO: SCREEN OFF->weird state ISSUE
  @Component({
    name: 'VoiceInterface',

    components: {
    },

    props: {
      status: Object
    },

    data: () => ({
      isShow: false,
      query: "",
      history: []
    }),

    mounted: async function () {
      // 1. Speak the greeting.
      this.$data.query = "Hello world!";
      await starkSpeech.speak(this.$data.query);

      this.$data.isShow = true;
      this.$forceUpdate();

      // 2. Listen for a response.
      let userGreeting;
      try {
        userGreeting = await starkSpeech.listen();
        this.$data.isShow = false;
      } catch (error: any) {
        this.$data.isShow = false;
        await starkSpeech.speak(`Sorry, an error occurred: ${error.error}`);
        this.$props.status.microphone = false;
      }
      // this.$forceUpdate();

      // 3. Check if you were heard.
      if (!userGreeting) {
        this.$data.isShow = true;
        this.$forceUpdate();
        this.$data.query = "You didn't respond. Can you hear me?";
        // 3.1 Say something about it.
        await starkSpeech.speak(this.$data.query);

        // Get the user response again.
        try {
          userGreeting = await starkSpeech.listen();
          this.$data.isShow = false;
        } catch (error: any) {
          this.$data.isShow = false;
          await starkSpeech.speak(`Sorry, an error occurred: ${error.error}`);
          this.$props.status.microphone = false;
        }

        this.$forceUpdate();
      }

      // Check the user response and assume they can't hear if the mic is working.
      if (!this.$props.status.microphone || !userGreeting) { this.$props.status.audio = false; return; }

      this.$data.query = "";

      while (true) { // eslint-disable-line no-constant-condition
        await starkSpeech.listenBackground();

        this.$data.isShow = true;
        this.$forceUpdate();
        this.$data.history.push(await starkSpeech.listen() || "");
        this.$data.isShow = false;
        this.$forceUpdate();
      }
    },

    methods: {
      
    },
  })
  export default class VoiceInterface extends Vue {}
</script>
