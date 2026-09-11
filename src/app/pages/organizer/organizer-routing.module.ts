import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrganizerApplyComponent } from './apply/organizer-apply.component';
import { OrganizerManageComponent } from './manage/organizer-manage.component';
import { OrganizerProfileComponent } from './profile/organizer-profile.component';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: 'apply',
    component: OrganizerApplyComponent,
    canActivate: [RoleGuard],
    data: { roles: ['USER'] },
  },
  {
    path: 'profile',
    component: OrganizerProfileComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ORGANIZER'] },
  },
  {
    path: 'manage',
    component: OrganizerManageComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN'] },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrganizerRoutingModule {}
