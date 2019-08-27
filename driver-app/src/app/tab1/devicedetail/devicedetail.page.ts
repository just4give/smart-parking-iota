import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { async } from '@angular/core/testing';
import { Storage } from  '@ionic/storage';

@Component({
  selector: 'app-devicedetail',
  templateUrl: './devicedetail.page.html',
  styleUrls: ['./devicedetail.page.scss'],
})
export class DevicedetailPage implements OnInit {

  private deviceId:string;
  
  private balance:any="0";
  private messages:any[];
  private interval;
  private seedJson={};
  private showQRCode:boolean = false;
  constructor(private route: ActivatedRoute, private apiService:ApiService,private storage:Storage) { }

  async ngOnInit() {
    this.deviceId = this.route.snapshot.paramMap.get('id');
    console.log(this.deviceId);
    let devices = await this.storage.get("devices");
    let device = devices.filter((m)=>{ return m.DEVICE_ID == this.deviceId})[0];
    
    this.seedJson = JSON.parse(device.SEED_JSON);
    console.log("devices", this.seedJson);
    let mamResponse = await this.apiService.getMamMessages(this.deviceId).toPromise();
    this.messages = mamResponse.messages;
    console.log(mamResponse);
    let that = this;
    this.interval = setInterval(async ()=>{
      let balance = await this.apiService.getBalance(this.deviceId).toPromise();
      console.log(balance.balance);
      that.balance = balance.balance;
    },5000)
  }


  ionViewWillEnter(){
    
  }

  ionViewWillLeave(){
    clearInterval(this.interval);
  }


}
