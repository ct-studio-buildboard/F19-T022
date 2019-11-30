// toste.js
// Injected into page script to facilitate detection of clicking, hovering, and adding to our toste machine
// --- Created by Ryan Kim, collaborated w/ Jerry Tsou, Arief Hutahaean, and Emile Burton ---

// -------------------------------------------------------------------------------------- //

// --- GLOBAL VARIABLES ---

var prev, prev_background_style;  // hold reference and background style information of what we're hovering over
var currently_working = false;    // boolean to check if toste is doing something right now.

var filtered_tags = ["HEADER", "FOOTER", "SCRIPT", "NOSCRIPT", "STYLE", "NAV", "PATH", "FORM", "BUTTON", "INPUT", "svg", "SVG"];
var prohibited_classes = ["sidebar", "nav", "navigation", "announcement"];
var prohibited_text_tags = ["B", "STRONG", "I", "EM", "MARK", "SMALL", "DEL", "INS", "SUB", "SUP"];

// --- END GLOBAL VARIABLES ---

// -------------------------------------------------------------------------------------- //

// --- GLOBAL FUNCTIONS ---

function make(desc) {
    // Probably a good idea to check if 'desc' is an array, but this can be done later;
    if ( !Array.isArray(desc) ) return false;
    var tag = desc[0], attributes = desc[1];
    var el = document.createElement(tag);
    var start = 1;
    if ( (attributes!=null) && (typeof attributes === 'object') && !Array.isArray(attributes) ) {
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
      if (Array.isArray(desc[i])) el.appendChild(make(desc[i]));
      else el.appendChild(document.createTextNode(desc[i]));
    }
    return el;
}

function handleResponse(response) {
  // runs when an action is completed by "background.js"
  currently_working = false;

  if (typeof response === 'undefined') {
    console.error("Response message from background not returned - check for possible errors");
    return;
  }

  let message = JSON.parse(response);

  if (message.status != 200) {
    console.error("ERROR: " + message.responseText);
    console.error("ERROR CONTENT: ", message.responseData);

  }
  else if (message.responseText != null) {
    console.log(message.responseText);
    if (message.responseData) {
      console.log(message.responseData);
    }
  } else {
    console.log("Status 200 recieved");
  }
}

function checker(prohibited, value) {
    var found_prohibited = false;
    var value_lowered = value.toLowerCase();
    for (var p of prohibited) {
      if (value_lowered.match(p)) {
        found_prohibited = true;
        break;
      }
    }
    return found_prohibited;
}

function parseHTML(h) {

    //console.log(h)

    var tag = h.nodeName;

    if (filtered_tags.indexOf(tag) != -1) {
      console.error("TAG NOT SUITABLE: " + tag)
      return false;
    }

    var children = [...h.childNodes];
    var innerText = (tag != "#text") ? h.innerText : h.wholeText;
    var classList = (h.classList) ? [...h.classList] : [];
    var raw = h;

    if (innerText.replace(/\s+/g, '').length == 0) {
      console.error("INNER TEXT NOT SUITABLE: " + tag)
      return false;
    }

    found_prohibited_class = classList.reduce((accumulation, curClass)=>{
      if (checker(prohibited_classes, curClass)) {
        accumulation = true;
      }
      return accumulation;
    }, false)

    if (tag != "BODY" && found_prohibited_class) {
      console.error("FOUND PROHIBITED CLASS: " + tag)
      return false
    }
    
    if (children.length > 0) {
      new_children = children.reduce((accumulation, child)=>{
        var res = parseHTML(child);
        if (res != false) {
          if (res[0] == "#text") {
            accumulation.push(["SPAN",{},res[2]])
          }
          else {
            accumulation.push(res)
          }
        }
        return accumulation;
      }, []);
      children = new_children
    }

    if (children.length == 0) {
      children = [innerText]
    }
    
    //var toReturn = [tag, {class:classList.join(' ')}, ...children]
    var toReturn = [tag, {}, ...children]
    //console.log(toReturn)
    return toReturn;
}

function cleanHTML(html, depth=1, layerThreshold=0.1, minDivisions = 3) {

    // html = original HTML source
    // depth = how deep the divisions should occur 
    //    (ex. 1 = we only have one layer deep, so one body -> 3 splits, for example)
    //    (ex. 2 = 2 layers deep, each of those 3 aforementioned splits divides into separate segments)
    // layerThreshold = the threshold by which we consider a segment to contain anything relevant to what we're looking
    // minDivisions = the minimum number of divisions each layer should ideally have.
    //    The funny thing about html-based ToS's is that they tend to do this weird behavior where they consistently have divisions of 2-3
    //      for every layer you go down. It only goes greater than 2-3 when you actually reach the ToS.

    function compareDescending( a, b ) {
      if ( a.ratio < b.ratio ){
        return 1;
      }
      if ( a.ratio > b.ratio){
        return -1;
      }
      return 0;
    }

    function filterChildren(htmlComponent) {
      var children = [...htmlComponent.childNodes]
      var totalLength = htmlComponent.innerHTML.length;
      children_lengths = children.map((child, childIndex)=>{
        return {index: childIndex, ratio: (child.innerHTML.length / totalLength)};
      });
      children_lengths.sort(compareDescending)
      children = children_lengths.filter((child)=>{
        return child.ratio >= layerThreshold
      });
      return children;
    }

    var toReturn = html;
    var toObserve = toReturn;

    for (var curLayer = 0; curLayer <= depth;) {
      var sampled = filterChildren(toObserve)
      if (sampled.length < minDivisions) {
        var sampledIndex = sampled[0].index;
        toReturn = [...toObserve.childNodes][sampledIndex];
        toObserve = toReturn;
        continue;
      }
      curLayer += 1;
    }
    return toReturn; 
}

function parseInnerText(html, lengthThreshold = 5) {

    // Checks if a cahracter is alphanumeric
    // --- Code provided by Michael Martin-Smucker on Stack Overflow: https://stackoverflow.com/a/25352300
    function isAlphaNumeric(str) {
      var code, i, len;

      for (i = 0, len = str.length; i < len; i++) {
        code = str.charCodeAt(i);
        if (!(code > 47 && code < 58) && // numeric (0-9)
            !(code > 64 && code < 91) && // upper alpha (A-Z)
            !(code > 96 && code < 123)) { // lower alpha (a-z)
          return false;
        }
      }
      return true;
    };

    // Classifies text as either Useless, Header, or Text
    function classificationScore(textElement) {
      // Pre-emptively declare scoring storage for this text element
      score = {"useless":0,"header":0,"text":0};

      // First classification: what's the end character?
      // Get last character
      var lastChar = (typeof textElement !== "undefined") ? textElement[textElement.length -1] : '';
      switch(lastChar) {
        case (':'):
          score.header += 1;
          score.text += 1;
          break;
        case ('.'):
          score.useless += 1;
          score.text += 1;
          break;
        case (';'):
          score.text += 2;
          break;
        case ('?'):
          score.header += 1;
          score.text += 1;
          break;
        case ('!'):
          score.header += 1;
          score.text += 1;
          break;
        case (')'):
          score.text += 2;
          break;
        default:
          score.useless += 1;
          score.header += 1;
      }

      // Second classification: what's the beginning character?
      // If the first character is alphabet, equally apply to header or text
      if (typeof textElement[0] !== "undefined" && textElement[0].match(/[a-z]/i)) {
        score.header += 1;
        score.text += 1;
      }
      // If the first character is number, more likely to be header than text
      else if (typeof textElement[0] !== "undefined" && textElement[0].match(/[0-9]/)) {
        score.header += 2;
      }
      else {
        score.useless += 2;
      }

      // Third classification: is it long or short?
      // Split textElement into words
      var bagOfWords = (typeof textElement !== "undefined") ? textElement.split(' ') : -1;
      // Comparison
      if (bagOfWords.length >= lengthThreshold) {
        score.header += 1;
        score.text += 1;
      }
      // However, if the text is short but it has a number in front of it, it's more likely to be a header...
      else if (typeof textElement[0] !== "undefined" && textElement[0].match(/[0-9]/)) {
        score.header += 2;
      }
      else {
        score.useless += 1;
        score.header += 1;
      }

      // Fourth classification: capitalization?
      // the first character is some undescribable, non-alphanumeric character
      if (typeof encodeURI(decodeURI(textElement))[0] === 'undefined' || !encodeURI(decodeURI(textElement))[0].match(/[a-z0-9]/i)) {
        score.useless += 2;
      }
      // text is all capitals
      else if (typeof textElement !== "undefined" && textElement === textElement.toUpperCase()) {
        score.header += 2;
      }
      // text is all lowercase
      else if (typeof textElement !== "undefined" && textElement === textElement.toLowerCase()) {
        score.useless += 1;
        score.header += 1;
      } 
      // text is neither fully upper or lowercase
      else {
        score.header += 1;
        score.text += 1;
      }

      // if useless score is greater than all other scores, return -1; else, return score
      //if (score.useless > score.header && score.useless > score.text) {
      //  return -1;
      //} 
      //else {
        return score;
      //}
    }

    var inText= (' ' + html.innerText.toString()).slice(1).toString();
    inText = inText.replace(/[\r\n]{2,}/g,"\n\n");
    var inTextArray = inText.split("\n\n");

    inTextArray = inTextArray.reduce((returnList, item, itemIndex)=>{

      let itemArray = item.split('\n');
      itemArray = itemArray.reduce((sum,innerItem)=>{
        let innerItemScore = classificationScore(innerItem)
        if (innerItemScore.useless <= innerItemScore.header || innerItemScore.useless <= innerItemScore.text) {
          delete innerItemScore["useless"];
          var scoreArray = Object.keys(innerItemScore).map(function(key) {
            return [key, innerItemScore[key]];
          });
          scoreArray.sort(function(first, second) {
            return second[1] - first[1];
          });

          let scoreCategory = scoreArray[0][0];
          if (scoreArray[0][1] == scoreArray[1][1]) {
            scoreCategory = 'text';
          }

          let newNode = {raw:innerItem,score:innerItemScore,category:scoreCategory};
          sum.push(newNode)
        }
        return sum;
      },[]);

      // pre-process items in itemArray and assign total score to either KEEP or BURN
      // We've removed all the parts taht we've deemed to be "useless" - now we have just headers and text
      // We determine whether to keep or burn based on several key factors:
      //  1) if the ratio of header to text is over a certain threshold, then we burn - otherwise, we keep
      /*
      if ( (itemArrayNumHeaders.length / itemArrayNum) <= 0.5 || (itemArrayNum == 1 && itemIndex < inTextArray.length - 1) || (itemIndex >= 4 && itemIndex <= inTextArray.length - 5) ) {
        returnList.push(itemArray)
      }
      */
      /*
      console.log(itemArray)
      let itemArrayNum = itemArray.length;
      let itemArrayNumHeaders = itemArray.filter((innerItem)=>{
        return innerItem.category == 'header';
      });
      console.log(itemArrayNum);
      console.log(itemArrayNumHeaders.length);
      */

      returnList.push(itemArray);
      return returnList;
    }, []);

    // Flatten our list of lists into one single list
    var flattenedContent = inTextArray.flat(Infinity)

    // return our flattened content - we've parsed through!
    return flattenedContent;
}
  
function segmentParsed(arr) {

    function Segment() {
      this.header = null;
      this.text = "";
    }
    var curSegment = new Segment();

    var new_arr = arr.reduce((toReturnArr, curItem, curItemIndex)=>{
      if (curItem.category == 'header') {
        if (curSegment.header == null) {
          curSegment.header = curItem;
        }
        else if (curSegment.header != null && curSegment.text.length == 0) {
          /*
          let prevSeg = (curItemIndex > 0) ? arr[curItemIndex-1] : null;
          let nextSeg = (curItemIndex < arr.length-1) ? arr[curItemIndex+1] : null;

          if (prevSeg == null) {
          */
            //curSegment.header = curItem;
          /*
          }
          else if (nextSeg == null) {
            curSegment.header = curItem;
          }
          else if (prevSeg.category == 'text' && nextSeg.category == 'header') {
            console.log("PREV: TEXT | NEXT: HEADER");
            curSegment.text += curItem.raw + '\n';
            arr[curItemIndex].category = 'text';
          }
          else if (prevSeg.category == 'text' && nextSeg.category == 'text') {
            console.log("PREV: TEXT | NEXT: TEXT");
            toReturnArr.push(curSegment);
            curSegment = new Segment;
            curSegment.header = curItem;
          }
          else if (prevSeg.category == 'header' && nextSeg.category == 'header') {
            console.log("PREV: HEADER | NEXT: HEADER");
            curSegment.header = curItem;
          }
          else if (prevSeg.category == 'header' && nextSeg.category == 'text') {
            console.log("PREV: HEADER | NEXT: TEXT");
            curSegment.header = curItem
          }
          else {
            console.log("PREV: UNKNOWN | NEXT: UNKNOWN");
            curSegment.header = curItem;
          }
          */
          toReturnArr.push(curSegment);
          curSegment = new Segment;
          curSegment.header = curItem;
        }
        else {
          /*
          let prevSeg = arr[curItemIndex-1];
          let nextSeg = (curItemIndex < arr.length-1) ? arr[curItemIndex+1] : null;

          if (nextSeg == null) {
            curSegment.text += curItem.raw + '\n';
            arr[curItemIndex].category = 'text';
          }
          else if (prevSeg.category == 'text' && nextSeg.category == 'header') {
            console.log("PREV: TEXT | NEXT: HEADER");
            //curSegment.text += curItem.raw + '\n';
            //arr[curItemIndex].category = 'text';
            toReturnArr.push(curSegment);
            curSegment = new Segment;
            curSegment.header = curItem;
          }
          else if (prevSeg.category == 'text' && nextSeg.category == 'text') {
            console.log("PREV: TEXT | NEXT: TEXT");
            toReturnArr.push(curSegment);
            curSegment = new Segment;
            curSegment.header = curItem;
          }
          else if (prevSeg.category == 'header' && nextSeg.category == 'header') {
            console.log("PREV: HEADER | NEXT: HEADER");
            toReturnArr.push(curSegment);
            curSegment = new Segment;
            curSegment.header = curItem;
          }
          else if (prevSeg.category == 'header' && nextSeg.category == 'text') {
            console.log("PREV: HEADER | NEXT: TEXT");
            toReturnArr.push(curSegment);
            curSegment = new Segment;
            curSegment.header = curItem;
          }
          else {
            console.log("PREV: UNKNOWN | NEXT: UNKNOWN");
          */
            toReturnArr.push(curSegment);
            curSegment = new Segment;
            curSegment.header = curItem;
          /*
          }
          */
        }
      }
      else if (curItem.category == 'text') {
        curSegment.text += curItem.raw + '\n';
      }

      if (curItemIndex == arr.length - 1) {
        toReturnArr.push(curSegment)
      }

      return toReturnArr;
    }, [])

    // Now, we post-process by conjoining multiple lists of just headers - no texts into their own segments
    // It's okay if some are not processed correctly and instead think they're their own header-text segment - falsities can still work
    var tempSegmentArray = []
    var tempSegment;
    var post_process = new_arr.reduce((toReturnArr, curItem, curItemIndex)=>{
      if (curItem.header != null && curItem.text == "") {
        tempSegmentArray.push(curItem);
      }
      else if (tempSegmentArray.length == 1) {
        var lastSegmentAdded = toReturnArr[toReturnArr.length-1];
        lastSegmentAdded.text += tempSegmentArray[0].header.raw + '\n';
        tempSegmentArray = [];
        toReturnArr.push(curItem);
      }
      else if (tempSegmentArray.length > 1) {
        tempSegment = new Segment;
        var newHeader = tempSegmentArray[0].header;
        tempSegment.header = newHeader;
        tempSegment.text = tempSegmentArray.reduce((newText, t, tIndex)=>{
          if (tIndex > 0) {
            newText += '- ' + t.header.raw + '\n' 
          }
          return newText;
        },"");
        tempSegmentArray = [];
        toReturnArr.push(tempSegment);
        toReturnArr.push(curItem);
      }
      else {
        toReturnArr.push(curItem);
      }

      if(tempSegmentArray.length > 0 && curItemIndex == new_arr.length-1) {
        tempSegment = new Segment;
        tempSegment.header = tempSegmentArray[0].header;
        if (tempSegmentArray.length > 1) {
          tempSegment.text = tempSegmentArray.reduce((newText, t, tIndex)=>{
            if (tIndex > 0) {
              newText += '- ' + t.header.raw + '\n' 
            }
            return newText;
          },"");
        }
        tempSegmentArray = [];
        toReturnArr.push(tempSegment);
      }

      return toReturnArr;
    }, [])


    return post_process;
}


/*
function toste_mouseover_controller(event) {
  // AddListenerEvent function that controls hovering over objects
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

function toste_click_controller(event) {
  if (!currently_working) {
    currently_working = true;
    var sending = browser.runtime.sendMessage({
      type: 'addTabContent',
      content: event.target.innerHTML
    }, handleResponse);
  }
}
*/

  /*
    var bodyParsed = parseHTML(bodyHTML);
    console.log(bodyParsed)

    var testMake = make(bodyParsed)
    console.log(testMake)

    var testCalculate = cleanHTML(testMake)
    console.log(testCalculate);
    */

    /*

    // Adds event listener for hover
    if (document.body.addEventListener) {
      document.body.addEventListener('mouseover', toste_mouseover_controller, false);
    }
    else if (document.body.attachEvent) {
      document.body.attachEvent('mouseover', function(e) {
        return toste_mouseover_controller(e || window.event);
      });
    }
    else {
      document.body.onmouseover = toste_mouseover_controller;
    }

    // Adds event listener for clicking
    document.addEventListener("click", toste_click_controller);
    */

// --- END GLOBAL FUNCTIONS ---

// -------------------------------------------------------------------------------------- //

// --- RUNTIME ---

browser.runtime.onMessage.addListener((message, tabId, sendResponse) => {
  response = {status:200};
  if (tabId == null) {
    response.status = 400;
    response.responseText = "Unrecognised Tab ID";
    response.responseData = message;
  }
  else {
    switch(message.type) {
      case "extractContent":
        var bodyHTML = document.body;
        console.log(bodyHTML)
        var bodyHTMLParsed = parseInnerText(bodyHTML)
        console.log(bodyHTMLParsed);
        var trulySegmented = segmentParsed(bodyHTMLParsed);
        //console.log(trulySegmented);

        // Set response values for return
        response.status = 200;
        response.responseText = "Content Extracted";
        response.responseData = trulySegmented;
        console.log(trulySegmented);

        break;
      default:
        // Set response values for return
        response.status = 400;
        response.responseText = "ToSTE: Unrecognised message type";
        response.responseData = message;
        break;
    }
  }
  sendResponse(response);
});
/*
if (!currently_working) {
  currently_working = true;
  var sending = browser.runtime.sendMessage({
    type: 'setContent',
    contents: trulySegmented
  },handleResponse);
}
*/


