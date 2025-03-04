import { DataErrorStatus, GLOBAL_ERROR, toObs } from './shared';
import { HttpErrorResponse } from '@angular/common/http';

describe('Shared Api - toObs', () => {
  it('should return an observable that emits the function return value if no error occurs', (done) => {
    const obsFn = toObs(() => 'some value');
    obsFn().subscribe((value) => {
      expect(value).toEqual('some value');
      done();
    });
  });

  it('should return an error observable that emits an HttpErrorResponse with global error state', (done) => {
    const e = Error(GLOBAL_ERROR);
    const obsFn = toObs(() => {
      throw e;
    });

    obsFn().subscribe({
      error: (error) => {
        expect(error).toEqual(
          new HttpErrorResponse({
            error: e,
            status: DataErrorStatus.HANDLE_GLOBALLY,
          })
        );
        done();
      },
    });
  });

  it('should return an error observable that emits an HttpErrorResponse with local error state', (done) => {
    const e = Error('some error');
    const obsFn = toObs(() => {
      throw e;
    });

    obsFn().subscribe({
      error: (error) => {
        expect(error).toEqual(
          new HttpErrorResponse({
            error: e,
            status: DataErrorStatus.HANDLE_LOCALLY,
          })
        );
        done();
      },
    });
  });
});
