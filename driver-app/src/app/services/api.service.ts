import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {environment} from '../../environments/environment';
import { Storage } from  '@ionic/storage';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient,private storage:Storage) { }

  login(user:any):any{
    return this.http.post(environment.url+'/api/login/car-owner',user);
  }

  signup(user:any):any{
    return this.http.post(environment.url+'/api/signup/car-owner',user);
  }

  registerDevice(device:any):any{
    
    return this.http.post(environment.url+'/api/register/car-device',device);
  }

  devices(userId:number):any{
     
    return this.http.get(environment.url+'/api/car/devices/'+userId);
  }
  getMamMessages(deviceId):any{
    return this.http.get(environment.url+'/api/car/mam/messeges/'+deviceId);
  }

  getBalance(deviceId):any{
    return this.http.get(environment.url+'/api/car/balance/'+deviceId);
  }

  parkings():any{
     
    return this.http.get(environment.url+'/api/parking/devices');
  }

}
