const ec = require("./modules/editContextModule");
const np = require("./nodeProperties");

var sg = require("scenegraph");

var gPreviousSelection;
var gPreviousSelectedNodes = {};
var gDocumentNodes = {};
var gPreviousDocumentNodes = {};

exports.createPanel = function() {
    console.log("In createPanel");    

    var container = document.createElement("div");

    container.innerHTML = `
    <style>
    .label-button {
        display: flex;
        flex-direction: row;
    }
    </style>
    
    <h1>Change Tracker</h1>

    <p />
    <hr />
    <p />

    <label class="label-button">
    <span>USER ACTIONS</span>
    <button id="clear">Clear</button>
    </label>

    <div id="logs"></div>
    `;

    container.querySelector("#clear").addEventListener("click", () => {
        container.querySelector("#logs").innerHTML = "";
    });

    return container;
}

exports.updatePanel = function(selection, rootNode, panelUI) {
    console.log("In changeTracker updatePanel");

    // compare the cureent selection to any previous selection
    let currentSelection = serializeSelection(selection);
    if (gPreviousSelection) {
        console.log("compare gPreviousSelection to the current selection");
        let deltas = compareSerializedNodeLists(gPreviousSelection, currentSelection);
        console.log("Compare results:");
        console.log(deltas);
         
        panelUI.querySelector('#logs').innerHTML += deltas;
        /*
        var logElement = panelUI.querySelector('#logs');
        var currentLogs = logElement.innerHTML;
        logElement.innerHTML = deltas + currentLogs;
        */
    }
    console.log("assign selection.items to gPreviousSelection");
    gPreviousSelection = currentSelection;
    getSelectedNodes(selection);
    // clean up these next few calls ... very ugly
    getDocumentNodes(sg.root);
    gPreviousDocumentNodes = gDocumentNodes;
}

function serializeSelection(selection) {
    console.log("In serializeSelection");
    let selectedItems = {};
    selection.items.forEach(node => selectedItems[node.guid] = serializeNode(node));
    return selectedItems;
}

function serializeNode(node) {
    console.log("In serializeNode");

    // iterate over the node properties and log any differences
    let nodeProperties = JSON.parse(np.getNodeProperties());

    let nodeData = iterateOverProperties(nodeProperties.properties, node);

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

    //console.log(nodeData);
    return nodeData;
}

/* 
*   The new attempt to compare serialized lists of nodes
*/
function compareSerializedNodeLists(previousList, currentList) {
    console.log("In compareSerializedNodeLists");

    let compareResults = "";
    let matchingGuids = [];
    let removedGuids = [];
    let addedGuids = [];

    for (const pNodeGuid in previousList) {
        let foundGuid = false;
        for (const cNodeGuid in currentList) {
            if (pNodeGuid === cNodeGuid) {
                console.log("Found matching item guid: " + pNodeGuid);
                matchingGuids.push(pNodeGuid);
                foundGuid = true;
            }            
        }
        if (! foundGuid) {
            console.log("Removed item guid: " + pNodeGuid + " - " + previousList[pNodeGuid]);
            removedGuids.push(pNodeGuid);
        }
    }
    // get added guids
    for (const cNodeGuid in currentList) {
        if (! matchingGuids.includes(cNodeGuid)) {
            console.log("Added item guid: " + cNodeGuid);
            addedGuids.push(cNodeGuid);
        }            
    }

    if (removedGuids.length || addedGuids.length) {
        console.log("The action was modifying the selected items array");
        if (addedGuids.length){
            console.log("add to selection count: " + addedGuids.length);
            addedGuids.forEach(guid => {
                // for the guids added they could be new XD elements ... hwo to verify this?
                if (! gDocumentNodes[guid]) {
                    compareResults += "Added: " + currentList[guid].type + " " +  currentList[guid].name + "\r";
                    gDocumentNodes[guid] = currentList[guid];
                    // need to to see if this is a container to see if we added other elements

                }
                compareResults += "Select: " + currentList[guid].type + " " +  currentList[guid].name + "\r";
            }); 
        } else {
            console.log("removed from selection count: " + removedGuids.length);
            if (sg.selection.items.length){
                // deseleced something but didn't delete anything
                removedGuids.forEach(guid => {
                    // for the guids removed they were deselected
                    compareResults += "Deselect: " + previousList[guid].type + " " +  previousList[guid].name + "\r";                 
                });
            } else {
                // deseleced everything which could be a delete
                getDocumentNodes(sg.root);
                removedGuids.forEach(guid => {
                    if (! gDocumentNodes[guid]) {
                        var nodeTest = gPreviousSelectedNodes[guid];
                        if (nodeTest) {
                            console.log("Was hoping node " + nodeTest.name + " would be undefined.");
                        }
                        compareResults += "Deleted: " + previousList[guid].type + " " +  previousList[guid].name + "\r";
                        //delete gDocumentNodes[guid]; // need to remove not assign
    
                        // need to see if the deleted node had children thus we deletd modre elements
                        // I need to keep the nodes not just the serialized version to check for children ...    
                    }                    
                });
                compareResults += "Deselect all\r";
            }
        }
    } else if (matchingGuids.length) {
        console.log("The action must be modifying the selected items: " + matchingGuids.length);
        matchingGuids.forEach(guid => {
            compareResults += compareNodeVersions(previousList[guid], currentList[guid]);
        });
    } else {
        console.log("The action must be a LIVE EDIT UPDATE!");
        compareResults += compareDocumentNodes(gPreviousDocumentNodes);
    }
    return compareResults;
}

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
            if (prevNode[property] !== curNode[property]) {
                var label = "";
                labels.forEach(key => label = label + key + " ");
                if (Array.isArray(prevNode[property])) {
                    console.log(label + property + ": ");
                    compareArrays(prevNode[property], curNode[property]);
                } else if (isObject(prevNode[property])) {
                    console.log(label + property + ": ");
                    if (property === "globalBounds") {
                        var boundsresults = compareBounds(prevNode[property], curNode[property]);
                        if (boundsresults) {
                            results += label + property + ": " + boundsresults.toString() + "\r"; 
                        }    
                    } else {
                        var compareResults = compareObjects(prevNode[property], curNode[property]);
                        if (compareResults) {
                            results += label + property + ": " + compareResults.toString() + "\r"; 
                        }    
                    }
                } else {
                    var result = label + property + ": " + prevNode[property] + " to " + curNode[property] + "\r";
                    console.log(label + property + ": " + prevNode[property] + " to " + curNode[property]);
                    console.log(result);
                    results += result;    
                }
            } else {
                //console.log(property + ": " + prevNode[property] + " equal to " + curNode[property]);
            }    
        }
    }
/*
    function isObject(value) {
        return value && typeof value === 'object' && value.constructor === Object;
    }
*/
    return results;
}

function isObject(value) {
    //return value && typeof value === 'object' && value.constructor === Object;
    return typeof value === 'object';
}

function compareArrays(prevArray, curArray) {
    console.log("In compareArrays");

    if (prevArray.length != curArray.length) {
        console.log("Previous values:")
        for (var i=0; i<prevArray.length; i++) {
            console.log(prevArray[i]);
        }
        console.log("Current values:")
        for (var i=0; i<curArray.length; i++) {
            console.log(curArray[i]);
        }
    } else {
        console.log("Different values")
        for (var i=0; i<prevArray.length; i++) {
            if (prevArray[i] != curArray[i]) {
                console.log(prevArray[i]);
                console.log(curArray[i]);
            }
        }
    }
}

function compareObjects(prevObject, curObject) {
    console.log("In compareObjects");
    //let results = {};
    let results = [];

    for (const key in prevObject) {
        if (prevObject[key] !== curObject[key]) {
            console.log(key + " " + prevObject[key] + " to " + curObject[key]);
            //results[key] = curObject[key] - prevObject[key];
            results.push(key + " " + prevObject[key] + " to " + curObject[key] + " ");
        }
    };
    console.log(results);
    return results;
}

function compareBounds(pBounds, cBounds) {
    console.log("In compareBounds");

    var deltas = {};
    var cmds = [];
    for (const key in pBounds) {
        if (pBounds[key] !== cBounds[key]) {
            deltas[key] = cBounds[key] - pBounds[key]
        }
    };

    if (deltas.hasOwnProperty("x") || deltas.hasOwnProperty("y")) {
        var deltaX = deltas.x ? deltas.x : 0;
        var deltaY = deltas.y ? deltas.y : 0;
        cmds.push("moveInParentCoordinates(" + deltaX + ", " +  deltaY + ")");
    }
    if (deltas.hasOwnProperty("width") || deltas.hasOwnProperty("height")) {
        var deltaWidth = deltas.width ? deltas.width : 0;
        var deltahHight = deltas.height ? deltas.height : 0;
        cmds.push("resize(" + deltaWidth + ", " +  deltahHight + ")");
    }
    if (cmds.length) {
        return cmds;
    }
    return
}

function getSelectedNodes(nodeArray) {
    gPreviousSelectedNodes = {};
    ec.editSelectedNodes(nodeArray, addSelectedNode);
}

function addSelectedNode(node) {
    gPreviousSelectedNodes[node.guid] = node;
}



function getDocumentNodes(rootNode) {
    gDocumentNodes = {};
    ec.editChildren(rootNode, addDocumentNode);
}

exports.clearDocumentNodes = function() {
    gDocumentNodes = {};
    gPreviousSelection = undefined;
}

function addDocumentNode(node) {
    gDocumentNodes[node.guid] = node;
}


function compareDocumentNodes(previousDocumentNodes) {
    var deltas = "";
    var prevDocNodes = [];
    var docNodes = [];

    for (const key in gPreviousDocumentNodes) {
        prevDocNodes[key] = serializeNode(gPreviousDocumentNodes[key]);
    }
        
    getDocumentNodes(sg.root);

    for (const key in gDocumentNodes) {
        docNodes[key] = serializeNode(gDocumentNodes[key]);
    }
         
    // compare the lists ....
    deltas = compareSerializedNodeLists(prevDocNodes, docNodes);

    return deltas;
}
/*
    node.moveInParentCoordinates(deltaX, deltaY);
    node.resize(width, height)
    node.name = "newName";
*/

exports.getDocumentNodes = getDocumentNodes;
