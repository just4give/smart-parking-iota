import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Storage } from  '@ionic/storage';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage implements OnInit {

  constructor(public router: Router, public apiService:ApiService, public storage:Storage,
    private loadingController: LoadingController) { }

  ngOnInit() {
  }

  async signup(f){
    this.presentLoading();
    let loggedInUser = await this.apiService.signup(f.value).toPromise();
    this.dismissLoading();
    if(loggedInUser){
      await this.storage.set("user", loggedInUser);
      this.router.navigateByUrl('/app/tabs');
    }
    
  }

  async presentLoading() {
    const loading = await this.loadingController.create({
      message: 'Please wait...',
      duration: 0
    });
    await loading.present();
    
  }

  async dismissLoading(){
    this.loadingController.dismiss();
  }

}
