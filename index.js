//我的主版本
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
const configuration = new Configuration({
  apiKey: config.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);


//这下面的是和mixin的通讯
client.loopBlaze({
  async onMessage(msg) {
    console.log(msg);
    if (msg.category === "PLAIN_TEXT") {
      //仅支持普通文本
      const rawData = msg.data.toString(); //转为string

      //判断为中英文
      // const chineseReg = /^[\u4e00-\u9fa5]+$/; // 匹配中文字符的正则表达式
      // const englishReg = /^[A-Za-z]+$/; // 匹配英文字符的正则表达式

      let RawZhData = ""; //初始化的
      let RawEnData = "";
      let ReturnZhData = ""; //初始化的
      let ReturnEnData = "";
      let rec = "";
      const checkl = checklanguage(msg.data);

      if (checkl === "chinese") {
        RawZhData = rawData;
        let RawEnData = await translate("chinese", RawZhData);
        let ReturnEnData = await conversation(RawEnData)
        let ReturnZhData = await translate("english", ReturnEnData)
        //现在在做中文提问机器人回应的部分

        rec = `>用户\n中文原文:  ${RawZhData} \nEnglish translation：${RawEnData}\n\n< 助手\n英文回应：${ReturnEnData}\n中文回应：${ReturnZhData}`;
        //就按照中文进行翻译和输出
        client.sendMessageText(msg.user_id, rec);
      } else if (checkl === "english") {
        //如果输入的是英文字符
        RawEnData = rawData;
        let RawZhData = await translate("english", RawEnData);
        let ReturnEnData = await conversation(RawEnData)
        let ReturnZhData = await translate("english", ReturnEnData)
        rec = `>用户\nEnglish original text:  ${RawEnData} \n中文译文：${RawZhData}\n\n< 助手\n英文回应：${ReturnEnData}\n中文回应：${ReturnZhData}`;
        client.sendMessageText(msg.user_id, rec);
      } else {
        client.sendMessageText(
          msg.user_id,
          "仅支持中英文Only English and Chinese are supportied"
        );
      }
    }
    else {
      client.sendMessageText(
        msg.user_id,
        "仅支持文本消息Only text are supportied"
      )
    }
  },
});




//下面为函数区，最新的函数在最下面
function checklanguage(text) {
  const chineseReg = /^[\u4e00-\u9fa5。，！？……（）\s""‘’“”]+$/; // 匹配中文字符的正则表达式
  const englishReg = /^[A-Za-z.,!?'"()\s]+$/; // 匹配英文字符的正则表达式
  if (chineseReg.test(text)) {
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
      model: "gpt-3.5-turbo",
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
    console.log("下面是反馈回来的内容");
    // console.log(completion.data.choices[0].message);
    //console.log(completion.data.choices[0].message.content.replace(/^"(.*)"$/, "$1"));
    return completion.data.choices[0].message.content.replace(/^"(.*)"$/, "$1");
  } else if (language === "english") {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that translates English to Chinese.",
        },
        {
          role: "user",
          content: `Translate the following English text to Chinese And only answer the translated text.: "${text}"`,
        },
      ],
    });
    console.log("下面是反馈回来的内容");
    // console.log(completion.data.choices[0].message);
    //console.log(completion.data.choices[0].message.content.replace(/^"(.*)"$/, "$1"));
    return completion.data.choices[0].message.content.replace(/^"(.*)"$/, "$1");
  }
  return rec;
}

//xiamianshi duihuajiqiren这个程序有问题


async function conversation(text) {
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
  messages: [
    {
      role: "system",
      content:
      "I want you to act as a spoken English teacher and improver. I will speak to you in English and you will reply to me in English to practice my spoken English. I want you to keep your reply neat, limiting the reply to 100 words.  I want you to strictly correct my grammar mistakes, typos, and factual errors. You need to understand the content of my new reply in the context of our previous exchange. You always ask me a question in your reply. Now let's start practicing, you could ask me a question first. Remember, I want you to strictly correct my grammar mistakes, typos, and factual errors.",
    },
    {
      role: "user",
      content: `${text}`,
  },
  ]
});
  console.log("下面是反馈回来的内容");
  console.log(completion.data.choices[0].message);
 console.log(completion.data.choices[0].message.content.replace(/^"(.*)"$/, "$1"));
  return completion.data.choices[0].message.content.replace(/^"(.*)"$/, "$1");
}
