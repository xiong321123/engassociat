const sdk = require("microsoft-cognitiveservices-speech-sdk");
const config = require("./config");
const fs = require("fs");

const speechConfig = sdk.SpeechConfig.fromSubscription(config.SPEECH_KEY, config.SPEECH_REGION);
const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

// 设置语音合成参数
const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
  <voice name='Microsoft Server Speech Text to Speech Voice (en-US, JessaRUS)'>
    Hello, world!
  </voice>
</speak>`;

async function textToSpeech() {
  console.log("Starting text to speech conversion...");

  try {
    const result = await synthesizer.speakSsmlAsync(ssml);
    if (result) {
      console.log("Conversion to WAV format completed successfully.");
      const audioStream = sdk.AudioDataStream.fromResult(result);
      audioStream.saveToAudioFile("output.wav", sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1));
      console.log("Output file saved as output.wav");
    }
    synthesizer.close();
  } catch (error) {
    console.error(error);
    synthesizer.close();
  }
}

textToSpeech();
