// Import the core angular services.
import { Component, OnInit } from '@angular/core';

import { AuthService } from './auth.service';
import { FriendService } from './friend.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent implements OnInit {

  title = 'Demo Application for mysql-sync with Firebase Authentication';

  errorMessages: Observable<any>;

  usersConnected: Observable<number>;

  constructor(public authService: AuthService, private friendService: FriendService) {}

  ngOnInit() {
    // connect socket client, if authentication token changes
    this.authService.token.subscribe(token => {
      this.friendService.setAuthToken(token);

      // wait some milliseconds for socket client to reconnect
      setTimeout(() => {
        this.friendService.readFriends(null);
        this.errorMessages = this.friendService.getErrorMessages();
        this.usersConnected = this.friendService.getUsersConnected();
      }, 500);
    });
  }

  public logout() {
    this.authService.logout();
  }

}
