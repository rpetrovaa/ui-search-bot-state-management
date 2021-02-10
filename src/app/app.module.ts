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
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { NgxsModule } from '@ngxs/store';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';

import { AppComponent } from './app.component';
import { Gui2wireApiService } from './services/gui2wire-api.service';
import { QueryState } from './state/query.state';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ChatbotComponent } from './chatbot/chatbot/chatbot.component';
import { PostRequestService } from './services/post-request.service';
import { SetStateService } from './services/set-state.service';
import { ImageDialogComponent } from './image-dialog/image-dialog.component';

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
    MatDialogModule,
    MatIconModule,
    NgxsModule.forRoot([QueryState]),
    NgxsReduxDevtoolsPluginModule.forRoot(),
    NgxsLoggerPluginModule.forRoot(),
    BrowserAnimationsModule,
  ],
  declarations: [AppComponent, ChatbotComponent, ImageDialogComponent],
  providers: [Gui2wireApiService, PostRequestService, SetStateService],
  bootstrap: [AppComponent],
})
export class AppModule {}
