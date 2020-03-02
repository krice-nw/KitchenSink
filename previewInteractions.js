const application = require("application");
const fs = require("uxp").storage;
const { root, selection, BooleanGroup, Group, Text, Artboard, SymbolInstance, RepeatGrid } = require("scenegraph");
const interactions = require("interactions");
const renditionUtils = require("./modules/renditionUtils");


var previewInteractionsPanel;
/*
            .container {
                display: flex;
                flex-direction: column;
                flex-wrap: wrap;
                margin: auto;
            }
            img {
                flex: 1 1 auto;
                width: 100%;
                margin: auto;
                margin-bottom: 10px;
                draggable: true;
            }
            .c7df0022-6473-4016-ac23-da7ac2ef1a40 { left: 279.5px; top: 604.5px;}
*/
function create() {
    const HTML =
        `<style>
            .parent {
                position: relative;
                margin-left: 20%;
            }
            .container {
                position: relative;
                margin: auto;
            }
            .artboard {
                position: relative;
            }
            .child {
                position: absolute;
                top: 25px;
                left: 25px;
            }
            form {
                width:90%;
                margin: -20px;
                padding: 0px;
            }
        </style>
        <form method="dialog" id="main">
            <div class="parent">
                <div class="container" id="images">
                </div>
            </div>
            <footer><button id="ok" type="submit" uxp-variant="cta">Export</button></footer>
        </form>
        <button id="actionButton">Click me</button>
        `
    function exec() {
        console.log(`exporting: ${selection.items.map(node => node.name)}`)
        
        try {
            application.editDocument(() => {
                prepareDocumentPreview();
                //previewDocument();
            });
        } catch (e) {
            console.log("Error trying to prepare document preview: " + e);
        }
        
        if (selection.items[0] instanceof SymbolInstance) {
            getStatesRenditions(selection.items[0]);
        } else {
            previewDocument();
        }
        
        //previewDocument();
    }

    let rootNode = document.createElement("panel");
    rootNode.innerHTML = HTML;
    rootNode.querySelector("form").addEventListener("submit", exec);

    rootNode.querySelector("#actionButton").addEventListener("click", () => {
        //application.editDocument(() => {selection.items[0].moveInParentCoordinates(20,20)});
        application.editDocument(() => {
            let textElement = new Text();
            //textElement.areaBox = {"width":200, "height":100};
            //textElement.areaBox = null;
            textElement.text = "Now is the time for all good men ...";
            selection.insertionParent.addChild(textElement);
            //root.artboards[0].addChild(textElement);
        });
    });

    return rootNode;
}

exports.show = function (event) {
    if (! previewInteractionsPanel) {
        previewInteractionsPanel = create();
    }
    event.node.appendChild(previewInteractionsPanel);
    //update(selection);
}

exports.hide = function (event) {
    previewInteractionsPanel.remove()
}

async function update() {
    console.log("In showSelectionRenditions update");
}


async function getStatesRenditions(component) {
    console.log("In getStatesRenditions");
    // ensure the component is a SymbolInstance then iterate over each state 
    // to create and display its rendition
    if (!(component instanceof SymbolInstance)) {
        console.log("Error: component is not a SymbolInstance");
    }

    let imageElement = document.querySelector("#images");
    while (imageElement.firstChild) {
        imageElement.removeChild(imageElement.firstChild);
    }

    let states = [];
    component.statesInfo.forEach(stateInfo => {
        states.push(component.getState(stateInfo.stateId));
    });
    console.log("sates length: " + states.length);

    let statesRenditions = await renditionUtils.getNodeRenditions(states);
    console.log(statesRenditions.length);
    renditionUtils.addRenditionsToElement(statesRenditions, imageElement);
}


function prepareDocumentPreview () {
    console.log("In prepareDocumentPreview");

    // iterate over each component on esach artborad to see if symbols shoudl be set to their default
    //     root.children.filter(node => node instanceof Artboard).forEach( artboard => {


    selection.editContext.children.filter(node => node instanceof Artboard).forEach( artboard => {
        artboard.children.filter(child => child instanceof SymbolInstance).forEach( component => {
//          component.statesArray.forEach( state => {
            component.statesInfo.forEach( stateInfo => {
                console.log("State is defualt: " + stateInfo.isDefaultState + ", is active: " + (stateInfo.stateId === component.stateId));
                // NOTE: stateInfo.isActiveState is no longer supports isActiveState
                //if (stateInfo.isDefaultState && ! stateInfo.isActiveState) {
                if (stateInfo.isDefaultState && (stateInfo.stateId !== component.stateId)) {
                //if (state.isDefaultState && ! state.isActiveState) {
                    console.log("Potential state change to default id " + stateInfo.stateId + " of component: " + component);
                    //console.log("Potential state change to default id " + state.stateId + " of component: " + component);
                    //let activeState = component.activeState;
                    //console.log("activeState: " + activeState);
                    let state = component.getState(stateInfo.stateId)
                    if ((component.boundsInParent.width != state.boundsInParent.width) ||
                        (component.boundsInParent.height != state.boundsInParent.height) ||
                        (component.boundsInParent.x != state.boundsInParent.x) ||
                        (component.boundsInParent.y != state.boundsInParent.y)) {
                        component.changeSymbolState(state.stateId);
                    }
                }
            });
        });
    });
}


/*
    The trigger node my be a state not on canvas - could ensure isActive and/or
    Get the statesArray ron this node and deternmibe the active state and use that
    to traverse to the oarent artbiard!
*/
function getParentArtboard(node) {
    console.log("In getParentArtboard: " + node);
    // find the active state
    let activeNode = node.isInactiveState ? node.activeState: node;
    console.log("Node: " + node.guid + ", activeNode: " + activeNode.guid);
    
    while (activeNode && !(activeNode instanceof Artboard)) {
        activeNode = activeNode.parent;
        console.log("parent: " + activeNode);
    }
    console.log("Return: " + activeNode);
    return activeNode;
}


async function previewDocument() {
    console.log("In previewDocument");
//    let previewArtboards = {};
    let renditions = {};
 
    // deteriomne the first artboard tp display - home or the fitrst in the list
    let homeArtboard = interactions.homeArtboard ? interactions.homeArtboard : root.children.filter(node => node instanceof Artboard)[0];

    previewArtboard(homeArtboard, renditions)
}

async function previewArtboard(artboard, renditions, previousArtboard = undefined) {
    console.log("In previewArtboards: " + artboard.name);

    // remove previous images ... so the atboard can be rendered in a pristine manner
    let images = document.querySelector("#images");
    while (images.firstChild) {
        images.removeChild(images.firstChild);
    }
    
    if (! renditions[artboard.guid]) {
        renditions[artboard.guid] = await renditionUtils.getNodeRenditionImages([artboard]);
    }

    // create the artboard img element
    let artboardImage = document.createElement("img");
    artboardImage.setAttribute("src", `data:image/png;base64,${renditions[artboard.guid]}`);
    artboardImage.setAttribute("width", artboard.localBounds.width);
    artboardImage.setAttribute("height", artboard.localBounds.height);

    //artboardImage.setAttribute("position", "relative");
    artboardImage.setAttribute("class", "artboard");

    // see if the artboard has interactions
    if (artboard.triggeredInteractions.length > 0) {
        // add the animation for this artboard
        artboardImage.addEventListener("click", e => {
            if (artboard.triggeredInteractions[0].action.type === "goBack") {
                previewArtboard(previousArtboard, renditions, artboard);
            } else {
                previewArtboard(artboard.triggeredInteractions[0].action.destination, renditions, artboard);
            }
        });    
    }     
    
    // add the artboard image to the display
    images.appendChild(artboardImage);

//    artboard.children.forEach(child => {
//        handleNodeInteractions(child, renditions, images)
//    });
    for (let i=0; i < artboard.children.length; i++) {
        console.log("artboard topLeftInParent: " + JSON.stringify(artboard.topLeftInParent))
        await handleNodeInteractions(artboard.children.at(i), renditions, images, artboard.topLeftInParent);
    }
}




/*
*   Iterate over the artboards to get interactions and add interaction nodes
*   to the artboard object for later rendering
*
*   Identify the preview start screen. it should be the home artboard but if that is
*   not defined use the 0th artboard.
*/



// 2/26/2020
function getActiveState(symbol) {
    console.log("In getActiveState");
    let activeState = symbol.getState(symbol.stateId);
    // console log some stuff
    return activeState;
}

function getDefaultState(symbol) {
    console.log("In getDefaultState");
    let defaultState = symbol;
    if (symbol instanceof SymbolInstance) {
        symbol.statesInfo.forEach(stateInfo => {
            if (stateInfo.isDefaultState) {
                console.log("Found default state, stateId: " + stateInfo.stateId);
                if (symbol.stateId === stateInfo.stateId) {
                    console.log("Default state is active");
                } else {
                    console.log("Default state is not active");
                }
                
                defaultState = symbol.getState(stateInfo.stateId);
                //console.log(defaultState);
            }
        });
    }

    return defaultState;
}

// let renditions = await renditionUtils.getNodeRenditions(nodes);
function getSymbolInteractions(symbol) {
    console.log("In getSymbolInteractions");
    let symbolInteractions = [];
    symbol.statesInfo.forEach(stateInfo => {
        //console.log("get state for stateId: " + stateInfo.stateId);
        let state = symbol.getState(stateInfo.stateId);
        // break out to a helper function?
        state.triggeredInteractions.forEach(interaction => {
            // if the action is goToState the destination is a stateId but we nned the state
            let destination = interaction.action.destination;
            if (interaction.action.type === 'goToState') {
                destination = symbol.getState(destination.stateId);
            }
            symbolInteractions.push({
                "source": state,
                "destination": destination,
                "trigger": interaction.trigger.type,
                "action": interaction.action.type
            });
        });
    });
    //console.log("symbolInteractions:" + JSON.stringify(symbolInteractions));
    return symbolInteractions;
}

async function getSymbolInteractionRenditions(interactions, renditions) {
    console.log("In getSymbolInteractionRenditions");
    let interactionNodes = [];
    let rendtionGuids = [];

    interactions.forEach(interaction => {
        let source = interaction.source;
        if (! renditions[source.guid] && ! rendtionGuids.includes(source.guid)) {
            //console.log("Get source rendition");
            interactionNodes.push(source);
            rendtionGuids.push(source.guid);
        }

        let destination = interaction.destination;
        if (! renditions[destination.guid] && ! rendtionGuids.includes(destination.guid)) {
            //console.log("Get destination rendition");
            interactionNodes.push(destination);
            rendtionGuids.push(destination.guid);
        }
    })
    
    if (interactionNodes.length > 0) {
        //console.log("Get " + interactionNodes.length + " rendition images");
        let interactionImages = await renditionUtils.getNodeRenditionImages(interactionNodes);
        //console.log("Got " + interactionImages.length + " rendition images");
        if (interactionImages.length === rendtionGuids.length) {
            for (let x=0; x<rendtionGuids.length; x++) {
                //console.log(interactionImages[x]);
                renditions[rendtionGuids[x]] = interactionImages[x];
            }
        }
    }
}

function addInteractiveElement(symbol, interactionData, renditions, topLeftPoint) {
    console.log("In addInteractiveElement");
    //console.log("In addInteractiveElement: " + symbol.name + " parent: " + symbol.parent.name + " parent: " + symbol.parent.parent.name);
    //console.log("topLeftPoint: " + JSON.stringify(topLeftPoint));
    let defaultState = getDefaultState(symbol);
    //console.log(defaultState);
    //console.log("default state guild: " + defaultState.guid);

    // create the inital img element set to the default state
    let symbolImage = document.createElement("img");
    //console.log("We have symbolImage: " + symbolImage);
    symbolImage.setAttribute("id", defaultState.guid);
    symbolImage.width = defaultState.boundsInParent.width;
    symbolImage.height = defaultState.boundsInParent.height;
    symbolImage.setAttribute("class", "child");
    symbolImage.setAttribute("name", defaultState.guid);

    // setting left and top will be difficult for nested elements ...
    // use the symbol and not the default state to determine top left
    // because it is the same accross all states and only the currently
    // viewed state has a parent/child hieirarchy.
    if (symbol.parent instanceof Group && symbol.parent.parent instanceof RepeatGrid) {
    //if (symbol.parent instanceof Group) {
        /*
        console.log("In RepeatGrid");
        console.log("defaultState.globalBounds.x: " + defaultState.globalBounds.x);
        console.log("defaultState.globalBounds.y: " + defaultState.globalBounds.y);
        console.log("symbol.parent.boundsInParent.x: " + symbol.parent.boundsInParent.x);
        console.log("symbol.parent.boundsInParent.y: " + symbol.parent.boundsInParent.y);
        console.log("symbol.parent.parent.boundsInParent.x: " + symbol.parent.parent.boundsInParent.x);
        console.log("symbol.parent.parent.boundsInParent.y: " + symbol.parent.parent.boundsInParent.y);
        // if the symbol is in a repeast grid it sits in a n intermnidiate group
        //symbolImage.style.left = defaultState.globalBounds.x + "px";
        //symbolImage.style.top = defaultState.globalBounds.y + "px";    
        //symbolImage.style.left = symbol.parent.boundsInParent.x + "px";
        //symbolImage.style.top = symbol.parent.boundsInParent.y + "px";

        //symbolImage.style.left = symbol.topLeftInParent.x + symbol.parent.topLeftInParent.x + "px";
        //symbolImage.style.top = symbol.topLeftInParent.y + symbol.parent.topLeftInParent.y + "px";
        */
        symbolImage.style.left = topLeftPoint.x;
        symbolImage.style.top = topLeftPoint.y;

    } else {
        //console.log("Not In RepeatGrid");
        symbolImage.style.left = symbol.boundsInParent.x + "px";
        symbolImage.style.top = symbol.boundsInParent.y + "px";
    }
    // assign source image
    symbolImage.setAttribute("src", `data:image/png;base64,${renditions[defaultState.guid]}`);

    // now iterate over interactions to add transition events
    console.log("Add event listeners");
    symbolImage.addEventListener("mouseenter", event => {
        let name = event.target.getAttribute("name");
        console.log("In mouseenter: " + name);


        let interactions = interactionData.filter( action => action.source.guid === name );
        if (interactions.length > 0) {
            event.target.style.setProperty('cursor', 'pointer');

            interactions.forEach(interaction => {
                if (interaction.trigger === "hover") {
                    console.log("Act on this");
                    // set img src, size and location to the detination - update metadata and name
                    updateImageElement(symbolImage, interaction.destination, renditions); 
                    // update metadata to reflect the desitination 
                    event.target.setAttribute("name", interaction.destination.guid);
                }
            });
        } else {
            console.log("interaction not found!");
        }
    });

    symbolImage.addEventListener("mouseleave", event => {
        let name = event.target.getAttribute("name");
        console.log("In mouseleave: " + name);

        event.target.style.setProperty('cursor', 'auto');

        let interaction = interactionData.filter( interaction => interaction.destination.guid === name && interaction.trigger === "hover")[0];

        if (interaction) {
            console.log("Act on this");
            // set img src, size and location to the detination - update metadata and name
            updateImageElement(symbolImage, interaction.source, renditions); 
            // update metadata to reflect the desitination 
            event.target.setAttribute("name", interaction.source.guid);
        }

    });

    symbolImage.addEventListener("click", event => {
        let name = event.target.getAttribute("name");
        console.log("In click: " + name);

        let interaction = interactionData.filter( action => action.source.guid === name && action.trigger === "tap")[0];
        console.log(JSON.stringify(interaction));

        if (interaction) {
            console.log("We have an interaction!");

            if (interaction.trigger === "tap") {
                console.log("Act on this tap");

                if (interaction.action === "goToState") {
                    console.log("Go to state");
                    // set img src, size and location to the detination - update metadata and name
                    updateImageElement(symbolImage, interaction.destination, renditions); 
                    // update metadata to reflect the desitination 
                    event.target.setAttribute("name", interaction.destination.guid);
                } else if (interaction.action === "goToArtboard") {
                    console.log("Go to artboard");
                    previewArtboard(interaction.destination, renditions, getParentArtboard(symbol));
                }
            }
        } else {
            console.log("interaction not found!");
        }
    });    

    function updateImageElement(imageElement, node, renditions) {
        console.log("In updateImageElement");
        imageElement.setAttribute("name", node.guid);
        imageElement.width = node.boundsInParent.width;
        imageElement.height = node.boundsInParent.height;
        imageElement.setAttribute("src", `data:image/png;base64,${renditions[node.guid]}`);
        //console.log(renditions[node.guid]);
    }

    return symbolImage;
}

async function handleNodeInteractions(node, renditions, images, topLeftInParent) {
    console.log("In handleNodeInteractions: " + node.name);

    if (node instanceof SymbolInstance) {
        let interactions = getSymbolInteractions(node);
        if (interactions.length > 0) {
            await getSymbolInteractionRenditions(interactions, renditions);
            let imgElement = addInteractiveElement(node, interactions, renditions, topLeftInParent);
            images.appendChild(imgElement);
        } else {
            for(let i = 0; i < node.children.length; i++) {
                console.log("Call handleNodeInteractions from symbol");
                let topLeftPoint = updateTopLeft(topLeftInParent, node.topLeftInParent);
                await handleNodeInteractions(node.children.at(i), renditions, images, topLeftPoint);
            }    
        }
        
    } else if (node.triggeredInteractions.length > 0) {
        let interactions = getNodeInteractions(node);
        await getSymbolInteractionRenditions(interactions, renditions);
        let imgElement = addInteractiveElement(node, interactions, renditions, topLeftInParent);
        images.appendChild(imgElement);
    } else if (node.isContainer) {
        //node.children.forEach(child => handleNodeInteractions(child, renditions, images));
        for(let i = 0; i < node.children.length; i++) {
            console.log("Call handleNodeInteractions for child");
            let topLeftPoint = updateTopLeft(topLeftInParent, node.topLeftInParent);
            await handleNodeInteractions(node.children.at(i), renditions, images, topLeftPoint);
        }
    }

    function updateTopLeft(baseTopLeft, parentTopLeft) {
        console.log("In updateTopLeft");
        let topLeft = {};
        topLeft.x = baseTopLeft.x + parentTopLeft.x;
        topLeft.y = baseTopLeft.y + parentTopLeft.y;
        return topLeft;
    }
}

function getNodeInteractions(node) {
    console.log("In getNodeInteractions");
    let nodeInteractions = [];
    node.triggeredInteractions.forEach(interaction => {
        // if the action is goToState the destination is a stateId but we nned the state
        let destination = interaction.action.destination;
        nodeInteractions.push({
            "source": node,
            "destination": destination,
            "trigger": interaction.trigger.type,
            "action": interaction.action.type
        });
    });
    return nodeInteractions;
}
// end 2/26/2020


exports.update = update;