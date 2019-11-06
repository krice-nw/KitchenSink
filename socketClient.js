const application = require("application");
const fs = require("uxp").storage;
const { root, selection, BooleanGroup, Text, Artboard } = require("scenegraph")
let renditionTimer;

var wsClient;

exports.createPanel = function() {
    console.log("In createPanel");  
    
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

                Name:<input id="name"></input>
                <button id="register" disabled="true">Register</button>
                <div id='data'>
                </div>

                <hr/>

                <div id="move_buttons">
                    <button id="move_up">\^</button>
                    <div>
                    <button id="move_left">\<</button>
                    <button id="move_right">\></button>
                    </div>
                    <button id="move_down">v</button>
                </div>

                <hr/>

                <button id="test_button">Test Button</button>
                <div id="test"></div>

                <hr/>

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

    function register() {
        var name = rootNode.querySelector("#name").value;
        console.log("Name: " + name);

        var uuid = getDocumentGuid();
        if (application.version > "25") {
            console.log(application.version + " is greater than 25");
            uuid = application.activeDocument.guid;
            name = application.activeDocument.name;     
        }

        // connect to the webSocket service
        connectToServer(uuid, name);

        // disable the register UI components - perhaps hide them too?
    //    rootNode.querySelector("#name").disabled = true;
    //    rootNode.querySelector("#register").disabled = true;

        let dataArea = document.querySelector("#data");
        dataArea.innerHTML = "Registered: " + name + " with live edit guid: " + uuid;
    }    
    rootNode.querySelector("#register").addEventListener("click", register);

    function enableRegister(event) {
        console.log("In getName");
        console.log(event.target.value);
        if (event.target.value.length > 0) {
            rootNode.querySelector("#register").disabled = false;
        } else {
            rootNode.querySelector("#register").disabled = true;
        }
    }
    rootNode.querySelector("#name").addEventListener("input", enableRegister);
    
    rootNode.querySelector("#test_button").addEventListener("click", function() {
        var cloud = require("cloud");
        var sharedArtifactData = JSON.stringify(cloud.getSharedArtifacts());
        console.log("sharedArtifactData: " + sharedArtifactData);
        rootNode.querySelector("#test").innerHTML = sharedArtifactData;
    });
    
    return rootNode;
}

exports.updatePanel = async function(selection, rootNode, panelUI) {
    console.log("In socketClient updatePanel");

    let registerButton = document.querySelector("#register");
}

async function getArtboardItems() {
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
                    image.addEventListener("dragstart", function(event){
                        console.log("Drag start");
                        this.style.opacity = '0.4';
                        //event.dataTransfer.setData('text/plain',this.innerHTML);
                    });
                    images.appendChild(image);
                })    
        } catch (e) {
                console.log(e)
            }
        }, 100
    );
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

function connectToServer(uuid, name) {
    console.log("In connectToServer");

    var url = "ws://localhost:8080";
    //var ws = new WebSocket(url, 'echo-protocol');
    wsClient = new WebSocket(url, 'xdplugin-protocol');

    wsClient.onopen = function () {
        console.log("Connection openned");
        // can I send a message here? ... yes
        wsClient.send(JSON.stringify({"guid":uuid, "name":name}));
    };
/*
    wsClient.addEventListener('open', function(event) {
        console.log("Connection openned");
        // can I send a message here?

    });
*/
    wsClient.addEventListener('message', function(event) {
        console.log("Socket message event: " + event.data);
        let dataObj = JSON.parse(event.data);
        if (dataObj.register) {
            wsClient.send(JSON.stringify({"message": "Glad to join you"}));
        }
    });

    /*
    try {
        client = new WebSocket(url, 'echo-protocol');
    } catch(err) {
        console.log("Failed to connect: " + err);
        return;
    }
    
    if (! client) {
        return;
    }
    */
    /*
    client.on('connectFailed', function(error) {
        console.log('Connect Error: ' + error.toString());
    });
    
    client.on('connect', function(connection) {
        console.log('WebSocket Client Connected');
        connection.on('error', function(error) {
            console.log("Connection Error: " + error.toString());
        });
        connection.on('close', function() {
            console.log('echo-protocol Connection Closed');
        });
        connection.on('message', function(message) {
            if (message.type === 'utf8') {
                console.log("Received: '" + message.utf8Data + "'");
            }
        });
        
        function sendNumber() {
            if (connection.connected) {
                var number = Math.round(Math.random() * 0xFFFFFF);
                connection.sendUTF(number.toString());
                setTimeout(sendNumber, 1000);
            }
        }
        sendNumber();
    });
    
    client.connect('ws://localhost:8080/', 'echo-protocol');
    */

}

function getDocumentGuid() {
    var rootMetadataObj = {};

    if (root.pluginData) {
        rootMetadataObj = JSON.parse(root.pluginData);
    }

    if (rootMetadataObj.liveEditAutomation) {
        return rootMetadataObj.liveEditAutomation;
    } else {
        var guid = create_UUID();
        rootMetadataObj.liveEditAutomation = guid;
        application.editDocument(() => {
            root.pluginData = JSON.stringify(rootMetadataObj);
        })
        return guid;
    }
}

function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}