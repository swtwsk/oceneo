import threading

from flask import Flask, jsonify, request
from flask_cors import CORS
import redis
import uuid

app = Flask(__name__)
CORS(app)

redis_db_sessions = redis.StrictRedis(host="redis", db=0, socket_connect_timeout=2,
                                      socket_timeout=2, charset="utf-8", decode_responses=True)


@app.route('/api/session', methods=['GET'])
def get_session_id():
    session_id = str(uuid.uuid1())
    return jsonify({
        'session_id': session_id
    }), 200


@app.route('/api/session/product', methods=['POST'])
def add_product():
    session_id = request.get_json().get('session_id')
    if session_id is None:
        return 'No session_id field', 404

    product_id = request.get_json().get('product_id')
    if product_id is None:
        return 'No product_id field', 404

    redis_db_sessions.sadd(session_id, product_id)
    return 'Successfully added', 200


@app.route('/api/session/product', methods=['GET'])
def exists_product():
    session_id = request.args.get('session_id')
    if session_id is None:
        return 'No session_id field', 404

    product_id = request.args.get('product_id')
    if product_id is None:
        return 'No product_id field', 404

    return jsonify({
        'exists': redis_db_sessions.sismember(session_id, product_id)
    }), 200


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=80)
