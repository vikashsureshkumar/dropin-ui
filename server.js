const braintree = require('braintree');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// Initialize Express application
const app = express();
const port = process.env.PORT || 3000; // Default port to 3000 if not specified in environment variables

// Middleware setup
// Body parser middleware to handle JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Braintree Gateway Setup
// Configure Braintree Gateway with Sandbox environment for testing
const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox, // Braintree environment (Sandbox for testing)
  merchantId: '5bsrvbjsbyn2hpp6', // Your Braintree merchant ID
  publicKey: 'byjnh7wz2jwtw83j', // Your Braintree public key
  privateKey: '068ce08fd73724811015d4c683b78039' // Your Braintree private key
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to generate a Braintree client token
app.get('/token', (req, res) => {
  gateway.clientToken.generate({}, (err, response) => {
    if (err) {
      // Log and respond with an error if token generation fails
      console.error('Error generating client token:', err);
      res.status(500).json({ error: 'Error generating client token' });
    } else {
      // Respond with the generated client token
      console.log("Client Token:", response.clientToken);
      res.json({ clientToken: response.clientToken });
    }
  });
});

// Route to handle transaction
app.post('/checkout', (req, res) => {
  const { paymentMethodNonce, amount } = req.body; // Extract payment nonce and amount from request body

  // Create a transaction with Braintree
  gateway.transaction.sale({
    amount: amount, // Amount to charge
    paymentMethodNonce: paymentMethodNonce, // Payment method nonce from client
    options: {
      submitForSettlement: true, // Immediately submit the transaction for settlement
    },
  }, (err, result) => {
    if (err) {
      // Log and respond with an error if the transaction fails
      console.error('Error processing transaction:', err);
      res.status(500).json({ error: 'Error processing transaction' });
    } else {
      // Respond with transaction result on success
      res.json(result);
    }
  });
});

// Start server and listen on the specified port
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`); // Log server start message
});
