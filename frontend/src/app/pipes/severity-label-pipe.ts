import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'severityLabel',
})
export class SeverityLabelPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
