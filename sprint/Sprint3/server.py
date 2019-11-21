
from flask import Flask
from flask import request


app = Flask(__name__)

@app.route('/')


def GetContents(url):
	uf = urllib.request.urlopen(url)
	html = uf.read()
	soup = BeautifulSoup(html, features="lxml")

	# kill all script and style elements
	for script in soup(["script", "style"]):
		# rip it out
		script.extract()    

	# get text
	text = soup.get_text()

	# break into lines and remove leading and trailing space on each
	lines = (line.strip() for line in text.splitlines())
	# break multi-headlines into a line each
	chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
	# drop blank lines
	text = '\n'.join(chunk for chunk in chunks if chunk)

	return text



def main():

	@app.route(url, methods = ['GET', 'POST',])

	GetContents(url)
	
    app.run(host='0.0.0.0', debug=True, port=3134)



if __name__=='__main__':
    main()