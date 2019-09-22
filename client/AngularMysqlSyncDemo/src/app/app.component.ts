// Import the core angular services.
import { Component, OnInit } from '@angular/core';

import { AuthService } from './auth.service';
import { FriendService } from './friend.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent implements OnInit {

  title = 'Demo Application for mysql-sync with Firebase Authentication';

  constructor(public authService: AuthService, private friendService: FriendService) {}

  ngOnInit() {
    // connect socket client, if authentication token changes
    this.authService.token.subscribe(token => {
      this.friendService.setAuthToken(token);

      // wait some milliseconds for socket client to reconnect
      setTimeout(() => {
        this.friendService.readFriends(null);
      }, 100);
    });
  }

  public logout() {
    this.authService.logout();
  }

}
