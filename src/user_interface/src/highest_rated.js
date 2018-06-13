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

function print_log(log) {
    document.getElementById("log").innerText = log;
}


function table_from_json(json) {
    let table = document.createElement("table");

    table.appendChild(create_row('Nazwa produktu:',json['name']));
    table.appendChild(create_row('Producent:',json['producer']));
    table.appendChild(create_row('Cena:',json['price']));
    table.appendChild(create_row('Opis:',json['description']));
    return table;
}

function product_header(id, name) {
    let header = document.createElement("div");
    header.innerText = "Product " + id + ": " + name;
    return header;
}

async function build_details(div_single_product, product_id) {
    let json_product_details;
    try {
        json_product_details = JSON.parse(await download("http://localhost:8011/api/products/" + product_id));
    } catch (exc) {
        print_log("Błąd w pobieraniu szczegółów produktu");
        return;
    }

    let table_product_details = table_from_json(json_product_details);
    div_single_product.appendChild(table_product_details);
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

async function build_products_list() {
    let json_id_name_list;
    try {
        json_id_name_list = JSON.parse(await download("http://localhost:8012/api/rate/highest_rated"));
    } catch (exc) {
        print_log("Błąd w pobieraniu listy produktów");
        return;
    }

    let id_name_list_ul = document.createElement("ul");

    for (let i = 0; i < json_id_name_list.length; i++) {
        let product_id = json_id_name_list[i];

        console.log(product_id);

        let id_name_list_li = document.createElement("li");
        let div_single_product = document.createElement("div");

        build_details(div_single_product, product_id);

        id_name_list_li.appendChild(div_single_product);
        id_name_list_ul.appendChild(id_name_list_li);
    }

    let div_lista_product = document.getElementById("products");
    div_lista_product.appendChild(id_name_list_ul);
}

async function main() {
	build_products_list();
}
main();
