import { Injectable } from '@angular/core';
@Injectable()
export class ImageUploadService {
  public imagesObject = {
    postImages: [],
    showImages: []
  }
  public zoomUrl = null;

  constructor() {
  }

  // Remove specific image from image array
  public onRemoveImg(src, name) {

    this.imagesObject.showImages = this.imagesObject.showImages.filter(image => image.name != name)
    this.imagesObject.postImages = this.imagesObject.postImages.filter(image => image.name != name)
  }
  // Add image to image array
  public onAddImage(files): number {

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      const fileName = files[i].name
      //  CHECK IF ARRAY CONTAINS 6 IMAGES
      if (this.imagesObject.postImages.length < 6) {
        this.imagesObject.postImages.push({
          name: files[i].name,
          file: files[i]
        });

        reader.onload = (evt) => {
          // console.log(evt)
          this.imagesObject.showImages.push({
            name: fileName,
            url: evt.target['result']
          })
        }
      } else {
        return -1;
      }
      reader.readAsDataURL(files[i])
    }

  }
  public onShowImage(img) {
    this.zoomUrl = img
  }
  public onHideImage(){
    this.zoomUrl = null;
  }
}
