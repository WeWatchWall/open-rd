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
        <v-icon size="60vw" color="primary">mdi-microphone</v-icon>  
        <div size="5vh">{{ query }}</div>
        <div size="5vh">History: {{ history }}</div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts">
  import { Component, Vue } from 'vue-property-decorator';

  import tf from '@tensorflow/tfjs'; // eslint-disable-line no-unused-vars
  import { create } from '@tensorflow-models/speech-commands';
  import annyang from "../annyang.min";

  import FlatPromise from 'flat-promise';

  // Delay in ms between local and remote recognition.
  const SWITCH_DELAY = 800;
  // Accuracy in % for keyword detection.
  const DETECT_ACCURACY = 0.87;
  // Also responds to: *phone hits table*, diss, miss, tiss, fiss, stark, start, time, mime
  const recognizer = create(
    "BROWSER_FFT", // fourier transform type, not useful to change
    undefined, // speech commands vocabulary feature, not useful for your models
    `${location.href}/audio/model.json`,
    `${location.href}/audio/metadata.json`
  );

  var remotePromise = new FlatPromise();
  var isRemoteInit = false;
  var remoteResult: any;

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
      // Check that model and metadata are loaded via HTTPS requests.
      await recognizer.ensureModelLoaded();

      // 1. Speak the greeting.
      this.$data.query = "Hello world!";
      await speak(this.$data.query);

      this.$data.isShow = true;
      this.$forceUpdate();

      // 2. Listen for a response.
      let userGreeting;
      try {
        userGreeting = await listen();
        this.$data.isShow = false;
      } catch (error: any) {
        this.$data.isShow = false;
        await speak(`Sorry, an error occurred: ${error.error}`);
        this.$props.status.microphone = false;
      }
      // this.$forceUpdate();

      // 3. Check if you were heard.
      if (!userGreeting) {
        this.$data.isShow = true;
        this.$forceUpdate();
        this.$data.query = "You didn't respond. Can you hear me?";
        // 3.1 Say something about it.
        await speak(this.$data.query);

        // Get the user response again.
        try {
          userGreeting = await listen();
          this.$data.isShow = false;
        } catch (error: any) {
          this.$data.isShow = false;
          await speak(`Sorry, an error occurred: ${error.error}`);
          this.$props.status.microphone = false;
        }

        this.$forceUpdate();
      }

      // Check the user response and assume they can't hear if the mic is working.
      if (!this.$props.status.microphone || !userGreeting) { this.$props.status.audio = false; return; }

      this.$data.query = "";

      while (true) { // eslint-disable-line no-constant-condition
        await listenBackground();

        this.$data.isShow = true;
        this.$forceUpdate();
        this.$data.history.push(await listen() || "");
        this.$data.isShow = false;
        this.$forceUpdate();
      }
    },

    methods: {
      
    },
  })
  export default class VoiceInterface extends Vue {}

  const speak = async function (arg: string)  {
    let utterance = new SpeechSynthesisUtterance(arg);
    var flatPromise = new FlatPromise();

    utterance.onend = function() {
      flatPromise.resolve();
    };
    speechSynthesis.speak(utterance);

    await flatPromise.promise;
  };

  const listen = async function () {
    // Setup the first time.
    if (!isRemoteInit) {
      isRemoteInit = true;

      annyang!.addCallback(
        "result", 
        (result: string[]) => {
          remoteResult = result[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
        }
      );

      annyang!.addCallback(
        "error", 
        (error: any) => {
          if (error.type == 'error' && error.error == 'no-speech') {
            return;
          }

          // Pull down the global vars.
          var localPromise = remotePromise;
          remotePromise = new FlatPromise();
          remoteResult = null;

          localPromise.reject(error);
        }
      );

      annyang!.addCallback(
        "end", 
        () => {
          // Pull down the global vars.
          var localPromise = remotePromise;
          var localResult = remoteResult;
          remotePromise = new FlatPromise();
          remoteResult = null;

          setTimeout(() => {
            localPromise.resolve(localResult);
          }, SWITCH_DELAY);
        }
      );
    }

    // Start listening.
    annyang!.start({ autoRestart: false, continuous: false });

    let result = await remotePromise.promise;
    return result;
  };
  
  const listenBackground = async function () {
    var resultPromise = new FlatPromise();

    recognizer.listen(async (result): Promise<void> => {
      let results = result.scores;
      if (results[1] > DETECT_ACCURACY) {            
        await recognizer.stopListening();
        setTimeout(
          () => {
            resultPromise.resolve();
          },
          SWITCH_DELAY
        );
      }
    }, {
      includeSpectrogram: false, // in case listen should return result.spectrogram
      probabilityThreshold: 0.75,
      invokeCallbackOnNoiseAndUnknown: false,
      overlapFactor: 0.75 // probably want between 0.5 and 0.75. More info in README
    });

    // returns when it's called out.
    await resultPromise.promise;
    return;
  }
</script>
