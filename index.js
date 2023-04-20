//
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
    if (msg.category === "PLAIN_TEXT" && whitelist.user_id.includes(msg.user_id) &&typeof msg.data === "string") 
    {
      if(msg.data.toString().substring(0,1) === "/"){
        const message1 = msg.data.toString().substring(1);
        const checkl = checklanguage(message1);
        const translateWord = await translate(checkl,message1);
        console.log(`translateWord is:${translateWord}`)
        console.log(translateWord)
        console.log(translateWord.translateTokens)
        console.log(translateWord.translateRec)
        client.sendMessageText(msg.user_id, `> ${message1} \n> ${translateWord.translateRec}`);
      }
      else{
        
      const rawData = msg.data.toString(); //转为string        
      let RawZhData = ""; //初始化的
      let RawEnData = "";   
      let rec = "";
      tokens = 0;
      const checkl = checklanguage(msg.data);

      if (checkl === "chinese") {
        RawZhData = rawData;
        let translateZHToEnAll = await translate("chinese", RawZhData);
        let RawEnData = translateZHToEnAll.translateRec;//
        let RawEnDataO = translateZHToEnAll.translateRec;;
        tokens += translateZHToEnAll.translateTokens;

        RawEnData = PreviousQuestion+Previousanswer+RawEnData;//上次疑问+上次回答+本次输入=本次疑问
        PreviousQuestion = RawEnData//本次疑问作为下一次的上次疑问
        console.log(`对话函数运行前GPT被问到的问题：${RawEnData}`);

        let conversationAll = await conversation(RawEnData);
        let ReturnEnData = conversationAll.conversationRec;//

        Previousanswer = ReturnEnData//本次回答作为下一次的上次回答
        console.log(`下一次对话函数运行前GPT的回复背景：${Previousanswer}`);



        tokens += conversationAll.conversationTokens;//

        let translateEnToZhAll = await translate("english", ReturnEnData);
        let ReturnZhData = translateEnToZhAll.translateRec//
        tokens += translateEnToZhAll.translateTokens;//
        //现在在做中文提问机器人回应的部分
        console.log(`total tokens ${tokens}`);
        const costs=0.002/1000*tokens
        console.log(`total costs ${costs}`);


        rec = `>用户\n中文原文:  ${RawZhData} \nEnglish translation：${RawEnDataO}\n\n< 助手\n英文回应：${ReturnEnData}\n中文回应：${ReturnZhData}`;
        //就按照中文进行翻译和输出
        client.sendMessageText(msg.user_id, rec);
      } else if (checkl === "english") {
        //如果输入的是英文字符
        RawEnData = rawData;
        RawEnDataO = rawData;
        let translateEnToZhAll = await translate("english", RawEnData);
        let RawZhData = translateEnToZhAll.translateRec;//
        tokens += translateEnToZhAll.translateTokens;
        console.log(`translateTokens ${tokens}`);

        RawEnData = PreviousQuestion+Previousanswer+RawEnData;//上次疑问+上次回答+本次输入
        PreviousQuestion = RawEnData//本次疑问作为下一次的上次疑问
        console.log(`对话函数运行前GPT被问到的问题：${RawEnData}`);

        let conversationAll = await conversation(RawEnData);
        let ReturnEnData = conversationAll.conversationRec;//

        Previousanswer = ReturnEnData//本次回答作为下一次的上次回答
        console.log(`对话函数运行前GPT被问到的问题：${RawEnData}`);

        tokens +=conversationAll.conversationTokens;//
        console.log(`conversationTokens ${tokens}`);

        let translateEnToZhReturnAll = await translate("english", ReturnEnData);
        let ReturnZhData = translateEnToZhReturnAll.translateRec//
        tokens +=translateEnToZhReturnAll.translateTokens;//
        console.log(`translateTokens ${tokens}`);

        console.log(`total tokens ${tokens}`);
        const costs=0.002/1000*tokens
        console.log(`total costs ${costs}`);

        rec = `>用户\nEnglish original text:  ${RawEnDataO} \n中文译文：${RawZhData}\n\n< 助手\n英文回应：${ReturnEnData}\n中文回应：${ReturnZhData}`;
        client.sendMessageText(msg.user_id, rec);
      } else {
        client.sendMessageText(
          msg.user_id,
          "仅支持文本消息Only text are supportied"
        );
      }

      }
      
    }
    else {
      client.sendMessageText(
        msg.user_id,
        "你的ID必须经过授权，且内容必须是文本消息 Your ID must be authorized and the content must be a text message"
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
      model: "gpt-3.5-turbo",
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
    model: "gpt-3.5-turbo",
  messages: [
    {
      role: "system",
      content:
      "I want you to act as a spoken English teacher and improver. I will speak to you in English and you will reply to me in English to practice my spoken English. If my content is a sentence or a question, you start the conversation based on my content. If my content is not a sentence or a question, use the content to generate a sentence to make a conversation. I want you to keep your reply neat, limiting the reply to 100 words.  I want you to generate a sentence to make a conversationstrictly correct my grammar mistakes, typos, and factual errors. You need to understand the content of my new reply in the context of our previous exchange. You always ask me a question in your reply. Now let's start practicing, you could ask me a question first. Remember, I want you to strictly correct my grammar mistakes, typos, and factual errors.",
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





