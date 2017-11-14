import {Component, Inject, OnInit, ViewChild, HostListener} from '@angular/core';
import {MdDialog, MdDialogRef, MD_DIALOG_DATA} from '@angular/material';
import {LocalStorageService} from "angular-2-local-storage";
import {Router, ActivatedRoute, Resolve} from '@angular/router';
import {RequestsService} from "../../services/requests.service";
import {EndpointService} from "../../services/endpoint.service";
import {SelfService} from "../../services/self.service";
import {MdSnackBar} from '@angular/material';
import {ImageUploadService} from "../../services/image-upload.service";
import {UserService} from '../../services/user.service'

import * as moment from 'moment';
import {ResolveComponent} from "../main/main.component";
declare let ol: any;
@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.sass', '../main/rightSidenav.sass']
})
export class ReportComponent implements OnInit {
  @ViewChild('cmnt') cmnt;
  @ViewChild('usernameChange') usernameChange;
  @ViewChild('emailChange') emailChange;
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if(event.keyCode === 27 ){
      this.zoomImageObject.zoom = false
    }
  }
  public locationImages = {
    cover: null
  };
  public commentValidation = {
    _class: (): string => {
      if(this.cmnt.nativeElement.value.length < 50 ) {
        return 'comment-button-disabled';
      }
      return 'comment-button';
    },
    toolTip: (): string => {
      if(this.cmnt.nativeElement.value.length < 50 ) {
        return 'Comment must contain at least 50 characters';
      }
      return 'Send us your comment'
    }
  }
  public commentGaleryValidation = {
    class: (id: number): string => {
      const imagesArray = this.reportData['comments'].find( item => item.id == id);
      if(imagesArray['comment_images'].length == 0) {
        return 'galery-disabled';
      }
      return 'galery';
    },
    tooltip: (id: number): string => {
      const imagesArray = this.reportData['comments'].find( item => item.id == id);
      if(imagesArray['comment_images'].length == 0) {
        return 'No images for this comment';
      }
      return 'Show images for this comment';
    },
    disabled: (id: number): boolean => {
      const imagesArray = this.reportData['comments'].find( item => item.id == id);
      if(imagesArray['comment_images'].length == 0) {
        return true;
      }
      return false;
    }
  }
  private param;
  public user = this.localStorageService.get('user_data');
  public loadingFlag = true;
  public reportData = {};
  public rate;
  public zoomImageObject = {
    zoom: false,
    source: null,
    chosenImg: null,
    current: null,
    type: null
  }
  public snackBars = {
    delete: () => {
      this.snackBar.open('Comment deleted', undefined,{
        duration: 2000,
      })
    },
    add: () => {
      this.snackBar.open('Comment added', undefined,{
        duration: 2000,
      })
    },
  }
  public solution = false;
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
      this.requestsService.postRequest(this.endpointService.user.update, data).subscribe(
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
      this.requestsService.postRequest(this.endpointService.user.update, data).subscribe(
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

  constructor(
    public dialog: MdDialog,
    private localStorageService: LocalStorageService,
    private router: Router,
    private route: ActivatedRoute,
    private requestsService: RequestsService,
    private endpointService: EndpointService,
    private selfService: SelfService,
    public snackBar: MdSnackBar,
    public imageUploadService: ImageUploadService,
    public userService: UserService,
  ) {}
  ngOnInit() {
    this.getReport();
  }
  // Get report data
  private getReport(): void {
    let param: string;
    this.route.params.subscribe(
      data => {
        param = data.id;
        this.param = data.id;
      })
    this.requestsService.getRequest(this.endpointService.report.specificReport + param).subscribe(
      data => {
        console.log(data.json(), 'report')
        const body = data.json()
        const commentsArr = []

        body.comments.forEach(comment => {
          comment['creation_time'] = moment(comment.creation_time).format('DD.MM.YYYY h:mm:ss')
          commentsArr.push(comment)
        })
        let reportData = {

          id: body.id,
          comments: commentsArr.reverse(),
          level: body.level,
          category: body.category,
          title: body.title,
          description: body.description.slice(0, 200),
          owner: body.owner,
          reportImages: body.report_images,
          responses: body.responses,
          urgency: body.urgency,
          created_at: moment(body.creation_time).format('DD.MM.YYYY hh:mm:ss'),
          myGrade: body.myGrade,
          lat: body.lat,
          lng: body.lng,
          active: body.active,
          avgGrade: body.avgGrade.toFixed(2)


        }

        if(body.report_images.length != 0){
          this.locationImages.cover = body.report_images[0]['full_url'];

        }


        if(body.hasOwnProperty('solution')){
          Object.assign(reportData, {solution: body.solution})
          this.solution = true;
        } else {
          delete this.reportData['solution']
          this.solution = false;
        }
        this.loadingFlag = false
        // Object.assign(this.reportData, reportData);
        this.reportData = reportData;
      }
    )
  }
  // Check if user liked specific resolve
  public checkUserLike(card: object) {
    const _vote = card['impressions'].find( vote => {return vote['owner']['username'] == this.user['username']} )
    if(_vote){
      return _vote.type
    }
    return 0
  }
  // Get number of likes for specific resolve
  public getNumberOfikes(source: Array<object>) {
    let likes: number = 0
    source.forEach(item => {
      if(item['type'] == 1) {
        likes++
      }
    })
    return likes
  }
  // Get number of dislikes for specific resolve
  public getNumberOfDislikes(source: Array<object>) {
    let dislikes: number = 0
    source.forEach(item => {
      if(item['type'] == 2) {
        dislikes++
      }
    })
    return dislikes
  }
  // Function which is called when user like specific resolve
  public likeResponse(id: number, arr) {
    const post = {
      responseId: id,
    }
    this.requestsService.postRequest(this.endpointService.report.specificReport + id + '/like', post).subscribe(
      response => {
        console.log(response.json());
        this.snackBar.open(response.json().message, undefined, {
          duration: 1500
        })
        this.getReport();
      }
    )
  }
  // Function which is called when user dislike specific resolve
  public dislikeResponse(id: number, arr) {
    const post = {
      responseId: id
    }
    this.requestsService.postRequest(this.endpointService.report.specificReport + id + '/dislike', post).subscribe(
      response => {
        console.log(response.json());
        this.snackBar.open(response.json().message, undefined, {
          duration: 1500
        })
        this.getReport();
      }
    )
  }
  // Check if specific resolve is solution
  public checkSolution(id: number): boolean {
    if(this.reportData.hasOwnProperty('solution')){
      if(this.reportData['solution'].id == id) {
        return true;
      }
    } else {
      return false;
    }
  }
  // Edit specific comment
  public editComment(id: number, text: string, images: Array<object>): void {
    const dialogRef = this.dialog.open(CommentsEditComponent, {
      width: '500px',
      height: '650px',
      data: {
        comment: text,
        images: images
      }
    })
    dialogRef.afterClosed().subscribe(
      () => {
        const edit_comment = dialogRef.componentInstance.comment;
        const remove_img_array: Array<number> = dialogRef.componentInstance.delete_image_array;
        if(edit_comment != undefined) {
          const new_comment = new FormData();
          new_comment.append('text', edit_comment);
          // console.log(this.imageUploadService.imagesObject.postImages)
          if(this.imageUploadService.imagesObject.postImages.length != 0) {
            this.imageUploadService.imagesObject.postImages.forEach(image => {
              new_comment.append('CommentImages[]', image.file);
            })
          }
          if(remove_img_array.length != 0) {
            remove_img_array.forEach(img_id => {
              new_comment.append('removeCommentImages[]', img_id.toString());
            })
          }

          this.requestsService.postRequest(this.endpointService.report.postComment + id + '/update', new_comment).subscribe(
            response => {
              // console.log(response.json())
              this.snackBar.open('Comment successfully edited', undefined, {
                duration: 1500
              })
              this.imageUploadService.imagesObject.showImages.length = 0;
              this.imageUploadService.imagesObject.postImages.length = 0;
              console.log(this.imageUploadService.imagesObject.postImages, 'sad')
              this.getReport()
            }
          )
        }
        else {
          this.imageUploadService.imagesObject.showImages.length = 0;
          this.imageUploadService.imagesObject.postImages.length = 0;
        }
      }
    )
  }
  // Send new comment
  public sendComment(comment: string): void{
    const postData = {
      reportId: this.param,
      text: comment
    }
    const images = this.imageUploadService.imagesObject.postImages;
    const post = new FormData();
    post.append('reportId', this.param);
    post.append('text', comment);
    if(images.length != 0) {
      for(let i = 0; i < images.length; i++){
        post.append('CommentImages[]', images[i].file);
      }
    }
    this.requestsService.postRequest(this.endpointService.report.postComment +this.param+'/create', post).subscribe(
      data => {
        this.snackBars.add();
        this.imageUploadService.imagesObject.postImages.length = 0;
        console.log(data.json())
        this.getReport();
      }
    )
  }
  // Navigate user back to map
  public navigateBack(): void{
    this.router.navigate(['main']);
  }
  // Delete specific comment
  public deleteComment(id: number): void {
      this.requestsService.deleteRequest(this.endpointService.report.postComment + id +'/delete').subscribe(
        res => {
          this.snackBars.delete();
          this.getReport();
        }
      )
  }
  // Choose which one image of point will be cover image
  public setCoverImage(e: any): void {
    this.locationImages.cover = e.src;
  }
  // Open image galery
  public openGalery(source?: string, id?: any): void{
     this.zoomImageObject.zoom = !this.zoomImageObject.zoom
    if(source == 'response') {
       this.zoomImageObject.chosenImg = null;
       this.zoomImageObject.type = 0;
       this.zoomImageObject.source = this.reportData['responses'].find( item => item.id == id);
    }
    else if(source == 'location'){
       this.zoomImageObject.source = this.reportData['reportImages'];
       this.zoomImageObject.chosenImg = id.src;
       this.zoomImageObject.type = 1;
    }
    else if (source == 'comment'){
      this.zoomImageObject.chosenImg = null;
      this.zoomImageObject.type = 2;
      this.zoomImageObject.source = this.reportData['comments'].find( item => item.id == id);
    }
    if(source){
      this.currentImage(source);
    }

  }
  // Open modal where user can rate point
  public openRate(): void {
    const dialogRef = this.dialog.open(RateComponent, {
      width: '400px',
      height: '280px'
    })
    dialogRef.afterClosed().subscribe(
      result => {
        if(result == 'true') {
          const grade = dialogRef.componentInstance.rate;
          const post = {
            grade: grade
          }
          this.requestsService.postRequest(this.endpointService.report.report + this.param + '/grade', post).subscribe(
            () => {
              this.snackBar.open('Your grade is sent', undefined, {
                duration: 1500
              })
              this.getReport();
            }
          )
        }
      }
    )
  }
  // Set current image in galery
  private currentImage(source: string): void {
    const chosen = this.zoomImageObject.chosenImg;
    if(chosen) {
      this.zoomImageObject.current = this.zoomImageObject.chosenImg;
    }
    else {
      if(source == 'response' || source == 'location'){
        this.zoomImageObject.current = this.zoomImageObject.source['report_images'][0]['full_url'];
      }
      else {
        this.zoomImageObject.current = this.zoomImageObject.source['comment_images'][0]['full_url'];
      }
    }
  }
  // Change image in galery forward or backward
  public changeImage(val: string): void{
    let lng, imgArray;
   if(this.zoomImageObject.type == 0){
      lng = this.zoomImageObject.source['report_images'].length;
      imgArray = this.zoomImageObject.source['report_images'];
   }
   else if(this.zoomImageObject.type == 1){
      lng = this.zoomImageObject.source.length;
      imgArray = this.zoomImageObject.source;
   }
   else if(this.zoomImageObject.type == 2){
     lng = this.zoomImageObject.source['comment_images'].length;
     imgArray = this.zoomImageObject.source['comment_images'];
   }
    const current = this.zoomImageObject.current;
    const index = imgArray.map((img) => img.full_url).indexOf(current)
    if(val == 'next') {
          if(index < lng-1) {
            this.zoomImageObject.current = imgArray[index+1].full_url
          }
    }
    else {
      if(index > 0) {
        this.zoomImageObject.current = imgArray[index-1].full_url;
      }
    }

  }
  // Option for resolving specific response
  public resolveResponse(id: number): void {
    const postData = {
      responseId: id
    };
    this.requestsService.postRequest(this.endpointService.report.specificReport + this.param + '/resolve', postData).subscribe(
      res => {
          this.getReport();
          this.snackBar.open('This resolve is taken as solution', undefined, {
            duration: 1500
          })
      }
    )
  }
  // Option for deleting location
  public onDeleteLocation(id: number, type: string): void {
    this.requestsService.deleteRequest(this.endpointService.report.report + id).subscribe(
      response => {
        // console.log(response.json().message)
        this.snackBar.open(response.json().message, undefined, {
          duration: 1400
        })
       if(type == 'location') {
         this.router.navigate(['main']);
       }
       else {
          this.getReport();
       }
      }
    )
  }
  // Open comment modal
  public openComment(): void {
    const dialogRef = this.dialog.open(CommentsComponent, {
      width: '550px',
      height: '650px',
      data: {
        comment: ''
      }
    });
      this.imageUploadService.imagesObject.showImages.length = 0;
    dialogRef.afterClosed().subscribe(
      () => {
        const response = dialogRef.componentInstance.comment
       if(response != undefined){
         this.sendComment(response);
       }
      }
    )
  }
  // Open resolve modal
  public openResolveDialog(id: number): void {
    const dialogRef = this.dialog.open(ResolveComponent,{
      width: '570px',
      height: '780px',
      data: null
    })
    dialogRef.componentInstance.reportId = id;
    dialogRef.afterClosed().subscribe(
      result => {
        console.log(dialogRef.componentInstance.data, 'new data')
        if(result == 'true'){
          this.reportData['responses'].push(dialogRef.componentInstance.data)
          // this.getReport();
        }
      }

    )
  }
  // Navigate user to map and center map on this point location
  public navigateToLocationOnMap(coordinates: Array<number>): void {
    const coords = ol.proj.transform(coordinates, 'EPSG:4326', 'EPSG:3857');
    this.requestsService.coords = coords;
    this.requestsService.zoom = 16;
    this.requestsService.openPopup = 1;
    this.requestsService.locationDescription = this.reportData;
    this.router.navigate(['main']);
  }
  public getSelf(){
    this.requestsService.getRequest(this.endpointService.user.self).subscribe(
      response => {
          this.localStorageService.set('user_data', response.json())
          this.user = response.json();
      }
    )
  }
  // Reopen point
  public onReopen(id: number): void {
    this.requestsService.postRequest(this.endpointService.report.report + id + '/reopen', {id: id}).subscribe(
      response => {
        console.log(response.json())
        this.getReport();
        this.snackBar.open('Location is opened again', undefined, {
          duration: 1500
        });
      }
    )
  }

}

@Component({
  selector: 'app-report-comments',
  templateUrl: 'comments.html',
  styleUrls: ['./comments.sass']
})
export class CommentsComponent {

  public commentValidation = {
    class: (comment: number): string => {
      if(comment < 10 ) {
        return 'comment-button-disabled';
      }
      return 'comment-button'
    },
    toolTip: (comment: number): string => {
      if(comment < 10 ) {
        return 'Comment must contain at least 10 characters';
      }
      return 'Send us your comment'
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
  }
  public comments;
  public comment;
  constructor(
    public dialogRef: MdDialogRef<CommentsComponent>,
    public imageUploadService: ImageUploadService,
    public snackBars: MdSnackBar,
    private requestsService: RequestsService,
    private endpointService: EndpointService,
    @Inject(MD_DIALOG_DATA) public data: any) {
    if(data.images != undefined && data.images.length > 0) {
      imageUploadService.imagesObject.showImages.length = 0;
      data.images.forEach(image => {
        imageUploadService.imagesObject.showImages.push({
          name: image.full_url,
          url: image.full_url
        })
      })
    }
  }
  public onComment(comment: string): void{
    this.comment = comment;
  }
}

@Component({
  selector: 'app-report-rate',
  templateUrl: 'rate.html',
  styleUrls: ['./rate.sass']
})
export class RateComponent {
  public rate;
  public rateFlag: boolean = false;
  constructor(public dialogRef: MdDialogRef<RateComponent>) {}

  showGrade(e){
    this.rate = e
    this.rateFlag = true
  }
}
@Component({
  selector: 'app-report-comments-edit',
  templateUrl: 'comments-edit.html',
  styleUrls: ['./comments.sass']
})
export class CommentsEditComponent {
  @ViewChild('cmnt') cmnt

  public commentValidation = {
    class: (comment: number): string => {
      if(comment < 10 ) {
        return 'comment-button-disabled';
      }
      return 'comment-button'
    },
    toolTip: (comment: number): string => {
      if(comment < 10 ) {
        return 'Comment must contain at least 10 characters';
      }
      return 'Send us your comment'
    }
  };
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
  public delete_image_array = [];
  public comments;
  public comment;
  constructor(
    public dialogRef: MdDialogRef<CommentsEditComponent>,
    public imageUploadService: ImageUploadService,
    public snackBars: MdSnackBar,
    private requestsService: RequestsService,
    private endpointService: EndpointService,
    @Inject(MD_DIALOG_DATA) public data: any) {
    if(data.images != undefined && data.images.length > 0) {
      imageUploadService.imagesObject.showImages.length = 0;
      data.images.forEach(image => {
        imageUploadService.imagesObject.showImages.push({
          name: image.full_url,
          url: image.full_url
        })
      })
    }
    setTimeout(() => {
      this.cmnt.nativeElement.innerHTML += data.comment;
    }, 1)
  }
  public onRemoveImage(image: string): void {
    // this.delete_image_array.length = 0;
    const image_id = this.data.images.find( img => {
      return img.full_url == image
    })
    this.delete_image_array.push(image_id.id);
    this.imageUploadService.imagesObject.showImages = this.imageUploadService.imagesObject.showImages.filter( img => {
      return img.url != image
    })
  }
  public onComment(comment: string): void{
    this.comment = comment;
  }
}
