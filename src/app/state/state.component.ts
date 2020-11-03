import { Component, OnInit } from '@angular/core';
import { IState } from './model/i-state';

@Component({
  selector: 'app-state',
  templateUrl: './state.component.html',
  styleUrls: ['./state.component.css']
})
export class StateComponent implements OnInit {

  state: IState;

  constructor() { }

  ngOnInit(): void {
  }

}
