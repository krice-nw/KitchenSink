const application = require("application");
const fs = require("uxp").storage;
const { root, selection, BooleanGroup, Text, Artboard, SymbolInstance } = require("scenegraph")
let renditionTimer;

var previewInteractionsPanel;

function create() {
    const HTML =
        `<style>
            .parent {
                margin-left: 20%;
            }
            .container {
                display: flex;
                flex-direction: column;
                flex-wrap: wrap;
                margin: auto;
            }
            img {
                flex: 1 1 auto;
                width: 100px;
                margin: auto;
                margin-bottom: 10px;
                draggable: true;
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
        getPreviewContent();
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


/*
*   Iterate over the artboards to get interactions and add interaction nodes
*   to the artboard object for later rendering
*/
async function getPreviewContent() {
    console.log("In getPreviewContent");
    let previewArtboards = {};
    let renditions = {};

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
                    console.log("State: " + state);
                    if (state.triggeredInteractions.length > 0) {
                        console.log("Including this state");
                        previewArtboards[artboardGuid].push(state);
                    }
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
    console.log("Previoud artboard guid: " + previousArtboardGuid);

    let artboardObj = previewArtboards[artboardGuid]
    console.log("Bounds width: " + artboardObj[0].localBounds.width + " height: " + artboardObj[0].localBounds.height);

    // remove the images ... because we will replace the view with this artboard
    let images = document.querySelector("#images");
    while (images.firstChild) {
        images.removeChild(images.firstChild);
    }

    let artboardDiv = document.createElement("div");
    
    artboardDiv.setAttribute("width", artboardObj[0].localBounds.width);
    artboardDiv.setAttribute("height", artboardObj[0].localBounds.height);
    //artboardDiv.setAttribute("border", "1px");
    
    console.log("Image File: " + artboardObj[0].imageFile);

    //artboardDiv.setAttribute("backgroundImage", "url('" + "data:image/png;base64," + artboardObj[0].imageFile + "')");
    //artboardDiv.setAttribute("backgroundImage", "url('" + "data:image/png;base64," + renditions[artboardObj[0].guid] + "')");
    //artboardDiv.setAttribute("backgroundImage", "url('" + artboardObj[0].imageFile + "')");

//    artboardDiv.style.backgroundImage = "url('" + "data:image/png;base64," + renditions[artboardObj[0].guid] + "')";
//    artboardDiv.style.backgroundImage = "url('" + "data:image/png;base64," + `${renditions[artboardObj[0].guid]}` + "')";
    //artboardDiv.style.backgroundImage = "url('" + "data:image/png;base64," + artboardObj[0].imageFile + "')";
//    artboardDiv.style.backgroundImage = "url('" + artboardObj[0].imageFile + "')";

    //artboardDiv.setAttribute("backgroundImage", "url('" + "data:image/png;base64," + `${renditions[artboardObj[0].guid]}` + "')";

    //artboardDiv.setAttribute("backgroundImage", "url(" + `data:image/png;base64,${renditions[artboardObj[0].guid]}` + ")");
    //artboardDiv.setAttribute("backgroundImage", `data:image/png;base64,${renditions[artboardObj[0].guid]}`);
//    artboardDiv.setAttribute("backgroundSize", "contain");


artboardDiv.style.backgroundColor = "red";
artboardDiv.style.backgroundImage = "url('" + artboardObj[0].imageFile + "')'";
artboardDiv.setAttribute("backgroundImage", `data:image/png;base64,${renditions[artboardObj[0].guid]}`);

//images.appendChild(artboardDiv);

    // the first rendition will be the artboard and the base of what we show
    console.log("Call renderImages with " + artboardObj[0].name);
    let artboard = document.createElement("img");
    //artboard.setAttribute("width", artboardObj[0].localBounds.width);
    //artboard.setAttribute("height", artboardObj[0].localBounds.height);
    //artboard.setAttribute("src", `data:image/png;base64,${artboardObj[0].image}`);
    artboard.setAttribute("src", `data:image/png;base64,${renditions[artboardObj[0].guid]}`);
    //artboard.setAttribute("width", artboardObj[0].localBounds.width);
    //artboard.setAttribute("height", artboardObj[0].localBounds.height);

    // see if the artboard has interactions
    if (artboardObj[0].triggeredInteractions.length > 0) {
        console.log("Artboard has interactions");
        console.log("Previous artboard GUID: " + previousArtboardGuid)
        console.log("Interaction trigger: " + JSON.stringify(artboardObj[0].triggeredInteractions[0].trigger));
        console.log("Interaction action type: " + JSON.stringify(artboardObj[0].triggeredInteractions[0].action.type));
        console.log("Interaction action destination: " + JSON.stringify(artboardObj[0].triggeredInteractions[0].action.destination));

        artboard.addEventListener("click", e => {
            renderArtbaord(previewArtboards, previousArtboardGuid, renditions, artboardGuid);
        });                            
    }

    artboardDiv.appendChild(artboard);
    images.appendChild(artboard);

    // now add any image that is the default state
    for (let i = 1; i < artboardObj.length; i++) {

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
                            });
                            nodeDiv.addEventListener("mouseleave", e => {
                                e.target.src = `data:image/png;base64,${renditions[state.guid]}`;
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
                        //setAttribute("src", `data:image/png;base64,${renditions[artboardObj[i+1].guid]}`);
                        e.target.src = `data:image/png;base64,${renditions[artboardObj[i+1].guid]}`;
    //                    e.target.addEventListener("click", e => {
    //                        console.log("Clicked!");
    //                    })
                    });
                    artboardChild.addEventListener("mouseleave", e => {
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
    //await renderImages(theArtboard);
//    images.appendChild(artboardDiv);
    //images.appendChild(artboard);
/*
    renditionsFiles.forEach(async theArtboard => {
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
*/ 
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