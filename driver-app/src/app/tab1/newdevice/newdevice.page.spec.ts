import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewdevicePage } from './newdevice.page';

describe('NewdevicePage', () => {
  let component: NewdevicePage;
  let fixture: ComponentFixture<NewdevicePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewdevicePage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewdevicePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
