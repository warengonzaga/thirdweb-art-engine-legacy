const basePath = process.cwd();
const { mkdir, exists, readdir, readFile, removeSync, remove, existsSync } = require('fs-extra');
const { FileSplitToDirectory } = require('file-split-to-directory');
const logger = require(`${basePath}/modules/WarenLogger.js`);
const cliArt = require(`${basePath}/modules/CLIArt.js`);
const prompts = require('prompts');

// paths
const buildFolder = `${basePath}/build`;
const imageFolder = `${buildFolder}/images`;
const jsonFolder = `${buildFolder}/json`;
const thirdwebFolder = `${buildFolder}/thirdweb`;
const tempFolder = `${basePath}/.temp/`;

// initialize FSTD
const fstd = new FileSplitToDirectory();

(async () => {

    let ImageArray = [];

    cliArt(); // display simple CLI art

    // get the response from the user
    const response = await prompts({
        type: 'number',
        name: 'batch',
        message: 'How many batch you would like to create?'
    });

    const createBatch = () => {

        // create folder for the batch
        mkdir(thirdwebFolder, (err) => { 
            if (err) throw err;
            logger("done", "Folder created ✅")
        });

        /**
         * startCreateBatch to start the process of batch creation
         * @param {boolean} isPreUploaded 
         */
        const startCreateBatch = (isPreUploaded) => {
            readdir(imageFolder, async (err, files) => {
                if (err) throw err;
                files.forEach((file) => {
                    ImageArray.push(file);
                });
                
                const countPerBatch = ImageArray.length / response.batch;
                fstd.directoryNameGenerator = (i) => `batch ${i + 1}`;
                if (!isPreUploaded) {
                    fstd.runSync(imageFolder, countPerBatch, thirdwebFolder);
                }
                fstd.runSync(jsonFolder, countPerBatch, thirdwebFolder);
                logger("done", "Batch created ✅");
            });
        }

        if (!existsSync(tempFolder)) {

            // start create the batch
            startCreateBatch(false); // images are not pre-uploaded
        
        } else {

            readFile(`${basePath}/.temp/temp.json`, (err, data) => {
                if (err) throw err;
                const state = JSON.parse(data);

                // start creating the batch, true if images are pre-uploaded, false if not.
                state.isPreUploaded ? startCreateBatch(true) : startCreateBatch(false);

            });

        }

        // remove image and json folder
        remove(imageFolder, (err) => { 
            if (err) throw err;
            logger("done", "Image folder removed ✅");
        });
        remove(jsonFolder, (err) => { 
            if (err) throw err;
            logger("done", "JSON folder removed ✅");
        });
    }

    // delete the _metadata.json file as it is not needed if you choose to do per batch upload
    removeSync(`${jsonFolder}/_metadata.json`, (err) => { 
        if (err) throw err;
        logger("done", "Extra metadata.json file deleted ✅");
    });

    // check if thirdweb folder exists
    if (exists(thirdwebFolder)) {
        logger("done", "Folder detected ✅");

        // if exist then delete it
        removeSync(thirdwebFolder, (err) => { 
            if (err) throw err;
            logger("done", "Folder deleted ✅");
        });

        createBatch();
    } else {        
        logger("done", "Folder doesn't exists ❎");

        createBatch();
    }

})();
