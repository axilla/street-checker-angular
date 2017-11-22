import { Component, OnInit, ViewChild, HostListener, Inject } from '@angular/core';
import {FormGroup, Validators, FormBuilder} from '@angular/forms';
import {LocalStorageService} from "angular-2-local-storage";
import {EndpointService} from "../../services/endpoint.service";
import {RequestsService} from "../../services/requests.service";
import {Router} from "@angular/router";
import {MdDialog, MdDialogRef} from '@angular/material';
import {ImageUploadService} from "../../services/image-upload.service";
import {MdSnackBar, MD_DIALOG_DATA} from '@angular/material';
import {UserService} from "../../services/user.service";

declare const moment: any;
declare const ol:any;
@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.sass', './leftSidenav.sass', './rightSidenav.sass']
})
export class MainComponent implements OnInit {
  //
  @ViewChild('zoombox') zoombox;
  @ViewChild('mapa') mapa;
  @ViewChild('forma') forma;
  @ViewChild('description') description;
  @ViewChild('usernameChange') usernameChange;
  @ViewChild('emailChange') emailChange;
  @ViewChild('listDisplay') listDisplay;
  // Function which is used for closing image galery on escape
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if(event.keyCode === 27){
      this.imageUploadService.onHideImage();
    }
  }
  public mapObject = {
    layers: {
      flag: {
        mapType: 0
      },
      tile : {
        normal: new ol.layer.Tile({
          source: new ol.source.XYZ({
            url: 'https://{1-4}.base.maps.cit.api.here.com' +
            '/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png' +
            '?app_id=d6Eh5wqSV7pftZkRWRGz&app_code=DjWVtBKfgfO3RUB2pu_dqg'
          })
        }),
        heatmap: new ol.layer.Tile({
          source: new ol.source.Stamen({
            layer: 'toner'
          })
        })
      }
    }
  };
  public categoryValue;
  public object_of_arrays = {
    all_points: [],
    pagination_length: [],
    search: [],
    categories: []
  };
  private popup;
  private descriptionPopup;
  public token = this.localStorageService.get('token');
  public user = this.localStorageService.get('user_data');
  public location_description = {
    level: null,
    description: null,
    title: null,
    id: null
  };
  public flags = {
    displayFlag: true,
    mapFlag: true
  };
  public sidenav_type;
  public single_location_form: FormGroup = this.formBuilder.group({
    title: [null, Validators.required],
    description: [null, Validators.required],
    type: [null, Validators.required],
    level: [null, Validators.required]
  });
  public search_form: FormGroup = this.formBuilder.group({
    title: null,
    category: null,
    date_before: null,
    date_after: null,
    active: null,
  });
  public addPointValidation = {
    add: (): string => {
      const imgLength = this.imageUploadService.imagesObject.postImages.length;
      if(this.single_location_form.valid && imgLength <= 6){
        return 'Add point';
      }
      return 'You must fill this form to add location';
    },
    upload: (): string => {
      if(this.imageUploadService.imagesObject.postImages.length  >= 6) {
        return "You can't upload more then 6 images";
      }
      return 'Upload image';
    },
    classAdd: (): string => {
      const imgLength = this.imageUploadService.imagesObject.postImages.length;
      if(this.single_location_form.valid || imgLength > 0 || imgLength <= 6){
        return 'btn done';
      }
      return 'btn done disabled'
    },
    classUpload: (): string => {
      if(this.imageUploadService.imagesObject.postImages.length <= 5){
        return 'file-enabled';
      }
      return 'file-disabled';
    }
  };
  public user_methods = {
            show_username: () => {
              const box_display = this.usernameChange.nativeElement.style.display;
              box_display != 'flex'
                ?
                this.usernameChange.nativeElement.style.display = 'flex'
                :
                this.usernameChange.nativeElement.style.display = 'none';
            },
            show_email: () => {
              const box_display = this.emailChange.nativeElement.style.display;
              box_display != 'flex'
                ?
                this.emailChange.nativeElement.style.display = 'flex'
                :
                this.emailChange.nativeElement.style.display = 'none';
            },
            update_username: (username: string): void => {
                const data = {username: username};
                this.requestService.postRequest(this.endpointService.user.update, data).subscribe(
                  response => {
                    this.user['username'] = response.json().username;
                    this.usernameChange.nativeElement.style.display = 'none';
                    this.snackBar.open('Username successfully changed', undefined, {
                      duration: 1500
                    })
                  }
                )
              },
            update_email: (email) => {
              const data = {email: email};
              this.requestService.postRequest(this.endpointService.user.update, data).subscribe(
                response => {
                  this.user['email'] = response.json().email;
                  this.emailChange.nativeElement.style.display = 'none';
                  this.snackBar.open('Email successfully changed', undefined, {
                    duration: 1500
                  })
                }
              )
            },
            logout: () => {
              this.localStorageService.clearAll();
              this.router.navigate(['']);
            }
          };
  private initialize_map_data = {
    sourceVectors: {},
    clusterSource: {},
    clusters: {},
    heatmap: new ol.layer.Heatmap({
      source: undefined,
      blur: 70,
      radius: 50,
      zIndex: 20,
      weight: (e) => {
        const level = e.get('level');
        return level / 10;
      }
    })
  };
  private map;
  constructor(private formBuilder: FormBuilder,
              private localStorageService: LocalStorageService,
              private endpointService: EndpointService,
              private requestService: RequestsService,
              private router: Router,
              public dialog: MdDialog,
              public imageUploadService: ImageUploadService,
              public userService: UserService,
              public snackBar: MdSnackBar) {}
  ngOnInit() {
    // Initialize point categories
    this.getCategories();
    // Initialize all points
    this.getAllPoints();
    // Initialize map with layers
    this.map = new ol.Map({
      target: this.mapa.nativeElement,
      layers: [
        this.mapObject.layers.tile.heatmap,
        this.mapObject.layers.tile.normal
      ],
      view: new ol.View({
        center: this.requestService.coords,
        zoom: this.requestService.zoom,
        minZoom: 4
      })
    });
    this.mapSelect();
    setTimeout(() => {
      this.map.updateSize()
    }, 1);
    // If user was on page with point details and then he navigated back to map, center map on that point and open modal with point details
    if(this.requestService.openPopup == 1){
      this.location_description.level = this.requestService.locationDescription['level'];
      this.location_description.description = this.requestService.locationDescription['description'];
      this.location_description.title = this.requestService.locationDescription['title'];;
      this.location_description.id = this.requestService.locationDescription['id'];
      this.descriptionPopup.setPosition(this.requestService.coords);
    }
    }
  // Get all point categories and set random color for each category
  private getCategories(): void {
    this.requestService.getRequest(this.endpointService.report.categories).subscribe(
      response => {
        console.log(response.json());
        const body = response.json();
        this.object_of_arrays.categories = body;
        const max_color_value = 16777215 ;
        const range = Math.floor(max_color_value / body.length);
        for(let i = range, y = 0; i <= max_color_value ; i+=range, y++) {
          const decimal_value = i-Math.floor(range/3);
          const _color = '#' + decimal_value.toString(16);
          Object.assign(this.object_of_arrays.categories[y], {color: _color});

        }
      },
      () => {},
      () => {
        this.setSourceVectors();
        this.setClusterSource();
        this.setCluser();
        for (const key in this.initialize_map_data.clusters) {
          const value = this.initialize_map_data.clusters[key];
          this.map.addLayer(value);
        }
      }
    )
  }
  // Initialize source vector for each category
  private setSourceVectors(): void {
    for(const key in this.object_of_arrays.categories){
      const _category = this.object_of_arrays.categories[key]['title'];
      Object.assign(this.initialize_map_data.sourceVectors, {[_category]: new ol.source.Vector({})});
    }
  };
  // Initialize cluster for each category
  private setClusterSource(): void {
    for(const key in this.initialize_map_data.sourceVectors){
      const _source = this.initialize_map_data.sourceVectors[key];
      const sourceVector = new ol.source.Cluster({
        distance: 40,
        source: _source
      });
      Object.assign(this.initialize_map_data.clusterSource,{[key]: sourceVector});
    }
  }
  // Set style for cluster and show number of points in cluster
  private setCluser(): void {
    for(const key in this.initialize_map_data.clusterSource){
      const _source = this.initialize_map_data.clusterSource[key];
      const _category = this.object_of_arrays.categories.find( cat => {return cat.title == key})
      const styleCache = {};
      const styleObj = (array) => {
        return new ol.style.Style({
          image: new ol.style.Circle({
            radius: 10,
            stroke: new ol.style.Stroke({
              color: '#fff',
              width: 2
            }),
            fill: new ol.style.Fill({
              color: _category['color']
            })
          }),
          text: new ol.style.Text({
            text: array.length.toString(),
            fill: new ol.style.Fill({
              color: '#fff'
            })
          })
        });
      };
      const vector = new ol.layer.Vector({
        source: _source,
        style: function(feature) {
          const features = feature.get('features');
          let style = styleObj(features);
          if(features.length != 0){
            style = styleCache[features.length];
            if (!style) {
              style = styleObj(features);
              styleCache[features.length] = style;
            }
          }
          return style;
        }
      });
      Object.assign(this.initialize_map_data.clusters, {[key]: vector});
    }
  }
  public navigateBack(): void{
    const mapStyle = this.mapa.nativeElement.style;
    mapStyle.width = 'initial';
    mapStyle.visibility = 'visible';
    setTimeout(() => {
      this.map.updateSize()
    },1);
    this.flags.displayFlag = true;
  }

  // Get all points and show them on map
  private getAllPoints(): void {
    this.requestService.getRequest(this.endpointService.report.get).subscribe(
      data => {
        const body = data.json().list;
        this.object_of_arrays.all_points = body;
        this.object_of_arrays.pagination_length = body;
        this.object_of_arrays.search = body.slice(0, 15);
      },
      err => {
        console.log(err);
      },
      () => {
        this.initFeatures(this.object_of_arrays.all_points);
      })
  };
  // Function that is called on map click event
  private mapSelect(): void {
    // Add point modal overlay. User will see this modal if he click on map
    this.popup = new ol.Overlay({
      element: this.forma.nativeElement,
      position: 'undefined',
      autoPan: false,
      positioning: 'center-center',
      id: 'popup',
      autoPanMargin: 100
    });
    // Description modal overlay. User will see this modal when point is selected
    this.descriptionPopup = new ol.Overlay({
      element: this.description.nativeElement,
      position: undefined,
      positioning: 'center-center',
      id: 'descriptionPopup',
      autoPan: false,
      autoPanMargin: 100
    });
    // Add modal overlays to map
    this.map.addOverlay(this.popup);
    this.map.addOverlay(this.descriptionPopup);

    const selectFeature = new ol.interaction.Select({
      condition: ol.events.condition.click
    });
    this.map.addInteraction(selectFeature);

    // Map click event
    this.map.on('click', (e) => {
      let flag = 0;
      this.map.forEachFeatureAtPixel(e.pixel, (feature) => {
        // Check if clicked location contains feature (point)
        if(feature.get('features') != undefined && feature.get('features').length == 1) {
          const point = feature.get('features')[0].getProperties();
          this.location_description.level = point.level;
          this.location_description.description = point.description.slice(0, 180);
          this.location_description.title = point.title;
          this.location_description.id = point.id
          flag = 1;
        }
        else {
          if(this.mapObject.layers.flag.mapType == 0){
            this.pointAuth();
            flag = 2;
          }
        }
      });
      // If clicked location doesn't contain features, open Add point modal (User can't add point if he is unregistered)
      if(flag == 0 && this.token && this.mapObject.layers.flag.mapType == 0){
        this.descriptionPopup.setPosition(undefined)
        this.popup.setPosition(e.coordinate)
        this.map.getView().animate({
          center: e.coordinate,
          duration: 1000
        })
      }
      // If clicked location contains feature, open Description modal for that feature (point)
      else if(flag == 1 && this.mapObject.layers.flag.mapType == 0){
        this.popup.setPosition(undefined)
        // descriptionPopup.setPosition(this.map.getView().getCenter())
        this.descriptionPopup.setPosition(e.coordinate)
        this.map.getView().animate({
          center: e.coordinate,
          duration: 1000
        })
      }
    });
  };
  // Initialize point features on map
  private initFeatures(array: any): void {
    array.forEach(element => {
       const lat = element['lat'];
       const lng = element['lng'];
       const coords = new ol.proj.fromLonLat([lng, lat]);
       const point = new ol.Feature({
         geometry: new ol.geom.Point(coords),
         description: element['description'],
         level: element['level'],
         title: element['title'],
         id: element['id'],
         category: element['category']
       });
       for(const key in this.initialize_map_data.sourceVectors){
         if(key == element['category']){
           this.initialize_map_data.sourceVectors[key].addFeature(point);
         }
       }


    })
  };
  // Simple message for user
  public pointAuth() {
    this.snackBar.open('Please choose single point', undefined, {
      duration: 2000,
    });
  };
  // Navigate user to page with point details
  public onNavigateToReport(_id: number): void {
    const id = this.location_description.id;
    id != undefined ? this.router.navigate(['report', id]) : this.router.navigate(['report', _id]);
  }
  // Function which is called on user search
  public userSearch(): void {

    const form = this.search_form.controls;
    const postData = {};
    for(const key in form){
      const value = form[key].value;
      const _key = key
      if(value != null) {
        if(key == 'date_before' || key == 'date_after' ){
          postData[key] = moment(value).format('YYYY-MM-DD HH:mm:ss');
        }
        else{
          postData[key] = value;
        }
      }
    }
    this.requestService.postRequest(this.endpointService.report.search, postData).subscribe(
      response => {
        const body = response.json();
        this.resetSourceVector(body);
      }
    )
  };
  // Let user choose between showing point on map or showing points in list
  public changeMapDisplay(value: string): void{
    const mapStyle = this.mapa.nativeElement.style;
    if(value == '1'){
      mapStyle.width = 'initial';
      mapStyle.visibility = 'visible';
      setTimeout(() => {
        this.map.updateSize()
      },1);
      this.flags.displayFlag = true;
    }
    else {
      mapStyle.width = '0';
      mapStyle.visibility = 'hidden';
      setTimeout(() => {
        this.map.updateSize()
      },1);
      this.flags.displayFlag = false;
    }

  }
  // Let user choose between heatmap or normal map
  public changeMapLayers(value: number): void{
    if(value == 1){
      // Remove cluster layers
      for(const key in this.initialize_map_data.clusters){
        this.map.removeLayer(this.initialize_map_data.clusters[key]);
      }
      // add heatmap layer
      this.map.addLayer(this.initialize_map_data.heatmap);
      // Remove normal map layer
      this.map.removeLayer(this.mapObject.layers.tile.normal);
      this.mapObject.layers.flag.mapType = 1;
    }
    else {
      // Remove heatmap layer
      this.map.removeLayer(this.initialize_map_data.heatmap);
      // Add normal map layer
      this.map.addLayer(this.mapObject.layers.tile.normal);
      // Add cluster layers
      for(const key in this.initialize_map_data.clusters){
        this.map.addLayer(this.initialize_map_data.clusters[key]);
      }
      this.mapObject.layers.flag.mapType = 0;
    }

  };
  // Function which is called when page is changed on list of points
  public paginationPageChange(e): void{
    const startIndex = e.pageIndex * e.pageSize;
    const endIndex = startIndex + e.pageSize;
    this.object_of_arrays.search = this.object_of_arrays.all_points.slice(startIndex, endIndex);
  };
  public showSingleReport(id: number): void {
    this.router.navigate(['report', id]);
  };
  // Display heatmap on choosen category
  public chooseHeatmapCategory(): void {
      this.initialize_map_data.heatmap.setSource(this.initialize_map_data.sourceVectors[this.categoryValue])
  };
  // Close point Description modal on map
  public onHideDescription(){
    this.map.getOverlayById('descriptionPopup').setPosition(undefined)
  }

  // Reset source vectors and initialize features again
  private resetSourceVector(body: any): void {
    for(const key in this.initialize_map_data.sourceVectors){
      this.initialize_map_data.sourceVectors[key].clear();
    }

    this.object_of_arrays.all_points = body;
    this.object_of_arrays.pagination_length = body;
    this.object_of_arrays.search = body.slice(0, 15);
    this.initFeatures(body);
  }
  // Function which is called when user creates new point
  public addLocation(state: boolean): void {
    this.imageUploadService.imagesObject.postImages.length = 0;
    this.imageUploadService.imagesObject.showImages.length = 0;
    if(state === true){
      const formValues = this.single_location_form.value;
      const pointData = new FormData();
      const mapCoords= this.map.getOverlayById('popup').getPosition();
      const coords =  new ol.proj.toLonLat( mapCoords, 'EPSG:900913');

      pointData.append('title', formValues.title);
      pointData.append('description', formValues.description);
      pointData.append('category', formValues.type);
      pointData.append('lng', coords[0]);
      pointData.append('lat', coords[1]);
      pointData.append('level', formValues.level);
      this.imageUploadService.imagesObject.postImages.forEach(image => {
        pointData.append('ReportImages[]', image.file);
      });
      this.requestService.postRequest(this.endpointService.report.createLocation, pointData).subscribe(
        response => {
          console.log(response.json());
          this.requestService.getRequest(this.endpointService.report.get).subscribe(
            resp => {
              const body = resp.json().list;
              // Reset points on map
              this.resetSourceVector(body);
            }
          )
          // Reset Add point form
          this.single_location_form.reset()
          this.snackBar.open('Location successfully added', undefined, {
            duration: 1500
          })
        }
      )
    }
    this.imageUploadService.imagesObject.postImages.length = 0;
    this.imageUploadService.imagesObject.showImages.length = 0;
    // Close Add point modal
    this.map.getOverlayById('popup').setPosition(undefined);


  };
  // Choose between opening left or right sidebar
  public chooseSidenav(value: string): string {
    return this.sidenav_type = value;
  };
  // Open resolve point modal on list of points
  public openResolveModal(id: string): void {
    const dialogRef = this.dialog.open(ResolveComponent, {
      // width: '570px',
      // height: '780px'
      width: '800px',
      height: '580px'
    });
    dialogRef.componentInstance.reportId = id;
    this.imageUploadService.imagesObject.showImages.length = 0;
    this.imageUploadService.imagesObject.postImages.length = 0;

  };
  // Reopen location
  public onReopen(id: number): void {
    this.requestService.postRequest(this.endpointService.report.report + id + '/reopen', {id: id}).subscribe(
      response => {
        console.log(response.json())
        this.snackBar.open('Location is opened again', undefined, {
          duration: 1500
        });
        this.requestService.getRequest(this.endpointService.report.all_mine_resolved).subscribe(
        _response => {
            console.log(_response.json())
            this.object_of_arrays.pagination_length = _response.json().list;
            this.object_of_arrays.search = _response.json().list.slice(0, 15);
          }
        )
      }
    )
  }
  // Filter only resolves of logged user
  public getMyResolves(value): void {
    if(value == 2){
      this.requestService.getRequest(this.endpointService.report.all_mine_resolved).subscribe(
        response => {
          console.log(response.json())
          this.object_of_arrays.pagination_length = response.json().list;
          this.object_of_arrays.search = response.json().list.slice(0, 15);
        }
      )
    }
    else if(value == 1){
      this.requestService.getRequest(this.endpointService.report.get).subscribe(
        response => {
          console.log(response.json())
          this.object_of_arrays.pagination_length = response.json().list;
          this.object_of_arrays.search = response.json().list.slice(0, 15);
        }
      )
    }
    else{
      this.requestService.getRequest(this.endpointService.report.all_mine).subscribe(
        response => {
          console.log(response.json())
          this.object_of_arrays.pagination_length = response.json().list;
          this.object_of_arrays.search = response.json().list.slice(0, 15);
        }
      )
    }
  }
  // Choose between showing all points or all logged user points
  public onChangePoints(value): void {
    if(value == 1){
      this.requestService.getRequest(this.endpointService.report.get).subscribe(
        response => {
          console.log(response.json())
          this.resetSourceVector(response.json().list);
        }
      )
    }
    else if(value == 2){
      this.requestService.getRequest(this.endpointService.report.all_mine).subscribe(
        response => {
          console.log(response.json())
          this.resetSourceVector(response.json().list);
        }
      )
    }
    if(value == 3){
      this.requestService.getRequest(this.endpointService.report.all_mine_resolved).subscribe(
        response => {
          console.log(response.json())
          this.resetSourceVector(response.json().list);
        }
      )
    }
  }
  // Get logged user data
  public getSelf(){
    this.requestService.getRequest(this.endpointService.user.self).subscribe(
      response => {
        this.localStorageService.set('user_data', response.json())
        this.user = response.json();
      }
    )
  }
}

// Resolve modal component
@Component({
  selector: 'app-resolve',
  templateUrl: './resolve.html',
  styleUrls: ['./resolve.sass']
})
export class ResolveComponent implements OnInit {
  // Close image galery when escape key is pressed
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if(event.keyCode === 27){
      this.imageUploadService.onHideImage();
    }
  }
  public imageObject = {
    class: (): string => {
      const imgLength = this.imageUploadService.imagesObject.postImages.length;
      if(imgLength >= 6){
        return 'btn upload-disabled';
      }
      return 'btn upload';
    },
    toolTip: (): string => {
      const imgLength = this.imageUploadService.imagesObject.postImages.length;
      if(imgLength >= 6){
        return 'You can only upload 6 images';
      }
      return 'Upload image';
    },
    disabled: () => {
      const imgLength = this.imageUploadService.imagesObject.postImages.length;
      if(imgLength >= 6){
        return true;
      }
      return false;
    }
  };
  public postObject = {
    tooltip: (): string => {
      const form = this.reportFormGroup.valid;
      let responses;
      if(this.locationInfo['responses'] != undefined){
        responses = this.locationInfo['responses'].length;
      }
      if(responses >= 3) {
        return 'We reached maximum number of responses for this location'
      }
      else if(!form) {
        return 'You must fill form';
      }
      return 'send us response';
    },
    class: (): string => {
      const form = this.reportFormGroup.valid;
      let response;
      if(this.locationInfo['responses'] != undefined) {
        response = this.locationInfo['responses'].length;
      }
      if(!form || response >= 3) {
        return 'btn send-disabled';
      }
      return 'btn send';
    }
  };
  public reportId;
  public locationInfo = {};
  public reportFormGroup: FormGroup = this.formBuilder.group({
    title: [null, Validators.required],
    description: [null, Validators.required]
  });
  private reportForm = new FormData();
  constructor(
    public dialogRef: MdDialogRef<ResolveComponent>,
    public imageUploadService: ImageUploadService,
    private requestService: RequestsService,
    private endpointService: EndpointService,
    public snackBar: MdSnackBar,
    @Inject(MD_DIALOG_DATA) public data: any,
    private formBuilder: FormBuilder) {}

    ngOnInit() {
      this.requestService.getRequest(this.endpointService.report.specificReport + this.reportId).subscribe(
        response => {
          this.locationInfo = response.json();
        }
      )
    }

    // Submit resolve form
    public onSubmit() {
      const formValue = this.reportFormGroup.value;
      const images = this.imageUploadService.imagesObject.postImages;
      this.reportForm.append('title', formValue.title);
      this.reportForm.append('description', formValue.description);
      this.reportForm.append('lat', this.locationInfo['lat']);
      this.reportForm.append('lng', this.locationInfo['lng']);
      this.reportForm.append('reportId', this.reportId);
      images.forEach(image => {
        this.reportForm.append('ReportImages[]', image.file);
      });
      if(this.reportFormGroup.valid && this.locationInfo['responses'].length < 3) {
        this.requestService.postRequest(this.endpointService.report.createLocation, this.reportForm).subscribe(
          response => {
            console.log(response.json(), 'response resolve');
            this.data = response.json()
            this.imageUploadService.imagesObject.postImages.length = 0;
            this.imageUploadService.imagesObject.showImages.length = 0;

            this.snackBar.open('Resolve successfully added', undefined, {
              duration: 1500
            })
            this.dialogRef.close('true')
          }
        )
      }

    };

}
