import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { FriendsComponent } from './friends/friends.component';
import { FriendDetailComponent } from './friend-detail/friend-detail.component';

import { AuthGuard } from './auth.guard';

const routes: Routes = [
    { path: '', redirectTo: 'friends', pathMatch: 'full' },
    { path: 'detail/:id', component: FriendDetailComponent, canActivate: [AuthGuard] },
    { path: 'friends', component: FriendsComponent, canActivate: [AuthGuard] },
    { path: 'login', component: LoginComponent }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
