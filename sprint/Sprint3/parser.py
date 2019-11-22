from urllib.request import urlopen, Request 
from urllib.parse import unquote
from bs4 import BeautifulSoup

def parseContents(contents):
	html = unquote(contents)
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

def GetContents(url):
	#uf = urlopen(url)

	headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.3'}
	reg_url = "https:XXXXOOOO"
	req = Request(url=url, headers=headers) 

	html = urlopen(req).read()
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

if __name__ == "__main__":
	url = "https://tech.cornell.edu/privacy-policy/"
	t = GetContents(url)
	
	file1 = open("Results/CornellTech/cornelltech_privacy.txt","w")
	file1.write(t) 
	file1.close() 