import { Injectable } from '@angular/core';
@Injectable()
export class EndpointService {
  // private url: string = 'http://street-checker.dev/api/';
  private url = 'http://street-checker.dev/api/';
  public auth = {
      logout: this.url + 'auth/logout',
      register: this.url + 'auth/register',
      login: this.url + 'auth/login'
    }
  public user = {
    self: this.url+'user/me',
    update: this.url+'user/me/update'
  }
  public report = {
    categories: this.url + 'report/categories',
    specificReport: this.url + 'report/',
    postComment: this.url + 'report/comment/',
    createLocation: this.url + 'report/create/',
    search: this.url + 'report/search',
    report: this.url + 'report/',
    get: this.url + 'report',
    all_mine:this.url + 'report/me',
    all_mine_resolved: this.url + 'report/me/resolved',
  }

  constructor() { }

}
