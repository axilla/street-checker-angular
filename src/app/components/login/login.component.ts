import { Component, OnInit, ViewChild } from '@angular/core';
import {RequestsService} from '../../services/requests.service';
import {MdSnackBar} from '@angular/material';
import {EndpointService} from "../../services/endpoint.service";
import {LocalStorageService} from "angular-2-local-storage";
import {Router} from "@angular/router";
import {UserService} from "../../services/user.service";


declare let ol: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent implements OnInit {


  @ViewChild('mapa') mapa;
  @ViewChild('name') name;
  @ViewChild('site') site;
  @ViewChild('login') login;
  @ViewChild('registerBtn') registerBtn;
  @ViewChild('registerForm') registerForm;


  public image_data = {
    image_extension: null,
    image: null
  };
  public register_data = {
    register_side: 0,
    register: true
  };


  public show_password = 'password';
  private map;

  private map_url: string = 'https://{1-4}.base.maps.cit.api.here.com' +
  '/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png' +
  '?app_id=d6Eh5wqSV7pftZkRWRGz&app_code=DjWVtBKfgfO3RUB2pu_dqg';




  constructor(
    public requestsService: RequestsService,
    private endpointService: EndpointService,
    private localStorageService: LocalStorageService,
    public userService: UserService,
    public snackBar: MdSnackBar,
    private router: Router
  ) { }


  // Angular lifecycle hook which is called on component initialization

  ngOnInit() {

    // Initialize map

    this.map = new ol.Map({

      layers: [
        new ol.layer.Tile({
          source: new ol.source.XYZ({
            url: this.map_url
          })
        })
      ],

      // Target div in html template which will contain map

      target: this.mapa.nativeElement,
      view: new ol.View({
        center: [2439871.411236484, 5363242.5681371195],
        zoom: 13
      })

    });


    // Call Welcome text animation on component init (Typed animation)

    this.fullTextAnimation();

    // Call function which returns user current location

    this.currentMapLocation();


  }

  // Function which is working with user avatar image

  public onSetImage(file): void{

    const fileReader = new FileReader();

    // Store choosen image in image_data object

    fileReader.onload = event => {
      this.image_data.image = event.target['result'];
    };

    fileReader.readAsDataURL(file[0]);

    // Store image extension in image_data object

    this.image_data.image_extension = file[0].type.slice(6, file[0].type.length);

  }

  // Fucntion which navigates unregistered user to main page

  public onAnonymousLogin(): void {
    this.snackBar.openFromComponent(LoginHelpComponent, {
      duration: 1000
    }).afterDismissed().subscribe(
      () => {},
      () => {},
      () => {
        setTimeout(() => {
          this.router.navigate(['main'])
        }, 500)
      }
    )
  }


  // Function which is called on user registration

  public onRegister(username: string, email: string, password: string): void {

    const body = new FormData();

    body.append('username', username);
    body.append('email', email);
    body.append('password', password);

    if(this.image_data.image_extension != null){
      body.append('binaryProfileImage', this.image_data.image);
      body.append('binaryProfileImageType', this.image_data.image_extension);
    }


    this.requestsService.postRequest(this.endpointService.auth.register, body).subscribe(
      data => {
        const token = data.json().user.scAccessToken;

        // Set token in localstorage

        this.localStorageService.set('token', token);
        this.snackBar.open('Yey, you are registered!', undefined, {
          duration: 1300
        })
        this.requestsService.getRequest(this.endpointService.user.self).subscribe(
          _response => {

            // Set user data in localstorage

            this.localStorageService.set('user_data', _response.json());
          },
          () => {},

          // Navigate user to main page

          () => {this.router.navigate(['main']);}
        )

      },
      err => {
        console.log(err.json(), 'error');
        this.snackBar.open('Whoops, looks like something went wrong', undefined, {
          duration: 1300
        })
      }
    )
  }

  // Function which is called on user login

  public onLogin(usernameOrEmail: string, password: string): void {


    const body = new FormData();

    body.append('usernameOrEmail', usernameOrEmail);
    body.append('password', password);


    this.requestsService.postRequest(this.endpointService.auth.login, body).subscribe(
      response => {

        const token = response.json().user.scAccessToken;

        //  Set token in localstorage

        this.localStorageService.set('token', token);

        this.requestsService.getRequest(this.endpointService.user.self).subscribe(
          _response => {
            this.localStorageService.set('user_data', _response.json());
          }
        )




        this.snackBar.openFromComponent(LoginHelpComponent, {
          duration: 1600
        }).afterDismissed().subscribe(
          () => {
            this.router.navigate(['main']);
          },

        );


      },
      () => {
        this.snackBar.openFromComponent(LoginHelp2Component, {
          duration: 4000
        });


      }
    )
  }

  //  Function which takes current location of user

  private currentMapLocation(): void {


    const geolocation = new ol.Geolocation({
      projection: this.map.getView().getProjection(),
      tracking: true,
      trackingOptions: {
        enableHighaccuracy: true,
        maximumAge: 2000
      }
    });

    // Set marker style

    const location_style = new ol.style.Style({
      image: new ol.style.Circle({

        radius: 10,
        fill: new ol.style.Fill({
          color: '#ff5722'
        }),
        stroke: new ol.style.Stroke({
          color: '#fff',
          width: 2
        })
      })
    });

    // Init location feature

    const location_feature = new ol.Feature();

    // Init location source vector

    const location_source = new ol.source.Vector({
      features: [location_feature]
    });

    // Init layer which contains location source and marker style

    const location_layer = new ol.layer.Vector({
      source: location_source,
      style: location_style
    });

    // Add layer that contains user location on map

    this.map.addLayer(location_layer);

    // Catch user current position (coordinates)

    geolocation.on('change', () => {

      const position = geolocation.getPosition();
      location_feature.setGeometry(new ol.geom.Point(position));
      this.map.getView().setCenter(position);
      this.map.getView().setZoom(13);

      this.requestsService.coords = position;
      this.requestsService.zoom = 13;


    })
  }

  // Welcome text full animation

  private fullTextAnimation(): void {

    this.welcomeText();

    // Show street checker text

    setTimeout(()=>{
      this.streetCheckerText()
    }, 2000);
  }

  // Function that types welcome text letter by letter

  private welcomeText(): void {
    const text = 'welcome to';

    //  SHOW WELCOME TEXT LETTER BY LETTER
    for(let i = 0; i<text.length; i++) {

      setTimeout(() => {

        // this.name.nativeElement.style
        this.name.nativeElement.innerHTML += text[i];

      }, 200 * i);

    }
  }

  private streetCheckerText(): void {

    this.site.nativeElement.innerHTML = 'street checker';
    this.site.nativeElement.style.display = 'block';

    //  SHOW STREET CHECKER TEXT
    setTimeout(()=>{
      this.login.nativeElement.style.display = 'flex';
    }, 2000);
  }

  // Function which flips marker on login page (login or register form)

  public registerAnimation(): number {

      // LOGIN SIDE
      if(this.register_data.register_side == 0){
        this.register_data.register_side = 180;
        setTimeout(()=> {
          this.register_data.register = !this.register_data.register;
        }, 300);
        setTimeout(()=> {

          this.registerForm.nativeElement.style.transform = 'rotateY(180deg)';
        }, 400);

        this.login.nativeElement.style.transform = 'rotateY('+this.register_data.register_side + 'deg)';


      }
      //  REGISTER SIDE
      else if(this.register_data.register_side == 180){
        this.register_data.register_side = 360;
        setTimeout(()=> {
          this.register_data.register = !this.register_data.register
        }, 300);
        this.login.nativeElement.style.transform = 'rotateY('+this.register_data.register_side + 'deg)';
        return this.register_data.register_side = 0;
      }
    }

  public showPassword(): void{
    this.show_password == 'password' ? this.show_password = 'text' : this.show_password = 'password';
  }


}



// Components that contains messages for snackbars

@Component({
  selector: 'app-login-help',
  template: `
    <div style="display: flex;justify-content: space-around;align-items: center;">
      <span style="color: #fff;">Yey, you are logged in!</span>
      <md-icon style="color: #fff; margin-left: 20px;">mood</md-icon>
    </div>
  `,
})
export class LoginHelpComponent {}


@Component({
  selector: 'app-login2-help',
  template: `
    <div style="display: flex;justify-content: space-around;align-items: center;">
      <span style="color: #fff;">Whoops, looks like something went wrong!</span>
      <md-icon style="color: #fff; margin-left: 20px;">mood_bad</md-icon>
    </div>
  `,
})
export class LoginRegisterComponent {}

@Component({
  selector: 'app-register-helpp',
  template: `
    <div style="display: flex;justify-content: space-around;align-items: center;">
      <span style="color: #fff;">Yey, you are registered!</span>
      <md-icon style="color: #fff; margin-left: 20px;">mood</md-icon>
    </div>
  `,
})
export class RegisterNotComponent {}

@Component({
  selector: 'app-register-not--help',
  template: `
    <div style="display: flex;justify-content: space-around;align-items: center;">
      <span style="color: #fff;">Looks like something went wrong</span>
      <md-icon style="color: #fff; margin-left: 20px;">mood_bad</md-icon>
    </div>
  `,
})
export class LoginHelp2Component {}
