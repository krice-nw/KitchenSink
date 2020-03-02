const fs = require("uxp").storage;
const { root, Artboard } = require("scenegraph");
const application = require("application");

exports.getArtboardRenditions = async function (imgType = "png", imgScale = 2) {
    console.log("In getArtboardRenditions");
    let artboards = root.children.filter(node => node instanceof Artboard);

    return getNodeRenditions(artboards, imgType, imgScale);
    /*
    try {
        const folder = await fs.localFileSystem.getTemporaryFolder();
        const arr = await artboards.map(async artboard => {
            const file = await folder.createFile(`${artboard.guid}.png`, { overwrite: true });
            console.log("artboard file: " + file.nativePath);
            let obj = {};
            obj.node = artboard;
            obj.outputFile = file;
            obj.type = imgType;
            obj.scale = imgScale;
            return obj;
        })
        
        const renditions = await Promise.all(arr);
    
        const renditionResults = await application.createRenditions(renditions);
        const renditionsFiles = renditionResults.map(a => a.outputFile);
        return renditionsFiles;
    } catch(error) {
        console.log(error);
    }
    */
}

exports.getChildNodeRenditions = function (parentNode, imgType = "png", imgScale = 2) {
    console.log("In getChildNodeRenditions");
    let nodes = getChildNodes(parentNode);
    console.log(nodes.length);
}

function getChildNodes(parent) {
    console.log("In getChildNodes");
    childNodes = [];
    parent.forEach((child) => {
        childNodes.push(child);
        if (child.hasChildren) {
            childNodes = childNodes.concat(getChildNodes(child));
        }
    });
    return childNodes;
}

async function getNodeRenditions (nodes, imgType = "png", imgScale = 2) {
    console.log("In getNodeRenditions");
    let renditionsFiles = [];
    try {
        const folder = await fs.localFileSystem.getTemporaryFolder();
        const arr = await nodes.map(async node => {
            const file = await folder.createFile(`${node.guid}.png`, { overwrite: true });
            //console.log("node file: " + file.nativePath);
            let obj = {};
            obj.node = node;
            obj.outputFile = file;
            obj.type = imgType;
            obj.scale = imgScale;
            return obj;
        })
        
        const renditions = await Promise.all(arr);
    
        const renditionResults = await application.createRenditions(renditions);
        renditionsFiles = renditionResults.map(a => a.outputFile);
        console.log("Return from getNodeRenditions: " + renditionsFiles.length);
    } catch(error) {
        console.log(error);
    }
    return renditionsFiles;
}

exports.getNodeRenditionImages = async function(nodes, imgType = "png", imgScale = 2) {
    let renditionFiles = await getNodeRenditions(nodes, imgType, imgScale);

    //console.log("rendtion files: " + renditionFiles.length);

    const  arr = await renditionFiles.map(async renditionFile => {
        const arrayBuffer = await renditionFile.read({ format: fs.formats.binary });
        let image = base64ArrayBuffer(arrayBuffer);
        return image;
    });
    const images = await Promise.all(arr);

    console.log("images: " + images.length);
    return images;
}

exports.addRenditionsToElement = function (renditions, element) {
    renditions.forEach(async renditionFile => {
        const arrayBuffer = await renditionFile.read({ format: fs.formats.binary });
        let image = document.createElement("img");
        let base64 = base64ArrayBuffer(arrayBuffer);
        image.setAttribute("src", `data:image/png;base64,${base64}`);
        element.appendChild(image);
    })    
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

exports.createBase64FromArrayBuffer = base64ArrayBuffer;
exports.getNodeRenditions = getNodeRenditions;