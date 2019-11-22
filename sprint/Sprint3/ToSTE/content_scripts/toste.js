
/*
(function() {
*/
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */

   /*
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;
  */
  /**
   * Given a URL to a beast image, remove all existing beasts, then
   * create and style an IMG node pointing to
   * that image, then insert the node into the document.
   */
   /*
  function insertBeast(beastURL) {
    removeExistingBeasts();
    let beastImage = document.createElement("img");
    beastImage.setAttribute("src", beastURL);
    beastImage.style.height = "100vh";
    beastImage.className = "beastify-image";
    document.body.appendChild(beastImage);
  }
  */

  /**
   * Remove every beast from the page.
   */

   /*
  function removeExistingBeasts() {
    let existingBeasts = document.querySelectorAll(".beastify-image");
    for (let beast of existingBeasts) {
      beast.remove();
    }
  }
  */

  /**
   * Listen for messages from the background script.
   * Call "beastify()" or "reset()".
  */

  /*
  browser.runtime.onMessage.addListener((message) => {
    switch(message.command) {
      case("beastify"):
        insertBeast(message.beastURL);
        break;
      case("reset"):
        removeExistingBeasts();
        break;
      case("test"):
        browser.tabs.executeScript({
          code: `console.log('location:', window.location.href);`
        });
        break;
    }
  });
  */
/*
})();
*/

function handleEvent(e) {
    console.log(`${e.type}: ${e.loaded} bytes transferred\n`);
    console.log(e.status)
}


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
    console.log(event)
    next(xhr);
  });
  xhr.addEventListener('error', handleEvent);


  console.log(type)
  console.log(url)
  console.log(cType)
  console.log(urlEncodedData)

  xhr.open(type, url);
  xhr.setRequestHeader('Content-Type', cType);
  xhr.send(urlEncodedData);

}


var prev;
var prev_background_style

if (document.body.addEventListener) {
  document.body.addEventListener('mouseover', toste_mouseover, false);
}
else if (document.body.attachEvent) {
  document.body.attachEvent('mouseover', function(e) {
    return toste_mouseover(e || window.event);
  });
}
else {
  document.body.onmouseover = toste_mouseover;
}

function toste_mouseover(event) {
  if (event.target === document.body || (prev && prev === event.target)) {
    return;
  }
  if (prev) {
    if (prev.style.removeProperty) {
      prev.style.backgroundColor = prev_background_style
    } else {
      prev.style.backgroundColor = prev_background_style
    }
    prev = undefined;
    prev_background_style = undefined;
  }
  if (event.target) {
    prev = event.target;
    prev_background_style = prev.style.backgroundColor;
    prev.style.backgroundColor = 'rgba(0,0,0,0.1)';
  }
}


document.addEventListener("click", (e) => {
  /*
  function toste_get(tab,content) {
    let true_url = tab.url;
    let data_to_send = {'url':true_url,'content':urlencode(content)}

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

    function toste_get_simple(content) {
      console.log(content)
      let data_to_send = {'html':content}
      console.log(data_to_send)

      sendHTTPRequest('POST','http://127.0.0.1:5000/',data_to_send,'application/x-www-form-urlencoded',(res)=>{
        console.log(res.status)
        if (res.status == 200) {
          console.log(res.responseText)
        }
        else {
          //server_result = JSON.parse(res.responseText)
          console.log(res)
        }
      });
    }
  
    /*
    browser.tabs.query({active: true, currentWindow: true})
      .then((tabs)=>{
        console.log(e.target.innerHTML);
        let chosen_tab = tabs[0];
        toste_get(chosen_tab, e.target.innerHTML);
      })
        //.catch(reportError);
    */

    /*
    //console.log(e.target.innerHTML);
    if (e.target.innerHTML.length > 0 && e.target.textContent.length > 0) {
      toste_get_simple(e.target.textContent);
    }
    else {
      console.error("Your Target must have something inside it!")
    }
    */

    function handleResponse(message) {
      console.log(message);
    }

    if (!e.target.classList.contains('toste')) {
      var sending = browser.runtime.sendMessage({
        type: 'setContent',
        content: e.target.innerHTML
      }, handleResponse);
    }
    //sending.then(handleResponse, handleError);  

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

     /*
    function reportError(error) {
      console.error(`Could not ToSTE: ${error}`);
    }
    */

    /**
     * Get the active tab,
     * then call "beastify()" or "reset()" as appropriate.
     */

     /*
    if (e.target.classList.contains("toste")) {
      browser.tabs.query({active: true, currentWindow: true})
        .then(toste_get)
        .catch(reportError);
    }
    else {
      console.log(e.target);
    }
    */
    /*
    else if (e.target.classList.contains("reset")) {
      browser.tabs.query({active: true, currentWindow: true})
        .then(reset)
        .catch(reportError);
    }
    */
});