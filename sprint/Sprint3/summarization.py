from __future__ import absolute_import
from __future__ import division, print_function, unicode_literals

import nltk
nltk.download('punkt')
from sumy.parsers.html import HtmlParser
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
from sumy.nlp.stemmers import Stemmer
from sumy.utils import get_stop_words
 

from sumy.summarizers.luhn import LuhnSummarizer
from sumy.summarizers.edmundson import EdmundsonSummarizer   #found this is the best as 
# it is picking from beginning also while other skip
 
 
LANGUAGE = "english"
SENTENCES_COUNT = 10
 
    
url="https://www.cornell.edu/privacy-notice.cfm"



parser = HtmlParser.from_url(url, Tokenizer(LANGUAGE))
# or for plain text files
# parser = PlaintextParser.from_file("document.txt", Tokenizer(LANGUAGE))


       
summarizer = LuhnSummarizer() 
summarizer = LsaSummarizer(Stemmer(LANGUAGE))
summarizer.stop_words = ("I", "am", "the", "you", "are", "me", "is", "than", "that", "this",)

for sentence in summarizer(parser.document, SENTENCES_COUNT):
    print((sentence)) 
    



