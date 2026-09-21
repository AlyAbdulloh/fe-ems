import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EventCreateComponent } from './create/event-create.component';
import { EventManageComponent } from './manage/event-manage.component';
import { EventDetailComponent } from './detail/event-detail.component';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: 'create',
    component: EventCreateComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ORGANIZER'] },
  },
  {
    path: 'edit/:id',
    component: EventCreateComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ORGANIZER'] },
  },
  {
    path: 'detail/:id',
    component: EventDetailComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ORGANIZER'] },
  },
  {
    path: 'manage',
    component: EventManageComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ORGANIZER'] },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventsRoutingModule {}
