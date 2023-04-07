
const data = 'eyJrZXkiOm51bGwsImRpZ2VzdCI6bnVsbCwiYXR0YWNobWVudF9pZCI6IjA2NWI2OWQzLWRlNjYtNDNmYS04ZDk3LTkwMzk1ZWUwNWE3NSIsIm1pbWVfdHlwZSI6ImltYWdlL3BuZyIsInNpemUiOjM2OTM5LCJuYW1lIjpudWxsLCJ3aWR0aCI6MzI2LCJoZWlnaHQiOjMxNCwidGh1bWJuYWlsIjoiTDZSTWIkP15WRWs9LjhuT2J2YUpUMGl3Yl5uTyIsImR1cmF0aW9uIjpudWxsLCJ3YXZlZm9ybSI6bnVsbCwiY2FwdGlvbiI6bnVsbCwiY3JlYXRlZF9hdCI6IjIwMjMtMDQtMDRUMDg6MDQ6MjQuNDgwNzYxMTMzWiIsInNoYXJlYWJsZSI6bnVsbH0';
const decodedData = atob(data.split(',')[1]); // 解码 base64 数据
const img = document.createElement('img');
img.src = 'data:image/jpeg;base64,' + decodedData; // 设置图片的 src 属性
document.body.appendChild(img);
