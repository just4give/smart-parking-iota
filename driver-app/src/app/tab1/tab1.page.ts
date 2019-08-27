import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Storage } from  '@ionic/storage';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit{

  private user:any;
  private devices:any[];
  constructor(public apiService:ApiService,public storage:Storage,public navCtrl:NavController) {}

  async ngOnInit(){
      
  }

  async ionViewWillEnter(){
    this.user = await this.storage.get("user");
    this.devices = await this.apiService.devices(this.user.id).toPromise();
    await this.storage.set("devices",this.devices);
    console.log(this.devices);
  }

  async viewDetail(device){
    this.navCtrl.navigateForward('/devicedetail/'+device.id);
  }
}
