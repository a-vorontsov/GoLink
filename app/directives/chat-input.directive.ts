import {Directive, ElementRef, HostListener} from '@angular/core';

@Directive({
  selector: '[glChatInput]',
})
export class ChatInputDirective {

  constructor(private el: ElementRef) {
  }

  @HostListener('keydown') onKeyDown() {

  }

  @HostListener('keypress') onKeyPress() {

  }

}
