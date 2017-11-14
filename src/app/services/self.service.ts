import { Injectable } from '@angular/core';
import {EndpointService} from "./endpoint.service";
import {RequestsService} from "./requests.service";
@Injectable()
export class SelfService {

  constructor(
    private endpointService: EndpointService,
    private requestService: RequestsService
  ) {}

  public getSelf() {
    return this.requestService.getRequest(this.endpointService.user.self)
  }
}
