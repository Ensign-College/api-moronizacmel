const Redis = require('redis');

const redisClient = Redis.createClient({
    url: `redis://localhost:6379`
});

exports.sendPaymentHandler = async (event, context) => {
    try {
        const requestBody = JSON.parse(event.body);
        let {
            billingAddress,
            billingCity,
            billingState,
            billingZipCode,
            phone,
            totalAmount,
            cardId,
            cardType,
            last4digits,
            orderId
        } = requestBody;

        // Reassign customerId to phone number
        customerId = phone;

        // Generate a unique payment ID using customerId and timestamp
        const paymentId = `${customerId}-${Date.now().toString()}`;

        // Construct the payment object
        const payment = {
            customerId,
            billingAddress,
            billingCity,
            billingState,
            billingZipCode,
            phone,
            totalAmount,
            paymentId,
            cardId,
            cardType,
            last4digits,
            orderId
        };

        // Generate a unique key for the payment using phone and current date
        const paymentKey = `payment-${paymentId}`;

        // Store the payment information in Redis as a JSON object
        await redisClient.json.set(paymentKey, '.', payment);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Payment successfully stored in Redis' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
