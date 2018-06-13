from flask import Flask, jsonify, request
from flask_cors import CORS
import redis
import pika
import requests

app = Flask(__name__)
CORS(app)

rabbit_connection = pika.BlockingConnection(pika.ConnectionParameters('rating_rabbitmq'))
rabbit_channel = rabbit_connection.channel()
rabbit_channel.queue_declare(queue='rates_queue')


MIN_RATE = 0
MAX_RATE = 10


@app.route('/api/rating/add', methods=['POST'])
def add_rate():
    product_id = request.get_json().get('product_id')
    if product_id is None:
        return "No product_id field", 404

    session_id = request.get_json().get('session_id')
    if session_id is None:
        return "No session_id field", 404

    try:
        rate = int(request.get_json().get('rate'))
    except Exception:
        return "Wrong rate value", 403

    if rate < MIN_RATE or rate > MAX_RATE:
        return "Rate value must be between {} and {}.".format(MIN_RATE, MAX_RATE), 403

    has_already_voted = requests.get(
        'http://session_flask/api/session/product', params={'session_id': session_id, 'product_id': product_id}
    ).json()

    if has_already_voted['exists']:
        return 'You have already voted', 403

    requests.post(
        'http://session_flask/api/session/product', json={'session_id': session_id, 'product_id': product_id}
    )

    global rabbit_connection
    global rabbit_channel

    try:
        rabbit_channel.basic_publish(exchange='', routing_key='rates_queue', body="{},{}".format(product_id, rate))
    except pika.exceptions.ConnectionClosed:
        rabbit_connection = pika.BlockingConnection(pika.ConnectionParameters('rabbitmq'))
        rabbit_channel = rabbit_connection.channel()
        rabbit_channel.queue_declare(queue='rates_queue')
        rabbit_channel.basic_publish(exchange='', routing_key='rates_queue', body="{},{}".format(product_id, rate))

    return "Queued rating request", 200


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=80)
