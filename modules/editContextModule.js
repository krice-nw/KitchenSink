
const sg = require("scenegraph");
const fs = require("uxp").storage.localFileSystem;
const vp = require("viewport");

function logAllChildNodes(node) {
    //console.log("In logAllChildNodes");

    let logs = "";

    if (node.children.length) {
        //console.log("Try to select the node children of: " + node.name);
        try {
            // node.children is not an array
            //var childNodes = [];
            node.children.forEach(function(childNode) {
                //console.log(childNode);
                logs += childNode.toString();
                logs += logAllChildNodes(childNode);
            });
        } catch(err) {
            console.log("Failed to log node children: " + err);
        }
    } else {
        //console.log(node.name + " doesn't have children");
    }
    return logs;
}

function editSelectedNodes(selection, editFunction) {
    // try to modify everything in the selection
    selection.items.forEach(function(node) {
        try {
            if (editFunction) {
                editFunction(node);
            } else {
                console.log("I am ready to try to edit the parent but you didn't provide an edit function");
            }
        } catch(err) {
            console.log("Failed to edit the selected node: " + err);
        }
    });
}


/*
*   selectParent
*
*   Recursive function to select each parent up to the document canvas
*/
function selectParents(node, selection) {
    if (node.parent && ! (node instanceof sg.Artboard)) {
        /*
        if (node.parent === gEditContextNode) {
            console.log("selectParent reached the editContext");
            console.log(node.parent);
        }
        */
        //console.log("Try to select the node parent: " + node.parent.name);
        //console.log(node.parent);
        try {
            selection.items = [node.parent];
            console.log("Assigned parent node as the selection");
            selectParents(node.parent, selection);
        } catch(err) {
            console.log("Failed to assign parent node as the selection: " + err);
        }
    } else {
        console.log(node.name + " doesn't have a parent");
    }
}

/*
*   editParent
*
*   Recursive function to edit each parent up to the document canvas
*/
function editParents(node, editFunction = undefined) {
    if (node.parent && !(node instanceof sg.Artboard)) {
        //console.log("Try to edit the node parent: " + node.parent.name);
        //console.log(node.parent);
        try {
            if (editFunction) {
                editFunction(node.parent);
            } else {
                console.log("I am ready to try to edit the parent but you didn't provide an edit function");
            }
//            node.fill = new sg.Color("#115588");
//            node.fill = new sg.Color("#885511");
//            console.log("Assigned node stroke and fill");
            editParents(node.parent, editFunction);
        } catch(err) {
            console.log("Failed to edit parent node: " + err);
        }
    } else {
        console.log(node.name + " doesn't have a parent");
    }
}

/*
*   selectChildren
*
*   Recursive function to select each child until we reach the last node of the hiararchy
*/
function selectChildren(node, selection) {
    if (node.children.length) {
        console.log("Try to select the node children of: " + node.name);
        try {
            // node.children is not an array
            var childNodes = [];
            node.children.forEach(function(childNode) {
                // try to scroll each iotem into view
                vp.scrollIntoView(childNode);
                childNodes.push(childNode);
            })
            selection.items = childNodes;
            console.log("Assigned child nodes as the selection");
            childNodes.forEach(function(childNode) {
                selectChildren(childNode, selection);
            });
        } catch(err) {
            console.log("Failed to set selection to node children: " + err);
        }
    } else {
        console.log(node.name + " doesn't have children");
    }
}

/*
*   editChildren
*
*   Recursive function to edit each child until we reach the last node of the hiararchy
*/
function editChildren(node, editFunction = undefined) {
    if (node.children.length) {
        //console.log("Try to edit the node children of: " + node.name);
        try {
            node.children.forEach(function(childNode) {
                try {
                    if (editFunction) {
                        editFunction(childNode);
                    } else {
                        console.log("I am ready to try to edit the child but you didn't provide an edit function");
                    }
//                    childNode.fill = new sg.Color("#115588");
//                    childNode.fill = new sg.Color("#885511");
//                    console.log("Assigned stroke and fill to childNode: " + childNode.name);    
                } catch (err) {
                    console.log("Failed to edit childNode: " + childNode.name + " Error: " + err);
                }
               editChildren(childNode, editFunction);
            });
        } catch(err) {
            console.log("Failed to edit node children: " + err);
        }
    } /* else {
        console.log(node.name + " doesn't have children");
    } */
}

/*
*   selectSiblings
*
*   Function to select each node with the same parent of the provided node
*/
function selectSiblings(node, selection) {
    if (node.parent && !(node instanceof sg.Artboard)) {
        var siblingNodes = [];
        node.parent.children.forEach(function(siblingNode) {
            if (siblingNode != node) {
                siblingNodes.push(siblingNode);
            }
        });
        if (siblingNodes.length) {
            try {
                selection.items = siblingNodes;
                console.log("Selected siblings of " + node.name);
            } catch (err) {
                console.log("Failed to select siblings of " + node.name + " Error: " + err);
            }
        } else {
            console.log("No sublings for " + node.name);
        }
    }
}

/*
*   editSiblings
*
*   Function to edit each node with the same parent of the provided node
*/
function editSiblings(node, editFunction = undefined) {
    if (node.parent && !(node instanceof sg.Artboard)) {
        node.parent.children.forEach(function(siblingNode) {
            if (siblingNode != node) {
                try {
                    if (editFunction) {
                        editFunction(siblingNode);
                    } else {
                        console.log("I am ready to try to edit the sibling but you didn't provide an edit function");
                    }
                    siblingNode.fill = new sg.Color("#115588");
                    siblingNode.fill = new sg.Color("#885511");
                    console.log("Assigned stroke and fill to siblingNode: " + siblingNode.name);    
                } catch (err) {
                    console.log("Failed to edit siblingNode: " + siblingNode.name + " Error: " + err);
                }
            }
        });
    }
}


function deleteChildren(node) {
    if (node.children.length) {
        console.log("Try to delete the node children of: " + node.name);
        try {
            node.children.forEach(function(childNode) {
                //deleteChildren(childNode);
                childNode.removeFromParent();  
            });
        } catch(err) {
            console.log("Couldn't delete the node: " + err)
        }
    }
}

function validateEditContext(editContextNode) {
    // valiodate you can select/edit any child within the edit context hierarchy
    // excpet for children of containers
    
}


function findParentRepeatGrid(node) {
    console.log("In findParentRepeatGrid");
    do {
        node = node.parent
    } while ( !(node instanceof sg.RepeatGrid) && !(node instanceof sg.Artboard) );

    if (node instanceof sg.RepeatGrid) {
        return node;
    }
}

/*
function findNodeInHierarchy(root, nodeType) {
    function takesImageFill(node) {
        console.log("In takesImageFill: " + node.name);
        return (node instanceof sg.GraphicNode) && !(node instanceof sg.Line) && !(node instanceof sg.Text);
    }

    var containerNodes = [];
    root.children.forEach(function(node) {
        console.log("Child node: " + node.name);
        if (node.isContainer) {
            console.log("Child node is a container");
            if (node instanceof sg.Group) {
                console.log("Child node is a group");
                containerNodes.push(node);
            }
        } else if (nodeType === 'text') {
            console.log("Looking for a text node");
            if (node instanceof sg.Text) {
                console.log("Found a text node");
                return node;
            } 
        } else if (takesImageFill(node)) {
            console.log("Returning an image fill node");
            return node;
        }
    });
    containerNodes.forEach(function(containerNode) {
        console.log("Calling from a container node: " + containerNode.name);
        return findNodeInHierarchy(containerNode, nodeType);
    });
}
*/

function findTextNodeInHierarchy(root) {
    function returnTextNodes(node){
        console.log("node: " + node.name);
        return (node instanceof sg.Text);
    };

    function returnGroupNodes(node){
        console.log("node: " + node.name);
        return (node instanceof sg.Group);
    };

    var foundNode;
    
    console.log("In findTextNodeInHierarchy");
    console.log(root.children.length);
    var textNode = root.children.filter(returnTextNodes)[0];
    console.log(textNode);
    //console.log("textNode: " + textNode.name);
    if (textNode) {
        console.log("return textNode");
        return textNode;
        //foundNode = returnedNode;
    }
    var containerNodes = root.children.filter(returnGroupNodes);
    console.log("containerNodes: " + containerNodes.length);
    containerNodes.forEach(function(containerNode) {
        console.log("Calling from a container node: " + containerNode.name);
        var returnedNode = findTextNodeInHierarchy(containerNode);
        console.log("returnedNode:");
        console.log(returnedNode);
        if (returnedNode) {
            foundNode = returnedNode;
        }
    });
    return foundNode;
}

function repeatGridTextAutoFill(selection) {
    console.log("In repeatGridTextAutoFill");

    var item = selection.items[0];
    if (! item) {
        console.log("No selection - bye.");
        return;
    }

    if (item instanceof sg.RepeatGrid) {
        console.log("Selected item is a repeat grid");
        // find the text field - might move out above if as the field we are to edit must be in the edit context 
        // so in the selection hierarchy
        console.log(item.children.at(0));
        var textNode = findTextNodeInHierarchy(item.children.at(0));
        console.log(textNode);
        item.attachTextDataSeries(textNode, ["1. One", "2. Two", "3. Three", "4. Four", "5. Five", "6. Six"]);
    } else {
        var rg = findParentRepeatGrid(item);
        var textNode = findTextNodeInHierarchy(rg);
        //var textNode = findTextNodeInHierarchy(item.parent);
        console.log(textNode);
        rg.attachTextDataSeries(textNode, ["1. One", "2. Two", "3. Three", "4. Four", "5. Five", "6. Six"]);
    }

}

function repeatGridImageAutoFill(selection) {
    console.log("In repeatGridImageAutoFill");

    var item = selection.items[0];
    if (! item) {
        console.log("No selection - bye.");
        return;
    }

    var repeatGrid;
    var imageContainerNode;

    if (item instanceof sg.RepeatGrid) {
        console.log("Selected item is a repeat grid");
        repeatGrid = item;
        // find the text field - might move out above if as the field we are to edit must be in the edit context 
        // so in the selection hierarchy
        console.log(item.children.at(0));
        imageContainerNode = findImageContainerNodeInHierarchy(item.children.at(0));
        console.log(imageContainerNode);
    } else {
        repeatGrid = findParentRepeatGrid(item);
        //imageContainerNode = findImageContainerNodeInHierarchy(repeatGrid);
        imageContainerNode = findImageContainerNodeInHierarchy(item.parent);
        console.log(imageContainerNode);
    }

    console.log("repeatGrid: ");
    console.log(repeatGrid);
    console.log("imageContainerNode: ");
    console.log(imageContainerNode);


    if (repeatGrid && imageContainerNode) {
        return fs.getPluginFolder().then(function (pluginFolder) {
            console.log("Get the plugin folder");
            // Note: you'll need to put a few image files *into the plugin folder* and list their names here
            var imageNames = ["room-1.jpg", "room-2.jpg", "room-3.jpg", "room-4.jpg"];
            return Promise.all(imageNames.map(name => pluginFolder.getEntry(name)));
        }).then(function (files) {
            console.log("Get the image files");
            var imageFills = files.map(file => {
                var fill = new sg.ImageFill(file);
                return fill;
            });
            console.log("Attach the images");
            repeatGrid.attachImageDataSeries(imageContainerNode, imageFills);
        });    
    }
}

function findImageContainerNodeInHierarchy(root) {
    console.log("In findImageContainerNodeInHierarchy");
    function takesImageFill(node) {
        console.log("In takesImageFill: " + node.name);
        return (node instanceof sg.GraphicNode) && !(node instanceof sg.Line) && !(node instanceof sg.Text) && ! node.isContainer;
    }

    function returnGroupNodes(node){
        console.log("node: " + node.name);
        return (node instanceof sg.Group);
    };

    var foundNode;
    
    var imageContainerNode = root.children.filter(takesImageFill)[0];
    console.log(imageContainerNode);
    //console.log("textNode: " + textNode.name);
    if (imageContainerNode) {
        console.log("return imageContainerNode");
        return imageContainerNode;
        //foundNode = imageContainerNode;
    }
    var containerNodes = root.children.filter(returnGroupNodes);
    console.log("containerNodes: " + containerNodes.length);

    containerNodes.forEach(function(containerNode) {
        console.log("Calling from a container node: " + containerNode.name);
        var returnedNode = findImageContainerNodeInHierarchy(containerNode);
        console.log("returnedNode:");
        console.log(returnedNode);
        if (returnedNode) {
            foundNode = returnedNode;
        }
    });
    return foundNode;
}



/*
function imageFillRepeatgrid(selection) {
    console.log("In imageFillRepeatgrid");
    function takesImageFill(node) {
        console.log("In takesImageFill: " + node.name);
        return (node instanceof sg.GraphicNode) && !(node instanceof sg.Line) && !(node instanceof sg.Text);
    }
    
    // User can either select the Repeat Grid itself (in which case we'll use the first fill-able shape node inside it)
    // or drill into the Repeat Grid and select a specific shape node inside it.
    var sel = selection.items[0];
    var rg, shape;
    if (sel instanceof sg.RepeatGrid) {
        console.log("selection is a repeat grid");
        rg = sel;
        shape = rg.children.at(0).children.filter(takesImageFill)[0];
        console.log("shape: " + shape.name);
    } else if (takesImageFill(sel)) {
        console.log("selection supports image fill: " + sel.name);
        shape = sel;
        rg = shape.parent.parent;
    }
    return fs.getPluginFolder().then(function (pluginFolder) {
        console.log("Get the plugin folder");
        // Note: you'll need to put a few image files *into the plugin folder* and list their names here
        var imageNames = ["room-1.jpg", "room-2.jpg", "room-3.jpg", "room-4.jpg"];
        return Promise.all(imageNames.map(name => pluginFolder.getEntry(name)));
    }).then(function (files) {
        console.log("Get the image files");
        var imageFills = files.map(file => {
            //var fill = sg.BitmapFill.create({scaleBehavior: sg.BitmapFill.SCALE_COVER});
            //fill.loadFromURL(file.nativePath);
            
            var fill = new sg.ImageFill(file);

            return fill;
        });
        console.log("Attach the images");
        rg.attachImageDataSeries(shape, imageFills);
    });
}
*/


exports.logAllChildNodes = logAllChildNodes;

exports.editSelectedNodes = editSelectedNodes;
exports.editChildren = editChildren;
exports.selectChildren = selectChildren;
exports.editParents = editParents;
exports.selectParents = selectParents;
exports.deleteChildren = deleteChildren;

exports.addTextToRepeatGrid = repeatGridTextAutoFill;
//exports.addImagesToRepeatGrid = imageFillRepeatgrid;
exports.addImagesToRepeatGrid = repeatGridImageAutoFill;
