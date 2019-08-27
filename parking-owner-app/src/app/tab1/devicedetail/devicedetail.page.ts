import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { async } from '@angular/core/testing';

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
  constructor(private route: ActivatedRoute, private apiService:ApiService) { }

  async ngOnInit() {
    this.deviceId = this.route.snapshot.paramMap.get('id');
    console.log(this.deviceId);
    
    
    let that = this;
    this.interval = setInterval(async ()=>{
      let balance = await this.apiService.getBalance(this.deviceId).toPromise();
      console.log(balance.balance);
      this.balance = balance.balance;
      let mamResponse = await this.apiService.getMamMessages(this.deviceId).toPromise();
      this.messages = mamResponse.messages;
    },5000)
  }


  ionViewWillEnter(){
    
  }

  ionViewWillLeave(){
    clearInterval(this.interval);
  }


}
