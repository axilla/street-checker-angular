import { Component, OnInit, ViewChild } from '@angular/core';
import { Injectable } from '@angular/core';
import {LocalStorageService} from 'angular-2-local-storage';
import {Http, Headers, RequestOptions} from '@angular/http';
import {Router} from '@angular/router';
import {EndpointService} from './endpoint.service';
import {MdSnackBar} from '@angular/material';



@Injectable()
export class RequestsService {
  public loginFlag;
  public zoom = 13;
  public coords = [2440231.41846971, 5362918.873916666];
  public openPopup = 0;
  public whereToNavigate;
  public locationDescription;
  constructor(
      private localStorageService: LocalStorageService,
      private endpointService: EndpointService,
      private http: Http,
      private router: Router,
      public snackBar: MdSnackBar,

  ) {}

  // Set Request options in Http requests
  private setOptions(): object{
    const headers = new Headers();
    const token: any = this.localStorageService.get('token')
    if(token){
      headers.append('sc-access-token', token)
    }
    const options = new RequestOptions({headers: headers});
    return options
  }

  public deleteRequest(url: string){
    return this.http.delete(url, this.setOptions());
  }
  public postRequest(url: string, data: any){
    return this.http.post(url, data, this.setOptions());
  }

  public getRequest(url:string){
    return this.http.get(url, this.setOptions());
  }

}




