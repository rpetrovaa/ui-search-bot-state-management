import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';  
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';

import { NgxsModule } from '@ngxs/store';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';

import { AppComponent } from './app.component';
import { Gui2wireApiService } from './services/gui2wire-api.service';
import { QueryState } from './state/query.state';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ChatbotComponent } from './chatbot/chatbot/chatbot.component';

@NgModule({
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,  
    MatFormFieldModule,
    MatButtonModule,
    MatGridListModule,
    MatCardModule,
    NgxsModule.forRoot([QueryState]),
    NgxsReduxDevtoolsPluginModule.forRoot(),
    NgxsLoggerPluginModule.forRoot(),
    BrowserAnimationsModule
  ],
  declarations: [
    AppComponent,
    ChatbotComponent,
  ],
  providers: [Gui2wireApiService],
  bootstrap: [AppComponent]
})
export class AppModule { }
