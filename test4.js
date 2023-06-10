// //上传来获得附件 ID，并发送给mixin客户端。目前图片消息已经解决。这里上传的ogg到迷信手机端，非常模糊。//发到安卓手机就非常清晰了
const fs = require('fs');
const config = require("./config");
const { BlazeClient } = require("mixin-node-sdk");
const client = new BlazeClient(config, { parse: true, syncAck: true });

async function UpLoadOggFile() {
  const file1 = fs.readFileSync("./output.ogg");
  const attachment = await client.uploadFile(file1);
  console.log(attachment);
  const attachment_id11 = attachment.attachment_id;

  client.sendAudioMsg('a840dd01-8bb4-4590-930a-21452ea2d6e6', {//tudouIpad:a840dd01-8bb4-4590-930a-21452ea2d6e6,
    attachment_id: attachment_id11, // 文件的唯一标识////wodeshouji:3c1b99b3-600f-4be0-a027-b36d4bbdb2d9
    mime_type: 'audio/ogg', // 音频的类型，目前只支持：audio/ogg   //
    size: 43000, // 音频的大小，单位是字节
    duration: 8000, // 音频的时长，单位是毫秒
    //wave_form: 'base64', // 可选，音频轨迹 base64
  });
}

UpLoadOggFile();






