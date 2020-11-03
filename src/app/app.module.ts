import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';  
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { StateComponent } from './state/state.component';
import { Gui2wireApiService } from './services/gui2wire-api.service';

@NgModule({
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule
  ],
  declarations: [
    AppComponent,
    StateComponent
  ],
  providers: [Gui2wireApiService],
  bootstrap: [AppComponent]
})
export class AppModule { }
