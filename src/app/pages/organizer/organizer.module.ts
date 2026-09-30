import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { OrganizerRoutingModule } from './organizer-routing.module';
import { OrganizerApplyComponent } from './apply/organizer-apply.component';
import { OrganizerManageComponent } from './manage/organizer-manage.component';
import { OrganizerProfileComponent } from './profile/organizer-profile.component';

@NgModule({
  declarations: [
    OrganizerApplyComponent,
    OrganizerManageComponent,
    OrganizerProfileComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbPaginationModule,
    OrganizerRoutingModule,
  ],
})
export class OrganizerModule {}
