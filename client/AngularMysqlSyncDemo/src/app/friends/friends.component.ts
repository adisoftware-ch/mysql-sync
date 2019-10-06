import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { FriendService, IFriend } from '../friend.service';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-friends',
    templateUrl: './friends.component.html',
    styleUrls: ['./friends.component.css']
})
export class FriendsComponent implements OnInit {

    friends: Observable<IFriend[]>;

    constructor(private friendService: FriendService, public authService: AuthService) { }

    ngOnInit() {
        this.friends = this.friendService.readFriends(null);
    }

    addFriend(name: string): void {
        name = name.trim();
        if (!name) { return; }
        this.friendService.addFriend(name);
    }

    deleteFriend(friend: IFriend): void {
        this.friendService.deleteFriend(friend.id, friend.version);
    }

}
