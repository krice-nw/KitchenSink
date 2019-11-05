const fs = require("uxp").storage.localFileSystem;

/*
export async function removePluginDataContent() {
    console.log("In emptyPluginDataFolder");
    var dataFolder = await fs.getPluginFolder();
    await removeFolderContent(dataFolder);
}
*/

function removePluginDataContent() {
    console.log("In emptyPluginDataFolder");
    fs.getDataFolder().then(function (pluginFolder) {
        removeFolderContent(pluginFolder);
    });
}

async function removeFolderContent(folder) {
    console.log("In removeFolderContent: " + folder.name);

    var folderContent = await folder.getEntries();
    for (var i=0; i<folderContent.length; i++) {
        var entryType = "File";
        var item = folderContent[i];
        console.log("folderContent: " + item.name);
        if (item.isFolder) {
            // test that we can not delete a non-empty folder
            var nestedFolder = await item.getEntries();
            if (nestedFolder.length > 0) {
                try {
                    //console.log("Try to delete folder: " + item.nativePath);
                    console.log("Try to delete folder: " + item.name);
                    await item.delete();
                    console.log("Error: I should not have been able to delete a non-empty folder");
                } catch(err){
                    console.log("Success: " + err);
                }
            }
            entryType = "Folder";
            await removeFolderContent(item);
        }
        console.log("Delete " + entryType + ": " + item.name);
        await item.delete();
    }
    var updatedFolderContent = await folder.getEntries();
    return updatedFolderContent.length > 0 ? false : true;
}


/*        return fs.getPluginFolder().then(function (pluginFolder) {
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
*/

exports.removePluginDataContent = removePluginDataContent;
