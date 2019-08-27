const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors')
const iota_helper = require("./iota-helper");
const DBHelper = require('./db-helper');
const db_helper = new DBHelper();
const app = express();
const crypto = require('crypto');
const { asciiToTrytes, trytesToAscii } = require('@iota/converter');

const seed = "EOSHDKIVNPAFTHLJAAONNGNBYDRJWNVRDUOODZCLHN9SNOMHFKGDYXOVKQQCTDCFHVQU9BCUVRBYZHSVE";
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.use(function(error, req, res, next) {
    res.json({ message: error.message });
});
  

const PORT = process.env.PORT = 5000;

let router = express.Router();

router.post('/initiate-payment',async function(req,res,next){
  console.log("called initiate-payment",req.body);
  try {
    let parkingDeviceId = req.body.deviceId;
    let plateNo = req.body.plateNo;
    
    let carDevice = await db_helper.get(`SELECT *  FROM CAR_DEVICE WHERE PLATE_NO=?`,[plateNo]);
    let parkingDevice = await db_helper.get(`SELECT *  FROM PARKING_DEVICE WHERE DEVICE_ID=?`,[parkingDeviceId]);
    let carSeed = JSON.parse(carDevice.SEED_JSON);
    let parkingSeed = JSON.parse(parkingDevice.SEED_JSON);
    
    
    let message =
      {address:parkingSeed.receivingAddress,
      value:parkingDevice.RATE,
      plateNo: plateNo,
      deviceId:parkingDeviceId,
      type:'initiate'};
  
    let encryptedMessage = encrypt(JSON.stringify(message),carDevice.DEVICE_ID);
    let tnxObject = [{address: carSeed.receivingAddress,value: 0,message: asciiToTrytes(encryptedMessage)}];
    let r = await iota_helper.sendTransaction(seed,tnxObject,undefined);
    
    if(r ===true){
      res.json({'message' : 'Successfull'});
    }else{
      throw new Error('unsuccessful');
    }
  } catch (error) {
      console.log(error);
      next(error);
  }
  
  
});

router.post('/signup/parking-owner',async function(req,res){
    
    db_helper.run(`INSERT INTO PARKING_OWNER (USERNAME,PASSWORD) VALUES (?,?)`,
    [req.body.username,req.body.password]);

    let user = await db_helper.get(`SELECT * FROM PARKING_OWNER WHERE USERNAME=? AND PASSWORD=?`,
    [req.body.username,req.body.password]);

    res.json(user);
});

router.post('/signup/car-owner',async function(req,res){
    
    db_helper.run(`INSERT INTO CAR_OWNER (USERNAME,PASSWORD) VALUES (?,?)`,
    [req.body.username,req.body.password]);

    let user = await db_helper.get(`SELECT * FROM CAR_OWNER WHERE USERNAME=? AND PASSWORD=?`,
    [req.body.username,req.body.password]);

    res.json(user);
});

router.post('/login/car-owner',async function(req,res){
    
    let user = await db_helper.get(`SELECT * FROM CAR_OWNER WHERE USERNAME=? AND PASSWORD=?`,
    [req.body.username,req.body.password]);

    console.log(user);
    if(!user){
        res.status(401).json({ error: 'Login failed.' });
    }
    res.json(user);
    
});

router.post('/login/parking-owner',async function(req,res){
    
    let user = await db_helper.get(`SELECT * FROM PARKING_OWNER WHERE USERNAME=? AND PASSWORD=?`,
    [req.body.username,req.body.password]);

    console.log(user);
    if(!user){
        res.status(401).json({ error: 'Login failed.' });
    }
    res.json(user);
    
});

router.post('/register/car-device',async function(req,res){
    
    let record = await iota_helper.generateAddresses(req.body.seed);
    record.deviceId=req.body.deviceId;
     
    db_helper.run(`INSERT INTO CAR_DEVICE (USER_ID,DEVICE_ID,PLATE_NO,SEED_JSON) VALUES (?,?,?,?)`,
    [req.body.userId,req.body.deviceId,req.body.plateNo,JSON.stringify(record)]);

    res.json({'message' : 'Car device registered.'});
});

router.get('/init/car-device/:deviceId',async function(req,res){
    var deviceId = req.params.deviceId;
    
    let car = await db_helper.get(`SELECT *  FROM CAR_DEVICE WHERE DEVICE_ID=?`,
    [deviceId]);
    res.json(car);
    
});

router.post('/register/parking-device',async function(req,res){
    console.log(req.body);
    let record = await iota_helper.generateAddresses(req.body.seed);
    record.deviceId=req.body.deviceId;
    let mamRecord = iota_helper.getMamRoot({seed:req.body.seed,key:req.body.deviceId});
    record.firstMamRoot = mamRecord.root;
    record.sideKey = mamRecord.keyTrytes;
     
    db_helper.run(`INSERT INTO PARKING_DEVICE (USER_ID,DEVICE_ID,RATE,SEED_JSON,LAT,LNG) VALUES (?,?,?,?,?,?)`,
    [req.body.userId,req.body.deviceId,req.body.rate,JSON.stringify(record),req.body.lat,req.body.lng]);

    res.json({'message' : 'Parking device registered.'});
});

router.get('/init/parking-device/:deviceId',async function(req,res){
    var deviceId = req.params.deviceId;
    
    let car = await db_helper.get(`SELECT *  FROM PARKING_DEVICE WHERE DEVICE_ID=?`,
    [deviceId]);
    res.json(car);
    
});

router.get('/parking/mam/messeges/:deviceId',async function(req,res){

    var deviceId = req.params.deviceId;
    
    let device = await db_helper.get(`SELECT *  FROM PARKING_DEVICE WHERE DEVICE_ID=?`,
    [deviceId]);
    
    let deviceSeed = JSON.parse(device.SEED_JSON);
    let root = await iota_helper.getMamRoot({seed:deviceSeed.seed,key:device.DEVICE_ID}).root;
    let response = await iota_helper.getMessages(root,device.DEVICE_ID);
    res.json(response);
    
});

router.get('/car/mam/messeges/:deviceId',async function(req,res){

    var deviceId = req.params.deviceId;
    
    let device = await db_helper.get(`SELECT *  FROM CAR_DEVICE WHERE DEVICE_ID=?`,
    [deviceId]);
    
    let deviceSeed = JSON.parse(device.SEED_JSON);
    let root = await iota_helper.getMamRoot({seed:deviceSeed.seed,key:device.DEVICE_ID}).root;
    let response = await iota_helper.getMessages(root,device.DEVICE_ID);
    res.json(response);
    
});

router.get('/parking/balance/:deviceId',async function(req,res){

    var deviceId = req.params.deviceId;
    
    let device = await db_helper.get(`SELECT *  FROM PARKING_DEVICE WHERE DEVICE_ID=?`,
    [deviceId]);
    
    let deviceSeed = JSON.parse(device.SEED_JSON);
    let balance = await iota_helper.getBalance(deviceSeed.receivingAddress);
    
    res.json({balance:balance});
    
});

router.get('/car/balance/:deviceId',async function(req,res){

    var deviceId = req.params.deviceId;
    
    let device = await db_helper.get(`SELECT *  FROM CAR_DEVICE WHERE DEVICE_ID=?`,
    [deviceId]);
    
    let deviceSeed = JSON.parse(device.SEED_JSON);
    let balance = await iota_helper.getBalance(deviceSeed.spendingAddress);
    
    res.json({balance:balance});
    
});

router.post('/car/update/spending',async function(req,res){

    var deviceId = req.body.deviceId;
    var spendingAddress =req.body.spendingAddress;

    
    let device = await db_helper.get(`SELECT *  FROM CAR_DEVICE WHERE DEVICE_ID=?`,
    [deviceId]);
    
    let deviceSeed = JSON.parse(device.SEED_JSON);
    deviceSeed.spendingAddress = spendingAddress;
    await db_helper.run(`UPDATE CAR_DEVICE SET SEED_JSON=? WHERE DEVICE_ID=?`,
    [JSON.stringify(deviceSeed),deviceId]);

    res.json({});
    
});

router.get('/parking/devices/:userId',async function(req,res){

    var userId = req.params.userId;
    let devices = await db_helper.all(`SELECT ID,USER_ID,DEVICE_ID,RATE,LAT,LNG  FROM PARKING_DEVICE WHERE USER_ID=?`,
    [userId]);
    res.json(devices);
    
});

router.get('/parking/devices',async function(req,res){

    var userId = req.params.userId;
    let devices = await db_helper.all(`SELECT ID,DEVICE_ID,RATE,LAT,LNG  FROM PARKING_DEVICE`,
    []);
    res.json(devices);
    
});

router.get('/car/devices/:userId',async function(req,res){

    var userId = req.params.userId;
    let devices = await db_helper.all(`SELECT ID,USER_ID,DEVICE_ID,PLATE_NO,SEED_JSON  FROM CAR_DEVICE WHERE USER_ID=?`,
    [userId]);
    res.json(devices);
    
});


app.use('/api',router);

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


app.listen(PORT,function(){
  console.log('Server is running at PORT:',PORT);
});