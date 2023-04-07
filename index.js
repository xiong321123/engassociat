const { BlazeClient } = require("mixin-node-sdk");
const config = require("./config");

const client = new BlazeClient(
  {
    pin: config.pin,
    client_id: config.client_id,
    session_id: config.session_id,
    pin_token: config.pin_token,
    private_key: config.private_key,

    config,
  },
  // 上面{ }内的信息替换成您自己Mixin机器人的私钥信息
  { parse: true, syncAck: true }
);

client.loopBlaze({
  onMessage(msg) {
    console.log(msg);
    const rawData = msg.data.toString();

    //判断为中文
    const chineseReg = /^[\u4e00-\u9fa5]+$/; // 匹配中文字符的正则表达式
    const englishReg = /^[A-Za-z]+$/; // 匹配英文字符的正则表达式

    let RawZhData = "你好呀";
    let RawEnData = "How are you?";

    const ReturnZhData = "你好呀";
    const ReturnEnData = "How are you?";
    let rec = "";

    if (chineseReg.test(msg.data)) {
      console.log("输入的字符是中文");
      RawZhData = rawData;

      rec = `>用户\n中文原文:  ${RawZhData} \n英文译文：${RawEnData}\n\n< 助手\n中文回应：${ReturnZhData}\n英文回应：${ReturnEnData}`;
      //就按照中文进行翻译和输出
    }
    // else {
    //   console.log("输入的字符不是中文");
    // }
    else if (englishReg.test(msg.data)) {
      console.log("输入的字符是英文");
      RawEnData = rawData;
      rec = `>用户\n英文原文:  ${RawEnData} \n中文译文：${RawZhData}\n\n< 助手\n中文回应：${ReturnZhData}\n英文回应：${ReturnEnData}`;
      //就按照英文进行翻译和输出
    } else if (!englishReg.test(msg.data) && !chineseReg.test(msg.data)) {
      client.sendMessageText(
        msg.user_id,
        "仅支持中英文Only English and Chinese are supportied"
      );
    }
    // else {
    //   console.log("输入的字符不是英文");
    // }

    //
    // if (msg.data === "你好") {
    //     client.sendMessageText(msg.user_id, "你也好！");
    //   } else if (msg.data === "How are you") {
    //     client.sendMessageText(msg.user_id, "我是编程学习小助手");
    //   } else {
    //     client.sendMessageText(msg.user_id, "我无法对该内容进行翻译");
    //   }
    //

    client.sendTextMsg(msg.user_id, rec);
  },
  onAckReceipt() {},
});

function translateZhtoEn(text) {
  // return = 'English'
}

function translateEntoZh(text) {}

//API reference-Chat下面复制过来的，修改了元素

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: config.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
async function chineseToEnglish(params) {
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
        content:
          'Translate the following Chinese text to English: "请问如何学习编程"',
      },
    ],
  });
  //console.log(completion)
  console.log(completion.data.choices[0].message);
}

chineseToEnglish();
//

//
