const application = require("application");
const fs = require("uxp").storage;
const { root, selection, BooleanGroup, Text, Artboard, SymbolInstance } = require("scenegraph");
const interactions = require("interactions");
let renditionTimer;

const gOneImgPerSatesArray = true;

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
        previewDocument();
        //getPreviewContent();

        //getPreviewNodeDetails(); // method to traverse artboards
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
/*
    if (renditionTimer) {
        clearTimeout(renditionTimer);
        renditionTimer = null;
    }

    renditionTimer = setTimeout(
        async () => {
*/
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
/*
        }, 100
    );
*/
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

            if (gOneImgPerSatesArray) {
                console.log("Create the shared stateArray img element");
                statesArrayImage = await createImgElement(components[i], renditions);
                statesArrayImage.setAttribute("class", "child");
                images.appendChild(statesArrayImage);
            }

            let statesInfo = components[i].statesInfo;
            let states = components[i].statesArray.filter(state => true);
            console.log(states.length);
            for (let s=0; s < states.length; s++) {
                let state = states[s];
                let stateName = statesInfo.filter(info => info.stateId === state.stateId)[0].name;
                // handle interactions
                if (state.triggeredInteractions.length > 0) {
                    console.log(stateName + " has interactions");
                    console.log("State guid: " + state.guid);

                    let trigger = state.triggeredInteractions[0].trigger.type;
                    console.log("trigger: " + trigger);
                    let action = state.triggeredInteractions[0].action.type;
                    console.log("action: " + action);
                    let destination = state.triggeredInteractions[0].action.destination;
                    console.log("destination: " + destination);

                    console.log("trigger: " + trigger);
                    console.log("action: " + action);
                    console.log("destination: " + destination);

                    // make sure to get the source and destination images
                    if (! renditions[state.guid]) {
                        renditions[state.guid] = await getnodeRenditionImage(state);
                    }
                    if (! renditions[destination.guid]) {
                        renditions[destination.guid] = await getnodeRenditionImage(destination);
                    }


                    if (gOneImgPerSatesArray) {
                        console.log("Hanlde shared stateArray img element");
                        let stateMetaData = {"source": state, "destination": destination, "trigger": trigger, "action": action, "index": s};
                        interactionData.push(stateMetaData);
                        if (state.isDefaultState) {
                            console.log("Default");
                            // set img lement src to the default state rendition
                            await updateImgElement(statesArrayImage, state, renditions); 
                            //stateMetaData.source = state.guid;
                            //stateMetaData.destination = destination.guid;
                            //statesArrayImage.setAttribute("data-metadata", stateMetaData);
                            statesArrayImage.setAttribute("name", state.guid);
                        }
                    } else {
                        console.log("Create state specific img element");
                        // create an img element for each interaction node
                        // hide it if not the default, but still add it to the images div
                        
                        let stateImage = await createImgElement(state, renditions);

                        // if the state is not the default hide it
                        if (state.isDefaultState) {
                            console.log("Default");
                            stateImage.style.visibility = 'visible';
                            console.log("Set  visibility to visible");
                        } else {
                            console.log("Not default");
                            stateImage.style.visibility = 'hidden';
                            console.log("Set  visibility to hidden");
                        }

                        // add event to mimic interactions

                        // always hab=ndle mouseenter and mouseleave cursor chnages
                        stateImage.addEventListener("mouseenter", event => {
                            event.target.style.setProperty('cursor', 'pointer');
                        });
                        stateImage.addEventListener("mouseleave", event => {
                            event.target.style.setProperty('cursor', 'auto');
                        });

                        if ((trigger === "hover") && (action === "goToState")) {
                            stateImage.addEventListener("mouseenter", event => {
                                let destImgElement = document.getElementById(destination.guid);
                                destImgElement.style.visibility = 'visible';
                                let srcImgElement = document.getElementById(state.guid);
                                srcImgElement.style.visibility = 'hidden';
                                //event.target.style.setProperty('cursor', 'pointer');
                            });
                            stateImage.addEventListener("mouseleave", event => {
                                let destImgElement = document.getElementById(destination.guid);
                                destImgElement.style.visibility = 'hidden';
                                let srcImgElement = document.getElementById(state.guid);
                                srcImgElement.style.visibility = 'visible';
                                //event.target.style.setProperty('cursor', 'auto');
                            });
                        } else if (trigger === "tap") {
                            if (action === "goToState") {
                                stateImage.addEventListener("click", event => {
                                    console.log("Tap - GoToState");
                                    let destImgElement = document.getElementById(destination.guid);
                                    destImgElement.style.visibility = 'visible';
                                    let srcImgElement = document.getElementById(state.guid);
                                    srcImgElement.style.visibility = 'hidden';
                                });    
                            } else if (action === "goToArtboard") {
                                stateImage.addEventListener("click", event => {
                                    console.log("Navigate to: " + destination);
                                });
                            }
                        }


                        images.appendChild(stateImage);
                    }

                    // now add event to mimic interactions


                    //images.appendChild(stateImage);
                }
            }

            // add event handler for the componet 
            if (gOneImgPerSatesArray) {

                statesArrayImage.addEventListener("mouseenter", event => {
                    let name = event.target.getAttribute("name");
                    console.log("In mouseenter: " + name);

                    let interaction = interactionData.filter( action => action.source.guid === name )[0];
                        
                    if (interaction) {
                        console.log("We have an interaction!");

                        if (interaction.destination) {
                            event.target.style.setProperty('cursor', 'pointer');
                        }

                        if (interaction.trigger === "hover") {
                            console.log("Act on this");
                            // set img src, size and location to the detination - update metadata and name
                            updateImgElement(statesArrayImage, interaction.destination, renditions); 
                            // update metadata to reflect the desitination 
                            event.target.setAttribute("name", interaction.destination.guid);
                        }
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

                    let interaction = interactionData.filter( action => action.source.guid === name )[0];

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
                getChildInteractions(components[i]);
            }
        }

        let children = node.children.filter(child => !(child instanceof SymbolInstance));
        for (let i=0; i < children.length; i++) {
            console.log("Child: " + children[i].name);
        }
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
async function getPreviewContent() {
    console.log("In getPreviewContent");
    let previewArtboards = {};
    let renditions = {};

    
    let previewRenditions = {};

    const artboards = root.children.filter(node => node instanceof Artboard);
    artboards.forEach(artboard => {
        let artboardGuid = artboard.guid;
        console.log("Add artboard: " + artboardGuid);
        previewArtboards[artboardGuid] = [artboard];
        console.log("Iterate over the artboard children");
        artboard.children.forEach(node => {
            console.log("See if this is a component");
            if (node instanceof SymbolInstance && (application.version > "25")) {
                console.log("StatesInfo: " + JSON.stringify(node.statesInfo));            
                console.log("Is default: " + node.isDefaultState)
                node.statesArray.forEach(state => {
                //for (let i=0; i<node.stateArray.length; i++) {
                    //let state = node.stateArray[i];

                    // the order appears to match the UI, regardless the default state appears first
                    console.log("State guid: " + state.guid);
                    console.log("State default: " + state.isDefaultState);
                    console.log("State stateId: " + state.stateId);
                    console.log("State: " + state);
                    let stateName = node.statesInfo.filter(s => s.stateId === state.stateId)[0].name;
                    if (state.triggeredInteractions.length > 0) {
                        console.log("Including this state: " + stateName);
                        previewArtboards[artboardGuid].push(state);
                        /*
                        let tempFile = await createNodeRendition(state);
                        console.log("tempFile: " tempFile.name);
                        previewRenditions[state.guid] = await renderImage(tempFile);
                        */
                    } else {
                        console.log("Skip this state: " + stateName);
                    }
                //}
                });
            } else if (node.triggeredInteractions.length > 0) {
                console.log("Including this node");
                previewArtboards[artboardGuid].push(node);
            }
        });
    });

    // remove the images ... thisis just to test teh render rendiotons method
    let images = document.querySelector("#images");
    while (images.firstChild) {
        images.removeChild(images.firstChild);
    }

    let interactions = require("interactions");
    console.log("Home artboard: " + interactions.homeArtboard);

    // get the image renditions for the preview content
    let keys = Object.keys(previewArtboards);
    console.log("Keys: " + keys.length);
    // deteriomne the first artboard tp display - home or the fitrst in the list
    let homeArtboardGuid = interactions.homeArtboard ? interactions.homeArtboard.guid : keys[0];
    for (let i=0; i<keys.length; i++) {
        let key = keys[i];
        console.log("Get renditions for artboard: " + previewArtboards[key]);
        const renditionsFiles = await createRenditionsFromArray(previewArtboards[key]);
        // add images to each artboard node
        for (let j=0; j < previewArtboards[key].length; j++) {
            previewArtboards[key][j].imageFile = renditionsFiles[j].nativePath;
            //previewArtboards[key][j].image = await renderImage(renditionsFiles[j]);
            renditions[previewArtboards[key][j].guid] = await renderImage(renditionsFiles[j]);
            console.log(renditionsFiles[j].name);
        }
        //await renderImages(renditionsFiles);    
    };

    //
    await renderArtbaord(previewArtboards, homeArtboardGuid, renditions);
}

async function renderImage(imageFile) {
    const arrayBuffer = await imageFile.read({ format: fs.formats.binary });
    return base64ArrayBuffer(arrayBuffer);
}

async function renderArtbaord(previewArtboards, artboardGuid, renditions, previousArtboardGuid = undefined) {
    console.log("In renderArtbaord");
    console.log("Aartboard guid: " + artboardGuid);
    console.log("Previoud artboard guid: " + previousArtboardGuid);

    let artboardObj = previewArtboards[artboardGuid]

    // remove the images ... because we will replace the view with this artboard
    let images = document.querySelector("#images");
    while (images.firstChild) {
        images.removeChild(images.firstChild);
    }

    // the first rendition will be the artboard and the base of what we show
    let artboard = document.createElement("img");
    artboard.setAttribute("src", `data:image/png;base64,${renditions[artboardObj[0].guid]}`);
    artboard.setAttribute("width", artboardObj[0].localBounds.width);
    artboard.setAttribute("height", artboardObj[0].localBounds.height);

    artboard.setAttribute("position", "relative");
    artboard.setAttribute("class", "artboard");


    // see if the artboard has interactions
    if (artboardObj[0].triggeredInteractions.length > 0) {
        /*
        console.log("Artboard has interactions");
        console.log("Previous artboard GUID: " + previousArtboardGuid)
        console.log("Interaction trigger: " + JSON.stringify(artboardObj[0].triggeredInteractions[0].trigger));
        console.log("Interaction action type: " + JSON.stringify(artboardObj[0].triggeredInteractions[0].action.type));
        console.log("Interaction action destination: " + JSON.stringify(artboardObj[0].triggeredInteractions[0].action.destination));
        */
        // add the animation for this artboard
        artboard.addEventListener("click", e => {
            // assume the homeartboard only has a goToArtbaord action
            if (artboardObj[0].triggeredInteractions[0].action.type === "goBack") {
                renderArtbaord(previewArtboards, previousArtboardGuid, renditions, artboardObj[0].guid);

            } else {
                renderArtbaord(previewArtboards, artboardObj[0].triggeredInteractions[0].action.destination.guid, renditions, artboardObj[0].guid);
            }
        });                            
    }

    images.appendChild(artboard);

    // Add the artboard interactive nodes - only add default state for multi state components
    for (let i = 1; i < artboardObj.length; i++) {

        // skip any non default state nodes
        if ((artboardObj[i] instanceof SymbolInstance) && ! artboardObj[i].isDefaultState) {
            console.log("Skipping non default component state")
            // this may be an issue for supporting the interactiioty of this state 
            continue;
        }

        let artboardChild = document.createElement("img");
        artboardChild.setAttribute("id", artboardObj[i].guid);

//        artboardChild.setAttribute("width", artboardObj[i].width);
//        artboardChild.setAttribute("height", artboardObj[i].height);

        //artboardChild.setAttribute("src", `data:image/png;base64,${artboardObj[i].image}`);
        artboardChild.setAttribute("src", `data:image/png;base64,${renditions[artboardObj[i].guid]}`);
        
        console.log("Interaction trigger: " + JSON.stringify(artboardObj[i].triggeredInteractions[0].trigger));
        console.log("Interaction action type: " + JSON.stringify(artboardObj[i].triggeredInteractions[0].action.type));
        console.log("Interaction action destination: " + JSON.stringify(artboardObj[i].triggeredInteractions[0].action.destination));
    
        if (! (artboardObj[i] instanceof SymbolInstance)) {
            let nodeImg = document.createElement("img");
            nodeImg.setAttribute("id", artboardObj[i].guid);
            nodeImg.src = `data:image/png;base64,${renditions[artboardObj[i].guid]}`;
            //
            console.log(artboardObj[i].name + "bounds: " + JSON.stringify(artboardObj[i].boundsInParent));
            //nodeImg.left = artboardObj[i].boundsInParent.x;
            let left =artboardObj[i].boundsInParent.x + "px";
            console.log("left: " + left);
            nodeImg.style.setProperty("left", left);
            //nodeImg.top = artboardObj[i].boundsInParent.y;
            let top =artboardObj[i].boundsInParent.y + "px";
            console.log("top: " + top);
            nodeImg.style.setProperty("top", top);
            nodeImg.width = artboardObj[i].boundsInParent.width;
            nodeImg.height = artboardObj[i].boundsInParent.height;
        //    nodeImg.setAttribute("width", artboardObj[i].boundsInParent.width);
        //    nodeImg.setAttribute("height", artboardObj[i].boundsInParent.height);
            nodeImg.setAttribute("class", "child");


            if (artboardObj[i].triggeredInteractions.length > 0) {
                if (artboardObj[i].triggeredInteractions[0].trigger.type === "tap") {
                    console.log("Tap triger");
                    if (artboardObj[i].triggeredInteractions[0].action.type === "goToArtboard") {
                        console.log("Going to artboard ....")
                        nodeImg.addEventListener("click", e => {
                            console.log("Click for goToArtboard");
                            renderArtbaord(previewArtboards, artboardObj[i].triggeredInteractions[0].action.destination.guid, renditions, artboardObj[0].guid);
                        });                            
                    }
                }

            }

            images.appendChild(nodeImg);
            //artboard.appendChild(nodeImg);
        }
        if (application.version > "25") {
            if (artboardObj[i].isDefaultState) {
                // see if I can create all event handlers based on the default state
                // maybe get the states for the default state to iterate for all actions?
                // Perhaps the previous methods that get the states to get rendiotns should just 
                // get the renditions per node guid and this determine the events to use those images.

                console.log("Create div for default state");
                let nodeDiv = document.createElement("img");
                nodeDiv.setAttribute("id", artboardObj[i].guid);
                nodeDiv.src = `data:image/png;base64,${renditions[artboardObj[i].guid]}`;
                console.log(artboardObj[i].name + "bounds: " + JSON.stringify(artboardObj[i].boundsInParent));
                //nodeDiv.left = artboardObj[i].boundsInParent.x;
                //nodeDiv.top = artboardObj[i].boundsInParent.y;

                let left =artboardObj[i].boundsInParent.x + "px";
                console.log("left: " + left);
                //nodeDiv.style.setProperty("left", left);
                nodeDiv.style.left = left;
                //nodeImg.top = artboardObj[i].boundsInParent.y;
                let top =artboardObj[i].boundsInParent.y + "px";
                console.log("top: " + top);
                //nodeDiv.style.setProperty("top", top);
                nodeDiv.style.top = top;
    
                nodeDiv.width = artboardObj[i].boundsInParent.width;
                nodeDiv.height = artboardObj[i].boundsInParent.height;
                //nodeDiv.setAttribute("position", "absolute");
                nodeDiv.setAttribute("class", "child");

                artboardObj[i].statesArray.forEach(state => {
                    //console.log("State to handle: " + state);
                    if (state.triggeredInteractions.length > 0) {
                        console.log("Including this state");
                        console.log("Triger: " + state.triggeredInteractions[0].trigger.type);
                        console.log("Action: " + state.triggeredInteractions[0].action.type);
                        console.log("Destination: " + state.triggeredInteractions[0].action.destination.guid);

                        // add some event handling based on the interaction
                        if (state.triggeredInteractions[0].trigger.type === "hover") {
                            nodeDiv.addEventListener("mouseenter", e => {
                                e.target.src = `data:image/png;base64,${renditions[state.triggeredInteractions[0].action.destination.guid]}`;
                                e.target.style.setProperty('cursor', 'pointer');
                            });
                            nodeDiv.addEventListener("mouseleave", e => {
                                e.target.src = `data:image/png;base64,${renditions[state.guid]}`;
                                e.target.style.setProperty('cursor', 'auto');
                            });
                        } 
                        if (state.triggeredInteractions[0].trigger.type === "tap") {
                            console.log("Tap triger");
                            if (state.triggeredInteractions[0].action.type === "goToState") {
                                console.log("Tap - goToState");
                                nodeDiv.addEventListener("click", e => {
                                    e.target.src = `data:image/png;base64,${renditions[state.triggeredInteractions[0].action.destination.guid]}`;
                                });
                            } else if (state.triggeredInteractions[0].action.type === "goToArtboard") {
                                console.log("Going to artboard ....")
                                nodeDiv.addEventListener("click", e => {
                                    console.log("Click for goToArtboard");
                                    renderArtbaord(previewArtboards, state.triggeredInteractions[0].action.destination.guid, renditions, artboardObj[0].guid);
                                });                            
                            }
                        }
                    }
                });
                // add the divNode
                console.log("Append nodeDiv to images");
                images.appendChild(nodeDiv);
                //artboardDiv.appendChild(nodeDiv);

                if (artboardObj[i].triggeredInteractions[0].trigger.type === "hover") {
                    console.log("Hover action");
                    artboardChild.addEventListener("mouseenter", e => {
                        e.target.style.setProperty('cursor', 'pointer');
                        //setAttribute("src", `data:image/png;base64,${renditions[artboardObj[i+1].guid]}`);
                        e.target.src = `data:image/png;base64,${renditions[artboardObj[i+1].guid]}`;
    //                    e.target.addEventListener("click", e => {
    //                        console.log("Clicked!");
    //                    })
                    });
                    artboardChild.addEventListener("mouseleave", e => {
                        e.target.style.setProperty('cursor', 'auto');
                        //setAttribute("src", `data:image/png;base64,${renditions[artboardObj[i+1].guid]}`);
                        e.target.src = `data:image/png;base64,${renditions[artboardObj[i].guid]}`;
                    });
                } else if (artboardObj[i].triggeredInteractions[0].trigger.type === "tap") {
                    console.log("Tap action");
                }
                //theArtboard.push(artboardObj[i].image);
            } else {
                console.log("Not the default state ... so interaction ?");
                //createInteractiveElement(artboardObj[i]);
            }
        }
        //images.appendChild(artboardChild);
    }

    function createInteractiveElement() {
        console.log("In createInteractiveElement");
    }
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

/*
*   Iterate over the artboards to get interactions
*/
async function getPreviewNodeDetails(previewItems) {

    let images = document.querySelector("#images");

    while (images.firstChild) {
        images.removeChild(images.firstChild);
    }

    renditionTimer = setTimeout(
        async () => {
            try {
                let interactions = require("interactions");

                console.log("Homeartbaoird: " + interactions.homeArtboard);
                var allInteractions = require("interactions").allInteractions;
                console.log("All interactions: " + JSON.stringify(allInteractions));
                //
                console.log(allInteractions.length);
                allInteractions.forEach(interaction => {
                    console.log("interaction: " + JSON.stringify(interaction));
                    console.log("triggerNode: " + interaction.triggerNode);
                    //console.log("interactions: " + interaction.interactions);
                    console.log("trigger: " + interaction.interactions[0].trigger.type);
                    console.log("action: " + interaction.interactions[0].action.type);
                    console.log("destination: " + interaction.interactions[0].action.destination);
                })
                console.log("Out of allInteractions");

                const artboards = root.children.filter(node => node instanceof Artboard);

                artboards.forEach(artboard => console.log("Artboards: " + JSON.stringify(artboard.incomingInteractions)));

                const symbols = []
                const symbolNodes = [];
                artboards.forEach(artboard => artboard.children.forEach(node => {
                    if (node instanceof SymbolInstance) {
                        console.log("StatesInfo: " + JSON.stringify(node.statesInfo));
                        
                        console.log("Is default: " + node.isDefaultState)

                        let defaultState = null;
                    //    let defaultState = node.defaultState;
                    //    console.log("Default state: " + defaultState);

                        node.statesArray.forEach(state => {
                            console.log("State: " + state);
                            symbolNodes.push(state);
                            var stateObj = {};
                            console.log("state.guid: " + state.guid);
                            stateObj.node = state.guid;
                            stateObj.name = state.name;
                            console.log("state.triggeredInteractions: " + state.triggeredInteractions);
                            stateObj.interactions = state.triggeredInteractions;
                            console.log("state.statesInfo: " + state.statesInfo);
                            stateObj.info = state.statesInfo;
                            symbols.push(stateObj);
                            //symbols.push(state);
                            //symbolsInfo.push(state.statesInfo);
                        });
/*
                        if (node.isDefaultState) {
                            if (node.states.length){
                                symbolNodes.push(node);
                                console.log("Source rendition Artboard: " + artboard);
                                var nodeObj = {};
                                nodeObj.node = node.guid;
                                //nodeObj.interactions = node.triggeredInteractions;
                                nodeObj.info = node.statesInfo;
                                symbols.push(nodeObj);
                                //symbolsInfo.push(node.statesInfo);
                                node.states.forEach(state => {
                                    symbolNodes.push(state);
                                    var stateObj = {};
                                    stateObj.node = state.guid;
                            //        stateObj.interactions = state.triggeredInteractions;
                                    stateObj.info = state.statesInfo;
                                    symbols.push(stateObj);
                                    //symbols.push(state);
                                    //symbolsInfo.push(state.statesInfo);
                                });
                            }
                        } else {
                            node.statesArray.forEach(state => {
                                console.log("State: " + state);
                                symbolNodes.push(state);
                                console.log("Source rendition Artboard: " + artboard);
                                var stateObj = {};
                                console.log("state.guid: " + state.guid);
                                stateObj.node = state.guid;
                                //console.log("state.triggeredInteractions: " + state.triggeredInteractions);
                                //stateObj.interactions = state.triggeredInteractions;
                                console.log("state.statesInfo: " + state.statesInfo);
                                stateObj.info = state.statesInfo;
                                symbols.push(stateObj);
                                //symbols.push(state);
                                //symbolsInfo.push(state.statesInfo);
                            });
                        }
*/
                    
/*
                        if (node.states.length){
                            symbolNodes.push(node);
                            var nodeObj = {};
                            nodeObj.node = node.guid;
                            nodeObj.interactions = node.triggeredInteractions;
                            nodeObj.info = node.statesInfo;
                            symbols.push(nodeObj);
                            //symbolsInfo.push(node.statesInfo);
                            node.states.forEach(state => {
                                symbolNodes.push(state);
                                var stateObj = {};
                                stateObj.node = state.guid;
                                stateObj.interactions = state.triggeredInteractions;
                                stateObj.info = state.statesInfo;
                                symbols.push(stateObj);
                                //symbols.push(state);
                                //symbolsInfo.push(state.statesInfo);
                            });
                        } else if (defaultState && defaultState.states.length){
                            symbolNodes.push(defaultState);
                            var nodeObj = {};
                            nodeObj.node = defaultState.guid;
                            nodeObj.interactions = defaultState.triggeredInteractions;
                            nodeObj.info = defaultState.statesInfo;
                            symbols.push(nodeObj);
                            //symbolsInfo.push(node.statesInfo);
                            defaultState.states.forEach(state => {
                                symbolNodes.push(state);
                                var stateObj = {};
                                stateObj.node = state.guid;
                                stateObj.interactions = state.triggeredInteractions;
                                stateObj.info = state.statesInfo;
                                symbols.push(stateObj);
                                //symbols.push(state);
                                //symbolsInfo.push(state.statesInfo);
                            });   
                        } else {
                            console.log("Symbol " + node.name + " and " + defaultState === null ? defaultState.name : "null defaultState" + " do not have states");
                        }
*/
                    }
                }));

                
                symbols.forEach(symbol => {
                    console.log("Symbol node: " + JSON.stringify(symbol.node));
                    console.log("Symbol interactions: " + JSON.stringify(symbol.interactions));
                    console.log("Symbol info: " + JSON.stringify(symbol.info));
                    
                    if (symbol.interactions.length > 0) {
                        console.log(Object.keys(symbol.interactions[0].action));

                        let trigger = symbol.interactions[0].trigger['type'];
                        console.log("trigger: " + trigger);
                        let action = symbol.interactions[0].action['type'];
                        console.log("action: " + action);
                        let destination = symbol.interactions[0].action['destination'];

                        if (action === "goToArtboard") {
                            symbolNodes.push(destination);
                        }
                        console.log("destination: " + destination.guid);
                        console.log("Trigger: " + trigger + " Action: " + action + " Destination: " + destination);
                    } else {
                        console.log(symbol.name + " does not have interactions");
                    }
                });
                
                
/*
                symbolsInfo.forEach(info => {
                    console.log("Symbol info: " + JSON.stringify(info));
                });
*/                
                const renditionsFiles = await createRenditionsFromArray(symbolNodes);
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
                console.log(e)
            }
        }, 100
    );
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