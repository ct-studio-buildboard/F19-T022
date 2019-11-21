import collections
import nltk
import numpy as np
import pandas as pd 

from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
from numpy.linalg import svd

from sklearn.metrics import confusion_matrix
from sklearn.model_selection import train_test_split

from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB 


ct_privacy = "cornelltech_privacy.txt"


data = pd.read_csv(ct_privacy, sep = '/n', names = ['sentence'], header = None) 


## 1. preprocessing 
#------------------
def clean_text(df): 

    """
    input
    ------
    df: pandas df 
        set type e.g. training or testing with a 
        "sentence" column containing list of sentences 

    output
    ------
    df: pandasd df 
        dictionary containing text that has be cleaned

    This function works on strings to: 
        1) changes all letters to lower case
        2) strips punctuation
        3) removes stop words
        4) lemmatize 

    """

    # 1) lower case: 
    df['sentence'] = df.apply(lambda x: x.astype(str).str.lower()) 

    # 2) Strip punctuation for lemmatization and removing stop words 
    df['sentence']  = df['sentence'].str.replace('[^\w\s]','')  

    # splitting sentences into lists so that you can lemmatize 
    df['sentence'] = df['sentence'].apply(lambda x: x.split())   

    #3) Strip the stop words,e.g.,“the”,“and”,“or”.
    nltk.download('stopwords')
    df['sentence'] = df['sentence'].apply(lambda x: [w for w in x if not  w in stopwords.words('english')]) 

    #4)  Lemmatization
    nltk.download('wordnet')  
    lemmatizer = WordNetLemmatizer() 
    df['sentence'] = df['sentence'].apply(lambda x: [lemmatizer.lemmatize(i) for i in x])            

    return df

 
clean_data = clean_text(data)

clean_data.to_csv(r'clean_data_ct_privacy.csv')



#################################################
# add labels to data manually
# & create cornelltech_privacy_toste.csv"

###############################################

ct_toste = "cornelltech_privacy_toste.csv"


X = clean_data['sentence'].tolist()
y = clean_data['toste'].tolist() 

# X_train, X_test, y_train, y_test = train_test_split(
#     X,y, test_size = 0.25) 


## 4. Feature Vector 
#-------------------
def count_word_frequencies(set_type):

    """
    input
    ------
    set_type: list
        list containing list of sentences 

    output
    ------
    word_count: dict
        dictionary containing word_fequencies 

    """

    word_count = {} 
    for word_list in set_type:  
        for word in word_list:  
            if word not in word_count: 
                word_count[word] =0 
            word_count[word] +=1  

    return word_count

def make_feature_vectors(set_type, word_frequencies):
    """
    input
    ------
    set_type: list
        list containing list of sentences 

    word_frequencies: dict
        dictionary containing word_fequencies 

    output
    ------
    all_fvs: list
        list showing feature vector from word_frequencies.
    """

    all_fvs = []  
    for word_list in set_type: 
        feature_vector = [0]*len(word_frequencies) 
        for i, fv in enumerate(word_frequencies.keys()):
            if fv in word_list:  
                feature_vector[i] += 1   
        all_fvs.append(feature_vector)  

    return all_fvs


# Post processing strategy
#----------------------------
# normalizing technique 

def log_norm(x): 
    x = pd.Series(x)
    l = len(x.nonzero()[0])
    if l > 0:
        a = (np.log(x + 1)) 
        return(a.tolist()) 
    else:
        return np.zeros((len(x),))

def l2(x):
    x = pd.Series(x)
    l = len(x.nonzero()[0])
    if l > 0:
        a = (x/ float(np.sqrt(np.dot(x, x.T))))
        return(a.tolist()) 
    else:
        return np.zeros((len(x),))

# apply to all feature vectors 
def normalize_fv(set_type, norm_type):
    """
    input
    ------
    set_type: list
        list containing list of feature vectors 

    output
    ------
    all_normalized_fvs: list
        list showing an l2 normalized feature vector 
        from word_frequencies.

    """

    all_normalized_fvs = []  
    for fv in set_type: 
        all_normalized_fvs.append(norm_type(fv)) 
    return all_normalized_fvs



# 6. logisic regression and naive bayes
#---------------------------------------

# a) logistic regression 

def train_logistic_regression(features, label):
    ml_model = LogisticRegression(C = 100,random_state = 0)
    ml_model.fit(features, label)
    return ml_model

#b) naive bayes 
def train_naive_bayes(features, label):
    ml_model = GaussianNB()
    ml_model.fit(features, label)
    return ml_model


def test_model(model, word_frequencies, X_train, X_test, y_train, y_test):

    ml_model = model(X_train, y_train)

    predicted_y = ml_model.predict(X_test)
    confusion = confusion_matrix(predicted_y, y_test)    
    correctly_identified = predicted_y == y_test
    accuracy = np.mean(correctly_identified) * 100

    important_words_dict = {} 
    for x, value in enumerate(correctly_identified):
        if value == True: 
            for v, word in zip(X_test[x], word_frequencies.keys()):
                if v !=0:
                    important_words_dict[word] = v 

    sorted_dict = sorted(important_words_dict.items(), key=lambda kv: kv[1])

    return accuracy, confusion, sorted_dict[-5:]


## 2gram  
#---------------------------------------
def count_2grams(set_type):

    """
    input
    ------
    set_type: list
        list containing list of sentences 

    output
    ------
    word_count: dict
        dictionary containing word_fequencies 

    """


    word_count = {} 
    for word_list in set_type:  
        for word in range(len(word_list)-1):
            two_gram = ' '.join((word_list[word:word+2])) 
            if two_gram not in word_count: 
                word_count[two_gram] =0 
            word_count[two_gram] +=1  
    return word_count


"""
Prep data for train model
"""
#4)  
# unique ngrams dictionary 
two_gram_bag_of_words = count_2grams(X_train) 
len(two_gram_bag_of_words)  
# feature vectors
X_train_fv_2g = make_feature_vectors(X_train, two_gram_bag_of_words)    
#5) normalize feature vectors 
X_train_norm_fv_2g = normalize_fv(X_train_fv_2g, log_norm)    

"""
Prep data for test model
"""
# 4) 
# feature vector 
X_test_fv_2g = make_feature_vectors(X_test, two_gram_bag_of_words)    
# 5) normalize feature vectors  
X_test_norm_fv_2g = normalize_fv(X_test_fv_2g, log_norm) 

## Test 
lg_accuracy_2g, lg_confusion_2g, lg_important_words_2g  = test_model(train_logistic_regression, two_gram_bag_of_words, X_train_norm_fv_2g, X_test_norm_fv_2g, y_train, y_test)
nb_accuracy_2g, nb_confusion_2g, nb_important_words_2g= test_model(train_naive_bayes,two_gram_bag_of_words,  X_train_norm_fv_2g, X_test_norm_fv_2g, y_train, y_test)


