from urllib.request import urlopen, Request 
from urllib.parse import unquote
from bs4 import BeautifulSoup

from html.parser import HTMLParser

class MyHTMLComponent:
    def __init__(self, type, tag, attrs, data):
        self.type = type
        self.tag = tag
        self.attrs = attrs
        self.data = data

        self.parent = None
        self.children = list()

    def AddChild(self, child):
        self.children.append(child)

    def AddParent(self, parent):
        self.parent = parent

    def PrintDetails(self):
        print("Type: {} | Tag: {} | Data: {}".format(self.type, self.tag, self.data))
        if len(self.children) > 0:
            for child in self.children:
                print(child.PrintDetails())

    def RecreateHTML(self):
        this_string_start = ""
        this_string_end = ""
        this_string_inner = ""

        if self.type == "end":
            this_string_start = "</"
            this_string_end = ">\n"
            this_string_inner = self.tag
        elif self.type == "start":
            this_string_start = "<"
            this_string_end = ">"
            this_string_inner = self.tag
        elif self.type == "startend":
            this_string_start = "<"
            this_string_end = ">\n"
            this_string_inner = self.tag
        elif self.data is not None:
            this_string_inner = self.data

        if self.attrs is not None:
            to_flatten = [tup[0] + '="' + tup[1] + '"' if len(tup[1]) > 0 else '' for tup in self.attrs]
            this_string_inner += ' ' + " ".join(to_flatten)

        this_string = this_string_start + this_string_inner + this_string_end;

        if len(self.children) > 0:
            for child in self.children:
                this_string += child.RecreateHTML()

        return this_string

class MyHTMLParser(HTMLParser):

    components = list()
    thisParsed = MyHTMLComponent("root", None, None, None)

    def handle_starttag(self, tag, attrs):
        #print("Encountered a start tag:", tag)
        comp = MyHTMLComponent("start", tag, attrs, None)
        self.components.append(comp)

    def handle_endtag(self, tag):
        #print("Encountered an end tag :", tag)
        comp = MyHTMLComponent("end", tag, None, None)
        self.components.append(comp)

    def handle_startendtag(self, tag, attrs):
        #print("Encountered a start-end tag:", tag)
        comp = MyHTMLComponent("startend", tag, attrs, None)
        self.components.append(comp)

    def handle_data(self, data):

        temp_data = "\n".join(item for item in data.split('\n') if item)
        temp_data = ' '.join(item for item in temp_data.split(' ') if item)

        if len(temp_data) == 0:
            temp_data = ' '          

        # print("Encountered some data  :", repr(temp_data))
        comp = MyHTMLComponent("data", None, None, temp_data)
        self.components.append(comp)

    def parse_data(self):

        thisParsed = MyHTMLComponent("root", None, None, None)
        tempParent = [self.thisParsed]
        for comp in self.components:
            if comp.type == "data":
                parent = tempParent[len(tempParent)-1]
                comp.parent = parent
                parent.children.append(comp)
            elif comp.type == "end":
                parent = tempParent[len(tempParent)-1]
                comp.parent = parent
                parent.children.append(comp)
                tempParent = tempParent[:-1]
            elif comp.type == "startend":
                parent = tempParent[len(tempParent)-1]
                comp.parent = parent
                parent.children.append(comp)
            else:
                parent = tempParent[len(tempParent)-1]
                comp.parent = parent
                parent.children.append(comp)
                tempParent.append(comp)
        return self.thisParsed

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

    html_content = soup.prettify()

    '''

    # get text
    text = soup.get_text()

    # break into lines and remove leading and trailing space on each
    lines = (line.strip() for line in text.splitlines())
    # break multi-headlines into a line each
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    # drop blank lines
    text = '\n'.join(chunk for chunk in chunks if chunk)

    return text
    '''




def GetHTMLContents(contents):
    parser = MyHTMLParser()
    parser.feed(contents)
    return parser

if __name__ == "__main__":
    url = "https://tech.cornell.edu/privacy-policy/"
    t = GetContents(url)
    
    file1 = open("Results/CornellTech/cornelltech_privacy.txt","w")
    file1.write(t) 
    file1.close() 