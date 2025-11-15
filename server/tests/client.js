let response = await fetch('http://localhost:3001/newURL', {
  method: 'POST',
//   headers: {
//     'Content-Type': 'application/json;charset=utf-8'
//   },
  body: "https://baijiahao.baidu.com/s?id=1848740936377189277"
});

let result = await response.text();
console.log(result);

await fetch('http://localhost:3001/niddle', {method: 'POST', body: '泰国国王'});

await fetch('http://localhost:3001/endURL', {method: 'POST'});