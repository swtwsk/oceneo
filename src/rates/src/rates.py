import threading

from flask import Flask, jsonify, request
from flask_cors import CORS
import redis
import pika
from sortedcontainers import SortedSet

app = Flask(__name__)
CORS(app)

redis_db_rates = redis.StrictRedis(host="redis", db=0, socket_connect_timeout=2,
                                   socket_timeout=2, charset="utf-8", decode_responses=True)

N_OF_HIGHEST_RATED = 10


def rate_of_product(id):
    if not redis_db_rates.exists(id):
        return 0.00

    sum_of_rates = redis_db_rates.hget(id, "rates_sum")
    amount_of_rates = redis_db_rates.hget(id, "rates_amount")

    if int(amount_of_rates) == 0:
        return 0.00

    return int(sum_of_rates) / int(amount_of_rates)


@app.route('/api/rate', methods=['GET'])
def get_rate():
    id = request.args.get('id')
    if id is None:
        return 'No id field', 404

    if not redis_db_rates.exists(id):
        return 'No product with such id', 404

    return jsonify({
        'rate': round(rate_of_product(id), 2)
    }), 200


@app.route('/api/rate/highest_rated', methods=['GET'])
def get_highest_rated():
    if not redis_db_rates.exists("highest_products"):
        return jsonify([]), 200

    return jsonify(redis_db_rates.lrange("highest_products", 0, -1)), 200


def add_rate():
    rabbit_connection = pika.BlockingConnection(pika.ConnectionParameters('rating_rabbitmq'))
    rabbit_channel = rabbit_connection.channel()
    rabbit_channel.queue_declare(queue='rates_queue')

    def rates_rabbit_callback(ch, method, properties, body):
        id, rate = body.decode('utf-8').split(',')
        print("rabbit: id: {}, rate: {}".format(id, rate))

        redis_db_rates.hincrby(id, "rates_amount", 1)
        redis_db_rates.hincrby(id, "rates_sum", rate)

        # Calculate ranking
        n_max = 0
        rates_sum_all = 0
        rates_amount_all = 0
        for key in redis_db_rates.keys():
            try:
                product_rates_amount = int(redis_db_rates.hget(key, "rates_amount"))
                product_rates_sum = int(redis_db_rates.hget(key, "rates_sum"))

                rates_amount_all += product_rates_amount
                rates_sum_all += product_rates_sum
                n_max = max(n_max, product_rates_amount)

            except redis.exceptions.ResponseError:
                pass

        if rates_amount_all == 0:
            return
        r_0 = rates_sum_all / rates_amount_all

        highest_ranking_products = SortedSet()

        for key in redis_db_rates.keys():
            try:
                product_rates_amount = int(redis_db_rates.hget(key, "rates_amount"))

                w = product_rates_amount / n_max
                product_ranking_rate = w * rate_of_product(key) + (1 - w) * r_0

                highest_ranking_products.add((product_ranking_rate, key))
                if len(highest_ranking_products) > N_OF_HIGHEST_RATED:
                    highest_ranking_products.pop(0)

            except redis.exceptions.ResponseError:
                pass

        redis_db_rates.delete("highest_products")

        for _, id in highest_ranking_products:
            redis_db_rates.lpush("highest_products", int(id))

    rabbit_channel.basic_consume(rates_rabbit_callback, queue='rates_queue', no_ack=True)
    rabbit_channel.start_consuming()


if __name__ == "__main__":
    rabbit_thread = threading.Thread(target=add_rate)
    rabbit_thread.daemon = True
    rabbit_thread.start()
    app.run(host='0.0.0.0', port=80)
