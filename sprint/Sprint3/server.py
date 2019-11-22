from pip._internal import main as pipmain
pipmain(['install', 'flask_cors'])

from flask import Flask
from flask_cors import CORS
from flask import request

import parser
from summarization import summarizer

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['POST'])
def parse_request():
	request_form = request.form
	#requested_url = request_form.get('url')
	requested_content = request.form.get('html')
	
	#results = parser.GetContents(requested_url)
	#results = parser.parseContents(requested_content)
	
	results = requested_content

	parsed_results = parser.parseContents(results)
	#print(parsed_results)
	summary = summarizer(parsed_results,2)
	print(summary)

	response = app.response_class(
        response =  summary,
        status = 200,
        mimetype = 'text/plain'
    )

	return response

if __name__ == '__main__':
    app.run()

