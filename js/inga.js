var is = (function () {

  /*
    Error object
  */
  var error = {
    showError: function (errorMsg) {
      alert(errorMsg);
    },
    msg: {
      wrongArgumentType: "Argument has wrong type."
    }
  };

  var settings = new SearchSettings();

  /*
   Settings constructor.
   minSearchCount = min chars in word for search;
   inputId = Id of the input field;
   resultRoodId = Id of the results container;
   resultElemClass = Class of the each search result;
  */
  function SearchSettings(minSearchCount, inputId, resultRootId, resultElemClass) {

    if (minSearchCount === undefined) {
      this.minSearchCount = 3;
    } else if (isNumeric(minSearchCount)) {
      this.minSearchCount = minSearchCount;
    } else {
      error.showError(error.msg.wrongArgumentType);
    }

    //all values converted to string;
    this.inputId = '' + (inputId || 'ingaSearchInput');
    this.resultRootId = '' + (resultRootId || 'ingaSearch');
    this.resultElemClass = '' + (resultElemClass || 'ingaOutputResult');

    function isNumeric(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }
  }


  //how much searchWord included in textString
  function countOfInclude(searchWord, textString) {
    var countInclude = 0,
      pos = 0,
      searchWordLow = searchWord.toLowerCase(),
      textStringLow = textString.toLowerCase();
    if (searchWord == "") return 0;

    while (true) {
      var inclPos = textStringLow.indexOf(searchWordLow, pos);
      if (inclPos == -1) break;
      countInclude++;
      pos = inclPos + 1;
    }
    return countInclude;
  }

  /*return scores for searchWord.
    Scores are considered differently.

    Rules for scores:

    For first inclusion( inclusion of first 3 chars from word that we search ):
    Scores for first inclusion stored in startScore variable;

    in TAG section: 3;
    in TITLE section: 1;
    in BODY section: 0.5;
    
    For each char that also included scores also added:
    Scores for each char stored in stepScore variable;

    in TAG section: 1;
    in TITLE section: 0.5;
    in BODY section: 0.2;

    If whole search word is included:

    For all sections: 1;
  */
  function getWordScore(searchWord, textString, place) {
    var resultScore = 0,
      startScore = 0,
      stepScore = 0;
    startSearchWord = searchWord.slice(0, settings.minSearchCount);
    if (place == "title") {
      startScore = 1;
      stepScore = 0.5;
    } else if (place == "tags") {
      startScore = 3;
      stepScore = 1;
    } else if (place == "body") {
      startScore = 0.5;
      stepScore = 0.2;
    }
    //get scores for the first 3 chars.
    resultScore += startScore * countOfInclude(startSearchWord, textString);
    //add 1 score for whole word inclusion
    resultScore += 1 * countOfInclude(searchWord, textString);
    //must decrease lenght of word because this is whole word inclusion,and we also added scores
    //for this.  
    for (var index = settings.minSearchCount; index < searchWord.length - 1; index++) {
      startSearchWord += searchWord[index];
      //add scores for each mutch char
      resultScore += stepScore * countOfInclude(startSearchWord, textString);
    }
    return resultScore;
  }

  //return scores for whole search request
  function getStringScore(searchString, textString, place) {
    var words = searchString.split(" "),
      resultScore = 0,
      index = 0;
    for (index; index < words.length; index++) {
      resultScore += getWordScore(words[index], textString, place);
    }
    return resultScore;
  }

  //return scores for whole page( scores for all sections )
  function getPageScore(searchString, page) {
    var resultScore = 0;
    resultScore += getStringScore(searchString, page.title, "title");
    resultScore += getStringScore(searchString, page.body, "body");
    resultScore += getStringScore(searchString, page.tags, "tags");
    return resultScore;
  }

  function PageInfo(url, score, id) {
    this.url = url;
    this.score = score;
    this.id = id;
  }

  /*
    Return array of pageInfo objects
    pageInfo object has three fields:
      pageInfo.url: url of the page;
      pageInfo.score: score for this url;
      pageInfo.id: index of this page in the index file.
    
    result array is reversed. All pageInfo objects than has score == 0 are deleted 
    from array.
  */
  function getPagesScore(searchString, pagesIndex) {
    var pagesRating = [],
      pageInfo = null,
      url, score, id;

    if (searchString.length < settings.minSearchCount) return null;
    for (var index = 0; index < pagesIndex.pages.length; index++) {
      url = pagesIndex.pages[index].url;
      score = getPageScore(searchString, pagesIndex.pages[index]);
      id = index;
      pageInfo = new PageInfo(url, score, id);
      pagesRating.push(pageInfo);
    }
    //reverse array
    pagesRating.sort(reversePagesRating);

    //delete all objects with no scores
    for (var index = 0; index < pagesRating.length; index++) {
      if (pagesRating[index].score == 0) {
        pagesRating.length = index;
        break;
      }
    }
    return pagesRating;

    //This function is for .sort method.
    function reversePagesRating(a, b) {
      return b.score - a.score;
    }
  }

  /*
    This function insert search results
    into HTML document.
    In HTML document must be " <div id="ingaSearch"></div> " string.
    This is the root point for all insertions.
    Each link displays in "div" element with attribute class="inga_output_result".
  */
  function insertResults(pagesRating) {
    var insrtPlace = document.getElementById(settings.resultRootId),
      searchResultDom,
      countOfResults = document.createElement("p");
    if (!pagesRating) return;
    insrtPlace.innerHTML = "";
    countOfResults.innerHTML = "Found: " + pagesRating.length;
    insrtPlace.appendChild(countOfResults);
    for (var index = 0; index < pagesRating.length; index++) {
      searchResultDom = document.createElement("div");
      insrtPlace.appendChild(searchResultDom);
      searchResultDom.setAttribute("class", settings.resultElemClass);
      searchResultDom.innerHTML = "<a href=" + pagesRating[index].url + ">" +
        sq.pages[pagesRating[index].id].title + " (" + pagesRating[index].score + ") </a>";
    }

  }

  /*
    Setup ingasearch to the page. 
    settingsObj is the SettingsSearch object;
    If settingsObj is not specified it will be created with default values
  */
  function ingasearch(settingsObj) {
    if ((settingsObj !== undefined) && (settingsObj instanceof SearchSettings)) {
      settings = settingsObj;
    }
    var inputElm = document.getElementById(settings.inputId);

    inputElm.onkeyup = function () {
      res = getPagesScore(this.value, sq);
      insertResults(res);
    }
  }

  return {
    set: ingasearch,
    SettingsObj: SearchSettings
  };
})();


