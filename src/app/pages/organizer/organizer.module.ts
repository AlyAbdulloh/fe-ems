import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
    OrganizerRoutingModule,
  ],
})
export class OrganizerModule {}
