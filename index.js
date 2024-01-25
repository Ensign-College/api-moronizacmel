const express = require('express');
const Redis = require('redis');
const bodyParser = require('body-parser');

const redisClient = Redis.createClient({
  url: `redis://localhost:6379`
});
const app = express();
app.use(bodyParser.json());

app.get('/boxes', async (req, res) => {
  let boxes = await redisClient.json.get('boxes', {path: '$'});
    res.json(boxes);
  })

app.post('/boxes',async (req, res) => {
  const newBox = req.body;
  newBox.id = parseInt(await redisClient.json.arrLen('boxes', '$') + 1);
  await redisClient.json.set('boxes', '$', newBox);
  res.json(newBox);

  })
  
const port = 3000;

app.listen(port, ()=>{
  redisClient.connect();
  console.log(`Listening on port: ${port} `)

});

console.log("Hello World");
