const express = require('express');
const Redis = require('redis');
const bodyParser = require('body-parser');

const cors = require('cors');

const options = {
  origin: "http://localhost:3000"
}

const redisClient = Redis.createClient({
  url: `redis://localhost:6379`
});

const app = express();
app.use(bodyParser.json());
app.use(cors(options));

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

app.post('/sendPayment', async(req,res)=>{
  try {
      const {
          customerId,
          billingAddress,
          billingCity,
          billingState,
          billingZipCode,
          totalAmount,
          paymentId,
          cardId,
          cardType,
          last4digits,
          orderId
      } = req.body;

      const payment = {
          customerId,
          billingAddress,
          billingCity,
          billingState,
          billingZipCode,
          totalAmount,
          paymentId,
          cardId,
          cardType,
          last4digits,
          orderId
      };

      const currentDate = new Date().toISOString().replace(/:/g, '-');
      const paymentKey = `${currentDate}`;

      await redisClient.json.set(paymentKey, '.', payment);
      res.status(200).json({ message: 'Payment successfully stored in Redis' });

  } catch (error) {
      console.error('Error storing payment in Redis:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

const port = 3001;

app.listen(port, ()=>{
  redisClient.connect();
  console.log(`Listening on port: ${port} `)
});

console.log("Hello World");
