//实现从URL中下载ogg并转化为MP3
const request = require('request');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

// 引入依赖库


// 定义转换函数
function convertOGGtoMP3(url) {
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

// 调用转换函数
const oggUrl = 'https://mixin-assets-cn.zeromesh.net/mixin/attachments/1682054804-1eecd0aecb0f305dfcb592b9a3c538c3a6c1ae2952ef34c49f8eb15a620afb47';//需要将这个URL中保存的OGG格式文件下载到内存，并转化保存为dudio.mp3,以提供给下面程序转录
const outputPath = `./audiocach/audio6.mp3`;
//保证命名唯一性，以URL52位以后的来命名 `./${oggUrl.substring(52)}.mp3`
//const outputPath = `./audio/${oggUrl.substring(52)}.mp3`


convertOGGtoMP3(oggUrl)
  .then(mp3Path => console.log(mp3Path))
  .catch(error => console.error(error));
