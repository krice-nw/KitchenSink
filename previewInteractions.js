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
        `
    function exec() {
        console.log(`exporting: ${selection.items.map(node => node.name)}`)
        getPreviewItems();
    }

    let rootNode = document.createElement("panel");
    rootNode.innerHTML = HTML;
    rootNode.querySelector("form").addEventListener("submit", exec);

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

function getParentArtboard(node) {
    console.log("In getParentArtboard: " + node);
    while (node && !(node instanceof Artboard)) {
        node = node.parent;
        console.log("parent: " + node);
    }
    console.log("Return: " + node);
    return node;
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



async function getPreviewNodeDetails(previewItems) {

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