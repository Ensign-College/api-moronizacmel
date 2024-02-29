const addOrder = async ({ redisClient, order }) => {
    order.customerId = 3852656789;
  
    const existingCustomer = order.customerId;
    const customerKey = `customer:${order.customerId}`;
    if (existingCustomer !== null) {
      const orderKey = `order:${order.customerId}-${Date.now()}`;
      order.orderId = orderKey;
  
      await redisClient.json.set(orderKey, "$", order);
    } else {
      throw new Error(`Customer ${customerKey} does not exist`);
    }
  };
  const getOrder = async ({ redisClient, orderId }) => {
    const resultObject = await redisClient.json.get(`order:${orderId}`);
    return resultObject;
  };
module.exports = { addOrder, getOrder };