const Mam = require('@iota/mam');
const fs = require('fs');
const crypto = require('crypto');
const { asciiToTrytes, trytesToAscii } = require('@iota/converter');
const IOTA = require('@iota/core').composeAPI;
const axios = require('axios');
const mode = 'restricted';
const depth = 3 // constant defined by IOTA - how deep to look for the tips in the Tangle
const minWeightMagnitude = 14 // constant defined by IOTA - the difficulty of PoW
const BACKEND_URL = process.env.BACKEND_URL;
const provider = 'https://nodes.devnet.iota.org'
//console.log(crypto.getCiphers());
const iota =  IOTA({
    provider: provider
})



let seed;
let deviceId;
let currentHashCount=0;
let oledMessage="Howdy!";
let mamState;
let intervalId;
let content;
let transactions;
let state;

async function publishToMam(mamMessage){
    const trytes = asciiToTrytes(JSON.stringify(mamMessage));
    const message = Mam.create(mamState, trytes);

    // Save new mamState
    mamState = message.state;

    // Attach the payload
    await Mam.attach(message.payload, message.address);
    fs.writeFileSync('./state.json', JSON.stringify(mamState.channel));
}

async function init(){

    try {
        content = JSON.parse(fs.readFileSync('seed.json'));
        state = JSON.parse(fs.readFileSync('state.json'));

        deviceId = content.deviceId;
        let secretKeyTrytes = asciiToTrytes(deviceId);

        if(!content.seed){
            let response = await axios.get(BACKEND_URL+'/api/init/car-device/'+deviceId);
        
            console.log("Device not yet registered.");
            while(!response.data){
                
                response = await axios.get(BACKEND_URL+'/api/init/car-device/'+deviceId);
                
            }
            let seedJson = JSON.parse(response.data['SEED_JSON']);
            content = seedJson;
            fs.writeFileSync('seed.json', JSON.stringify(content,null,2));
        }
        
        console.log("Devide initialized...");
        
        transactions = JSON.parse(fs.readFileSync('transactions.json'));
        currentHashCount = transactions.hashCount;

        // Initialise MAM State
        mamState = Mam.init(provider,content.seed);
        
        // Set channel mode
        mamState = Mam.changeMode(mamState, mode, secretKeyTrytes);
        
        if(state.next_root !== undefined){
            mamState.channel.next_root = state.next_root;
            mamState.channel.start = state.start;
        }

        intervalId = setInterval(checkForPayment,5000);
    } catch (error) {
        console.log(error);
    }
    

}

async function checkForPayment(){
    try {
        console.log("check for payment request");
        let hash = await iota.findTransactions({addresses:[content.receivingAddress]});
    
        if(hash.length > currentHashCount){
            //new transaction received
            let newTnxHash = hash.filter((m)=>{ return !transactions.hash.includes(m)});
            console.log("new transaction received = "+newTnxHash);
            clearInterval(intervalId);
            currentHashCount = hash.length;
            transactions.hashCount = hash.length;
            transactions.hash = hash;
            fs.writeFileSync('transactions.json', JSON.stringify(transactions,null,2));

            let tnx = await iota.getTransactionObjects(newTnxHash);
            let msg = tnx[0].signatureMessageFragment;
            let msgAsSring = trytesToAscii(msg.substring(0,msg.length-1));
            console.log("msgAsSring= ",msgAsSring);
            //console.log("deviceId= "+deviceId);
            msg = decrypt(msgAsSring,deviceId);
            console.log("decrypted= "+msg);
            let decryptedObj = JSON.parse(msg);
            
            
            
            
            if(decryptedObj.type!=='initiate'){
                return;
            }
            //make the payment
            let tnxMessage = {
                type:'paid',
                value:decryptedObj.value,
                plateNo:decryptedObj.plateNo
            }
            let encryptedMessage = encrypt(JSON.stringify(tnxMessage),decryptedObj.deviceId);

            let tnxObject = [{address: decryptedObj.address,value: decryptedObj.value,message: asciiToTrytes(encryptedMessage)}];
            
            //record to MAM
            let mamMessage = {
                message:"Making payment of "+decryptedObj.value+"i to "+decryptedObj.deviceId,
                timestamp: new Date().getTime()
            }
            
            console.log("prepareTransfers");
            let trytes = await iota.prepareTransfers(content.seed,tnxObject);
            let hashes = await iota.sendTrytes(trytes,depth,minWeightMagnitude);
            console.log("Transaction sent to tangle");
            if(hashes.length>0){
                let nextSpendingAddress = hashes[hashes.length-1].address;
                let balance = hashes[hashes.length-1].value;
                console.log("Payment made. Remaining balance= "+balance);
                content.spendingAddress = nextSpendingAddress;
                content.balance = balance;
                fs.writeFileSync('seed.json', JSON.stringify(content,null,2));
                await axios.post(BACKEND_URL+'/api/car/update/spending',content);
            }
            await publishToMam(mamMessage);
            //restart interval
            intervalId = setInterval(checkForPayment,5000);
        }
    
    } catch (error) {
        console.log(error);
    }
    
}
   
function decrypt(text,password){
    var decipher = crypto.createDecipher('aes-192-cbc',password)
    var dec = decipher.update(text,'base64','utf8')
    dec += decipher.final('utf8');
    return dec;
}

function encrypt(text,password){
    var cipher = crypto.createCipher('aes-192-cbc',password)
    var crypted = cipher.update(text,'utf8','base64')
    crypted += cipher.final('base64');
    return crypted;
}

init();
