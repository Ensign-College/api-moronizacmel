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

app.post('/pay', async(req,res)=>{
  try {
      const {
          customerId,
          customerPhone,
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
          customerPhone,
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
      const paymentKey = `payment.${customerPhone}.${currentDate}`;

      await redisClient.json.set(paymentKey, '.', payment);
      res.status(200).json({ message: 'Payment successfully stored in Redis' });

  } catch (error) {
      console.error('Error storing payment in Redis:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/payments', async (req, res) => {
  try {
    const paymentKeys = await redisClient.keys('payment.*');

    const payments = await Promise.all(paymentKeys.map(async (key) => {
      return await redisClient.json.get(key, {path: '$'});
    }));

    res.json(payments);
  } catch (error) {
    console.error('Error retrieving payments from Redis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/payments/user/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    const paymentKeys = await redisClient.keys('payment.*');

    const userPayments = [];

    for (const key of paymentKeys) {

      const payment = await redisClient.json.get(key, {path: '$'});

      if (payment[0].customerId == userId) {
        userPayments.push(payment);
      }
    }

    res.json(userPayments);
  } catch (error) {
    console.error('Error retrieving user payments from Redis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



const port = 3001;

app.listen(port, ()=>{
  redisClient.connect();
  console.log(`Listening on port: ${port} `)
});

console.log("Hello World");
