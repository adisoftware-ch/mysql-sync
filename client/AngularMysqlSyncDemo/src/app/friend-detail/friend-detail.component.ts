import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { FriendService, IFriend } from '../friend.service';

@Component({
    selector: 'app-friend-detail',
    templateUrl: './friend-detail.component.html',
    styleUrls: ['./friend-detail.component.css']
})
export class FriendDetailComponent implements OnInit {
    friend: IFriend;

    constructor(
        private route: ActivatedRoute,
        private friendService: FriendService,
        private location: Location
    ) { }

    ngOnInit(): void {
        this.getFriend();
    }

    private getFriend(): void {
        const id = +this.route.snapshot.paramMap.get('id');
        this.friendService.readFriends('id=' + id)
            .subscribe(friends => {
                if (friends.length > 0) {
                    this.friend = friends[0];
                }
            });
    }

    goBack(): void {
        this.location.back();
    }

    save(): void {
        this.friendService.updateFriend(this.friend.id, this.friend.name);
        this.goBack();
    }
}
