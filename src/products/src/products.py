from flask import Flask, jsonify, request
from flask_cors import CORS
import redis

app = Flask(__name__)
CORS(app)

redis_db_products = redis.StrictRedis(host="redis", db=0, socket_connect_timeout=2,
                                      socket_timeout=2, charset="utf-8", decode_responses=True)


@app.route('/api/products', methods=['GET'])
def get_products_list():
    products = {}
    for key in redis_db_products.keys():
        try:
            products[key] = redis_db_products.hget(key, "name")
        except redis.exceptions.ResponseError:
            pass

    return jsonify(products), 200


@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product_details(product_id):
    if not redis_db_products.exists(product_id):
        return "No product with given id", 404

    return jsonify(redis_db_products.hgetall(product_id)), 200


PRODUCT_DATA = ['name', 'price', 'producer', 'description']


@app.route('/api/products/add', methods=['POST'])
def add_product():
    for data_field in PRODUCT_DATA:
        if request.get_json().get(data_field) is None:
            return "No '{}' field".format(data_field), 403

    redis_db_products.incr("number_of_products")

    id = redis_db_products.get("number_of_products")
    for data_field in PRODUCT_DATA:
        redis_db_products.hset(id, data_field, request.get_json().get(data_field))

    return "Successfully added new product with id: {}".format(id), 200


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=80)
