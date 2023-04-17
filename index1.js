//这个部分单独来测试和ChatGPT的交流


//API reference-Chat下面复制过来的，修改了元素
const config = require("./config");
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
