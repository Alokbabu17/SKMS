# app.py
from flask import Flask, send_from_directory, render_template

app = Flask(__name__, static_folder='static', template_folder='templates')

@app.route('/')
def index():
    return render_template('index.html')

# optional endpoint to receive count (if you want)
@app.route('/log_count/<int:count>', methods=['POST'])
def log_count(count):
    # implement logging if needed
    return ('', 204)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
