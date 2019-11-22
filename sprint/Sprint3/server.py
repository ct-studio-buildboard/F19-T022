
from flask import Flask
from flask import request


app = Flask(__name__)

@app.route('/', methods=['POST'])
def parse_request():
	print("hello world");
	print(request.json)
	print(request.args)
	print(request.form)
	print(request.values)
	print(request)
	return request.data;
	#data = request.data
	#print(data)
	#return data 

if __name__ == '__main__':
    app.run()

