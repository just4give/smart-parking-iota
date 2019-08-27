import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Storage } from  '@ionic/storage';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page implements OnInit{

  constructor(public router: Router, public apiService:ApiService, public storage:Storage) {
    
  }

  async ngOnInit(){
    let user  = await this.storage.get("user");
    console.log("storage", user);
  }
  async logout(){
    await this.storage.remove("user");
    this.router.navigateByUrl('');
  }
}
