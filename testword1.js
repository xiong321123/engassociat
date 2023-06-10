
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

 selectWords(7)
//现在我来完成这个功能