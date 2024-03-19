const express = require('express');
const Redis = require('redis');
const bodyParser = require('body-parser');

const { addOrder, getOrder } = require("./services/orderservice.js")
const { addOrderItem, getOrderItem } = require("./services/orderItems")
const fs = require("fs");
const Schema = JSON.parse(fs.readFileSync("./orderItemSchema.json", "utf8"));
const Ajv = require("ajv");
const ajv = new Ajv();

const redisClient = Redis.createClient({
  url: `redis://localhost:6379`
});

const app = express();
app.use(bodyParser.json());

exports.handler = async (event) => {
  const { httpMethod, path, body, queryStringParameters } = event;

  try {
    if (httpMethod === 'POST') {
      if (path === '/boxes') {
        const newBox = JSON.parse(body);
        newBox.id = parseInt(await redisClient.json.arrLen('boxes', '$') + 1);
        await redisClient.json.set('boxes', '$', newBox);
        return {
          statusCode: 200,
          body: JSON.stringify(newBox)
        };
      } else if (path === '/pay') {
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
        } = JSON.parse(body);

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
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Payment successfully stored in Redis' })
        };
      } else if (path === '/orders') {
        let order = JSON.parse(body);
        let responsestatus = order.productQuantity && order.ShippingAddress ? 200 : 400;

        if (responsestatus === 200) {
          try {
            const orderId = await addOrder({ redisClient, order });
            return {
              statusCode: 200,
              body: JSON.stringify({ message: "Order created successfully", orderId })
            };
          } catch (error) {
            console.error(error);
            return {
              statusCode: 500,
              body: JSON.stringify({ error: 'Internal Server Error' })
            };
          }
        } else {
          return {
            statusCode: responsestatus,
            body: JSON.stringify(
              `Missing one of the following fields ${
              order.productQuantity ? "" : "productQuantity"
              } ${order.ShippingAddress ? "" : "ShippingAddress"}`
            )
          };
        }
      } else if (path === '/orderItems') {
        try {
          const orderItemId = await addOrderItem({
            redisClient,
            orderId: JSON.parse(body).orderId,
            orderItem: JSON.parse(body),
          });

          return {
            statusCode: 201,
            body: JSON.stringify({ orderItemId, message: "Order item added successfully" })
          };
        } catch (error) {
          console.error("Error adding order item: ", error);
          return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" })
          };
        }
      }
    } else if (httpMethod === 'GET') {
      if (path === '/boxes') {
        let boxes = await redisClient.json.get('boxes', { path: '$' });
        return {
          statusCode: 200,
          body: JSON.stringify(boxes)
        };
      } else if (path === '/payments') {
        const paymentKeys = await redisClient.keys('payment:*');
        const payments = await Promise.all(paymentKeys.map(async (key) => {
          return await redisClient.json.get(key, { path: '$' });
        }));
        return {
          statusCode: 200,
          body: JSON.stringify(payments)
        };
      } else if (path.startsWith('/payments/user')) {
        const userId = queryStringParameters.id;
        const paymentKeys = await redisClient.keys('payment:*');
        const userPayments = [];

        for (const key of paymentKeys) {
          const payment = await redisClient.json.get(key, { path: '$' });

          if (payment[0].customerId == userId) {
            userPayments.push(payment);
          }
        }

        return {
          statusCode: 200,
          body: JSON.stringify(userPayments)
        };
      } else if (path.startsWith('/payment')) {
        const orderId = queryStringParameters.id;
        const paymentKey = `payment:${orderId}`;
        const payment = await redisClient.json.get(paymentKey);

        if (!payment) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Payment not found' })
          };
        }

        return {
          statusCode: 200,
          body: JSON.stringify(payment)
        };
      }
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

redisClient.connect();
