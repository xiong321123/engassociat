//对text1的文字，生成了WAV，也生成了OGG，ogg在QQ影音中能播放

const { BlazeClient } = require("mixin-node-sdk");
const config = require("./config");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
const client = new BlazeClient(config, { parse: true, syncAck: true });

const text1 = "Here is what PS means and how to use it correctly in your messages.";

function texttoaudio(text) {
  "use strict";

  var sdk = require("microsoft-cognitiveservices-speech-sdk");

  var audioFile = "YourAudioFile.wav";
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    config.SPEECH_KEY,
    config.SPEECH_REGION
  );
  const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);

  speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural";

  var synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  synthesizer.speakTextAsync(
    text,
    function (result) {
      if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
        console.log("synthesis finished.");
        convertToOgg();
      } else {
        console.error(
          "Speech synthesis canceled, " +
            result.errorDetails +
            "\nDid you set the speech resource key and region values?"
        );
      }
      synthesizer.close();
      synthesizer = null;
    },
    function (err) {
      console.trace("err - " + err);
      synthesizer.close();
      synthesizer = null;
    }
  );

  console.log("Now synthesizing to: " + audioFile);

  function convertToOgg() {
    const input = "./YourAudioFile.wav";
    const output = "./output.ogg";
    ffmpeg(input)
      .outputOptions("-vn")
      .audioCodec("libopus")
      .audioChannels(2)
      .audioFrequency(48000)
      .outputOptions("-b:a 64k")
      .format("ogg")
      .on("end", () => console.log("Finished transcoding"))
      .on("error", (err) => console.log(`An error occurred: ${err.message}`))
      .save(output);
  }
};

texttoaudio(text1)