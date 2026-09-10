import { Component, OnInit, ViewChild } from '@angular/core';

import { TokenStorageService } from '../../../../core/services/token-storage.service';

import { document, projectList } from 'src/app/core/data';
import { PaginationService } from 'src/app/core/services/pagination.service';
import { projectListModel, documentModel } from './profile.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})

/**
 * Profile Component
 */
export class ProfileComponent implements OnInit {

  projectList!: projectListModel[];
  document!: documentModel[];
  userData:any;
  allprojectList: any;


  constructor(private TokenStorageService: TokenStorageService, public service: PaginationService) {

  }

  ngOnInit(): void {
    this.userData =  this.TokenStorageService.getUser();  
    /**
     * Fetches the data
     */
     this.fetchData();
  }

  /**
   * Fetches the data
   */
  private fetchData() {
    this.document = document;
    this.projectList = projectList;
    this.allprojectList = projectList;
  }


  /**
   * Swiper setting
   */
  config = {
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    arrows: false
  };

 
 

}
