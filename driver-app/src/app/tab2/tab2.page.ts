import { Component, ElementRef, ViewChild, NgZone } from '@angular/core';
import {Geolocation} from '@ionic-native/geolocation/ngx';
import { ApiService } from '../services/api.service';
import { MqttService, IMqttMessage } from 'ngx-mqtt';
import { Subscription } from 'rxjs';

declare var google: any;

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

  @ViewChild("Map",{static: true}) mapElement: ElementRef;
  map: any;
  mapOptions: any;
  location = {lat: null, lng: null};
  markerOptions: any = {position: null, map: null, title: null};
  markers: any ={};
  apiKey: any = ''; /*Your API Key*/
  private subscription: Subscription;

  mapStyle:any =[
      {
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#f5f5f5"
          }
        ]
      },
      {
        "elementType": "labels.icon",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#616161"
          }
        ]
      },
      {
        "elementType": "labels.text.stroke",
        "stylers": [
          {
            "color": "#f5f5f5"
          }
        ]
      },
      {
        "featureType": "administrative.land_parcel",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#bdbdbd"
          }
        ]
      },
      {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#eeeeee"
          }
        ]
      },
      {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#757575"
          }
        ]
      },
      {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#e5e5e5"
          }
        ]
      },
      {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#9e9e9e"
          }
        ]
      },
      {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#ffffff"
          }
        ]
      },
      {
        "featureType": "road.arterial",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#757575"
          }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#dadada"
          }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#616161"
          }
        ]
      },
      {
        "featureType": "road.local",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#9e9e9e"
          }
        ]
      },
      {
        "featureType": "transit.line",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#e5e5e5"
          }
        ]
      },
      {
        "featureType": "transit.station",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#eeeeee"
          }
        ]
      },
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#c9c9c9"
          }
        ]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#9e9e9e"
          }
        ]
      }
    ];
    
  
  constructor(public zone: NgZone, public geolocation: Geolocation, public apiService:ApiService,
    public _mqttService: MqttService) {

    
    
  }

  async ionViewWillEnter(){
    let that = this;
    this.subscription = this._mqttService.observe('iota/parking').subscribe((message: IMqttMessage) => {
      
      let msg = JSON.parse(message.payload.toString());
      //console.log(msg);
      let marker = that.markers[msg.id];
      if(marker){
        if(msg.status ===0){
          marker.setMap(null);
          marker.setAnimation(google.maps.Animation.DROP);
        }else{
          marker.setMap(that.map);
          marker.setAnimation(google.maps.Animation.DROP);
        }
      }
      

    });

    
    var markerIcon = {
      url: './assets/marker-active.png',
      scaledSize: new google.maps.Size(35, 48),
      anchor: new google.maps.Point(32,65),
      labelOrigin: new google.maps.Point(18, -10),
    };

    this.geolocation.getCurrentPosition().then((position) =>  {
      this.location.lat = position.coords.latitude;
      this.location.lng = position.coords.longitude;
      console.log(this.location);
    });
    /*Map options*/
    this.mapOptions = {
        center: {lat: 41.375610, lng: -72.215561},
        zoom: 16,
        mapTypeControl: false,
        styles: this.mapStyle
    };

    this.map = new google.maps.Map(this.mapElement.nativeElement, this.mapOptions);
    let parkings = await this.apiService.parkings().toPromise();
    console.log(parkings);
    if(parkings.length>0){
      this.map.setCenter({lat: parkings[0].LAT, lng: parkings[0].LNG}); 
    }
    //{lat: 41.375610, lng: -72.215561};
    parkings.forEach(p => {
      let markerOptions ={
        map : this.map,
        position: {lat: p.LAT, lng: p.LNG},
        label : {
          text: p.RATE+"i",
          color: "#d33939",
          fontSize: "24px",
          fontWeight: "bold"
        },
        icon : markerIcon
      }
      this.markers[p.DEVICE_ID] =  new google.maps.Marker(markerOptions);
      this.markers[p.DEVICE_ID].setAnimation(google.maps.Animation.DROP);

    });
    
  }

  ionViewWillLeave(){
    //clearInterval(this.interval);
    //this._mqttService.unsafePublish(topic, message, {qos: 1, retain: true});
    this.subscription.unsubscribe();
  }

   pinSymbol(color) {
    return {
      path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#fff',
      strokeWeight: 2,
      scale: 1.5
    };
  }
}
