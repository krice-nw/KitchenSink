console.log("Selection Test Plugin loaded");

const interactionsTest = require("./interactionsTest");
const changeTracker = require("./changeTracker");
const showSelectionRendition = require("./showSelectionRendition");
const elementDetails = require("./elementDetails");
const previewInteractions =require("./previewInteractions");

const sg = require("scenegraph");
const cmd = require("commands");
const app = require("application");

var selection = sg.selection;
var canvas = sg.root;

var gEditContextNode = undefined;

let gPreviousSelection = undefined;

//import { editChildren } from 'modules/editContextModule'; 
const ec = require("./modules/editContextModule");
const np = require("./nodeProperties");

const fileUtils = require("./modules/fileUtils");

//let val = hello();  // val is "Hello";

console.log("Call fileUtils.removePluginDataContent()");
fileUtils.removePluginDataContent();
console.log("Past fileUtils.removePluginDataContent()");

async function createDialog() {
    console.log("In createDialog");

    // log what is in the doc
    ec.logAllChildNodes(canvas);

    var editContext = selection.editContext;
    console.log("Edit context: " + editContext.name);
    console.log(editContext);
    gEditContextNode = editContext;

    return showOurDialog(selection).then(results => {
        console.log("ourDialog dismissed");
        console.log(results);

        //var savedSelection = selection.items;

        if (results.proceed) {
            // as the input checkboxes will invoke the XD action comment out results actions

            if (results.edit_selection) {
                ec.editSelectedNodes(selection, editNode);
                //testSymbolOverride(selection)
            }

            if (results.edit_parents) {
                selection.items.forEach(function(node) {
                    ec.editParents(node, editNode);
                });
            }

            if (results.edit_children) {
                console.log("iterate over selected items");
                selection.items.forEach(function(node) {
                    console.log("Call editChildren");
                    ec.editChildren(node, editNode);
                });
            }

            if (results.edit_editContext) {
                console.log("iterate over edit context items");
                ec.editChildren(selection.editContext, editNode);
            }

            if (results.select_parents) {
                savedSelection.forEach(function(node) {
                    ec.selectParents(node, selection);
                });
            }


            if (results.select_children) {
                savedSelection.forEach(function(node) {
                    console.log("Call selectChildren with node " + node.name);
                    ec.selectChildren(node, selection);
                });
            }

            //selection.items = savedSelection;

            if (results.delete_selection) {
                savedSelection.forEach(function(node) {
                    console.log("delete selected node " + node.name);
                    node.removeFromParent();
                });
            }

            if (results.delete_children) {
                savedSelection.forEach(function(node) {
                    if (node.children.length) {
                        console.log("delete childeen of selected node " + node.name);
                        try {
                            node.children.forEach(function(childNode) {                    
                                childNode.removeFromParent();
                            });
                        } catch(err) {
                            console.log("Couldn't delete the children: " + err)
                        }
                    }
                });
            }

        }

        if (selection.editContext != gEditContextNode) {
            console.log("Edit context node has changed to: " + selection.editContext.name);
        } else {
            console.log("Edit context has not changed");
        }

    });
}

let ourDialog;
function showOurDialog() {
//    return new Promise((resolveCallback, rejectCallback) => {
    if (ourDialog) {
        console.log("returning ourDialog early");
        return ourDialog.showModal();
    }
    ourDialog = document.createElement("dialog");
    ourDialog.innerHTML = `
<style>
    form {
        width: 360px;
    }
    .h1 {
        align-items: center;
        justify-content: space-between;
        display: flex;
        flex-direction: row;
    }
    .icon {
        border-radius: 4px;
        width: 24px;
        height: 24px;
        overflow: hidden;
    }
    #logs {
        height: 500px;
        max-height: 116px;
        overflow-y: scroll;
        resize: none;
    }
</style>
<form method="dialog">
    <h1 id="salutation">Change Me</h1>
    <h1 class="h1">
        <span>Edit Context Tests</span>
        <img class="icon" src="./assets/icon.png" />
    </h1>
    <hr />
    <p>Please select the tests you would like executed.</p>

        <div id="select">
        <span class="xd-heading">SELECTION</span>
        <p class="small"></p>

        <span class="xd-heading">Select</span>

        <div id='select_children_div' class="flex start pad">
            <input id='select_children' type="checkbox" />
            <span class="pad-left">Select all children of each selected item</span>
        </div>

        <div id='select_edit_context_div' class="flex start pad">
            <input id='select_edit_context' type="checkbox" />
            <span class="pad-left">Select all itmes in the edit context</span>
        </div>


        <span class="xd-heading">Edit</span>

        <div id='edit_selection_div' class="flex start pad">
        <input id='edit_selection' type="checkbox" />
        <span class="pad-left">Edit all selected items</span>
        </div>

        <div id='edit_children_div' class="flex start pad">
        <input id='edit_children' type="checkbox" />
        <span class="pad-left">Edit all children of each selected item</span>
        </div>

        <div class="flex start pad">
        <input id='edit_editContext' type="checkbox" />
        <span class="pad-left">Edit all itmes in the edit context</span>
        </div>


        <span class="xd-heading">DELETE</span>

        <div id='delete_selection_div' class="flex start pad">
        <input id='delete_selection' type="checkbox" />
        <span class="pad-left" >Delete all selected items</span>
        </div>

        <div id='delete_children_div' class="flex start pad">
        <input id='delete_children' type="checkbox" />
        <span class="pad-left" >Delete children of selected items</span>
        </div>

    </div>

    <p />
    <hr />
    <p />
    
    <label class="row">
        <span>Password:</span>
        <input id="pw" type="password"/>
    </label

    <span class="xd-heading">EDIT CONTEXT ITEMS</span>

    <div id="logs">
    This is a test
    </div>

    <footer>
        <button id="cancel" uxp-variant="primary">Cancel</button>
        <button id="ok" type="submit" uxp-variant="cta">Create</button>
    </footer>
</form>
        `;

    document.body.appendChild(ourDialog);

    let salutation = "Say hello";
    
    switch (app.appLanguage) {
        case 'en':
            salutation = "Good Day";
            break;
        case 'de':
            salutation = "Guten Tag";
            break;
        case 'es':
            salutation = "Buenos Dias";
            break;
    }
    
    document.getElementById("salutation").innerHTML = salutation;

    // try to modify the doc on input change - not sure this applies to dialogs
//    inputChangeHandler(ourDialog);

    function onsubmit(e) {
        console.log('onsubmit called: ' + e);
        //determine the settings to pass back via dialog close
        var results = {};
        const inputs = ourDialog.getElementsByTagName('input');
        console.log(inputs);
        console.log("Inputs: " + inputs.length);
        //const options = document.querySelectorAll('label > input');
        for (let input of inputs) {
            if (input.checked) {
                results.proceed = true;
                results[input.id] = true;
            }
        }
        ourDialog.close(results);
        e.preventDefault();
//            resolveCallback("Go for it!");
    }   

    
    const dialogForm = ourDialog.querySelector('form');
    dialogForm.onsubmit = onsubmit;
    

    const cancelButton = ourDialog.querySelector('#cancel');
    cancelButton.addEventListener("click", () => {
        ourDialog.close("reasonCanceled")
//            rejectCallback('Cancelled');
    });

    const okButton = ourDialog.querySelector('#ok');
    okButton.addEventListener("click", e => {
        onsubmit(e);
        e.preventDefault();
    });

    ourDialog.addEventListener("close", () => {
        console.log("Dialog close event fired");
    });

        //document.appendChild(ourDialog);

    return ourDialog.showModal();
}




/*
* Plugin entry point
*/

var elementDetailsUI;
var interactionsTestUI;
var changeTrackerUI;

module.exports = {
    commands: {
        "selectionMenu": createDialog
    },
    panels: {
        elementDetailsPanel: {
            show(event) {
                if (!elementDetailsUI) {
                    elementDetailsUI = elementDetails.createPanel();
                    //event.node.appendChild(interactionsTestUI);
                }
                event.node.appendChild(elementDetailsUI);
            },
            hide(event) {
                elementDetailsUI.remove();
            },
            update(sel,root) {
                elementDetails.updatePanel(sel, root, elementDetailsUI);
           }
        },
        "selectionPanel": {
            show(event) {
                console.log("show: " + event);
                var panel = createPanel();
                event.node.appendChild(panel);
            },
            hide(event) {
                console.log("hide: " + event);
                createPanel().remove();
            },
            update(theSelection, rootNode) {
                console.log("In update");
                console.log(theSelection.items.length);
                console.log(rootNode);
                selectionChangeHandler();                            
            }
        },
        interactionsPanel: {
            show(event, selection, rootNode) {
                console.log("Showing selection panel: Interactions Panel");
                console.log(event);
                console.log(selection);
                console.log(rootNode);

                if (!interactionsTestUI) {
                    interactionsTestUI = interactionsTest.createPanel();
                    //event.node.appendChild(interactionsTestUI);
                }
                event.node.appendChild(interactionsTestUI);
            },
            /**/
            hide(event, selection, rootNode) {
                console.log("Hiding selection panel: Interactions Panel");
                console.log(event);
                console.log(selection);
                console.log(rootNode);
                interactionsTestUI.remove();
            },
            /**/
            update(sel,root) {
                console.log("Updating selection panel: Interactions Panel");
                console.log(sel.items.length);
                console.log(root);
                interactionsTest.updatePanel(sel, root, interactionsTestUI);
            }
        },
        changeTrackerPanel: {
            show(event) {
                console.log("Showing selection panel: changeTracker Panel");
                
                console.log("Call fileUtils.removePluginDataContent()");
                fileUtils.removePluginDataContent();
                console.log("Past fileUtils.removePluginDataContent()");
                
                if (!changeTrackerUI) {
                    changeTrackerUI = changeTracker.createPanel();
                }
                event.node.appendChild(changeTrackerUI);
                changeTracker.getDocumentNodes(canvas);
                //changeTracker.updatePanel(selection, canvas, changeTrackerUI);
            },
            hide(event) {
                console.log("Hiding selection panel: changeTracker Panel");
                changeTrackerUI.remove();
                changeTracker.clearDocumentNodes();
            },
            update(sel,root) {
                console.log("Updating selection panel: changeTracker Panel");
                changeTracker.updatePanel(sel, root, changeTrackerUI);
                //changeTracker.updatePanel(selection, canvas, changeTrackerUI);
            }
        },
        showSelectionRendition: {
            show(event) {
                console.log("Showing selection panel: selectionRendition Panel");
                showSelectionRendition.show(event);
            },
            hide(event) {
                console.log("Hiding selection panel: selectionRendition Panel");
                showSelectionRendition.hide(event);
            },
            update(sel, root) {
                console.log("Updating selection panel: selectionRendition Panel");
                showSelectionRendition.update();
            }
        },
        previewInteractions: {
            show(event) {
                console.log("Showing Kitchen Sink: previewInteractions Panel");
                previewInteractions.show(event);
            },
            hide(event) {
                console.log("Hiding Kitchen Sink: previewInteractions Panel");
                previewInteractions.hide(event);
            },
            update(sel, root) {
                console.log("Updating Kitchen Sink: previewInteractions Panel");
                previewInteractions.update();
            }
        }
    }
};


var panelUI;
function createPanel() {

    if (panelUI) {
        console.log("Return panelUI");
        return panelUI;
    }

    // log what is in the doc
    // ec.logAllChildNodes(canvas);
    
    console.log("version: " + app.version);
    console.log("appLanguage: " + app.appLanguage);
    console.log("systemLocale: " + app.systemLocale);
    

    var editContext = selection.editContext;
    console.log("Edit context: " + editContext.name);
    console.log(editContext);
    gEditContextNode = editContext;

    //var container = document.createElement("div");
    //container.setAttribute("class", "uxp-plugin");
    var container = document.createElement("panel");
    container.setAttribute("id", "container");
    container.innerHTML = `
    <style>
        .border {
            border: 1px solid red;
            padding: 4px;
            width: 90%;
        }
        .flex {
            display: flex;
            flex-direction: row;
        }
        .between { justify-content: space-between; }
        .around  { justify-content: space-around; }
        .start   { justify-content: flex-start; }
        .end     { justify-content: flex-end; }
        .center  { justify-content: center; }
        .border * {
            border: 1px solid blue;
            padding: 4px;
            margin: 0 4px;
        }
        .pad {
            padding: 5px;
        }
        .pad-left {
            margin-left: 10px;
        }
        .xd-heading {
            color: #9F9F9F;
            font-size: 9px;
            margin-top: 5px;
            margin-bottom: 5px;
        }
        .span-disable {
            color: #9F9F9F;
        }
        panel p {
            line-height: 20px;
            margin: 5px 6px 7px 6px;
        }
        panel p.small {
            line-height: 16px;
        }
        panel hr.small {
            height: 1px;
            border-radius: 0.5px;
            background-color: #EAEAEA;
        }
        panel hr {
            height: 2px;
            border-radius: 1px;
            background-color: #EAEAEA;
        }
        hr.large {
            height: 4px;
            border-radius: 2px;
            background-color: #4B4B4B;
        }
        #logs {
            height: 500px;
            max-height: 116px;
            overflow-y: scroll;
            resize: none;
        }

        a {
            color: #0D66D0;
          }
          a:hover {
            text-decoration-line: underline;
          }
          .uxp-plugin {
            /* all controls have a standard margin so that combined with the dialog padding yields our desired margin. */
            padding: 14px;
            display: flex;
            flex-direction: column;
            font-size: 14px;
            color: #505050;
          }
          .uxp-plugin .color-red {
            color: #C9252D;
          }
          .uxp-plugin .color-blue {
            color: #0D66D0;
          }
          .uxp-plugin .color-green {
            color: #12805C;
          }
          .uxp-plugin .color-orange {
            color: #CB6F10;
          }
          .uxp-plugin .background-red {
            background-color: #C9252D;
          }
          .uxp-plugin .background-blue {
            background-color: #0D66D0;
          }
          .uxp-plugin .background-green {
            background-color: #12805C;
          }
          .uxp-plugin .background-orange {
            background-color: #CB6F10;
          }
          .uxp-plugin .border-red {
            border-color: #C9252D;
          }
          .uxp-plugin .border-blue {
            border-color: #0D66D0;
          }
          .uxp-plugin .border-green {
            border-color: #12805C;
          }
          .uxp-plugin .border-orange {
            border-color: #CB6F10;
          }
          .uxp-plugin p, .uxp-plugin input, .uxp-plugin textarea, .uxp-plugin button, .uxp-plugin select, .uxp-plugin h1, .uxp-plugin h2, .uxp-plugin h3, .uxp-plugin h4, .uxp-plugin h5, .uxp-plugin h6, .uxp-plugin hr {
            margin: 6px;
          }
          .uxp-plugin h1 {
            font-weight: bold;
            font-size: 18px;
            margin: 1px 6px 2px 6px;
            color: #3F3F3F;
          }
          .uxp-plugin h2 {
            font-weight: bold;
            font-size: 14px;
            margin: 1px 6px 3px 6px;
            color: #3F3F3F;
          }
          .uxp-plugin h3, .uxp-plugin h4, .uxp-plugin h5, .uxp-plugin h6 {
            font-weight: normal;
            font-size: 11px;
            margin: 3px 6px 3px 6px;
            color: #707070;
          }
          .uxp-plugin hr {
            height: 2px;
            border-radius: 1px;
            background-color: #EAEAEA;
          }
          .uxp-plugin hr.large {
            height: 4px;
            border-radius: 2px;
            background-color: #4B4B4B;
          }
          .uxp-plugin hr.small {
            height: 1px;
            border-radius: 0.5px;
            background-color: #EAEAEA;
          }
          .uxp-plugin input[type=checkbox] {
            margin-right: 3px;
          }
          .uxp-plugin label {
            display: flex;
            color: #707070;
            flex-direction: column;
          }
          .uxp-plugin label span {
            font-size: 12px;
            margin: 2px 6px 3px 6px;
          }
          .uxp-plugin header {
            display: flex;
            justify-content: center;
          }
          .uxp-plugin footer {
            display: flex;
            flex-direction: row;
            justify-content: flex-end;
            margin-top: 12px;
          }
          .uxp-plugin p {
            line-height: 20px;
            margin: 5px 6px 7px 6px;
          }
          .uxp-plugin p.large {
            font-size: 18px;
            line-height: 24px;
            margin: 1px 6px 2px 6px;
            margin: 7px 6px 8px 6px;
          }
          .uxp-plugin p.small {
            line-height: 16px;
          }
          .uxp-plugin .row {
            display: flex;
            flex-direction: row;
            align-items: center;
          }
          .uxp-plugin .row input[type=text], .uxp-plugin .row textarea, .uxp-plugin .row label {
            flex: 1;
          }
          .uxp-plugin label.row {
            align-items: center;
          }
          .uxp-plugin .column {
            display: flex;
            flex-direction: column;
          }
          .uxp-plugin .margin {
            margin: 6px;
          }
          .uxp-plugin .margin2 {
            margin: 12px;
          }
          .uxp-plugin label.row {
            justify-items: center;
            align-items: center;
          }
          .uxp-plugin nav.row {
            border-bottom: solid 2px #EAEAEA;
            margin: 6px;
            margin-top: 15px;
          }
          .uxp-plugin nav.row .tab {
            position: relative;
            top: 2px;
            white-space: nowrap;
            padding-bottom: 15px;
            cursor: pointer;
            /* doesn't work yet */
            color: #707070;
            /* textColorLight */
            border-bottom: solid 2px transparent;
          }
          .uxp-plugin nav.row .tab:not(:first-child) {
            margin-left: 12px;
          }
          .uxp-plugin nav.row .tab:not(:last-child) {
            margin-right: 12px;
          }
          .uxp-plugin nav.row .tab.active, .uxp-plugin nav.row .tab:hover:not(.disabled) {
            color: #3F3F3F;
          }
          .uxp-plugin nav.row .tab.disabled {
            color: #B3B3B3;
          }
          .uxp-plugin nav.row .tab.active {
            border-bottom: solid 2px #3F3F3F;
          }
          .uxp-plugin nav.row.small {
            margin-top: 7px;
          }
          .uxp-plugin nav.row.small .tab {
            padding-bottom: 7px;
          }
          .uxp-plugin nav.row.quiet {
            border-bottom: solid 2px transparent;
          }
          .uxp-plugin dialog {
            padding: 34px;
          }
    </style>
    <h3>FLEX, SPACE-BETWEEN</h3>
    <div class="border flex between">
        <div>A</div><div>B</div><div>C</div>
    </div>
    <h3>FLEX, SPACE-AROUND</h3>
    <div class="border flex around">
        <div>A</div><div>B</div><div>C</div>
    </div>
    <h3>FLEX, FLEX-START</h3>
    <div class="border flex start">
        <div>A</div><div>B</div><div>C</div>
    </div>
    <h3>FLEX, FLEX-END</h3>
    <div class="border flex end">
        <div>A</div><div>B</div><div>C</div>
    </div>
    <h3>FLEX, CENTER</h3>
    <div class="border flex center">
        <div>A</div><div>B</div><div>C</div>
    </div>


    <p />
    <hr />
    <p />

    <div id="select">
        <span class="xd-heading">SELECTION</span>
        <p class="small"></p>

        <span class="xd-heading">Select</span>

        <div id='select_children_div' class="flex start pad">
            <input id='select_children' type="checkbox" editLabel="Select children" />
            <span class="pad-left">Select all children of each selected item</span>
        </div>

        <div id='select_edit_context_div' class="flex start pad">
            <input id='select_edit_context' type="checkbox" editLabel="Edit context selection" />
            <span class="pad-left">Select all itmes in the edit context</span>
        </div>


        <span class="xd-heading">Edit</span>

        <div id='edit_selection_div' class="flex start pad">
        <input id='edit_selection' type="checkbox" editLabel="Edit the selection" />
        <span class="pad-left">Edit all selected items</span>
        </div>

        <div id='edit_children_div' class="flex start pad">
        <input id='edit_children' type="checkbox" editLabel="Edit selection children" />
        <span class="pad-left">Edit all children of each selected item</span>
        </div>

        <div class="flex start pad">
        <input id='edit_editContext' type="checkbox" editLabel="Edit context edits" />
        <span class="pad-left">Edit all itmes in the edit context</span>
        </div>


        <span class="xd-heading">DELETE</span>

        <div id='delete_selection_div' class="flex start pad">
        <input id='delete_selection' type="checkbox" editLabel="Delete the selection" />
        <span class="pad-left" >Delete all selected items</span>
        </div>

        <div id='delete_children_div' class="flex start pad">
        <input id='delete_children' type="checkbox" editLabel="Delete selection children" />
        <span class="pad-left" >Delete children of selected items</span>
        </div>

    </div>

    <p />
    <hr />
    <p />

    <span class="xd-heading">EDIT CONTEXT ITEMS</span>

    <div id="logs">
    This is a test
    </div>

    <hr />
    <h1>H1 Header</h1>
    <hr class="large"></hr>
    <p class="large"></p>
    <h2>H2 Header</h2>
    <hr />
    <p />
    <h3>H3 Header</h3>
    <hr class="small"></hr>
    <p class="small"></p>
    Hello
    `;

    inputChangeHandler(container);

    panelUI = container;
    return panelUI; 
}

function inputChangeHandler(container) {
    console.log("In inputChangeHandler");

    // changeHandlers
    console.log("get inputs");
    const inputs = container.getElementsByTagName('input');
    console.log(inputs);
    console.log("Inputs: " + inputs.length);
    container.getElementsByTagName('input').forEach(input => {
        //input.addEventListener("change",handleInputChange);
        input.addEventListener("click",handleInputChange);
        input.setAttribute("editLabel", input.getAttribute("id"));
    });

    selectionChangeHandler(container);

    function handleInputChange() {
        container.getElementsByTagName('input').forEach(input => {
            //console.log(input.getAttribute("id"));
            if (input.getAttribute("id") !== this.getAttribute("id")) {
                //input.setAttribute("checked", "false");
                input.checked = false;
            }
        });

        if (this.getAttribute("checked")){
            //console.log("Apply the action ...");
            actOnSelection(this.getAttribute("id"));
            // as the input checkbox was used as a trigger - uncheck it
            //this.setAttribute("checked", false);
            document.getElementById(this.getAttribute("id")).checked = false;
        }
    }

}

function selectionChangeHandler(container = null) {
    console.log("In selectionChangeHandler");

    if (! container) {
        console.log("Get container from the document");
        container = document.getElementById("container");
    }

    if (! container) {
        return;
    }

    container.querySelector('#logs').innerHTML = ec.logAllChildNodes(selection.editContext);

    // TODO:
    /*
        update the edit contect text field
    
        BUG: The selection shows correct but selection.editContext is wrong
        Select somethong like a child of a group then select nothing
        selection item length is 0 as expected but the editContext is the previous selections
        Issue only on deselect - selct group child to group child ok
        as is child of group to element or element ot child of group
        selction accros groups is a problem though ....

        Is just a timing issue ... I think
    */

        // if there is a selection enabkle the selction actions
    if (selection.items.length) {
        enableInputState(container.querySelector('#edit_selection_div'));
        enableInputState(container.querySelector('#delete_selection_div'));

        if (selectionItemsHaveChildren()) {
            enableInputState(container.querySelector('#select_children_div'));
            enableInputState(container.querySelector('#edit_children_div'));
            enableInputState(container.querySelector('#delete_children_div'));
        } else {
            enableInputState(container.querySelector('#select_children_div'), false);
            enableInputState(container.querySelector('#edit_children_div'), false);
            enableInputState(container.querySelector('#delete_children_div'), false);
        }
    } else {
        enableInputState(container.querySelector('#select_children_div'), false);
        enableInputState(container.querySelector('#edit_selection_div'), false);
        enableInputState(container.querySelector('#delete_selection_div'), false);
        enableInputState(container.querySelector('#edit_children_div'), false);
        enableInputState(container.querySelector('#delete_children_div'), false);
    }    

    function enableInputState(divElement, enable = true) {
        //console.log("In enableInputState");
        divElement.getElementsByTagName('*').forEach(element => {
            if (enable) {
                element.disabled = false;
                if (element.tagName === 'SPAN') {
                    element.setAttribute("class", "pad-left");
                }
            } else {
                element.disabled = true;
                if (element.tagName === 'SPAN') {
                    element.setAttribute("class", "span-disable pad-left");
                }
            }
        });
    }
/*
    // compare the cureent selection to any previous selection
    let currentSelection = serializeSelection(selection);
    if (gPreviousSelection) {
        console.log("compare gPreviousSelection to the current selection");
        let deltas = compareSerializedNodeLists(gPreviousSelection, currentSelection);
        console.log("Compare results:");
        console.log(deltas);
    }
    console.log("assign selection.items to gPreviousSelection");
    gPreviousSelection = currentSelection;
*/
}

function actOnSelection(action) {
    switch(action) {
        case 'edit_selection':
        /*
            sg.executePanelCommand(() => {
                ec.editSelectedNodes(selection, editNode);
            }, "edit selected items");
        */
            app.editDocument({ editLabel: "edit selected items" },(sel, root) => {
                console.log("Call editSelectedNodes with: " + sel);
                ec.editSelectedNodes(sel, editNode);
                //
                //getAssets();
            });
            break;
        case 'edit_children':
        /*
            sg.executePanelCommand(() => {
                selection.items.forEach(node => ec.editChildren(node, editNode));
            }, "edit children of selected items");
        */
            app.editDocument({ editLabel: "edit children of selected items" },() => {
                selection.items.forEach(node => ec.editChildren(node, editNode));
            });
            break;
        case 'edit_editContext':
        /*
            sg.executePanelCommand(() => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        try {
                            ec.editChildren(selection.editContext, editNode);
                            resolve();
                        } catch (err) {
                            reject();
                        }    
                    }, 1000);
                }).then(() => {
                    console.log("action: edit_editContext completed");
                });
                //ec.editChildren(selection.editContext, editNode);
            }, "edit all editable items");   
        */
            app.editDocument({ editLabel: "edit all editable items" }, () => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        try {
                            ec.editChildren(selection.editContext, editNode);
                            resolve();
                        } catch (err) {
                            reject();
                        }    
                    }, 1000);
                }).then(() => {
                    console.log("action: edit_editContext completed");
                });
            });
            break;
        case 'delete_selection':
            //sg.executePanelCommand(() => {
            app.editDocument({ editLabel: "delete selected items" },() => {
                selection.items.forEach(node => node.removeFromParent());
            });
            break;
        case 'delete_children':
            //sg.executePanelCommand(() => {
            app.editDocument({ editLabel: "delete children of selected items" },() => {
                selection.items.forEach(node => ec.deleteChildren(node));
            });
            break;
        case 'select_children':
            //sg.executePanelCommand(() => {
            app.editDocument(() => {
                console.log("select_children: action");
                selection.items.forEach(node => ec.selectChildren(node, selection));
            });
            break;
        case 'select_edit_context':
            //sg.executePanelCommand(() => {
            app.editDocument(() => {
                console.log("select_edit_context: action");
                ec.selectChildren(selection.editContext, selection);
            });
            break;
    }
}

function editNode(node) {
    console.log("in editNode");
    if (node.parent instanceof sg.SymbolInstance) {
        console.log("edit a symbol instance");
        //return testSymbolOverride(node);
        if (node.parent.isMaster) {
            console.log("We have the master symbol");
            var text = new sg.Text();
            text.text = "Testing style assignemnt with linked asset character styles."
            text.styleRanges = [{"length":50, "fontFamily":"Helvetica", "fontStyle":"Regular", "fontSize":14}];
            node.parent.addChild(text, 0);
            text.moveInParentCoordinates(20,20);

            //selection.editContext.removeAllChildren();
        } else {
            var rect = new sg.Rectangle();
            rect.width = 40;
            rect.height = 20;
            node.parent.addChild(rect, 0);
            rect.moveInParentCoordinates(10,10);
        }
    } else if (node.isContainer) {
        console.log("edit a container");
        let nodeBounds = node.localBounds;
        node.resize(nodeBounds.width * 1.25, nodeBounds.height * .75);
    } else {
        if (node instanceof sg.Text) {
            var text = new sg.Text();
            text.width = 100;
            text.height = 100;
            text.text = "Testing style assignemnt with linked asset character styles."
            selection.insertionParent.addChild(text);
            text.moveInParentCoordinates(200,200);
            text.styleRanges = node.styleRanges;
            selection.items= [text];
/*
            let fillColor = new sg.Color("#DDDDDD");
            let ranges = [];
            ranges.push({"length":50, "fontFamily":"Helvetica", "fontStyle":"Regular", "fontSize":14, "fill":fillColor});
            node.styleRanges = ranges;
*/
        } else {
            console.log("edit a non-container");
            //console.log("Fill color _linkId: " + node.fill._linkId);
            console.log("Fill color linkId: " + node.fill.linkId);

            node.fill = new sg.Color("#335588");
            console.log(node.fill);
            node.stroke = new sg.Color("#885533");
            console.log(node.stroke);

            if (node.fill.linkId) {
                var rect = new sg.Rectangle();
                rect.width = 100;
                rect.height = 100;
                selection.insertionParent.addChild(rect);
                rect.moveInParentCoordinates(100,100);

                // this assigns the linked color asset
                //rect.fill = node.fill;

                // this assigns a color but not as a  asset
                var testColor = new sg.Color(node.fill.value);
                rect.fill = testColor;
                
                var obj1Fill = rect.fill;
                var obj2Link = node.fill.linkId;
                obj1Fill.linkId = obj2Link;
                rect.fill = obj1Fill;

                selection.items= [rect];

                console.log(rect.fill);
                
            //    node.fill.linkId = "";
            //    console.log(node.fill);
                
            } else {
                //node.fill._linkId = "013ab2c3-ddde-4002-ac63-aac5a50e20b2";
                //node.fill.linkId("013ab2c3-ddde-4002-ac63-aac5a50e20b2");    
            }
            console.log(node.fill);
        }
    }
}

function testSymbolOverride(selection) {
    console.log("In testSymbolOverride");

    if (selection.editContext instanceof sg.SymbolInstance) {
        selection.items.forEach(function(node) {
        
            console.log("we have a symbol: " + selection.editContext.symbolId);

            //editNode(node);

            if (selection.editContext.isMaster) {
                console.log("We have the master symbol");
                var text = new sg.Text();
                text.text = "Testing style assignemnt with linked asset character styles."
                text.styleRanges = [{"length":50, "fontFamily":"Helvetica", "fontStyle":"Regular", "fontSize":14}];
                selection.editContext.addChild(text, 0);
                //selection.editContext.addChild(text, 3);
                text.moveInParentCoordinates(20,10);

                //selection.editContext.removeAllChildren();
            } else {
                var rect = new sg.Rectangle();
                rect.width = 40;
                rect.height = 20;
                //selection.editContext.addChild(rect, 0);
                //selection.editContext.addChild(rect, 3);
                selection.editContext.addChildBefore(rect, node);
                //selection.editContext.addChildAfter(rect, node);
                rect.moveInParentCoordinates(10,10);
            }
        });
    } else if (selection.items[0] instanceof sg.SymbolInstance) {
        selection.items[0].removeFromParent();
    } else {
        editNode(node);
    }
}


function getAssets() {
    let assets = require("assets");
    let colorAssest = assets.colors.get();
    //colorAssest.forEach(color => console.log(color));
    console.log("Color asset count: " + colorAssest.length);
    for (var i=0; i<colorAssest.length; i++) {
        console.log(colorAssest[i]);
    }

    var colorToDelete = colorAssest[1];
    console.log("Delete:");
    console.log(colorToDelete);
    assets.colors.delete(colorToDelete);
    console.log("Deleted!");
    console.log(assets.colors.get().length);

    let charStyleAssets = assets.characterStyles.get();
    charStyleAssets.forEach(charStyle => console.log(charStyle));
}

function selectionItemsHaveChildren() {
    for(let i=0; i< selection.items.length; i++) {
        if (selection.items[i].children.length) {
            return true;
        }
    }
    return false;
}

/*
function serializeSelection(selection) {
    console.log("In serializeSelection");
    let selectedItems = {};
    selection.items.forEach(node => selectedItems[node.guid] = serializeNode(node));
    return selectedItems;
}
*/
/* 
*   The new attempt to compare serialized lists of nodes
*/
/*
function compareSerializedNodeLists(previousList, currentList) {
    console.log("In compareSerializedNodeLists");

    let compareResults = "";
    let matchingGuids = [];
    let removedNodes = [];
    let addedNodes = [];

    let foundGuid = false;

    for (const pNodeGuid in previousList) {
        for (const cNodeGuid in currentList) {
            if (pNodeGuid === cNodeGuid) {
                console.log("Found matching item guid: " + pNodeGuid);
                matchingGuids.push(pNodeGuid);
                foundGuid = true;
            }            
        }
        if (! foundGuid) {
            console.log("Removed item guid: " + pNodeGuid + " - " + previousList[pNodeGuid]);
            removedNodes.push(pNodeGuid);
        }
    }
    // get added guids
    for (const cNodeGuid in currentList) {
        if (! matchingGuids.includes(cNodeGuid)) {
            console.log("Added item guid: " + cNodeGuid);
            addedNodes.push(cNodeGuid);
        }            
    }

    if (removedNodes.length || addedNodes.length) {
        console.log("The action was modifying the selected items array");
    } else {
        console.log("The action must be modifying the selected items: " + matchingGuids.length);
        matchingGuids.forEach(guid => {
            compareResults += compareNodeVersions(previousList[guid], currentList[guid]);
        });
    }
    return compareResults;
}
*/
/*
function serializeNode(node) {
    console.log("In serializeNode");

    // iterate over the node properties and log any differences
    let nodeProperties = JSON.parse(np.getNodeProperties());

    let nodeData = iterateOverProperties(nodeProperties.properties, node);

    function iterateOverProperties(properties, node) {
        let data = {};
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
        return data;
    }

    function isObject(value) {
        return value && typeof value === 'object' && value.constructor === Object;
    }

    //console.log(nodeData);
    return nodeData;
}
*/
/*
function compareNodeVersions(previousNode, currentNode) {
    console.log("In compareNodes");

    let results = "";

    if (previousNode.guid != currentNode.guid) {
        console.log("You can only compare versions of the same node!");
        return;
    }

    // iterate over the node properties and log any differences
    let nodeProperties = JSON.parse(np.getNodeProperties());
    //console.log(nodeProperties);

    iterateOverProperties(nodeProperties.properties, previousNode, currentNode);

    function iterateOverProperties(properties, pNode, cNode, labels = []) {
        for (var property in properties) {
            if (isObject(properties[property])) {
                if (pNode && cNode) {
                    labels.push(property);
                    iterateOverProperties(properties[property], pNode[property],cNode[property], labels);
                }
            } else {
                if (pNode && cNode) {
                    compareProperty(pNode, cNode, property, labels);
                }
            }
        };
        labels.pop();
    }

    function compareProperty(prevNode, curNode, property, labels) {
        //console.log("In compareProperty");
        //console.log("property: " + property + " => prevNode: " + prevNode + ", curNode: " + curNode);
        if (prevNode && curNode) {
            if (prevNode[property] != curNode[property]) {
                var label = "";
                labels.forEach(key => label = label + key + " ");
                var result = label + property + ": " + prevNode[property] + " to " + curNode[property] + "\r";
                console.log(label + property + ": " + prevNode[property] + " to " + curNode[property]);
                console.log(result);
                results += result;
            } else {
                //console.log(property + ": " + prevNode[property] + " equal to " + curNode[property]);
            }    
        }
    }

    function isObject(value) {
        return value && typeof value === 'object' && value.constructor === Object;
    }

    return results;
}
*/



/* TODO
persist selectiuon - array of nodes wiht deatils
    on show and selection chnage
        get the selected items and for each node get and save the node properties
        if (on selection and a previous selection was saved - compare for what changed)
            for the chnages create plugin API steps to reproduce (recording plugin)

So a recursive get node properties
getNodeProperties(node) {
    let nodeData = {};
    nodeData.guide = node.guid
    nodeData.type = get instance type
    get values based on that
    if node.children.length
        getNodeProperties()childNode)
    }   

}
*/
