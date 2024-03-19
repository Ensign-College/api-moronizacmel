const express = require('express');
const Redis = require('redis');
const bodyParser = require('body-parser');

const {addOrder, getOrder} = require("./services/orderservice.js")
const {addOrderItem, getOrderItem} = require("./services/orderItems.js")
const fs = require("fs");
const Schema = JSON.parse(fs.readFileSync("./orderItemSchema.json","utf8"));
const Ajv = require("ajv");
const ajv = new Ajv();

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
          cardId,
          cardType,
          last4digits,
          orderId
      } = req.body;

      const currentDate = new Date().now().toString();
      const paymentKey = `payment:${customerPhone}.${currentDate}`;

      const payment = {
          customerId,
          customerPhone,
          billingAddress,
          billingCity,
          billingState,
          billingZipCode,
          totalAmount,
          paymentId: paymentKey,
          cardId,
          cardType,
          last4digits,
          orderId
      };

      await redisClient.json.set(paymentKey, '.', payment);
      res.status(200).json({ message: 'Payment successfully stored in Redis' });

  } catch (error) {
      console.error('Error storing payment in Redis:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/payments', async (req, res) => {
  try {
    const paymentKeys = await redisClient.keys('payment:*');

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
    
    const paymentKeys = await redisClient.keys('payment:*');

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

app.get('/payment/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    
    const paymentKey = `payment:${orderId}`;
    
    const payment = await redisClient.json.get(paymentKey);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (error) {
    console.error('Error retrieving user payments from Redis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});











// Order
app.post("/orders", async (req, res) => {
  let order = req.body;
  let responsestatus = order.productQuantity && order.ShippingAddress ? 200 : 400;

  if (responsestatus === 200) {
    try {
      const orderId = await addOrder({ redisClient, order });
      res.status(200).json({ message: "Order created successfully", orderId });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
      return;
    }
  } else {
    res.status(responsestatus);
    res.send(
      `Missing one of the following fields ${
        order.productQuantity ? "" : "productQuantity"
      } ${order.ShippingAddress ? "" : "ShippingAddress"}`
    );
  }
});

// Order Items
app.post("/orderItems", async (req, res) => {
  try {
    const orderItemId = await addOrderItem({
      redisClient,
      orderId: req.body.orderId, // Utiliza el ID de la orden enviado desde el frontend
      orderItem: req.body,
    });

    res.status(201).json({ orderItemId, message: "Order item added successfully" });
  } catch (error) {
    console.error("Error adding order item: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



















const port = 3001;

app.listen(port, ()=>{
  redisClient.connect();
  console.log(`Listening on port: ${port} `)
});

console.log("Hello World");
