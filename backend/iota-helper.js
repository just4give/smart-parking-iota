const { asciiToTrytes, trytesToAscii } = require("@iota/converter");
const Mam = require("@iota/mam");
const IOTA_PROVIDER="https://nodes.devnet.iota.org";
const IOTA = require('@iota/core').composeAPI;
const mode = 'restricted';
const depth = 3 // constant defined by IOTA - how deep to look for the tips in the Tangle
const minWeightMagnitude = 14 // constant defined by IOTA - the difficulty of PoW

const iota =  IOTA({
    provider: IOTA_PROVIDER
})

async function getMessages(root, secretKey) {
    const secretKeyTrytes = asciiToTrytes(secretKey);
    const mamMode = "restricted";

    const mamState = Mam.init(IOTA_PROVIDER, undefined);
    Mam.changeMode(mamState, mamMode, secretKeyTrytes);

    let messages = [];

    const response = await Mam.fetch(root, mamMode, secretKeyTrytes, function(data) {
        let payload = trytesToAscii(data);
        messages.push(JSON.parse(payload));
    });

    return {
        last_root: response.nextRoot,
        messages
    };
}

async function postMessage(options){

}

async function sendTransaction(seed,tnxObject, options){
    try {
        let trytes = await iota.prepareTransfers(seed,tnxObject);
        let hashes = await iota.sendTrytes(trytes,depth,minWeightMagnitude);
        
        if(hashes.length>0){
            return true;
        }else{
            return false;
        }
    } catch (error) {
        console.log(error);
    }
    
}

function getMamRoot(options) {
    const secretKey = options.key;
    const secretKeyTrytes = asciiToTrytes(secretKey);
    const senderSeed = options.seed;
    const mamMode = "restricted";

    let mamState = Mam.init(IOTA_PROVIDER, senderSeed);
    mamState = Mam.changeMode(mamState, mamMode, secretKeyTrytes);
    return {
        root: Mam.getRoot(mamState),
        keyTrytes: secretKeyTrytes
    };
}

async function  generateAddresses(seed){
    let content ={};
    content.seed=seed;
    let address1 = await iota.getNewAddress(seed,{index:0,checksum:true});
    content.receivingAddress = address1;
    let address2 = await iota.getNewAddress(seed,{index:1,checksum:true});
    content.spendingAddress = address2;
    return content;
}

async function getBalance(address){
    let response = await iota.getBalances([address],100);
    return response.balances[0]
}

module.exports = {
    getMessages,
    getMamRoot,
    sendTransaction,
    generateAddresses,
    getBalance
};
