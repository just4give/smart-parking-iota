import { Component, OnInit } from '@angular/core';
import { Storage } from  '@ionic/storage';
import { ApiService } from 'src/app/services/api.service';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';


@Component({
  selector: 'app-newdevice',
  templateUrl: './newdevice.page.html',
  styleUrls: ['./newdevice.page.scss'],
})
export class NewdevicePage implements OnInit {

  private loading:any;
  constructor(private apiService:ApiService, private storage:Storage,private router: Router,
    private loadingController: LoadingController) { }

  ngOnInit() {
  }

  async register(form:any){
    let device = form.value;
    console.log("register device",device);
    let user = await this.storage.get("user");
    console.log(user);
    device.userId = user.id;
    this.presentLoading();
    device = await this.apiService.registerDevice(device).toPromise();
    this.router.navigateByUrl('/app/tabs/tab1');
    this.dismissLoading();
  }

  async presentLoading() {
    const loading = await this.loadingController.create({
      message: 'Your device being registered. Please wait...',
      duration: 0
    });
    await loading.present();
    
  }

  async dismissLoading(){
    this.loadingController.dismiss();
  }

}
