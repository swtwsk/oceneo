function setCookie(cname, cvalue, exdays) {
    let d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

async function get_session_id() {
    let session_id = getCookie("session_id");
    if (session_id === "") {
        session_id = JSON.parse(await download("http://localhost:8021/api/session"))['session_id'];
        setCookie("session_id", session_id, 365);
    }
    return session_id;
}

function download(wl) {
    return new Promise(function(resolve, reject) {
        let req = new XMLHttpRequest();
        req.open("GET", wl);
        req.addEventListener("readystatechange", function() {
            if(req.readyState === 4) {
                if(req.status === 200) {
                    resolve(req.response);
                }
                else {
                    reject("Error: GET " + wl);
                }
            }
        });
        req.send();
    });
}

function send_json(address, json) {
    return new Promise(function(resolve, reject) {
        let req = new XMLHttpRequest();
        req.open("POST", address);
        req.setRequestHeader("Content-Type", "application/json");

        req.addEventListener("readystatechange", function() {
            if(req.readyState === 4) {
                if(req.status === 200) {
                    resolve(req.response);
                }
                else {
                    reject("Error: POST " + address + ": " + JSON.stringify(json));
                }
            }
        });
        let json_to_send = JSON.stringify(json);
        req.send(json_to_send);
    });
}

function print_log(log) {
    let logger = document.getElementById("log");
    logger.innerText = log;
    logger.style.display = 'block';
}

function create_row(name1, name2) {
    let row = document.createElement("tr");
    let column = document.createElement("th");
    column.innerHTML = name1;
    row.appendChild(column);

    column = document.createElement("td");
    column.innerHTML = name2;
    row.appendChild(column);

    return row;
}

async function table_from_json(json, id) {
    let table = document.createElement("table");

    table.appendChild(create_row('Nazwa produktu:',json['name']));
    table.appendChild(create_row('Producent:',json['producer']));
    table.appendChild(create_row('Cena:',json['price']));
    table.appendChild(create_row('Opis:',json['description']));
    try {
        table.appendChild(create_row('Ocena:', JSON.parse(await download('http://localhost:8012/api/rate?id=' + id))['rate']));
    } catch (exc) {
        table.appendChild(create_row('Ocena:', 'brak'));
    }
    return table;
}

function product_header(id, name) {
    let header = document.createElement("div");
    header.innerText = "Produkt " + id + ": " + name;
    return header;
}

async function build_details(div_single_product, div_single_product_header, product_id) {
    let json_product_details;
    try {
        json_product_details = JSON.parse(await download("http://localhost:8011/api/products/" + product_id));
    } catch (exc) {
        print_log("Błąd w pobieraniu szczegółów produktu");
        return;
    }

    let table_product_details = await table_from_json(json_product_details, product_id);
    div_single_product.appendChild(table_product_details);

    let rate_input_field = document.createElement("input");
    rate_input_field.min = "1";
    rate_input_field.max = "10";
    rate_input_field.type = "number";
    div_single_product.appendChild(rate_input_field);

    let submit_button = document.createElement("button");
    submit_button.innerText = "Oceń";

    submit_button.addEventListener("click", async function () {
        try {
            await send_json("http://localhost:8013/api/rating/add", {
                "product_id": product_id,
                "rate": rate_input_field.value,
                "session_id": await get_session_id()
            });
            print_log("Wysłano ocenę");
        } catch (exc) {
            alert("Wystąpił błąd podczas wysyłania oceny!");
        }
    });
    div_single_product.appendChild(submit_button)
}

async function build_products_list() {
    let json_id_name_list;
    try {
        json_id_name_list = JSON.parse(await download("http://localhost:8011/api/products"));
    } catch (exc) {
        print_log("Błąd w pobieraniu listy produktów");
        return;
    }

    let id_name_list_ul = document.createElement("ul");

    for (let product_id in json_id_name_list) {
        if (json_id_name_list.hasOwnProperty(product_id)) {
            let id_name_list_li = document.createElement("li");
            let div_single_product = document.createElement("div");

            let div_single_product_header = product_header(product_id, json_id_name_list[product_id]);
            div_single_product.appendChild(div_single_product_header);

            div_single_product.details_shown = false;
            id_name_list_li.addEventListener("click", async function () {
                if (div_single_product.details_shown === false) {
                    div_single_product.details_shown = true;
                    build_details(div_single_product, div_single_product_header, product_id);
                }
            });
            id_name_list_li.appendChild(div_single_product);
            id_name_list_ul.appendChild(id_name_list_li);
        }
    }

    let div_products_list = document.getElementById("products");
    div_products_list.appendChild(id_name_list_ul);
}

async function main() {
	build_products_list();
}
main();
