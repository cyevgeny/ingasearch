#Ingasearch

## Simplest search for blog

**Ingasearch.js** is the simple search script that allow add
search to the static sites.

## Add ingasearch to your site
First, include ingasearch stylesheet: 

    <link rel="stylesheet" type="text/css" href="css/ingastyle.css">

In ```<body>```:

    <input id="ingaSearchInput" type="text"> </input>
    <div id="ingaSearch"> </div>

Then put this after ```</body>``` tag:


    <script src="js/search_content.js"></script>
    <script src="js/ingasearch.js></script>

Last is the container where search results will be appeared.
Each result use "ingaOutputResult" class:

    <div class="ingaOutputResult">  Search Result One </div>
    <div class="ingaOutputResult">  Search Result Two </div>




And set ingasearch:
    
    <script>
        is.set();
    </script>

## Customise Ingasearch:


You can set your own id of the ```<input>``` tag, id of the result container and class for results. 
Also, you can set min count of chars in search word that must have sense. If no SettingsObj in
the ```is.set()``` method, default values is used. 

Example:

    <script>
      var sett = new is.SettingsObj( 5, "myNewInputId", "myNewContainerId", "myNewResultClass" );
      is.set(sett);
    </script>
