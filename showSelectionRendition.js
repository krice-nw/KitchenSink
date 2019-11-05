const application = require("application");
const fs = require("uxp").storage;
const { root, selection, BooleanGroup, Text, Artboard, SymbolInstance } = require("scenegraph")
let renditionTimer;

var selectionRenditionPanel;

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
        getArtboardItems();
    }

    let rootNode = document.createElement("panel");
    rootNode.innerHTML = HTML;
    rootNode.querySelector("form").addEventListener("submit", exec);

    return rootNode;
}

exports.show = function (event) {
    if (! selectionRenditionPanel) {
        selectionRenditionPanel = create();
    }
    event.node.appendChild(selectionRenditionPanel);
    //update(selection);
}

exports.hide = function (event) {
    selectionRenditionPanel.remove()
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
                        /*
                        const renditionsFiles = await createSingleRendition(selection.editContext);
                        renditionsFiles.forEach(async renditionFile => {
                            const arrayBuffer = await renditionFile.read({ format: fs.formats.binary });
                            let image = document.createElement("img");
                            let base64 = base64ArrayBuffer(arrayBuffer);
                            image.setAttribute("src", `data:image/png;base64,${base64}`);
                            images.appendChild(image);
                        })    
                        */
                    } else {
                        console.log("Edit Context");
                        console.log(selection.items[0]);
                        /*
                        if (
                            (selection.items.length == 1) 
                            && (selection.items[0] instanceof Text)
                            && (selection.items[0].text == '')
                        ) {
                            console.log("In text insertion: Don't generate renditions");
                        } else {
                            */
                            const renditionsFiles = await createRenditions();
                            renditionsFiles.forEach(async renditionFile => {
                                const arrayBuffer = await renditionFile.read({ format: fs.formats.binary });
                                let image = document.createElement("img");
                                let base64 = base64ArrayBuffer(arrayBuffer);
                                image.setAttribute("src", `data:image/png;base64,${base64}`);
                                images.appendChild(image);
                            })    
                        /*}*/
                    }
                } else {
                    //bob = ted;
                    //throw "Bad times";
                    await showArtboardChildren();
                    /*
                    const renditionsFiles = await createArtboardRenditions(selection.focusedArtboard);
                    renditionsFiles.forEach(async renditionFile => {
                        const arrayBuffer = await renditionFile.read({ format: fs.formats.binary });
                        let image = document.createElement("img");
                        let base64 = base64ArrayBuffer(arrayBuffer);
                        image.setAttribute("src", `data:image/png;base64,${base64}`);
                        images.appendChild(image);
                    })    
                    */
                }
            } catch (e) {
                console.log(e)
            }
        }, 100
    );
}

async function getArtboardItems() {

    //
    let doc = application.currentDocument;
    console.log("Doc guid: " + doc.guid);
    console.log("Doc title: " + doc.title);

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
                //const renditionsFiles = await createArtboardRenditions(selection.focusedArtboard);

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


async function showArtboardChildren() {
    let images = document.querySelector("#images");

    const renditionsFiles = await createArtboardRenditions(selection.focusedArtboard);
    renditionsFiles.forEach(async renditionFile => {
        const arrayBuffer = await renditionFile.read({ format: fs.formats.binary });
        let image = document.createElement("img");
        let base64 = base64ArrayBuffer(arrayBuffer);
        image.setAttribute("src", `data:image/png;base64,${base64}`);
        images.appendChild(image);
    })    
}


async function createSingleRendition(node) {
    const folder = await fs.localFileSystem.getTemporaryFolder();
        const file = await folder.createFile(`${node.guid}.png`, { overwrite: true });
        console.log("file: " + file.nativePath);
        let obj = {};
        obj.node = node;
        obj.outputFile = file;
        obj.type = "png";
        obj.scale = 2;
    const renditionResults = await application.createRenditions([obj]);
    const renditionsFiles = renditionResults.map(a => a.outputFile);
    return renditionsFiles;
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

async function createArtboardRenditions(artboard) {
    const folder = await fs.localFileSystem.getTemporaryFolder();
    const arr = await artboard.children.map(async item => {
        console.log("Test" );
        const file = await folder.createFile(`${item.guid}.png`, { overwrite: true });
        console.log("file: " + file.nativePath);
        let obj = {};
        obj.node = item;
        obj.outputFile = file;
        obj.type = "png";
        obj.scale = 2;
        obj.skip = false;
        if (item instanceof BooleanGroup){
            if (selection.editContext === item) {
                console.log("Skip Boolean Group");
                obj.skip = true;
            }
        }
        return obj;
    })
    
    const renditions = await Promise.all(arr);

    var filterArr = renditions.filter(item => {return item.skip === false});
    console.log("filterArr length: " + filterArr.length);

    const renditionResults = await application.createRenditions(filterArr);
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
/*
module.exports = {
    panels: {
        example: {
            show,
            hide,
            update
        }
    }
};
*/

exports.update = update;