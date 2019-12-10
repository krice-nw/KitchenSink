
const ec = require("./modules/editContextModule");
const np = require("./nodeProperties");

const {root, Artboard} = require("scenegraph");

let gContext = undefined;
let gSelection = undefined;

exports.createPanel = function() {
    console.log("In elementDetails createPanel");    

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
    #logs {
        height: 500px;
        max-height: 116px;
        overflow-y: scroll;
        resize: none;
    }

    #nodeDetails {
        height: 500px;
        max-height: 116px;
        overflow-y: scroll;
        resize: none;
    }

    </style>
    <div id="not_overlay"></div>
    <h1>Element Details</h1>

    <hr/>
    <div id="elementScopeRadioGroup" class="flex-column border">
        <label class="row">
            <input id="rootRadioButton" class="radio" type="radio"  name="elementScope"/>
            <span>Root Node</span>
        </label>
        <label>
        <input id="rootCheckBox" type="checkbox">Include children</input>
        </label>

        <label class="row">
            <input id="selectionRadioButton" type="radio" class="radio" name="elementScope"/>
            <span>Selection</span>
            
            <label>
            <input id="selectionCheckBox" type="checkbox">Include children</input>
            </label>
            
        </label>
        <label class="row">
            <input id="activeArtboardRadioButton" type="radio" class="radio" name="elementScope"/>
            <span>Active Artboard</span>
        </label>
        <label class="row">
            <input id="pasteboardRadioButton" type="radio" class="radio" name="elementScope"/>
            <span>Pasteboard</span>
        </label>
    </div>

    <hr/>

    <button id="detailButton">Get Details</button>

    <hr/>
<!--
    <textarea id="detailText" rows="10" columns="20"></textarea>

    <div id="logs">
    This is a test
    </div>

    <hr/>
    
    <div id="nodeDetails">
    This is a test
    </div>

    <hr/>


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

    <p></p>

    <button id="create_Renditions">Create Rendtitons</button>
    <hr/>
    <div id="images"></div>
    <hr/>
-->
    <div id="test-area">Test</div>

    <hr/>

    <div id="logs">
    This is a test
    </div>

    <hr/>
    
    <div id="nodeDetails">
    This is a test
    </div>`;

    


/* 
    Appears I only receive the change event if the radio is checked, not when unchecked
    
    // toggle nested radio checkbox elements 
    container.querySelector("#rootRadioButton").addEventListener("change", (event) => {
        console.log("rootRadioButton: " + event.target.checked);
        if (event.target.checked) {
            console.log("Enable checkbox");
            container.querySelector("#rootCheckBox").disabled = false;
        } else {
            console.log("Disable checkbox");
            container.querySelector("#rootCheckBox").disabled = true;
        }
    })
*/

    let radioGroup = container.querySelector("#elementScopeRadioGroup");

    radioGroup.addEventListener("change", (event) => {
        var selectedRadio = event.target;
        console.log("Selected radio button with id: " + selectedRadio.id);
        console.log("event.currentTarget.id: " + event.currentTarget.id);

        if (event.target.type === 'radio') {
            console.log("Radio button selected")
            container.querySelector("#detailButton").disabled = false;
        }

        switch (event.target.id) {
            case "rootRadioButton":
                if (event.target.checked) {
                    console.log("Enable checkbox");
                    container.querySelector("#rootCheckBox").disabled = false;
                    container.querySelector("#selectionCheckBox").disabled = true;
                } else {
                    console.log("Disable checkbox");
                    container.querySelector("#rootCheckBox").disabled = true;
                }        
                break;
            case "selectionRadioButton":
                if (event.target.checked) {
                    console.log("Enable checkbox");
                    container.querySelector("#selectionCheckBox").disabled = false;
                    container.querySelector("#rootCheckBox").disabled = true;
                } else {
                    console.log("Disable checkbox");
                    container.querySelector("#selectionCheckBox").disabled = true;
                }   
                break;
            case "activeArtboardRadioButton":
            case "pasteboardRadioButton":
                console.log("Disable checkboxes");
                container.querySelector("#rootCheckBox").disabled = true;
                container.querySelector("#selectionCheckBox").disabled = true;
                break;
        }
    })
    /*
    radioGroup.querySelectorAll("input.radio").forEach((element) => {
        element.addEventListener("change", (event) => {
            console.log("In change for input.radio");
            if (event.target.id === "rootRadioButton") {
                if (event.target.checked) {
                    console.log("Enable checkbox");
                    container.querySelector("#rootCheckBox").disabled = false;
                    container.querySelector("#selectionCheckBox").disabled = true;
                } else {
                    console.log("Disable checkbox");
                    container.querySelector("#rootCheckBox").disabled = true;
                }        
            } else if (event.target.id === "selectionRadioButton") {
                if (event.target.checked) {
                    console.log("Enable checkbox");
                    container.querySelector("#selectionCheckBox").disabled = false;
                    container.querySelector("#rootCheckBox").disabled = true;
                } else {
                    console.log("Disable checkbox");
                    container.querySelector("#selectionCheckBox").disabled = true;
                }        
            } else {
                console.log("Disable checkboxes");
                container.querySelector("#rootCheckBox").disabled = true;
                container.querySelector("#selectionCheckBox").disabled = true;
            }
            // chnage only appears to be called on checking (not unchecking)
            // so ensure the button is enabled
            container.querySelector("#detailButton").disabled = false;

        })
    })
    */
   
    container.querySelector("#detailButton").addEventListener("click", getElementDetails);

    /*
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

    container.querySelector('#create_Renditions').addEventListener("click", createNodeRenditions);
    */
    /*
    container.querySelector('#create_Renditions').addEventListener("click", function(event) {
        const {selection} = require("scenegraph");
        if (selection.items.length > 0) {
            console.log("Get Node Renditions");
            let nodes = [selection.items[0]];
            createNodeRenditions(nodes).then(console.log("Finished"));
    
        }
    });
    */

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
    console.log("In elementDetails updatePanel");

    // remove the test area nodes
    // really just need to do this if the selection changes (or maybe edit context change)
    // as i utileze the selection - need to base oin that chnaging
    //if (selection.editContext != gContext) {
        /*
    let updateEditNodes = false;
    selection.items.forEach(sel => {
        gSelection.forEach(prevSel => {
            if (sel != prevSel) {
                console.log("Found a selection difference");
                updateEditNodes = true;
            }
        })
    })
    if(updateEditNodes) {
        console.log("Update edit nodes");
    } else {
        console.log("Selection unchanged");
    }
        */
    if (selection.items != gSelection) {
        console.log("Selection changed - update the test area");
        gContext = selection.editContext;
        gSelection = selection.items;
        let testItems = document.getElementById("test-area");
        while (testItems.firstChild) {
            testItems.removeChild(testItems.firstChild);
        }

        populateNodeEditArea(selection);
    }
return;
    let selectionRadio = document.getElementById("selectionRadioButton");
    // if we have a selection enable selection radio 
    // if no other radio checked - check selection
    if (selection.items.length > 0) {
        console.log("Set selection radio disabled to false");
        selectionRadio.disabled = false;
        //selectionRadio.setAttribute("disabled", false);
        if (! radioGroupHasSelection()) {
            console.log("Set selection radio checked to true");
            //selectionRadio.setAttribute("checked", true);
            selectionRadio.checked = true;
        }
        // as a radio is selected enable the button
        document.getElementById("detailButton").disabled = false;
    } else {
        // if no selection and selection radio checked - uncheck it
        // then disable it
        if (selectionRadio.checked) {
            console.log("Set selection radio checked to false");
            //selectionRadio.setAttribute("checked", false);
            selectionRadio.checked = false;
        }
        console.log("Set selection radio disabled to true");
        selectionRadio.disabled = true;
        //selectionRadio.setAttribute("disabled", true);

        if (radioGroupHasSelection()) {
            // as a radio is selected enable the button
            document.getElementById("detailButton").disabled = false;
        } else {
            // as a radio is not selected disable the button
            document.getElementById("detailButton").disabled = true;
        }
    }


    function radioGroupHasSelection(){
        console.log("In radioGroupHasSelection");
        let hasSelection = false;
        // iterate over the radio input items 
        document.getElementsByClassName("radio").forEach((radioInput) => {
            if (radioInput.checked) {
                hasSelection = true;
            }
        })
        return hasSelection;
    }
}

function getElementDetails() {
    console.log("In getElementDetails");

    let radioGroup = document.getElementById("elementScopeRadioGroup");
    radioGroup.querySelectorAll("input.radio").forEach((input) => {
        if (input.checked) {
            console.log(input.id + " is checked");
            if (input.id === 'rootRadioButton') {
                getDetails(input.id, document.getElementById("rootCheckBox").checked);
            } else if (input.id === 'selectionRadioButton') {
                getDetails(input.id, document.getElementById("selectionCheckBox").checked);
            } else {
                getDetails(input.id);
            }
        }
    });
}

function getDetails(requestedElement, includeChildren = false) {
    console.log("In getDetails: " + requestedElement + ", include childre: " + includeChildren);

    
   
    const app = require("application");
app.editDocument({"editLabel":"Add Polygon"}, () => {

    const {Polygon, Color, selection} = require("scenegraph");
    //let selecion = require("scenegraph").selection;

    var polygon = new Polygon();
    polygon.cornerCount = 5;
    polygon.starRatio = 55;
    polygon.setAllCornerRadii(15);
    polygon.width = 100;
    polygon.height = 100;
    polygon.fill = new Color("red");

    selection.insertionParent.addChild(polygon);
    selection.items = [polygon];
});
    
var details;
    switch (requestedElement) {
        case "rootRadioButton":
            console.log("getDeatils for the root element");
            break;
        case "selectionRadioButton":
            console.log("getDeatils for the selection");
            details = getSelectedNodeDetails(includeChildren);
            break;
        case "activeArtboardRadioButton":
            console.log("getDeatils for the active artboard");
            details = require("interactions").allInteractions;
            break;
        case "pasteboardRadioButton":
            console.log("getDeatils for the pasteboard");
            break;
        default:
            console.log("getDeatils for unknown requested element: " + requestedElement);
    }
    // add deatils to the panel
    document.getElementById("logs").innerHTML = JSON.stringify(details);
    console.log(JSON.stringify(details));

    const sg = require("scenegraph");
    const selection =sg.selection;
    let nodeObject = serializeNode(selection.items[0], includeChildren);
    console.log("Serialized node (include childre: " + includeChildren + "): " + JSON.stringify(nodeObject));
    document.getElementById('nodeDetails').innerHTML = JSON.stringify(nodeObject);
/*
    // see about add the node deatils into a set of UI feilds to edit the content?
    const {Rectangle, Ellipse, Polygon, Line, Text, Group, SymbolInstance, RepeatGrid, Artboard} = require("scenegraph");
    selection.items.forEach((node) => {
        let nodeType = undefined;
        if (node instanceof Polygon) {
            nodeType = "Polygon";
            let nodeEditDiv = document.createElement("div");
            let nodeEditLable = document.createElement("span");
            nodeEditLable.innerHTML = nodeType;
            nodeEditDiv.appendChild(nodeEditLable);

            nodeEditDiv.appendChild(createRow("Width:", node.width));
            nodeEditDiv.appendChild(createRow("Height:", node.height));
            nodeEditDiv.appendChild(createRow("Corners:", node.cornerCount));
            nodeEditDiv.appendChild(createRow("Radii:", node.cornerRadii[0]));
            nodeEditDiv.appendChild(createRow("Ratio:", node.starRatio));

            let updateNodeButton = document.createElement("button");
            updateNodeButton.setAttribute("id", "updateNodeButton");
            updateNodeButton.innerHTML = "Update";
            updateNodeButton.disabled = true;
            updateNodeButton.addEventListener("click", (e) => {
                console.log("Update the node");

                const app = require("application");
                app.editDocument({"editLabel":"Update " + nodeType}, () => {
                    node.width = parseFloat(document.getElementById("Width:").value);
                    node.height = parseFloat(document.getElementById("Height:").value);
                    node.cornerCount = parseFloat(document.getElementById("Corners:").value);
                    node.setAllCornerRadii(parseFloat(document.getElementById("Radii:").value));
                    node.starRatio = parseFloat(document.getElementById("Ratio:").value);
                });
        
                e.target.disabled = true;   // still acts as active once after the click
            });
            nodeEditDiv.appendChild(updateNodeButton);

            nodeEditDiv.addEventListener("change", (e) => {
                console.log("something changed - see if we should enable update");
                if ((document.getElementById("Width:").value != node.width) ||
                    (document.getElementById("Height:").value != node.height) ||
                    (document.getElementById("Corners:").value != node.cornerCount) ||
                    (document.getElementById("Radii:").value != node.cornerRadii[0]) ||
                    (document.getElementById("Ratio:").value != node.starRatio)) {
                        console.log("Enable the button");
                        document.getElementById("updateNodeButton").disabled = false;
                } else {
                    console.log("Disable the button");
                    document.getElementById("updateNodeButton").disabled = true;
                }   
            });

            document.getElementById("test-area").appendChild(nodeEditDiv);
        }
    });

    function createRow(label, value) {
        // <label><span>Height:</span><input type="text" /></label>
        let row = document.createElement("label");
        row.setAttribute("class", "row");
        let rowLabel = document.createElement("span");
        rowLabel.innerHTML = label;
        row.appendChild(rowLabel);
        let input = document.createElement("input");
        input.setAttribute("type", "text");
        input.id = label;
        input.value = value;
        row.appendChild(input);

        console.log(input.id);
        return row;
    }
*/
}


function populateNodeEditArea(selection) {
    console.log("In populateNodeEditArea");

    const {GraphicNode} = require("scenegraph");

    // see about add the node deatils into a set of UI feilds to edit the content?
    let firstNodeType = undefined;
    selection.items.forEach((node) => {
        let nodeType = getNodeType(node);
        if (nodeType === "artboard") {
            console.log("Artborad selections not supported");
            return;
        }
        if (! firstNodeType) {
            firstNodeType = nodeType;
        }

        if (nodeType === firstNodeType) {
            console.log("Same node type: " + firstNodeType);
        } else {
            console.log("Node type: " + nodeType + ", does not match: " + firstNodeType);
        }

        let nodeEditDiv = document.createElement("div");
        let nodeEditLable = document.createElement("span");
        nodeEditLable.innerHTML = nodeType;
        nodeEditDiv.appendChild(nodeEditLable);

        nodeEditDiv.appendChild(createRow("Width:", node.width));
        nodeEditDiv.appendChild(createRow("Height:", node.height));
        // fill
        nodeEditDiv.appendChild(createRow("Fill", node.fillEnabled, "checkbox"));
        // stroke
        let strokePositionOptions = [GraphicNode.INNER_STROKE, GraphicNode.OUTER_STROKE, GraphicNode.CENTER_STROKE];
        let strokeEndCapsOptions = [GraphicNode.STROKE_CAP_NONE, GraphicNode.STROKE_CAP_SQUARE, GraphicNode.STROKE_CAP_ROUND];
        let strokeJoinsOptions = [GraphicNode.STROKE_JOIN_BEVEL, GraphicNode.STROKE_JOIN_ROUND, GraphicNode.STROKE_JOIN_MITER];

        nodeEditDiv.appendChild(createRow("Stroke", node.strokeEnabled, "checkbox"));
        nodeEditDiv.appendChild(createRow("Stroke Width", node.strokeWidth));  
        nodeEditDiv.appendChild(createRadioGroup("Stroke Position", node.strokePosition, strokePositionOptions));
        nodeEditDiv.appendChild(createRadioGroup("Stroke End Caps", node.strokeEndCaps, strokeEndCapsOptions));
        nodeEditDiv.appendChild(createRadioGroup("Stroke Joins", node.strokeJoins, strokeJoinsOptions));  

//        nodeEditDiv.appendChild(createRow("Stroke miter limit", node.strokeMiterLimit));
/*
        let strokeDashArray = node.strokeDashArray;
        let dash = strokeDashArray.length > 0 ? strokeDashArray[0] : 0;
        nodeEditDiv.appendChild(createRow("Dash", dash));
        let gap = strokeDashArray.length > 1 ? strokeDashArray[1] : 0;
        nodeEditDiv.appendChild(createRow("Gap", gap));
        nodeEditDiv.appendChild(createRow("Stroke dash offset", node.strokeDashOffset));
*/

        if (nodeType === "polygon") {
            nodeEditDiv.appendChild(createRow("Corners:", node.cornerCount));
            nodeEditDiv.appendChild(createRow("Radii:", node.cornerRadii[0]));
            nodeEditDiv.appendChild(createRow("Ratio:", node.starRatio));
        }

        let updateNodeButton = document.createElement("button");
        updateNodeButton.setAttribute("id", "updateNodeButton");
        updateNodeButton.innerHTML = "Update";
        updateNodeButton.disabled = true;
        updateNodeButton.addEventListener("click", (e) => {
            console.log("Update the node");

            const app = require("application");
            app.editDocument({"editLabel":"Update " + nodeType}, () => {
                node.width = parseFloat(document.getElementById("Width:").value);
                node.height = parseFloat(document.getElementById("Height:").value);
                node.fillEnabled = document.getElementById("Fill").checked;
                node.strokeEnabled = document.getElementById("Stroke").checked;

                node.strokeWidth = parseFloat(document.getElementById("Stroke Width").value);

                let positionRadioGroup = document.getElementById("Stroke Position");
                strokePositionOptions.forEach(option => {
                    //let control = document.getElementById(positionOption)
                    let control = positionRadioGroup.querySelector("#" + option);
                    console.log("Control: " + control);
                    if (control.checked) {
                        console.log("Set strokePosition: " + option)
                        node.strokePosition = option;
                    }
                });

                let endCapsRadioGroup = document.getElementById("Stroke End Caps");
                strokeEndCapsOptions.forEach(option => {
                    //let control = document.getElementById(option)
                    let control = endCapsRadioGroup.querySelector("#" + option);
                    if (control.checked) {
                        console.log("Set strokeEndCapsOptions: " + option)
                        node.strokeEndCaps = option;
                    }
                });

                let joinsRadioGroup = document.getElementById("Stroke Joins");
                strokeJoinsOptions.forEach(option => {
                    //let control = document.getElementById(option);
                    let control = joinsRadioGroup.querySelector("#" + option);
                    if (control.checked) {
                        console.log("Set strokeJoinsOptions: " + option);
                        node.strokeJoins = option;
                    }
                });

            /*    
                node.strokeMiterLimit = parseFloat(document.getElementById("Stroke miter limit").value);

                let strokeDashArray = [];
                strokeDashArray.push(parseFloat(document.getElementById("Dash").value));
                strokeDashArray.push(parseFloat(document.getElementById("Gap").value));
                node.strokeDashArray = strokeDashArray;
                
                node.strokeDashOffset = parseFloat(document.getElementById("Stroke dash offset").value);
            */

                if (nodeType === "polygon") {
                    node.cornerCount = parseFloat(document.getElementById("Corners:").value);
                    node.setAllCornerRadii(parseFloat(document.getElementById("Radii:").value));
                    node.starRatio = parseFloat(document.getElementById("Ratio:").value);
                }
            });
            e.target.disabled = true;   // still acts as active once after the click
        });
        nodeEditDiv.appendChild(updateNodeButton);

        nodeEditDiv.addEventListener("change", (e) => {
            console.log("something changed - see if we should enable update");
/*
            let test = document.getElementById("Stroke Joins").value;
                console.log("Stroke Joins: " + test);
*/
            let disableButton = true;
            if ((parseFloat(document.getElementById("Width:").value) != node.width) || (parseFloat(document.getElementById("Height:").value) != node.height)) {
                disableButton = false;
            }

            if (node.fillEnabled != document.getElementById("Fill").checked) {
                disableButton = false;
            }
            if (node.strokeEnabled != document.getElementById("Stroke").checked) {
                disableButton = false;
            }

            if (parseFloat(document.getElementById("Stroke Width").value) != node.strokeWidth) {
                disableButton = false;
            }

            if (disableButton) {
                let positionRadioGroup = document.getElementById("Stroke Position");
                strokePositionOptions.forEach(option => {
                    //let control = document.getElementById(positionOption)
                    let control = positionRadioGroup.querySelector("#" + option);
                    console.log("Control: " + control);
                    if (control.checked) {
                        if (node.strokePosition != option) {
                            disableButton = false;
                        }
                    }
                });

                let endCapsRadioGroup = document.getElementById("Stroke End Caps");
                strokeEndCapsOptions.forEach(option => {
                    //let control = document.getElementById(option)
                    let control = endCapsRadioGroup.querySelector("#" + option);
                    if (control.checked) {
                        if (node.strokeEndCaps != option) {
                            disableButton = false;
                        }
                    }
                });

                let joinsRadioGroup = document.getElementById("Stroke Joins");
                strokeJoinsOptions.forEach(option => {
                    //let control = document.getElementById(option)
                    let control = joinsRadioGroup.querySelector("#" + option);
                    if (control.checked) {
                        if (node.strokeJoins != option) {
                            disableButton = false;
                        }
                    }
                });

/*
                let strokeDashArray = node.strokeDashArray;
                //let hasDashArray = false;
                if (parseFloat(document.getElementById("Dash").value) != strokeDashArray[0]) {
                    disableButton = false;
                }
                if (parseFloat(document.getElementById("Gap").value) != strokeDashArray[1]) {
                    disableButton = false;
                }
                if (parseFloat(document.getElementById("Stroke dash offset").value) != node.strokeDashOffset) {
                    disableButton = false;
                }
*/                
            }

            if (nodeType === "polygon") {
                if ((document.getElementById("Corners:").value != node.cornerCount) ||
                    (document.getElementById("Radii:").value != node.cornerRadii[0]) ||
                    (document.getElementById("Ratio:").value != node.starRatio)) {
                        disableButton = false;
                }
            }
            console.log("Disable button: " + disableButton);
            document.getElementById("updateNodeButton").disabled = disableButton; 
        });

        document.getElementById("test-area").appendChild(nodeEditDiv);
    });

    function getNodeType(node) {
        const {Rectangle, Ellipse, Polygon, Line, Text, Group, SymbolInstance, RepeatGrid, Artboard} = require("scenegraph");
        if (node instanceof Rectangle) {
            return "rectangle";
        }else if (node instanceof Ellipse) {
            return "ellipse";
        }else if (node instanceof Polygon) {
            return "polygon";
        }else if (node instanceof Line) {
            return "line";
        }else if (node instanceof Text) {
            return "text";
        }else if (node instanceof Group) {
            return "group";
        }else if (node instanceof SymbolInstance) {
            return "symbol";
        }else if (node instanceof RepeatGrid) {
            return "repeatgrid";
        } else if (node instanceof Artboard) {
            return "artboard";
        } else {
            return "unknown";
        }
    }

    function createRow(label, value, controlType = "text") {
        // <label><span>Height:</span><input type="text" /></label>
        let row = document.createElement("label");
        row.setAttribute("class", "row");
        let rowLabel = document.createElement("span");
        rowLabel.innerHTML = label;
        row.appendChild(rowLabel);
        let input = document.createElement("input");
        input.setAttribute("type", controlType);
        input.id = label;
        if (controlType === "checkbox") {
            input.checked = value;
        } else {
            input.value = value;
        }
        row.appendChild(input);

        console.log(input.id);
        return row;
    }

    function createRadioGroup(label, value, options) {
        let radioGroup = document.createElement("div");
        radioGroup.id = label;
        radioGroup.setAttribute("class", "flex-column border");
        let groupLabel = document.createElement("span");
        groupLabel.innerHTML = label;
        radioGroup.appendChild(groupLabel);

        options.forEach(option => {
            let row = document.createElement("label");
            row.setAttribute("class", "row");

            let input = document.createElement("input");
            input.setAttribute("type", "radio");
            input.name = label;
            input.id = option;
            input.value = option;
            if (value === option) {
                input.checked = true;
            }
            row.appendChild(input);

            let rowLabel = document.createElement("span");
            rowLabel.innerHTML = option;
            row.appendChild(rowLabel);
    
            radioGroup.appendChild(row);
        });

        return radioGroup;
    }
}

function getSelectedNodeDetails(includeChildren) {
    console.log("In getSelectedNodeDetails - include children: " + includeChildren);

    const {selection} = require("scenegraph");
    let detailsArray = [];
    selection.items.forEach((item) => {
        detailsArray.push(getNodeInfo(item, includeChildren));
    });
    return detailsArray;
}

function getNodeInfo(node, getChildren) {
    console.log("In getNodeInfo");

    function nodeType(node) {
        const {Rectangle, Ellipse, Polygon, Line, Text, Group, SymbolInstance, RepeatGrid, Artboard} = require("scenegraph");
        if (node instanceof Rectangle) {
            return "rectangle";
        }else if (node instanceof Ellipse) {
            return "ellipse";
        }else if (node instanceof Polygon) {
            return "polygon";
        }else if (node instanceof Line) {
            return "line";
        }else if (node instanceof Text) {
            return "text";
        }else if (node instanceof Group) {
            return "group";
        }else if (node instanceof SymbolInstance) {
            return "symbol";
        }else if (node instanceof RepeatGrid) {
            return "repeatgrid";
        } else if (node instanceof Artboard) {
            return "artboartd";
        } else {
            return "unknown";
        }
    }

    let detailsObj = {};

//    detailsObj.guid = node.guid;
    detailsObj.type = nodeType(node);
//    detailsObj.detailsStr = JSON.stringify(node);
//    console.log("Node string: " + detailsObj.detailsStr);

    // first get the node details
    detailsObj.name = node.name;
    detailsObj.guid = node.guid;
    detailsObj.hasDefaultName = node.hasDefaultName;
    detailsObj.isContainer = node.isContainer;
    detailsObj.isInArtworkTree = node.isInArtworkTree;
    detailsObj.selected = node.selected;
    detailsObj.visible = node.visible;
    detailsObj.locked = node.locked;
    detailsObj.markedForExport = node.markedForExport;
    detailsObj.fixedWhenScrolling = node.fixedWhenScrolling;
    detailsObj.hasLinkedContent = node.hasLinkedContent;
    // get interactions
    detailsObj.triggeredInteractions = node.triggeredInteractions;
    //

    // get specific type data
    if (detailsObj.type === "polygon") {
        console.log("Get polygon details");
        detailsObj.cornerCount = node.cornerCount;
        detailsObj.cornerRadii = node.cornerRadii;
        detailsObj.starRatio = node.starRatio;
        detailsObj.width = node.width;
        detailsObj.height = node.height;
    }

    //const fs = require("uxp").storage.localFileSystem;
    //const {Entry} = require("uxp").storage.localFileSystem;
    const ImageFill = require("scenegraph").ImageFill;
    if (node.fillEnabled && node.fill instanceof ImageFill){
        console.log("We have an imageFill");
        // woufl be great if we could get the UXP Entry from this ....
        // let uxpImageFile = new fs.Entry(node.fill);
        console.log(node.fill);
    } else {
        console.log("No imageFill");
    }

    //const LinearGradientFill = require("LinearGradientFill");
    const LinearGradientFill = require("scenegraph").LinearGradient;
    if (node.fillEnabled && node.fill instanceof LinearGradientFill){
        console.log("We have a LinearGradientFill");
        console.log(JSON.stringify(node.fill));
    } else {
        console.log("No LinearGradientFill");
    }

    //const RadialGradientFill = require("RadialGradientFill");
    const RadialGradientFill = require("scenegraph").RadialGradient;
    if (node.fillEnabled && node.fill instanceof RadialGradientFill){
        console.log("We have a RadialGradientFill");
        console.log(JSON.stringify(node.fill));
    } else {
        console.log("No RadialGradientFill");
    }

    if (detailsObj.type === "symbol") {
        console.log("we have a symbol");

        if (nodeType(node.parent) === "symbol") {
            console.log("Has parent");
            console.log("Parent interactions: " + JSON.stringify(node.parent.triggeredInteractions));
        }

        console.log("Symbol interactions: " + JSON.stringify(node.triggeredInteractions));

        let states = node.states;
        let statesInfo = node.statesInfo;

        console.log("States: " + states);
        //console.log("States: " + JSON.stringify(states));
        console.log("States length: " + node.states.lesngth);

        node.states.forEach(state => {
            console.log("State: " + state);
            console.log("StatesId: " + state.stateId);
            if (state.children.length) {
                state.children.forEach(child => {
                    console.log("State Child: " + child);
                    console.log("State Child interactions: " + JSON.stringify(child.triggeredInteractions));
                });
            };
            //detailsObj.triggeredInteractions = node.triggeredInteractions
            console.log("State interactions: " + JSON.stringify(state.triggeredInteractions));
        });

        console.log("States Info: " + JSON.stringify(statesInfo));
        //detailsObj.states = states;
        //detailsObj.statesInfo = statesInfo;
/*
        console.log("Get Node Renditions");
        let nodeArray = [];
        nodeArray.push(node);
        createNodeRenditions(nodeArray);
        //const renditionsFiles = await createNodeRenditions(nodeArray);
        //await displayRenditions(renditionsFiles);
*/
    }

    // now add any children if present and instructed
    if (getChildren && node.children.length) {
        console.log("Get Node Children");
        let children = [];
        node.children.forEach((child) => {
            children.push(getNodeInfo(child, getChildren));
        })
        detailsObj.children = children;
    }
    return detailsObj;
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
        try{
            console.log("Do bad thing");
            createArtboardItem(message);
        } catch (e){
            console.log(e)
        }

        console.log("Do correct thing");
        app.editDocument({"editLabel":"create artboard item"}, () => {
            createArtboardItem(message);
        });
        
    } catch(err) {
        console.log("ERROR trying to " + message + ": " + err);
    }      
}

function serializeNode(node, includeChildren) {
    console.log("In serializeNode");

    // iterate over the node properties and log any differences
    let nodeProperties = JSON.parse(np.getNodeProperties());

    let nodeData = iterateOverProperties(nodeProperties.properties, node);
    if (includeChildren && node.children.length) {
        console.log("IncludeChildren");
        let children = [];
        node.children.forEach(child => children.push(serializeNode(child, includeChildren)));
        nodeData.children = children;
    }

    function iterateOverProperties(properties, node) {
        let data = {};
        data.type = nodeType(node);
        //properties.keys.forEach(property => {
        for (var property in properties) {
            if (isObject(properties[property])) {
                //console.log("Serialize object: " + property);
                if (node) {
                    //console.log(node[property]);
                    data[property] = iterateOverProperties(properties[property], node[property]);
                }
            } else {
                if (node) {
                    data[property] = node[property];
                }
            }
        };
        console.log("data: " + data);
        return data;
    }
/*
    function isObject(value) {
        return value && typeof value === 'object' && value.constructor === Object;
    }
*/
    function nodeType(node) {
        const {Rectangle, Ellipse, Polygon, Line, Text, Group, SymbolInstance, RepeatGrid, Artboard} = require("scenegraph");
        if (node instanceof Rectangle) {
            return "rectangle";
        }else if (node instanceof Ellipse) {
            return "ellipse";
        }else if (node instanceof Polygon) {
            return "polygon";
        }else if (node instanceof Line) {
            return "line";
        }else if (node instanceof Text) {
            return "text";
        }else if (node instanceof Group) {
            return "group";
        }else if (node instanceof SymbolInstance) {
            return "symbol";
        }else if (node instanceof RepeatGrid) {
            return "repeatgrid";
        } else if (node instanceof Artboard) {
            return "artboartd";
        } else {
            return "unknown";
        }
    }

    console.log("nodeData: " + nodeData);
    console.log(JSON.stringify(nodeData));
    return nodeData;
}

function isObject(value) {
    //return value && typeof value === 'object' && value.constructor === Object;
    return typeof value === 'object';
}


/*
    Create renditions for the array of nodes
    These will be saved png files in a temp directory
    return an array of renditon image files
*/
async function createNodeRenditions(nodes) {
    console.log("In createNodeRenditions");
    let images = document.querySelector("#images");

    console.log("Have images element: " + images);

    while (images.firstChild) {
        images.removeChild(images.firstChild);
    }

    console.log("Cleared images element: " + images);

    if (renditionTimer) {
        //console.log("clear renditionTimer");
        clearTimeout(renditionTimer);
        renditionTimer = null;
    }
    renditionTimer = setTimeout(
        async () => {
            try {
                //console.log("In setTimeout");
                //const renditionsFiles = await createRenditionsFromArray(nodes);
                //await displayRenditions(renditionsFiles, images);
               
                const artboards = root.children.filter(node => node instanceof Artboard);
                const renditionsFiles = await createRenditionsFromArray(artboards);
                renditionsFiles.forEach(async renditionFile => {
                    const arrayBuffer = await renditionFile.read({ format: fs.formats.binary });
                    let image = document.createElement("img");
                    let base64 = base64ArrayBuffer(arrayBuffer);
                    image.setAttribute("src", `data:image/png;base64,${base64}`);
                    //image.ondragstart= "drag(event)";
                    //image.ondragstart = function(){console.log("Drag start")};
                    image.setAttribute("draggable", true);
                    image.addEventListener("Drag start", function(event){
                        console.log("Drag start");
                    });
                    images.appendChild(image);
                })    
              
        } catch (e) {
                console.log("Error: " + e)
            }
        }, 100
    );
    console.log("Exiting createNodeRenditions");
}

// get renditions for each item in the array
async function createRenditionsFromArray(nodeArray) {
    console.log("In createRenditionsFromArray");
    const folder = await fs.localFileSystem.getTemporaryFolder();
    const arr = await nodeArray.map(async item => {
        console.log("Test: " + item.guid);
        const file = await folder.createFile(`${item.guid}.png`, { overwrite: true });
        console.log("file: " + file.nativePath);
        let obj = {};
        obj.node = item;
        obj.outputFile = file;
        obj.type = "png";
        obj.scale = 2;
        return obj;
    })

    const renditions = await Promise.all(arr);
    const renditionResults = await application.createRenditions(renditions);
    const renditionsFiles = renditionResults.map(a => a.outputFile);
    return renditionsFiles;
}

async function displayRenditions(renditionsFiles, images){
    console.log("In displayRenditions");
    renditionsFiles.forEach(async renditionFile => {
        const arrayBuffer = await renditionFile.read({ format: fs.formats.binary });
        let image = document.createElement("img");
        let base64 = base64ArrayBuffer(arrayBuffer);
        image.setAttribute("src", `data:image/png;base64,${base64}`);
        images.appendChild(image);
    })    
}
 

function base64ArrayBuffer(arrayBuffer) {
    let base64 = ''
    const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

    const bytes = new Uint8Array(arrayBuffer)
    const byteLength = bytes.byteLength
    const byteRemainder = byteLength % 3
    const mainLength = byteLength - byteRemainder

    let a, b, c, d
    let chunk

    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
        // Combine the three bytes into a single integer
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

        // Use bitmasks to extract 6-bit segments from the triplet
        a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
        b = (chunk & 258048) >> 12 // 258048   = (2^6 - 1) << 12
        c = (chunk & 4032) >> 6 // 4032     = (2^6 - 1) << 6
        d = chunk & 63               // 63       = 2^6 - 1

        // Convert the raw binary segments to the appropriate ASCII encoding
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
        chunk = bytes[mainLength]

        a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

        // Set the 4 least significant bits to zero
        b = (chunk & 3) << 4 // 3   = 2^2 - 1

        base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

        a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
        b = (chunk & 1008) >> 4 // 1008  = (2^6 - 1) << 4

        // Set the 2 least significant bits to zero
        c = (chunk & 15) << 2 // 15    = 2^4 - 1

        base64 += encodings[a] + encodings[b] + encodings[c] + '='
    }

    return base64
}
