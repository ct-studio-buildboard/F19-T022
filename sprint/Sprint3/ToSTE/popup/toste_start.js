/**
 * CSS to hide everything on the page,
 * except for elements that have the "beastify-image" class.
 */
const hidePage = `body > :not(.beastify-image) {
                    display: none;
                  }`;

function sendHTTPRequest(type, url, content, contenttype, next) {
  
  var urlEncodedData = "";
  var urlEncodedDataPairs = [];
  var name;

  if (content != null){
    for(name in content) {
      urlEncodedDataPairs.push(encodeURIComponent(name) + '=' + encodeURIComponent(content[name]));
    }
    urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');
  }

  var cType = (contenttype != null) ? contenttype : 'application/x-www-form-urlencoded';

  var xhr = new XMLHttpRequest();
  xhr.addEventListener('load', function(event) {
    next(xhr);
  });
  xhr.addEventListener('error', function(event) {
    console.log('Oops! Something goes wrong.');
  });
  xhr.open(type, url);
  xhr.setRequestHeader('Content-Type', cType);
  xhr.send(urlEncodedData);


  /*
  xhr.open(type, url);
  if (type.toLowerCase() == "post") {
    var cType = (contenttype != null) ? contenttype : 'application/json';
    xhr.setRequestHeader('Content-Type',cType);
    console.log(cType)
  }
  xhr.onload = function() { next(xhr);  }
  xhr.send(content);
  */
}

/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */

function make(desc) {
  // Probably a good idea to check if 'desc' is an array, but this can be done later;
  if ( !isArray(desc) ) return false;
  var tag = desc[0], attributes = desc[1];
  var el = document.createElement(tag);
  var start = 1;
  if ( (attributes!=null) && (typeof attributes === 'object') && !isArray(attributes) ) {
    for (var attr in attributes) {
      switch(attr) {
        case 'class':
          el.className = attributes[attr];
          break;
        case 'checked':
          el.checked = attributes[attr];
          break;
        case 'html':
          el.innerHTML = attributes[attr];
          break;
        default:
          el.setAttribute(attr, attributes[attr]);
      }
    }
    start = 2;
  }
  for (var i = start; i < desc.length; i++) {
    if (isArray(desc[i])) el.appendChild(make(desc[i]));
    else el.appendChild(document.createTextNode(desc[i]));
  }
  return el;
}

function listenForClicks() {

  document.addEventListener("click", (e) => {

    function printResult(type,content) {

    }

    function handleResponse(res) {
      if (res.length == 0) {
        console.log("error!")
      } else {
        /*
        full_res = []
        if (!Array.isArray(res)){
          full_res.push(res)
        } else {
          full_res = res
        }
        */
        full_res = res[0]
        data_to_send = {'html':full_res}
        sendHTTPRequest('POST','http://127.0.0.1:5000/',data_to_send,'application/x-www-form-urlencoded',(res)=>{
          if (res.status == 200) {
            console.log(res.responseText)
          }
          else {
            //server_result = JSON.parse(res.responseText)
            console.log(res)
          }
        });
      }
    }

    function toste_get(tabs) {
      let tab = tabs[0]
      let res = browser.runtime.sendMessage({type: 'getContent', id:tab.id}, handleResponse)
      /*
      let true_url = tabs[0].url;
      let data_to_send = {'url':true_url}
      console.log(true_url)
      sendHTTPRequest('POST','http://127.0.0.1:5000/',data_to_send,'application/x-www-form-urlencoded',(res)=>{
        if (res.status == 200) {
          console.log(res.responseText)
        }
        else {
          //server_result = JSON.parse(res.responseText)
          console.log(res)
        }
      });
      */
    }

    /**
     * Insert the page-hiding CSS into the active tab,
     * then get the beast URL and
     * send a "beastify" message to the content script in the active tab.
     */
     /*
    function beastify(tabs) {
      browser.tabs.insertCSS({code: hidePage}).then(() => {
        let url = beastNameToURL(e.target.dataset.id);
        browser.tabs.sendMessage(tabs[0].id, {
          command: "beastify",
          beastURL: url
        });
      });
    }
    */

    /**
     * Remove the page-hiding CSS from the active tab,
     * send a "reset" message to the content script in the active tab.
     */
     /*
    function reset(tabs) {
      browser.tabs.removeCSS({code: hidePage}).then(() => {
        browser.tabs.sendMessage(tabs[0].id, {
          command: "reset",
        });
      });
    }
    */

    /**
     * Just log the error to the console.
     */
    function reportError(error) {
      console.error(`Could not ToSTE: ${error}`);
    }

    /**
     * Get the active tab,
     * then call "beastify()" or "reset()" as appropriate.
     */
    if (e.target.classList.contains("toste")) {
      browser.tabs.query({active: true, currentWindow: true})
        .then(toste_get)
        .catch(reportError);
    }
    else {
      console.log(e.target);
    }
    /*
    else if (e.target.classList.contains("reset")) {
      browser.tabs.query({active: true, currentWindow: true})
        .then(reset)
        .catch(reportError);
    }
    */
  });
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(`Failed to execute content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs.executeScript({file: "/content_scripts/toste.js"})
.then(listenForClicks)
.catch(reportExecuteScriptError);