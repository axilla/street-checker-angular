import { Injectable } from '@angular/core';
import { LocalStorageService } from 'angular-2-local-storage';
import { RequestsService } from './requests.service';
import { EndpointService } from './endpoint.service'

@Injectable()
export class UserService {
  public user;
  constructor(
    private localstorage: LocalStorageService,
    private requests: RequestsService,
    private endpoints: EndpointService
  ) {
    this.getUser();
  }

  public getUser() {
    return this.requests.getRequest(this.endpoints.user.self);
  }
  public setUser() {
    this.requests.getRequest(this.endpoints.user.self).subscribe(
      response => {
        this.user = response.json();
      }
    )
  }

}
