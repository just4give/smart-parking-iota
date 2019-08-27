import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Storage } from  '@ionic/storage';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  constructor(public router: Router, public apiService:ApiService, public storage:Storage) { }

  ngOnInit() {
  }

  async navTabs(){
    //you can use either of below
    this.router.navigateByUrl('/app/tabs');
    //this.navCtrl.navigateRoot('/app/tabs/(home:home)')
  }

  async navSignup(){
    console.log("signup");
    this.router.navigateByUrl('/signup');
  }

  async login(f){
    console.log("login clicked",f.value);
    let loggedInUser = await this.apiService.login(f.value).toPromise();
    if(loggedInUser){
      await this.storage.set("user", loggedInUser);
      this.router.navigateByUrl('/app/tabs');
    }
    
  }
}
