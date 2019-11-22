from __future__ import absolute_import
from __future__ import division, print_function, unicode_literals

from pip._internal import main as pipmain
pipmain(['install', 'sumy'])

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
 
def summarizer(html_input, sentence_count):
	 
	LANGUAGE = "english"
	SENTENCES_COUNT = sentence_count
	 
	#url="https://www.cornell.edu/privacy-notice.cfm"

	#parser = html_input
	#parser = HtmlParser.from_plaintext(html_input, Tokenizer(LANGUAGE))
	# or for plain text files
	parser = PlaintextParser(html_input, Tokenizer(LANGUAGE))

	summarizer = LuhnSummarizer() 
	summarizer = LsaSummarizer(Stemmer(LANGUAGE))
	summarizer.stop_words = ("I", "am", "the", "you", "are", "me", "is", "than", "that", "this",)

	results = []
	for sentence in summarizer(parser.document, SENTENCES_COUNT):
		results.append(str(sentence))
		#print(sentence)
		#return sentence
	return results
