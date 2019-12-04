const application = require("application");
const fs = require("uxp").storage;
const { root, selection, BooleanGroup, Text, Artboard, SymbolInstance } = require("scenegraph");
const interactions = require("interactions");
let renditionTimer;


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
                // previewDocument();
            });
        } catch (e) {
            console.log("Error trying to prepare document preview: " + e);
        }
        
        previewDocument();

        //getPreviewItems(); // method to utilize allInteractions
    }

    let rootNode = document.createElement("panel");
    rootNode.innerHTML = HTML;
    rootNode.querySelector("form").addEventListener("submit", exec);

    rootNode.querySelector("#actionButton").addEventListener("click", () => {
        application.editDocument(() => {selection.items[0].moveInParentCoordinates(20,20)});
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
    /*
    let images = document.querySelector("#images");

    while (images.firstChild) {
        images.removeChild(images.firstChild);
    }

    if (renditionTimer) {
        clearTimeout(renditionTimer);
        renditionTimer = null;
    }
    renditionTimer = setTimeout(
        async () => {
            try {
                if (selection.items.length) {
                    if (selection.editContext instanceof BooleanGroup) {
                        console.log("In a BoleanGroup: Don't generate renditions");
                    } else {
                        console.log("Edit Context");
                        console.log(selection.items[0]);

                        //
                        let parentArtboard = getParentArtboard(selection.items[0]);
                        console.log("parentArtboard: " + parentArtboard);

                        const renditionsFiles = await createRenditions();
                        renditionsFiles.forEach(async renditionFile => {
                            const arrayBuffer = await renditionFile.read({ format: fs.formats.binary });
                            let image = document.createElement("img");
                            let base64 = base64ArrayBuffer(arrayBuffer);
                            image.setAttribute("src", `data:image/png;base64,${base64}`);
                            images.appendChild(image);
                        })    
                    }
                } 
            } catch (e) {
                console.log(e)
            }
        }, 100
    );
    */
}


function prepareDocumentPreview () {
    console.log("In prepareDocumentPreview");

    // iterate over each component on esach artborad to see if symbols shoudl be set to their default
    //     root.children.filter(node => node instanceof Artboard).forEach( artboard => {


    selection.editContext.children.filter(node => node instanceof Artboard).forEach( artboard => {
        artboard.children.filter(child => child instanceof SymbolInstance).forEach( component => {
            component.statesArray.forEach( state => {
                if (state.isDefaultState && ! state.isActiveState) {
                    console.log("Potential state change to default id " + state.stateId + " of component: " + component);
                    let activeState = component.activeState;
                    console.log("activeState: " + activeState);
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

async function getPreviewItems() {
    console.log("In getPreviewItems");

    // requird preview renditions - array of nodes for which we need images

    // start by adding all the interactions - these are key to preview
    // get the parent artboadr for any non-artboard node 

    // afterwords add any artbaords that house interactions but are not included in the interaction array of nodes ....


    let previewArtboards = {};
    let previewRenditions = [];

    let interactions = require("interactions");
    let homeArtboard = interactions.homeArtboard;
    if (! homeArtboard) {
        console.log("Failed to get homeArtboard");
    }
    console.log("Home Artboard: " + homeArtboard);

//    previewArtboards[homeArtboard.guid] = homeArtboard;

    let homeInteractionObj = {};
    homeInteractionObj.tiggerNode = homeArtboard;
    //interactionObj.interactions = interaction.interactions;
    previewArtboards[homeArtboard.guid] = [homeInteractionObj];
    //previewArtboards[homeArtboard.guid] = [homeArtboard];
    previewRenditions.push(homeArtboard);

    // now add the triggers being sure to add any containig artbaords first

    console.log("iterate over the interactions");

    let previewItems = [];
    interactions.allInteractions.forEach(interaction => {
        let triggerNode = interaction.triggerNode;
        console.log("triggerNode: " + triggerNode);
        if (triggerNode instanceof Artboard) {
            let artboardGuid = triggerNode.guid;
            if (previewArtboards[artboardGuid] === undefined) {
                console.log("Add artboard: " + triggerNode)
                let interactionObj = {};
                interactionObj.tiggerNode = triggerNode;
                interactionObj.interactions = interaction.interactions;
                previewArtboards[artboardGuid] = [interactionObj];
                //previewArtboards[artboardGuid] = [triggerNode];
                previewRenditions.push(triggerNode);
            } else {
                // should I do something here?
            }
        } else {
            let artboardContainer = getParentArtboard(triggerNode);
            if (artboardContainer) {
                let artboardGuid = artboardContainer.guid;
                if (previewArtboards[artboardGuid] === undefined) {
                    console.log("Add artboard: " + artboardContainer)
                    let interactionObj = {};
                    interactionObj.tiggerNode = artboardContainer;
                    previewArtboards[artboardGuid] = [interactionObj];
                    //previewArtboards[artboardGuid] = [artboardContainer];
                    previewRenditions.push(artboardContainer);
                }
                // now add the node 
                console.log("Add trigger node to the previewArtboards with atboard guid: " + artboardGuid);
                console.log(JSON.stringify(previewArtboards));
                console.log(JSON.stringify(previewArtboards[artboardGuid]));
                let interactionObj = {};
                interactionObj.tiggerNode = triggerNode;
                interactionObj.interactions = interaction.interactions;
                previewArtboards[artboardGuid] = [interactionObj];

                //previewArtboards[artboardGuid].push(triggerNode);
                console.log("Add triggerNode for rendition");
                previewRenditions.push(triggerNode);
            } else {
                console.log("Failed to get the containing artboard for: " + triggerNode);
            }
        }

        //previewItems.push(triggerNode);
        //AddContainingArtboard(triggerNode)
    });

    /*
    // now set up renditon requests per page to view ... we start with the home artboard
    let homeInteractions = previewArtboards[homeArtboard.guid];
    let homeInteractionRendtions = []
    homeInteractions.forEach(interaction => {

    })
    */


/*
    function AddContainingArtboard(node) {
        let artboardNode = getParentArtboard(node);
        if (artboardNode && )
    }
*/


    //
    if (application.version > "25") {
        console.log(application.version + " is gretaer than 25");
        let doc = application.activeDocument;
        console.log("Doc guid: " + doc.guid);
        console.log("Doc title: " + doc.name);    
    }


    let imageFiles = await getPreviewRenditions(previewRenditions);
    console.log("Have images");
    imageFiles.forEach(imageFile => {
        console.log("Image: " + imageFile.name);
    });
    
    console.log("Exit getPreviewItems");
}

async function getPreviewRenditions(previewItems) {
    console.log("In getPreviewRenditions");

    let renditionsFiles = [];

    let images = document.querySelector("#images");

    while (images.firstChild) {
        images.removeChild(images.firstChild);
    }

    try {
        renditionsFiles = await createRenditionsFromArray(previewItems);
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
    }    catch (e) {
        console.log(e)
    }
    return renditionsFiles;
}


async function previewDocument() {
    console.log("In previewDocument");
    let previewArtboards = {};
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
        let imageFile = await createNodeRendition(artboard);
        renditions[artboard.guid] = await renderImage(imageFile);
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

    getChildInteractions(artboard, images);

    async function getChildInteractions(node, images) {
        console.log("In getChildInteractions: " + node.name);
        if (node.children.lenght < 1) {
            console.log("No children");
            return;
        }
        console.log("We have " + node.children.length + " children");
        // I beleive all SymbolInstances now have states - even if just the default state
        //let components = node.children.filter(child => child instanceof SymbolInstance && child.statesArray.length > 0);
        let components = node.children.filter(child => child instanceof SymbolInstance);
        for (let i=0; i < components.length; i++) {
            console.log("Component: " + components[i].name);

            let statesArrayImage = undefined;
            let interactionData = [];


            if (components[i].statesArray.length < 1) {
                console.log("ERROR: SymbolInstance without states - " + components[i].name);
            }

            console.log("Create the shared stateArray img element");
            statesArrayImage = await createImgElement(components[i], renditions);
            statesArrayImage.setAttribute("class", "child");
            //images.appendChild(statesArrayImage);

            let componentHasIteractions = false;

            let statesInfo = components[i].statesInfo;
            let states = components[i].statesArray.filter(state => true);
            console.log(states.length);
            for (let s=0; s < states.length; s++) {
                let state = states[s];
                let stateName = statesInfo.filter(info => info.stateId === state.stateId)[0].name;
                console.log("STATE: " + stateName);

                // check if is the deafult state here to ensure we add the rendition for view
                if (state.isDefaultState) {
                    console.log("Default");
                    // make sure to get the defaulkt state image
                    if (! renditions[state.guid]) {
                        renditions[state.guid] = await getnodeRenditionImage(state);
                    }
                    // set img element src to the default state rendition
                    await updateImgElement(statesArrayImage, state, renditions); 
                    // set the element name to the deafult state guid
                    statesArrayImage.setAttribute("name", state.guid);

                    // check if the active state has the same width, hight and location
                    /*
                    if (! state.isAciveState) {
                        //if () {
                            setSymbolSatate(components[i], state.id);
                        //}
                    }
                    */
                }

                // handle interactions
                if (state.triggeredInteractions.length > 0) {
                    console.log(stateName + " has interactions: " + state.triggeredInteractions.length);
                    console.log("State guid: " + state.guid);

                    componentHasIteractions = true;

                    // make sure to get the source
                    if (! renditions[state.guid]) {
                        renditions[state.guid] = await getnodeRenditionImage(state);
                    }

                    for (let index = 0; index < state.triggeredInteractions.length; index++) {
                        let trigger = state.triggeredInteractions[index].trigger.type;
                        console.log("trigger: " + trigger);
                        let action = state.triggeredInteractions[index].action.type;
                        console.log("action: " + action);
                        let destination = state.triggeredInteractions[index].action.destination;
                        console.log("destination: " + destination);

                        // make sure to get the destination
                        if (! renditions[destination.guid]) {
                            renditions[destination.guid] = await getnodeRenditionImage(destination);
                        }

                        console.log("Add interaction for the shared state img element");
                        console.log("Source guid: " + state.guid + " trigger: " + trigger + " action: " + action);
                        let stateMetaData = {"source": state, "destination": destination, "trigger": trigger, "action": action, "index": s};
                        interactionData.push(stateMetaData);
                    }

                    // now add event to mimic interactions

                    //images.appendChild(stateImage);
                }
            }

            // add event handler for the componet 

            if (componentHasIteractions) {
                images.appendChild(statesArrayImage);

                statesArrayImage.addEventListener("mouseenter", event => {
                    let name = event.target.getAttribute("name");
                    console.log("In mouseenter: " + name);


                    let interactions = interactionData.filter( action => action.source.guid === name );
                    if (interactions.length > 0) {
                        event.target.style.setProperty('cursor', 'pointer');

                        interactions.forEach(interaction => {
                            if (interaction.trigger === "hover") {
                                console.log("Act on this");
                                // set img src, size and location to the detination - update metadata and name
                                updateImgElement(statesArrayImage, interaction.destination, renditions); 
                                // update metadata to reflect the desitination 
                                event.target.setAttribute("name", interaction.destination.guid);
                            }
                        });
                    } else {
                        console.log("interaction not found!");
                    }
                });

                statesArrayImage.addEventListener("mouseleave", event => {
                    let name = event.target.getAttribute("name");
                    console.log("In mouseleave: " + name);

                    event.target.style.setProperty('cursor', 'auto');

                    let interaction = interactionData.filter( interaction => interaction.destination.guid === name && interaction.trigger === "hover")[0];

                    if (interaction) {
                        console.log("Act on this");
                        // set img src, size and location to the detination - update metadata and name
                        updateImgElement(statesArrayImage, interaction.source, renditions); 
                        // update metadata to reflect the desitination 
                        event.target.setAttribute("name", interaction.source.guid);
                    }

                });

                statesArrayImage.addEventListener("click", event => {
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
                                updateImgElement(statesArrayImage, interaction.destination, renditions); 
                                // update metadata to reflect the desitination 
                                event.target.setAttribute("name", interaction.destination.guid);
                            } else if (interaction.action === "goToArtboard") {
                                console.log("Go to artboard");
                                previewArtboard(interaction.destination, renditions, artboard);
                            }
                        }
                    } else {
                        console.log("interaction not found!");
                    }
                });
            }

            // see if this is a container
            if (components[i].isContainer) {
                console.log("This is a container");
                //getChildInteractions(components[i], images);
            }
        }

        let children = node.children.filter(child => !(child instanceof SymbolInstance));
        for (let i=0; i < children.length; i++) {
            console.log("Child: " + children[i].name);
        }
    }
}

function setSymbolSatate(component, desiredStateId) {
    try {
        application.editDocument(() => {
            component.changeComponentState(desiredStateId);
        });
    } catch (e) {
        console.log("Error trying to change compoenent state: " + e);
    }
}

async function createImgElement(node, renditions) {
    let image = document.createElement("img");
    image.setAttribute("id", node.guid);
    image.width = node.boundsInParent.width;
    image.height = node.boundsInParent.height;
    image.setAttribute("class", "child");
    // setting left and top will be difficult for nested elements ...
    console.log("Set state image top and left");
    image.style.left = node.boundsInParent.x + "px";
    image.style.top = node.boundsInParent.y + "px";
    // assign source image
    if (! renditions[node.guid]) {
        renditions[node.guid] = await getnodeRenditionImage(node);
    }
    image.setAttribute("src", `data:image/png;base64,${renditions[node.guid]}`);
    return image;
}

async function updateImgElement(imgElement, node, renditions) {
    console.log("In updateImgElement: " + node.guid);
    imgElement.setAttribute("name", node.guid);
    imgElement.width = node.boundsInParent.width;
    imgElement.height = node.boundsInParent.height;
    // setting left and top will be difficult for nested elements ...
    console.log("Set state image top and left");
    imgElement.style.left = node.boundsInParent.x + "px";
    imgElement.style.top = node.boundsInParent.y + "px";
    // assign source image
    /*
    if (! renditions[node.guid]) {
        renditions[node.guid] = await getnodeRenditionImage(node);
    }
    */
    imgElement.setAttribute("src", `data:image/png;base64,${renditions[node.guid]}`);
}

async function getnodeRenditionImage(node) {
    let imageFile = await createNodeRendition(node);
    let image = await renderImage(imageFile);
    return image;
}

async function assignImgSrc(imgElement, image) {
    imgElement.setAttribute("src", `data:image/png;base64,${image}`);
    return imgElement;               
}

/*
*   Iterate over the artboards to get interactions and add interaction nodes
*   to the artboard object for later rendering
*
*   Identify the preview start screen. it should be the home artboard but if that is
*   not defined use the 0th artboard.
*/


async function renderImage(imageFile) {
    const arrayBuffer = await imageFile.read({ format: fs.formats.binary });
    return base64ArrayBuffer(arrayBuffer);
}


async function renderImages(renditionsFiles) {
    console.log("In renderImages");
    let images = document.querySelector("#images");
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
}


async function createRenditions() {
    const folder = await fs.localFileSystem.getTemporaryFolder();
    const arr = await selection.items.map(async item => {
        const file = await folder.createFile(`${item.guid}.png`, { overwrite: true });
        console.log("file: " + file.nativePath);
        let obj = {};
        obj.node = item;
        obj.outputFile = file;
        obj.type = "png";
        obj.scale = 2;
        return obj
    })
    const renditions = await Promise.all(arr);
    const renditionResults = await application.createRenditions(renditions);
    const renditionsFiles = renditionResults.map(a => a.outputFile);
    return renditionsFiles;
}


// get renditions for each item in the array
async function createRenditionsFromArray(nodeArray) {
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

// create rendition for a single node
async function createNodeRendition(node) {
    const folder = await fs.localFileSystem.getTemporaryFolder();
    let nodeArray = [node];
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
    return renditionsFiles[0];
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

exports.update = update;