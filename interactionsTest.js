
var testEvent = new Event('editXD');
var testClickEvent = new Event('click');
// Listen for the event.
//elem.addEventListener('editXD', function (e) { /* ... */ }, false); 
// Dispatch the event.
//elem.dispatchEvent(testEvent);

const gTestMode = false;

exports.createPanel = function() {
    console.log("In createPanel");    

    var dialog = document.createElement("dialog");
    var form = document.createElement("form");

    var container = document.createElement("div");

    container.innerHTML = `
    <style>
    #overlay {
      position: absolute;
      display: block;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255,0,0,0.85);
      z-index: 2;
      cursor: pointer;
    }
    </style>
    <div id="not_overlay"></div>
    <h1>Interactions Tests</h1>
    <button id="buttonTest">Button</button>
    <label class="row">
        <span>Test Check Box</span>
        <input id="checkBoxTest" type="checkbox" label="Check Box">Checkbox input</input>
    </label>
    <input id="textInputTest">Your text here!</input>
    <input id="rangeInputTest" type="range" min="1" max="100" width="100%">Range input</input>
    <input id="rangeInputTest2" type="range" min="1" max="100" value="25" width="100%"/>
    
    <label class="row">
        <span>Password:</span>
        <input id="pw" type="password"/>
    </label

    <span>Radio Buttons:</span>
    <div id="radioGroup" class="flex-column border">
        <label class="row">
            <input type="radio"  name="myRadios"/>
            <span>Option 1</span>
        </label>
        <label class="row">
            <input type="radio"  name="myRadios"/>
            <span>Option 2</span>
        </label>
        <label class="row">
            <input type="radio"  name="myRadios"/>
            <span>Option 3</span>
        </label>
    </div>

    <label class="row">
      <input type="checkbox" id="chk">
      <span>Checkbox</span>
    </label>

    <label class="row">
      <input type="text" id="input">
      <span>Value</span>
    </label>

    <label class="row">
        <span>Opacity</span>
        <input type="text" id="opac">
    </label>

    <label>
        <span>Width:</span>
        <input type="text" />
    </label>

    <label><span>Height:</span><input type="text" /></label>

    <button id='renditionEditContextTest'>XD-70475</button>

    <button id='sharedLinks'>Shared Links</button>

    <p></p>
    <div>Test</div>`;

    // button
    container.querySelector("#buttonTest").addEventListener("click", handleEvent);
    //container.querySelector("#buttonTest").addEventListener("editXD", handleEvent);

    // input checkbox
    container.querySelector("#checkBoxTest").addEventListener("click", handleEvent);
    // change should work but is now broken
    container.querySelector("#checkBoxTest").addEventListener("change", handleEvent);
    container.querySelector("#checkBoxTest").addEventListener("input", handleEvent);
    //container.querySelector("#checkBoxTest").addEventListener("editXD", handleEvent);

    // input text
    container.querySelector("#textInputTest").addEventListener("click", handleEvent);
    container.querySelector("#textInputTest").addEventListener("blur", handleEvent);
    container.querySelector("#textInputTest").addEventListener("change", handleEvent);
    container.querySelector("#textInputTest").addEventListener("keydown", handleEvent);
    //The next two work fine - but very noisey
    //container.querySelector("#textInputTest").addEventListener("keydown", handleEvent);
    //container.querySelector("#textInputTest").addEventListener("input", handleEvent);
    //container.querySelector("#textInputTest").addEventListener("editXD", handleEvent);

    // input range
    container.querySelector("#rangeInputTest").addEventListener("change", handleEvent);
    // above doesn't fire if use arrows to move after activated via tab, below does get fired
    //The next one works fine - but very noisey
    container.querySelector("#rangeInputTest").addEventListener("input", handleEvent);
    //container.querySelector("#rangeInputTest").addEventListener("editXD", handleEvent);

    container.querySelector("#chk").addEventListener("change", handleEvent);
    container.querySelector("#input").addEventListener("change", handleEvent);

    // password
    container.querySelector("#pw").addEventListener("change", function() {
        console.log("In pw handler");
        //bob = ted;
        throw "pw error";
    });

    // radios
    var radioButtons = container.querySelectorAll("div #radioGroup input[name='myRadios']");
    console.log("radioButtons: " + radioButtons.length);
    //radioButtons.forEach(function(radioButton) {radioButton.addEventListener("change", handleEvent)});
    radioButtons.forEach((radioButton) => {radioButton.addEventListener("change", handleEvent)});


    //opac test
    container.querySelector("#opac").addEventListener("change", function (event) {
        console.log("Opacity event handler");
        const app = require("application");
        const selection = require("scenegraph");
        console.log("copy to clipboard without app.editDocument wrapper");
        require("clipboard").copyText("Validate Change");
        
        app.editDocument(selection => {
            selection.items[0].opacity = parseFloat(event.target.value);
            //console.log("copy to clipboard within app.editDocument wrapper");
            //require("clipboard").copyText("Hello world");
        });
        
    });

    container.querySelector("#renditionEditContextTest").addEventListener("click", testRenditions);
    /*
    container.querySelector("#renditionEditContextTest").addEventListener("click", function() {
        console.log("In renditionEditContextTest handler");
        const selection = require("scenegraph");
        var file = await fs.getFileForSaving("sample.png", { types: ["png"], overwrite: true });
    
        var renditions = [{
            node: selection.items[0],
            outputFile: file,
            type: application.RenditionType.PNG,
            scale: 2
        }];
        console.log("START", selection.editContext);
        console.log(selection.items);
    
        return application.createRenditions(renditions).then(results => {
            console.log("END", selection.editContext);
            console.log(selection.items);
        }).catch(error => {
            console.log(error);
        });  
    });
    */

    container.querySelector('#sharedLinks').addEventListener("click", function() {
        const cloud = require("cloud");
        var sharedArtifacts = cloud.getSharedArtifacts();
        //var prototypes = sharedArtifacts.filter(artifact => (artifact.type === cloud.ArtifactType.PROTOTYPE));
        sharedArtifacts.forEach(artifact => {
            console.log("artifact: ", artifact);
            console.log("Prototype URL: ", artifact.url);
        });

        var specs = sharedArtifacts.filter(artifact => (artifact.type === cloud.ArtifactType.SPECS));
        specs.forEach(artifact => {
            console.log("Design Spec URL: ", artifact.url);
        });

        var prototypes = sharedArtifacts.filter(artifact => (artifact.type === cloud.ArtifactType.PROTOTYPE));
        prototypes.forEach(artifact => {
            console.log("Prototype URL: ", artifact.url);
        });
    })

   const sg = require("scenegraph");
   const selection =sg.selection;

   console.log(selection.items);
   //const selection = selection.selection;
   //console.log(selection.items.length);
   console.log(selection.editContext);

    return container;

    form.appendChild(container);
    dialog.appendChild(form);
    return dialog;
}

exports.updatePanel = function(selection, rootNode, panelUI) {
    console.log("In interactionsTest updatePanel");
    /*
    let element = panelUI.querySelector('#buttonTest');
    if (element) {
        console.log("element dispatch testEvent");
        element.dispatchEvent(testEvent);
        //element.dispatchEvent(testClickEvent);
        //element.checked = ! element.checked;
        //element.value = "test";
        //checkBox.click();
    } else {
        console.log("Failed to get element");
    }
    */
    const sg = require("scenegraph");
    /*
    var artboards = [];
    rootNode.children.forEach(node => {
        if (node instanceof sg.Artboard) {
            artboards.push(node);
        }
    });
    */
    const artboards = rootNode.children.filter(node => node instanceof sg.Artboard);

    console.log("Number of artboards: " + artboards.length);

}

function handleEvent(event) {
    const app = require("application");
/*
    event.type // click
    event.currentTarget.id // checkBoxTest
    event.currentTarget.tagName // INPUT
    event.currentTarget.localName // input
    event.currentTarget.name // ""
    event.currentTarget.value // on
    event.currentTarget.type // checkbox
    event.currentTarget.innerHTML // ""
*/
    console.log("event.type: " + event.type);
    console.log("event.key: " + event.key);
    console.log("event.currentTarget.type: " + event.currentTarget.type);
    console.log("event.currentTarget.id: " + event.currentTarget.id);
    console.log("event.currentTarget.tagName: " + event.currentTarget.tagName);
    console.log("event.currentTarget.localName: " + event.currentTarget.localName);
    console.log("event.currentTarget.name: " + event.currentTarget.name);
    console.log("event.currentTarget.value: " + event.currentTarget.value);
    console.log("event.currentTarget.innerHTML: " + event.currentTarget.innerHTML);

    let message = event.type + " " + event.currentTarget.tagName;
    if (event.currentTarget.type) {
        message += " " + event.currentTarget.type;
    } 
    if (event.currentTarget.innerHTML) {
        message += " " + event.currentTarget.innerHTML;
    }
    //message += " for " + event.currentTarget.id;

    if (event.key === "Enter") {
        console.log("preventing default!");
        event.preventDefault();
    }

    + " " + event.currentTarget.tagName + " " + event.currentTarget.type;
    try {
        if (gTestMode) {
            try{
                console.log("Do bad thing");
                createArtboardItem(message);
            } catch (e){
                console.log(e)
            }    
        }

        console.log("Do correct thing");
        app.editDocument({"editLabel":"create artboard item"}, () => {
            createArtboardItem(message);
        });
        
    } catch(err) {
        console.log("ERROR trying to " + message + ": " + err);
    }      
}

function createArtboardItem(msg) {
    console.log("In createArtboardItem: " + msg);
    const { Text, Rectangle, Color, selection } = require("scenegraph");
    const { group } = require("commands");

    var hPadding = 2;
    var vPadding = 2;
  
    var textNode = new Text;
    textNode.text = msg;
    let fillColor = new Color("#DDDDDD");
    let ranges = [];
    ranges.push({"length":50, "fontFamily":"Helvetica", "fontStyle":"Regular", "fontSize":24, "fill":fillColor});
    textNode.styleRanges = ranges;
    var bounds = textNode.boundsInParent;
    selection.insertionParent.addChild(textNode);
    textNode.placeInParentCoordinates(
        {x: 0, y: 0},
        {x: 0 - bounds.x, y: 0 - bounds.y}
    );
    bounds = textNode.boundsInParent;
    console.log(bounds);

    var shape = new Rectangle();
    shape.width = bounds.width + 2 * hPadding
    shape.height = bounds.height + 2 * vPadding;
    shape.stroke = new Color("blue");

    selection.insertionParent.addChild(shape);
    shape.placeInParentCoordinates(
        {x: 0, y: 0},
        {x: 0 - bounds.x - hPadding, y: 0 - bounds.y - vPadding}
    );
  
      const oldSelection = selection.items.map(item => item);
      selection.items = [ textNode, shape ];
      group();
      //const newItem = selection.items[0];
      //newItem.pluginData = { hPadding, vPadding };
      //selection.items = oldSelection;
      //return newItem;

}

async function testRenditions() {
    console.log("In testRenditions");
    const {selection} = require("scenegraph");
    console.log(selection.items);
    console.log(selection.items.length);
    console.log(selection.items[0]);
    console.log(selection.editContext);
    const fs = require("uxp").storage.localFileSystem;
    console.log("get the file to save the rendition");
    var file = await fs.getFileForSaving("sample.png", { types: ["png"], overwrite: true });
    console.log("got the file to save the rendition");

    //const application = require("application");
    
    var renditions = [{
        node: selection.items[0],
        outputFile: file,
        type: application.RenditionType.PNG,
        scale: 2
    }];
    console.log("START", selection.editContext);
    console.log(selection.items);

    return application.createRenditions(renditions).then(results => {
        console.log("END", selection.editContext);
        console.log(selection.items);
    }).catch(error => {
        console.log(error);
    });
}

/*
    container.innerHTML = `
    <div>
      <input type="text" id="opac">
      <label for="opac">Opacity</label>
    </div>
    `;

    parent.appendChild(container);

    document.getElementById("opac").addEventListener("change", function (event) {
        app.editDocument(selection => {
            selection.items[0].opacity = parseFloat(event.target.value);
        });
    });
*/