import {Directive, ElementRef, Input} from "@angular/core";
import {TimestampPipe} from "../pipes/timestamp.pipe";
@Directive({
  selector: '[glTimestamp]',
})
export class TimestampDirective {
  private TIME_TEN_SECONDS = 10000;
  private TIME_ONE_MINUTE = 60000;
  private TIME_TEN_MINUTES = 600000;

  private _timestamp;
  private intervalLength;
  private timeoutId;
  private el:HTMLElement;

  constructor(el:ElementRef) {
    this.el = el.nativeElement;
  }

  @Input() set timestamp(timestamp:any) {
    if (timestamp) {
      this._timestamp = Number(timestamp);
      this.intervalLength = this.TIME_TEN_SECONDS;
      this.updateTime();
      this.updateLater();
    }
  }

  updateTime() {
    this.el.innerText = new TimestampPipe().transform(this._timestamp);
  }

  updateLater() {
    this.timeoutId = setTimeout(() => {
      var timestampDifference = Date.now() - this._timestamp;
      if (timestampDifference >= this.TIME_ONE_MINUTE) {
        this.intervalLength = this.TIME_ONE_MINUTE;
      } else if (timestampDifference >= this.TIME_TEN_MINUTES) {
        this.intervalLength = this.TIME_TEN_MINUTES
      }
      this.updateTime();
      this.updateLater();
    }, this.intervalLength);
  }

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

}
