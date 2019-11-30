from pip._internal import main as pipmain
pipmain(['install', 'flask_cors'])

from flask import Flask
from flask_cors import CORS
from flask import request

import parser
from summarization import summarizer

import CustomHTMLParser
import json

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['POST'])
def parse_request():
	request_form = request.form
	#requested_url = request_form.get('url')
	requested_content = request.form.get('html')
	
	#results = parser.GetContents(requested_url)
	#results = parser.parseContents(requested_content)
	
	results = json.loads(requested_content);
	print(results[0].header)

	#html_parser = CustomHTMLParser.GetHTMLContents(results)
	#print(html_parser.parse_data().PrintDetails())
	#tempParsed = html_parser.GetHTMLContents(results)
	#for t in tempParsed.components:
	#	print(t.PrintDetails())


	#parsed_results = parser.parseContents(results)
	#print(parsed_results)

	summary = []
	for res in results:
		to_add = {"raw": summarizer(res.header,1), "text":summarizer(res.text,5)}
		new_results.append(to_add);

	#summary = summarizer(parsed_results,5)
	print(summary)

	response = app.response_class(
        response =  summary,
        status = 200,
        mimetype = 'text/plain'
    )

	return response

if __name__ == '__main__':
    app.run()

