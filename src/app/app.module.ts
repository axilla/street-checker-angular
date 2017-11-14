import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


declare var ol: any;
// MATERIAL


import {
  MdButtonModule, MdCheckboxModule, MdInputModule, MdIconModule,
  MdRadioModule, MdSidenavModule, MdChipsModule, MdToolbarModule,
  MdMenuModule, MdDialogModule, MdSliderModule, MdSnackBarModule,
  MdSelectModule, MdCardModule, MdPaginatorModule, MdTooltipModule,
  MdProgressSpinnerModule, MdDatepickerModule, MdNativeDateModule,
  DateAdapter, NativeDateAdapter, MD_DATE_FORMATS, } from '@angular/material';

// COMPONENTS

import { AppComponent } from './app.component';
import { LoginComponent, LoginHelp2Component, LoginHelpComponent, LoginRegisterComponent, RegisterNotComponent } from './components/login/login.component';
import {MainComponent, ResolveComponent} from './components/main/main.component';
import {HttpModule} from '@angular/http';
import {
  ReportComponent, CommentsComponent, RateComponent,
  CommentsEditComponent
} from './components/report/report.component';
import { RequestsService } from "./services/requests.service";
import {EndpointService} from "./services/endpoint.service";
import {LocalStorageModule, LocalStorageService} from "angular-2-local-storage";
import { CustomDateAdapterComponent } from './custom-date-adapter/custom-date-adapter.component';
import {ImageUploadService} from "./services/image-upload.service";
import {SelfService} from "./services/self.service";
import {UserService} from "./services/user.service";



const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent},
  { path: 'main', component: MainComponent},
  { path: 'report/:id', component: ReportComponent}
]

const MY_DATE_FORMATS = {
  parse: {
    dateInput: {month: 'short', year: 'numeric', day: 'numeric'},
  },
  display: {
    dateInput: 'input',
    monthYearLabel: {year: 'numeric', month: 'numeric'},
    dateA11yLabel: {year: 'numeric', month: 'long', day: 'numeric'},
    monthYearA11yLabel: {year: 'numeric', month: 'long'},
  },
};


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    LoginHelpComponent,
    LoginHelp2Component,
    LoginRegisterComponent,
    MainComponent,
    ReportComponent,
    CommentsComponent,
    RateComponent,
    RegisterNotComponent,
    CustomDateAdapterComponent,
    ResolveComponent,
    CommentsEditComponent

  ],
  imports: [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes),
    ReactiveFormsModule,
    HttpModule,
    LocalStorageModule.withConfig({
      prefix: 'my-app',
      storageType: 'localStorage'
    }),

    // MATERIAL
    MdInputModule,
    MdButtonModule,
    MdIconModule,
    MdRadioModule,
    MdSidenavModule,
    MdChipsModule,
    MdToolbarModule,
    MdMenuModule,
    MdDialogModule,
    MdSliderModule,
    MdSnackBarModule,
    MdSelectModule,
    MdCardModule,
    MdPaginatorModule,
    MdTooltipModule,
    MdProgressSpinnerModule,
    MdDatepickerModule,
    MdNativeDateModule,
    MdCheckboxModule


  ],

  entryComponents: [
    CommentsComponent,
    RateComponent,
    LoginHelpComponent,
    LoginHelp2Component,
    LoginRegisterComponent,
    RegisterNotComponent,
    ResolveComponent,
    CommentsEditComponent
  ],


  providers: [
    RequestsService,
    EndpointService,
    ImageUploadService,
    SelfService,
    UserService,
    {provide: DateAdapter, useClass: CustomDateAdapterComponent},
    {provide: MD_DATE_FORMATS, useValue: MY_DATE_FORMATS},


  ],
  bootstrap: [AppComponent]
})


export class AppModule { }
