const Redis = require("redis");

const redisClient = Redis.createClient({
  url: "redis://localhost:6379",
});

const addOrderItem = async ({ redisClient, orderItem }) => {
  try {
    const orderItemId = `${orderItem.customerId}-${Date.now()}`;
    orderItem.orderItemId = orderItemId;

    await redisClient.json.set(`orderItem:${orderItemId}`, '$', orderItem);

    console.log("Order item ID:", orderItemId);
    return orderItemId;
  } catch (error) {
    throw new Error(`Error adding order item: ${error}`);
  }
};


const updateOrderItem = async ({ redisClient, orderItem }) => {
  try {
    const existingOrderItem = await redisClient.json.get(`orderItem:${orderItem.orderItemId}`);

    if (existingOrderItem !== null) {
      await redisClient.json.set(`orderItem:${orderItem.orderItemId}`, '$', orderItem);
    } else {
      throw new Error(`Order item with ID ${orderItem.orderItemId} does not exist`);
    }
  } catch (error) {
    throw new Error(`Error updating order item: ${error}`);
  }
};

const getOrderItem = async ({ redisClient, orderItemId }) => {
  try {
    const orderItem = await redisClient.json.get(`orderItem:${orderItemId}`);

    if (orderItem !== null) {
      return orderItem;
    } else {
      throw new Error(`Order item with ID ${orderItemId} does not exist`);
    }
  } catch (error) {
    throw new Error(`Error retrieving order item: ${error}`);
  }
};

const searchOrderItems = async ({ redisClient, query, key, isText }) => {
  try {
    let value = query[key];
    const resultObject = isText ? await redisClient.ft.search('idx:OrderItem', `@${key}:(${value}*)`) : await redisClient.ft.search('idx:OrderItem', `@${key}:{${value}}`);
    return resultObject.documents.map(resultObject => ({ ...resultObject.value, orderItemId: resultObject.id.split(':')[1] }));
  } catch (error) {
    throw new Error(`Error searching for order items: ${error}`);
  }
};

module.exports = { addOrderItem, updateOrderItem, getOrderItem, searchOrderItems };
module.exports.redisClient = redisClient;