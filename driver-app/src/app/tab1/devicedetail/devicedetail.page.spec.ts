import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DevicedetailPage } from './devicedetail.page';

describe('DevicedetailPage', () => {
  let component: DevicedetailPage;
  let fixture: ComponentFixture<DevicedetailPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DevicedetailPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DevicedetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
