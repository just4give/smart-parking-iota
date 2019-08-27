const http     = require('http');
const httpServ = http.createServer();
const mosca    = require('mosca');
const Mam = require('@iota/mam');
const fs = require('fs');
const { asciiToTrytes, trytesToAscii } = require('@iota/converter');
const IOTA = require('@iota/core').composeAPI;
const mode = 'restricted';
const provider = 'https://nodes.devnet.iota.org'
const axios = require('axios');
const crypto = require('crypto');

const BACKEND_URL = process.env.BACKEND_URL;
 
const iota =  IOTA({
    provider: provider
})


let seed;
let oledMessage;
let mamState;
let content = JSON.parse(fs.readFileSync('seed.json'));
let state = JSON.parse(fs.readFileSync('state.json'));
let deviceId = content.deviceId;
let transactions = JSON.parse(fs.readFileSync('transactions.json'));
let currentHashCount = 0;
const secretKeyTrytes = asciiToTrytes(deviceId);
const mqtt    = require('mqtt');
let mqttClient;


var moscaSettings = {
    port: 12883		//mosca (mqtt) port
    
  };

var mqttServ = new mosca.Server(moscaSettings);

mqttServ.attachHttpServer(httpServ);
mqttServ.on('ready',async ()=>{
    console.log("MQTT is ready");
    await init();
    setInterval(checkForIncomingPayment,10000);  
})



// fired when a message is received
mqttServ.on('published', async (packet, client)=> {
  if(client){
    if (packet.topic ==='/intiate/payment') {
        console.log("payment initiating...");
        const obj = JSON.parse(packet.payload.toString());
        let mamMessage = {
            message:"Car parked with plate no "+obj.plateNo,
            imageUrl:obj.s3Key,
            timestamp: new Date().getTime()
        }
        await publishToMam(mamMessage);
        
        //also call REST API to initial payment
        let payment = {
            deviceId: deviceId,
            plateNo: obj.plateNo
        }
        try {
            await axios.post(BACKEND_URL+'/api/initiate-payment',payment);
        } catch (error) {
            
        }
        
    }

    if(packet.topic ==='/space/occupied'){
        try {
            console.log("messaged received at /space/occupied "+ packet.payload.toString());
            let obj = JSON.parse(packet.payload.toString());
            let data = {id: deviceId};
            if(obj.occupied===true){
                data.status= 0;
            }else{
                data.status = 1;
            }
            mqttClient.publish('iota/parking', JSON.stringify(data));
        } catch (error) {
            console.log(error);
        }
        
    }
    
  }
  
});

async function publishToMam(mamMessage){
    const trytes = asciiToTrytes(JSON.stringify(mamMessage));
    const message = Mam.create(mamState, trytes);

    // Save new mamState
    mamState = message.state;

    // Attach the payload
    await Mam.attach(message.payload, message.address);
    fs.writeFileSync('./state.json', JSON.stringify(mamState.channel));
}
async function checkForIncomingPayment(){
    //console.log("check for payment");
    currentHashCount = transactions.hashCount;

    try {
        let hash = await iota.findTransactions({addresses:[content.receivingAddress]});
    
        if(hash.length > currentHashCount){
            console.log("new transaction received");
            let newTnxHash = hash.filter((m)=>{ return !transactions.hash.includes(m)});
            
            currentHashCount = hash.length;
            transactions.hashCount = hash.length;
            transactions.hash = hash;
            fs.writeFileSync('transactions.json', JSON.stringify(transactions,null,2));

            let tnx = await iota.getTransactionObjects(newTnxHash);
            let msg = tnx[0].signatureMessageFragment;
            let msgAsSring = trytesToAscii(msg.substring(0,msg.length-1));
            //console.log("msgAsSring= ",msgAsSring);
            //console.log("deviceId= "+deviceId);
            msg = decrypt(msgAsSring,deviceId);
            //console.log("decrypted= "+msg);
            let decryptedObj = JSON.parse(msg);
            
            
            
            if(decryptedObj.value>0){
                let prevBalance = content.balance||0;
                content.balance = prevBalance+decryptedObj.value;
                fs.writeFileSync('seed.json', JSON.stringify(content,null,2));

                //record to MAM
                let mamMessage = {
                    message:"Payment of "+decryptedObj.value+"i received from "+decryptedObj.plateNo,
                    timestamp: new Date().getTime()
                }
                await publishToMam(mamMessage);

                var moscaMessage = {
                    topic: '/payment/success',
                    payload: 'true', // or a Buffer
                    qos: 0, // 0, 1, or 2
                    retain: false // or true
                  };
                  
                  mqttServ.publish(moscaMessage, function() {
                    console.log('payment success posted to mosca!');
                  });
            }
            
            
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

async function init(){
    console.log("Device not yet registered...");
    if(!content.seed){
        let response = await axios.get(BACKEND_URL+'/api/init/parking-device/'+deviceId);
        while(!response.data){
            response = await axios.get(BACKEND_URL+'/api/init/parking-device/'+deviceId);
            
        }
        let seedJson = JSON.parse(response.data['SEED_JSON']);
        content = seedJson;
        fs.writeFileSync('seed.json', JSON.stringify(content,null,2));
        
        
    }
    console.log("Device initialized...");
    
    
    // Initialise MAM State
    mamState = Mam.init(provider,content.seed);
    
    // Set channel mode
    mamState = Mam.changeMode(mamState, mode, secretKeyTrytes);
    
    if(state.next_root !== undefined){
        mamState.channel.next_root = state.next_root;
        mamState.channel.start = state.start;
    }

    mqttClient  = mqtt.connect("mqtt://broker.hivemq.com",{clientId:deviceId});

    mqttClient.on("connect",()=>{	
        console.log("connected to broker.hivemq.com");
        //client.subscribe('garage/connected')
        //client.publish('garage/connected', 'true')
    })
    return true;
}
httpServ.listen(3001);
