import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { FriendsComponent } from './friends/friends.component';
import { FriendDetailComponent } from './friend-detail/friend-detail.component';
import { LoginComponent } from './login/login.component';

import { MysqlSyncClientService, MYSQL_SYNC_ENV } from 'mysql-sync-client';
import { environment } from 'src/environments/environment';

import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule, AngularFireAuth } from '@angular/fire/auth';

import { AuthService } from './auth.service';
import { FriendService } from './friend.service';

@NgModule({
  declarations: [
    AppComponent,
    FriendsComponent,
    FriendDetailComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AppRoutingModule
  ],
  providers: [
    AngularFireAuth,
    AuthService,
    FriendService,
    MysqlSyncClientService, { provide: MYSQL_SYNC_ENV, useValue: environment }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
