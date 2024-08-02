document.addEventListener('DOMContentLoaded', function () {
    fetch('/token')
        .then(response => response.json())
        .then(data => {
            if (!data.clientToken) {
                console.error('Failed to get client token');
                return;
            }

            braintree.dropin.create({
                authorization: data.clientToken,
                container: '#dropin-container'
            }, function (createErr, instance) {
                if (createErr) {
                    console.error(createErr);
                    return;
                }

                document.getElementById('submit-button').addEventListener('click', function () {
                    instance.requestPaymentMethod(function (err, payload) {
                        if (err) {
                            console.error(err);
                            return;
                        }

                        fetch('/checkout', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ paymentMethodNonce: payload.nonce })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                alert('Transaction successful! ID: ' + data.transactionId);
                            } else {
                                alert('Transaction failed: ' + data.error);
                            }
                        });
                    });
                });
            });
        })
        .catch(error => {
            console.error('Error fetching client token:', error);
        });
});
