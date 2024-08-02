// Variables for DOM elements and Braintree Drop-in instance
var dropin;
var payBtn = document.getElementById('pay-btn');
var nonceGroup = document.querySelector('.nonce-group');
var nonceInput = document.querySelector('.nonce-group input');
var nonceSpan = document.querySelector('.nonce-group span');
var payGroup = document.querySelector('.pay-group');
var billingFields = {
  email: {
    input: document.getElementById('email'),
    help: document.getElementById('help-email')
  },
  'billing-phone': {
    input: document.getElementById('billing-phone'),
    help: document.getElementById('help-billing-phone')
  }
};

// Autofill function for billing fields
function autofill(e) {
  e.preventDefault();
  billingFields.email.input.value = 'vikash.rs@gmail.com';
  billingFields['billing-phone'].input.value = '80566-80856';
  Object.keys(billingFields).forEach(function (fieldName) {
    clearFieldValidations(billingFields[fieldName]);
  });
}

// Event listener for autofill button
document.getElementById('autofill').addEventListener('click', autofill);

// Clear validation messages for a field
function clearFieldValidations(field) {
  field.help.innerText = '';
  field.help.parentNode.classList.remove('has-error');
}

// Validate billing fields
function validateBillingFields() {
  var isValid = true;
  Object.keys(billingFields).forEach(function (fieldName) {
    var field = billingFields[fieldName];
    if (field.input.value.trim() === '') {
      isValid = false;
      field.help.innerText = 'Field cannot be blank.';
      field.help.parentNode.classList.add('has-error');
    } else {
      clearFieldValidations(field);
    }
  });
  return isValid;
}

// Initialize the payment process
function start() {
  getClientToken();
}

// Fetch Braintree client token from server
function getClientToken() {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      onFetchClientToken(JSON.parse(xhr.responseText).clientToken);
    } else if (xhr.readyState === 4) {
      console.error('Error fetching client token:', xhr.responseText);
    }
  };
  xhr.open("GET", "/token");
  xhr.send();
}

// Set up Braintree Drop-in UI
function setupDropin(clientToken) {
  return braintree.dropin.create({
    authorization: clientToken,
    container: '#drop-in',
    threeDSecure: {
      amount: '100.00',
      email: billingFields.email.input.value,
      billingAddress: {
        phoneNumber: billingFields['billing-phone'].input.value.replace(/[\(\)\s\-]/g, '')
      }
    }
  });
}

// Handle client token fetch and Drop-in setup
function onFetchClientToken(clientToken) {
  setupDropin(clientToken).then(function(instance) {
    dropin = instance;
    setupForm();
  }).catch(function(err) {
    console.error('Drop-in setup error:', err);
  });
}

// Configure form after Drop-in setup
function setupForm() {
  enablePayNow();
}

// Enable the "Pay Now" button
function enablePayNow() {
  payBtn.value = 'Pay Now';
  payBtn.removeAttribute('disabled');
}

// Show payment status and reload the page
function showNonce(payload, liabilityShift) {
  nonceSpan.textContent = liabilityShift ? "Payment Success!" : "Payment Failed";
  nonceInput.value = payload.nonce;
  payGroup.classList.add('hidden');
  nonceGroup.classList.remove('hidden');

  // Reload the page after 5 seconds
  setTimeout(function() {
    window.location.reload();
  }, 5000);
}

// Handle the payment method and send to server
function handlePaymentMethod(payload) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      console.log('Transaction result:', JSON.parse(xhr.responseText));
      showNonce(payload, true);
    } else if (xhr.readyState === 4) {
      console.error('Transaction error:', xhr.responseText);
      showNonce(payload, false);
    }
  };
  xhr.open("POST", "/checkout");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({
    paymentMethodNonce: payload.nonce,
    amount: '100.00'
  }));
}

// Event listener for "Pay Now" button
payBtn.addEventListener('click', function(event) {
  payBtn.setAttribute('disabled', 'disabled');
  payBtn.value = 'Processing...';

  if (!validateBillingFields()) {
    enablePayNow();
    return;
  }

  dropin.requestPaymentMethod({
    threeDSecure: {
      amount: '100.00',
      email: billingFields.email.input.value,
      billingAddress: {
        phoneNumber: billingFields['billing-phone'].input.value.replace(/[\(\)\s\-]/g, '')
      }
    }
  }, function(err, payload) {
    if (err) {
      console.error('Tokenization error:', err);
      dropin.clearSelectedPaymentMethod();
      enablePayNow();
      return;
    }

    handlePaymentMethod(payload);
  });
});

// Start the payment process
start();
