import {Directive, ElementRef, Input, HostListener} from "@angular/core";

@Directive({
  selector: '[glChatInput]'
})
export class ChatInputDirective {

  private el:HTMLElement;

  constructor(el:ElementRef) {
    this.el = el.nativeElement;
  }

  @HostListener('blur') onBlur() {

  }

  @HostListener('focus') onFocus() {

  }

  @HostListener('keydown') onKeyDown() {

  }

  @HostListener('keypress') onKeyPress() {

  }

}
