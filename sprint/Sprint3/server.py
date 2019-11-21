
from flask import Flask
from flask import request


app = Flask(__name__)

@app.route('/', methods = ['GET', 'POST',])

def parse_request():
	data = request.data
	return data 

app.run(debug=True)

