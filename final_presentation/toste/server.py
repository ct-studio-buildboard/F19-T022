from pip._internal import main as pipmain
pipmain(['install', 'flask_cors'])

from flask import Flask
from flask_cors import CORS
from flask import request

import parser
from summarization import summarizer

import CustomHTMLParser
import json
from collections import namedtuple

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['POST'])
def parse_request():
	request_form = request.form
	#requested_url = request_form.get('url')
	requested_content = request.form.get('input');
	
	#results = parser.GetContents(requested_url)
	#results = parser.parseContents(requested_content)
	
	#results = json.loads(requested_content, object_hook=lambda d: namedtuple('X', d.keys())(*d.values()));
	results = json.loads(requested_content);

	#html_parser = CustomHTMLParser.GetHTMLContents(results)
	#print(html_parser.parse_data().PrintDetails())
	#tempParsed = html_parser.GetHTMLContents(results)
	#for t in tempParsed.components:
	#	print(t.PrintDetails())


	#parsed_results = parser.parseContents(results)
	#print(parsed_results)

	summary = []
	for res in results:
		#print(res["header"]["raw"], res["text"])
		new_header = summarizer(res["header"]["raw"],1)
		new_text = summarizer(res["text"],2)
		if (len(new_header) == 0):
			new_header = [res["header"]["raw"]]
		#print(new_header, new_text);
		to_add = {"header": new_header[0], "text": new_text}
		summary.append(to_add);

	#summary = summarizer(parsed_results,5)
	#print("FINAL SUMMARY: ", summary)

	response = app.response_class(
        response =  json.dumps(summary),
        status = 200,
        mimetype = 'text/plain'
    )

	return response

if __name__ == '__main__':
    app.run()

