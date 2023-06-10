


const fs = require('fs');
const request = require('request');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const { BlazeClient } = require("mixin-node-sdk");
const config = require("./config");
const {
  checkMixinVersionBiggerThanTarget,
} = require("mixin-web-sdk/dist/lib/browser");
const client = new BlazeClient(
  {
    pin: config.pin,
    client_id: config.client_id,
    session_id: config.session_id,
    pin_token: config.pin_token,
    private_key: config.private_key,
    config,
  },
  { parse: true, syncAck: true }
);
const { Configuration, OpenAIApi } = require("openai");
const whitelist = require("./whitelist");
const configuration = new Configuration({
  apiKey: config.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
//先放在这里

let PreviousQuestion = "";//上次疑问
let Previousanswer = "";//上次问的问题

//这下面的是和mixin的通讯
client.loopBlaze({
  async onMessage(msg) {
    console.log(msg);
    const UserId = msg.user_id;//znegjia
    console.log(UserId);
    var rawData=''
    if(msg.data === "/"){
      randomWords = selectWords(7)

      client.sendAppButtonMsg(UserId, [
        {
          label: randomWords[0], // 按钮的文本内容
          color: '#FF0000', // 16进制按钮的颜色，如： #FF0000
          action: `input: ${randomWords[0]}`, // 按钮的跳转链接
        },
      ]);//并没有造句，conversation这个函数中有要求进行造句。

    }

    else if(msg.category === "PLAIN_TEXT" && msg.data.toString().substring(0,1) === "。"){//输入句号可以清空前文记录，进行重置
      PreviousQuestion =''
      Previousanswer=''
    }




    else if(msg.category === "PLAIN_TEXT" && msg.data.toString().substring(0,1)!==( "。"||"/")){ 
        rawData = msg.data.toString(); //转为string  
        console.log(`此处的rawdata是${rawData}`)
    }

    else if(msg.category === "PLAIN_AUDIO"){
      client.showAttachment(msg.data.attachment_id).then(console.log)//输出
      const oggUrl =(await client.showAttachment(msg.data.attachment_id)).view_url//这个文件如何下载保存转换    
      console.log(`此处的URL是${oggUrl}`)
      // 调用转换函数
       outputPath = `./audiocach/audio5.mp3`;
    
      await convertOGGtoMP3(oggUrl)
        .then(mp3Path => console.log(mp3Path))
        .catch(error => console.error(error));

      const resp = await openai.createTranscription(//OpenAi进行翻译，createTranscription就是转为文字
       fs.createReadStream("./audiocach/audio5.mp3"),
       "whisper-1"
        );
      //console.log(resp.data.text)
      rawData=resp.data.text
      console.log(`这里语音转文字为:${rawData}`)
    }

    let RawZhData = ""; //初始化的
       let RawEnData = "";   
       let rec = "";
       let rec1 = "";
       let rec2 = '';

       tokens = 0;
       const checkl = checklanguage(rawData);
       console.log(`此处的checkl是:${checkl}`)

      if (checkl === "chinese") {
        RawZhData = rawData;
        let translateZHToEnAll = await translate("chinese", RawZhData);
        let RawEnData = translateZHToEnAll.translateRec;//
        let RawEnDataO = translateZHToEnAll.translateRec;//这两个是来做什么的
        tokens += translateZHToEnAll.translateTokens;

        rec2 = `>用户\n中文原文:  ${RawZhData} \nEnglish translation：${RawEnDataO}\n`
        client.sendMessageText(msg.user_id, rec2);

        RawEnData = PreviousQuestion+Previousanswer+RawEnData;//上次疑问+上次回答+本次输入=本次疑问
        PreviousQuestion = RawEnData//本次疑问作为下一次的上次疑问
        console.log(`对话函数运行前GPT被问到的问题：${RawEnData}`);

        let conversationAll = await conversation(RawEnData);
        let ReturnEnData = conversationAll.conversationRec;//

        Previousanswer = ReturnEnData//本次回答作为下一次的上次回答
        //console.log(`下一次对话函数运行前GPT的回复背景：${Previousanswer}`);

        tokens += conversationAll.conversationTokens;//

        let translateEnToZhAll = await translate("english", ReturnEnData);
        let ReturnZhData = translateEnToZhAll.translateRec//
        tokens += translateEnToZhAll.translateTokens;//
        
        console.log(`total tokens ${tokens}`);
        const costs=0.002/1000*tokens
        console.log(`total costs ${costs}`);

        rec = `< 助手\n英文回应：${ReturnEnData}\n`;
        //就按照中文进行翻译和输出
        client.sendMessageText(msg.user_id, rec);
        texttoaudio(ReturnEnData)
        setTimeout(() => {
          UpLoadOggFile(UserId);
        }, 7000);
        rec1 = `中文回应：\n\n\n\n${ReturnZhData}`; 
        
        setTimeout(() => {
          client.sendMessageText(msg.user_id, rec1);
        }, 12000);



      } else if (checkl === "english") {
        //如果输入的是英文字符
        RawEnData = rawData;
        RawEnDataO = rawData;
        let translateEnToZhAll = await translate("english", RawEnData);
        let RawZhData = translateEnToZhAll.translateRec;//
        tokens += translateEnToZhAll.translateTokens;
        console.log(`translateTokens ${tokens}`);


        
        rec2 = `>用户\nEnglish original text:  ${RawEnDataO} \n中文译文：${RawZhData}\n\n`
        client.sendMessageText(msg.user_id, rec2);

        RawEnData = PreviousQuestion+Previousanswer+RawEnData;//上次疑问+上次回答+本次输入
        PreviousQuestion = RawEnData//本次疑问作为下一次的上次疑问
        console.log(`对话函数运行前GPT被问到的问题：${RawEnData}`);

        let conversationAll = await conversation(RawEnData);
        let ReturnEnData = conversationAll.conversationRec;//

        Previousanswer = ReturnEnData//本次回答作为下一次的上次回答
        //console.log(`对话函数运行前GPT被问到的问题：${RawEnData}`);

        tokens +=conversationAll.conversationTokens;//
        console.log(`conversationTokens ${tokens}`);

        let translateEnToZhReturnAll = await translate("english", ReturnEnData);
        let ReturnZhData = translateEnToZhReturnAll.translateRec//
        tokens +=translateEnToZhReturnAll.translateTokens;//
        console.log(`translateTokens ${tokens}`);

        console.log(`total tokens ${tokens}`);
        const costs=0.002/1000*tokens
        console.log(`total costs ${costs}`);

        rec = `< 助手\n英文回应：${ReturnEnData}\n`;
        client.sendMessageText(msg.user_id, rec);
        texttoaudio(ReturnEnData)
        setTimeout(() => {
          UpLoadOggFile(UserId);
        }, 7000);

        rec1 = `中文回应：\n\n\n\n${ReturnZhData}`; 
        
        setTimeout(() => {
          client.sendMessageText(msg.user_id, rec1);
        }, 12000);


      } else {
        client.sendMessageText(
          msg.user_id,
          "仅支持中英文消息Only Chinese and English text are supportied"
        );
      }
      }}
    
    //   if(msg.category === "PLAIN_TEXT" && msg.data.toString().substring(0,1) === "/"){
    //     const message1 = msg.data.toString().substring(1);
    //     const checkl = checklanguage(message1);
    //     const translateWord = await translate(checkl,message1);
    //     console.log(`translateWord is:${translateWord}`)
    //     console.log(translateWord)
    //     console.log(translateWord.translateTokens)
    //     console.log(translateWord.translateRec)
    //     client.sendMessageText(msg.user_id, `> ${message1} \n> ${translateWord.translateRec}`);
    //   }


  
    // else {
    //   client.sendMessageText(
    //     msg.user_id,
    //     "你的ID必须经过授权，且内容必须是语音或文本消息 Your ID must be authorized and the content must be a text message"
    //   )
    // }
  
);




//下面为函数区，最新的函数在最下面
function checklanguage(text) {
  const chineseReg = /^[\u4e00-\u9fa5。，！？……（）\s""‘’“”]+$/; // 匹配中文字符的正则表达式
  const englishReg = /^[A-Za-z.,!?'"()\s]+$/; // 匹配英文字符的正则表达式
  if (chineseReg.test(text.charAt(0))) {//只检查第一个字符
    console.log("输入的字符是中文2");
    return "chinese";
  } else if (englishReg.test(text)) {
    console.log("输入的字符是英文2");
    return "english";
  } else {
    return "unknown";
  }
}


async function translate(language, text) {
  if (language === "chinese") {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that translates Chinese to English.",
        },
        {
          role: "user",
          content: `Translate the following Chinese text to English And only answer the translated text.: "${text}"`,
        },
      ],
    });
    //console.log("下面是反馈回来的内容");
    // console.log(completion.data.choices[0].message);
    //console.log(completion.data.choices[0].message.content.replace(/^"(.*)"$/, "$1"));
    console.log(completion.data.usage.total_tokens);
    const translateTokens = completion.data.usage.total_tokens
    const translateRec = completion.data.choices[0].message.content.replace(/^"(.*)"$/, "$1")
    return {translateTokens:translateTokens,translateRec:translateRec}
    //completion.data.choices[0].message.content.replace(/^"(.*)"$/, "$1");
  } else if (language === "english") {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that translates English to Chinese.",
        },
        {
          role: "user",
          content: `Translate the following English text to simplified Chinese And only answer the translated text.: "${text}"`,
        },
      ],
    });
    //console.log("下面是反馈回来的内容2");
    // console.log(completion.data.choices[0].message);
    //console.log(completion.data.choices[0].message.content.replace(/^"(.*)"$/, "$1"));
    console.log(completion.data.usage.total_tokens);

    const translateTokens = completion.data.usage.total_tokens
    const translateRec = completion.data.choices[0].message.content.replace(/^"(.*)"$/, "$1")
    return {translateTokens:translateTokens,translateRec:translateRec}
    //return completion.data.choices[0].message.content.replace(/^"(.*)"$/, "$1");
  }
  return rec;
}


async function conversation(text) {
  const completion = await openai.createChatCompletion({
    model: "gpt-4",//"gpt-3.5-turbo"
  messages: [
    {
      role: "system",
      content:
      "I want you to act as a spoken English teacher and improver. I will speak to you in English and you will reply to me in English to practice my spoken English. If my content is a sentence or a question, you start the conversation based on my content. If my content is not a sentence or a question, use the content to generate a sentence to make a conversation. I want you to keep your reply neat, limiting the reply to 150 words.  I want you to generate a sentence to make a conversationstrictly correct my grammar mistakes, typos, and factual errors. You need to understand the content of my new reply in the context of our previous exchange. You always ask me a question in your reply. Now let's start practicing, you could ask me a question first. Remember, I want you to strictly correct my grammar mistakes, typos, and factual errors.",
    },
    {
      role: "user",
      content: `${text}`,
  },
  ]
});
  console.log("下面是反馈回来的内容3");
  //console.log(completion.data.choices[0].message);
 console.log(completion.data.choices[0].message.content.replace(/^"(.*)"$/, "$1"));
 console.log(completion.data.usage.total_tokens);

 const conversationTokens = completion.data.usage.total_tokens
 const conversationRec = completion.data.choices[0].message.content.replace(/^"(.*)"$/, "$1")
 return {conversationTokens:conversationTokens,conversationRec:conversationRec}

  //return completion.data.choices[0].message.content.replace(/^"(.*)"$/, "$1");
}


// 定义转换函数
async function convertOGGtoMP3(url) {
  return new Promise((resolve, reject) => {
    // 下载 OGG 文件
    const stream = request(url);

    // 转换为 MP3 格式,成功了
    const command = ffmpeg();
    command.input(stream);
    command.audioCodec('libmp3lame');
    command.outputFormat('mp3');
    command.on('end', () => {
      // 返回转换后的 MP3 文件路径
      resolve(outputPath);
    });
    command.on('error', (error) => {
      reject(error);
    });
    command.save(outputPath);
  });
}


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


async function UpLoadOggFile(UserId) {
  const file1 = fs.readFileSync("./output.ogg");
  const attachment = await client.uploadFile(file1);
  console.log(attachment);
  const attachment_id11 = attachment.attachment_id;

  client.sendAudioMsg(UserId, {//这一步需要进行修改才行，不同的人都能收到才行。tudouIpad:a840dd01-8bb4-4590-930a-21452ea2d6e6,
    attachment_id: attachment_id11, // 文件的唯一标识////wodeshouji:3c1b99b3-600f-4be0-a027-b36d4bbdb2d9
    mime_type: 'audio/ogg', // 音频的类型，目前只支持：audio/ogg   //
    size: 43000, // 音频的大小，单位是字节
    duration: 8000, // 音频的时长，单位是毫秒
    //wave_form: 'base64', // 可选，音频轨迹 base64
  });
}


function selectWords(wordlength){
  // 一个包含20个元素的列表
  const word = ["be", "have", "do", "say", "go", "get", "make", "know", "think", "take", "see", "come", "want", "use", "find", "give", "tell", "work", "call", "try"]
  
  const result = []; // 定义空数组用于存储随机选择的3个不同元素
  
  while (result.length < wordlength) { // 循环直到随机选择3个不同元素
    const randomIndex = Math.floor(Math.random() * word.length); // 生成随机索引
    const randomElement = word[randomIndex]; // 根据随机索引获取随机元素
    if (!result.includes(randomElement)) { // 判断随机元素是否已经被选择过
      result.push(randomElement); // 将随机元素添加到结果数组中
    }
  }
  console.log(result); // 打印随机选择的3个不同元素
  return result;
  }
  
   