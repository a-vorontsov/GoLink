import {Directive, ElementRef, HostListener} from '@angular/core';
import {Keyboard} from 'ionic-native';

@Directive({
  selector: '[glChatInput]'
})
export class ChatInputDirective {

  constructor(private el: ElementRef,
              private keyboard: Keyboard) {
  }

  @HostListener('keydown') onKeyDown() {

  }

  @HostListener('keypress') onKeyPress() {

  }

}
