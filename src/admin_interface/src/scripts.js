function send_json(address, json) {
    console.log(json);
    $.ajax({
        type: 'POST',
        url: address,
        data: JSON.stringify(json),
        contentType: 'application/json',
        success: function() {
            hideErrors();
            let success_alert = document.getElementById('form-success-alert');
            success_alert.style.display = 'block';
            setTimeout(function() {
                $('#form-success-alert').fadeOut('fast');
            }, 1000);
        },
        error: function () {
            document.getElementById('form-success-alert').style.display = 'none';
            document.getElementById('form-error-alert').style.display = 'block';
        }
    });
}

function checkInput(input, form_error) {
    if (input === '') {
        let price_error = document.getElementById(form_error);
        price_error.style.opacity = '1';
        price_error.style.height = '30px';
        return false;
    }

    return true;
}

function hideErrors() {
    let errors = document.getElementsByClassName('form-error');
    [].forEach.call(errors, function(element) {
        element.style.opacity = '0';
        element.style.height = '0';
    });
    document.getElementById('form-error-alert').style.display = 'none';
}

function addProduct() {
    hideErrors();

    let error = false;

    let product_name_input = document.getElementById('id-name');
    let product_name = product_name_input.value;
    error = error || !checkInput(product_name, 'id-name-form-error');

    let product_price_input = document.getElementById('id-price');
    let product_price = product_price_input.value;
    error = error || !checkInput(product_price, 'id-price-form-error');

    let product_producer_input = document.getElementById('id-producer');
    let product_producer = product_producer_input.value;
    error = error || !checkInput(product_producer, 'id-producer-form-error');

    let product_description_input = document.getElementById('id-description');
    let product_description = product_description_input.value;
    error = error || !checkInput(product_description, 'id-description-form-error');

    if (error) {
        return false;
    }

    let request_data = {
        'name': product_name,
        'price': parseInt(product_price),
        'producer': product_producer,
        'description': product_description
    };

    send_json('http://localhost:8011/api/products/add', request_data);

    return false;
}
