//这段代码对输入的文字，生成了WAV，也生成了OGG，ogg在QQ影音中能播放


const { BlazeClient } = require("mixin-node-sdk");
const config = require("./config");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
const client = new BlazeClient(config, { parse: true, syncAck: true });
const text1 = "Hello world"

(function() {

    "use strict";

    var sdk = require("microsoft-cognitiveservices-speech-sdk");
    var readline = require("readline");

    var audioFile = "YourAudioFile.wav";
    const speechConfig = sdk.SpeechConfig.fromSubscription(config.SPEECH_KEY, config.SPEECH_REGION);
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);

    speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural"; 

    var synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question("Enter some text that you want to speak >\n> ", function (text) {
      rl.close();
      synthesizer.speakTextAsync(text,
          function (result) {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          console.log("synthesis finished.");
          convertToOgg();
        } else {
          console.error("Speech synthesis canceled, " + result.errorDetails +
              "\nDid you set the speech resource key and region values?");
        }
        synthesizer.close();
        synthesizer = null;
      },
          function (err) {
        console.trace("err - " + err);
        synthesizer.close();
        synthesizer = null;
      });
      console.log("Now synthesizing to: " + audioFile);
    });

    function convertToOgg() {
      const input = './YourAudioFile.wav';
      const output = './output.ogg';
      ffmpeg(input)
        .outputOptions('-vn')
        .audioCodec('libopus')
        .audioChannels(2)
        .audioFrequency(48000)
        .outputOptions('-b:a 64k')//-b:a 64k
        .format('ogg')
        .on('end', () => console.log('Finished transcoding'))
        .on('error', (err) => console.log(`An error occurred: ${err.message}`))
        .save(output);
    }
}());


//和mixin交付的先暂停

// const fs = require('fs');
// const file = fs.readFileSync('./output.ogg');


//   // Upload the OGG file to Mixin
//   const attachment = client.uploadFile(file);
//   console.log(attachment);

//   const attachment_id11 = attachment.attachment_id;
//   console.log(attachment_id11);

//   client.sendAudioMsg("3c1b99b3-600f-4be0-a027-b36d4bbdb2d9", {
//     attachment_id: attachment_id11,
//     mime_type: "audio/ogg", // 音频的类型，目前只支持：audio/ogg
//     size: 59000, // 音频的大小，单位是字节
//     duration: 1000, // 音频的时长，单位是毫秒
//     wave_form: "base64", // 可选，音频轨迹 base64
//   });
